import { NestFactory } from '@nestjs/core';
import { SeedService } from './seed.service';
import { AppModule } from 'src/app.module';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const seedService = app.get(SeedService);

    await seedService.runAll();
    await app.close();
}

bootstrap();
