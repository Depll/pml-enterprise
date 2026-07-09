/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DeliveryAreaService } from './../src/delivery-area/delivery-area.service';

describe('DeliveryAreaController (e2e)', () => {
  let app: INestApplication;

  const mockDeliveryAreaService = {
    checkPlz: jest.fn().mockImplementation((plz: string) => {
      // Wir simulieren eine saubere Business-Logik im Mock
      if (plz === '51375' || plz === '51371') {
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DeliveryAreaService)
      .useValue(mockDeliveryAreaService)
      .compile();

    app = moduleFixture.createNestApplication();
    
    // Hier aktivieren wir die exakte Validierung wie in der main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/delivery-areas/check/:plz', () => {
    // Test 1: Gültige PLZ im Liefergebiet
    it('sollte { allowed: true } zurückgeben, wenn die PLZ beliefert wird (200)', () => {
      return request(app.getHttpServer())
        .get('/api/delivery-areas/check/51375')
        .expect(200)
        .expect({ allowed: true });
    });

    // Test 2: Gültige PLZ, aber NICHT im Liefergebiet
    it('sollte { allowed: false } zurückgeben, wenn die PLZ existiert, aber nicht beliefert wird (200)', () => {
      return request(app.getHttpServer())
        .get('/api/delivery-areas/check/12345')
        .expect(200)
        .expect({ allowed: false });
    });

    // Test 3: Edge Case - Buchstaben statt Zahlen
    it('sollte mit { allowed: false } umgehen, wenn Text als PLZ übergeben wird', () => {
      return request(app.getHttpServer())
        .get('/api/delivery-areas/check/abcde')
        .expect(200)
        .expect({ allowed: false });
    });

    // Test 4: Edge Case - Sonderzeichen oder SQL-Injection-Versuch im Query-Parameter
    it('sollte Sonderzeichen sicher abfangen und als nicht erlaubt werten', () => {
      return request(app.getHttpServer())
        .get('/api/delivery-areas/check/%27%20OR%201=1')
        .expect(200)
        .expect({ allowed: false });
    });
  });
});