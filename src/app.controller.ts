import { Controller, Get } from '@nestjs/common';

@Controller({})
export class AppController {
  @Get()
  getApi() {
    return 'Welcome to the API subdomain!';
  }
}
