import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    return {
      service: 'OTR API',
      version: '1.0',
      docs: '/api/docs',
      health: '/api/health',
    };
  }

  @Get('health')
  getHealth() {
    return { status: 'ok', service: 'otr-api' };
  }
}
