import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedService } from './database/seeds/seed.service'; // <-- Importieren

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // --- SEEDER START ---
  const seedService = app.get(SeedService);
  await seedService.runSeed();
  // --------------------

  await app.listen(3000);
}
bootstrap().catch((err) => {
  console.error('Fehler beim Starten der App:', err);
});
