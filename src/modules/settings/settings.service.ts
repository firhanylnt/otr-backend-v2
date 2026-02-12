import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../../entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {}

  async get(key: string) {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    return setting?.value;
  }

  async set(key: string, value: string, type = 'string', group?: string) {
    let setting = await this.settingsRepository.findOne({ where: { key } });
    if (setting) {
      setting.value = value;
      setting.type = type;
    } else {
      setting = this.settingsRepository.create({ key, value, type, group });
    }
    return this.settingsRepository.save(setting);
  }

  async getByGroup(group: string) {
    return this.settingsRepository.find({ where: { group } });
  }

  async getAll() {
    const settings = await this.settingsRepository.find();
    const grouped: { [key: string]: { [key: string]: any } } = {};
    
    for (const setting of settings) {
      const group = setting.group || 'general';
      if (!grouped[group]) grouped[group] = {};
      grouped[group][setting.key] = setting.value;
    }
    
    return grouped;
  }

  async updateBatch(settings: { key: string; value: string }[]) {
    for (const { key, value } of settings) {
      await this.set(key, value);
    }
    return { success: true };
  }

  async getAboutSettings() {
    const settings = await this.settingsRepository.find({
      where: { group: 'about' },
    });

    const result: { [key: string]: any } = {};
    for (const setting of settings) {
      // Parse JSON values
      if (setting.type === 'json') {
        try {
          result[setting.key] = JSON.parse(setting.value);
        } catch {
          result[setting.key] = setting.value;
        }
      } else {
        result[setting.key] = setting.value;
      }
    }

    return result;
  }
}

