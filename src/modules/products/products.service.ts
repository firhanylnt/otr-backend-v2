import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  }

  async create(data: Partial<Product>) {
    const product = this.productsRepository.create({
      ...data,
      slug: this.generateSlug(data.name!),
    });
    return this.productsRepository.save(product);
  }

  async findAll(includeInactive = false) {
    if (includeInactive) {
      return this.productsRepository.find({
        order: { sortOrder: 'ASC', createdAt: 'DESC' },
      });
    }
    return this.productsRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, data: Partial<Product>) {
    const product = await this.findOne(id);
    Object.assign(product, data);
    return this.productsRepository.save(product);
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
    return { success: true };
  }
}

