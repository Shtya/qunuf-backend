import { Controller, Get, Post } from '@nestjs/common';
import { SwaggerSyncService } from 'nestjs-swagger-sync';

@Controller({})
export class AppController {
  constructor(private readonly swaggerSyncService: SwaggerSyncService) { }

  @Get()
  getApi() {
    return 'Welcome to the API subdomain!';
  }


  @Post('sync')
  async syncSwagger() {
    await this.swaggerSyncService.syncSwagger();
    return { message: 'Swagger documentation synced with Postman' };
  }
}
