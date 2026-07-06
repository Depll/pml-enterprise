import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedService } from './database/seeds/seed.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // --- AUTOMATISCHER SEEDER FÜR RENDER ---
  const seedService = app.get(SeedService);
  try {
    await seedService.runSeed();
  } catch (seedError) {
    console.error('Fehler beim Datenbank-Seeding:', seedError);
  }
  // ---------------------------------------

  // Nutzt den von Render bereitgestellten Port oder standardmäßig 10000
  const port = process.env.PORT || 10000;

  // '0.0.0.0' erlaubt es Render, die App im internen Netzwerk anzusprechen
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on port: ${port}`);
}
bootstrap().catch((err) => {
  console.error('Fehler beim Starten der App:', err);
});
