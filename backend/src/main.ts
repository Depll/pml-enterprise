import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { SeedService } from './database/seeds/seed.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Automatische Validierungs-Pipe registrieren
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Filtert Felder heraus, die nicht im DTO stehen
      transform: true, // Konvertiert Typen automatisch passend zum DTO
    }),
  );

  // --- SEEDER START ---
  //const seedService = app.get(SeedService);
  // await seedService.runSeed();
  // --------------------

  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap().catch((err) => {
  console.error('Fehler beim Starten der App:', err);
});
