/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import request from 'supertest';

import { AppModule } from './../src/app.module';
import { OrdersService } from './../src/orders/orders.service';

describe('OrdersController (e2e)', () => {
  let app: INestApplication;

  const mockOrdersService = {
    findAllOrders: jest
      .fn()
      .mockResolvedValue([
        { id: 'order-1', status: 'open', customerName: 'E2E Tester' },
      ]),
    createOrder: jest.fn().mockImplementation((dto) => {
      // Validation-Simulation im Mock für den POST-Test
      if (!dto.customerName) {
        throw new BadRequestException('customerName sollte nicht leer sein');
      }
      return Promise.resolve({
        id: 'new-order-999',
        customerName: dto.customerName,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        positions: (dto.positions || []).map((p: any) => ({
          ...p,
          productId: Number(p.productId),
          selectedSize: p.selectedSize || '',
          selectedIngredientsIds: p.selectedIngredientsIds || [],
        })),
      });
    }),
    updateStatus: jest
      .fn()
      .mockImplementation(
        (id: string, status: string, stornoReason?: string) => {
          if (id === 'nicht-existent') {
            throw new NotFoundException(
              `Bestellung mit ID ${id} nicht gefunden`,
            );
          }
          // Validation-Simulation: Nur bestimmte Status-Werte erlauben
          const allowedStatuses = ['open', 'bereit', 'geliefert', 'storniert'];
          if (!allowedStatuses.includes(status)) {
            throw new BadRequestException('Ungültiger Status-Wert');
          }
          return Promise.resolve({ id, status, stornoReason });
        },
      ),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(OrdersService)
      .useValue(mockOrdersService)
      .compile();

    app = moduleFixture.createNestApplication();
    // Falls du globale Pipes nutzt (wie ValidationPipe), hier aktivieren:
    // app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  // --- GET TESTS ---
  describe('GET /orders', () => {
    it('sollte alle Bestellungen zurückgeben', () => {
      return request(app.getHttpServer())
        .get('/orders')
        .expect(200)
        .expect([
          { id: 'order-1', status: 'open', customerName: 'E2E Tester' },
        ]);
    });
  });

  // --- POST TESTS ---
  describe('POST /orders', () => {
    it('sollte eine neue Bestellung erfolgreich anlegen (201)', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .send({
          customerName: 'Susi Sorglos',
          positions: [{ productId: '12', quantity: 1, priceSnapshot: 8.5 }],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'new-order-999');
          expect(res.body.positions[0].productId).toBe(12); // Typ-Konvertierungs-Check via HTTP
        });
    });

    it('sollte 400 zurückgeben, wenn Pflichtfelder fehlen', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .send({ positions: [] }) // customerName fehlt
        .expect(400);
    });
  });

  // --- PATCH TESTS ---
  describe('PATCH /orders/:id/status', () => {
    it('sollte Status erfolgreich updaten (200)', () => {
      return request(app.getHttpServer())
        .patch('/orders/order-1/status')
        .send({
          status: 'storniert',
          stornoReason: 'Kunde wünscht Stornierung',
        })
        .expect(200)
        .expect({
          id: 'order-1',
          status: 'storniert',
          stornoReason: 'Kunde wünscht Stornierung',
        });
    });

    it('sollte 400 zurückgeben, wenn ein ungültiger Status gesendet wird', () => {
      return request(app.getHttpServer())
        .patch('/orders/order-1/status')
        .send({ status: 'komischer-status' })
        .expect(400);
    });

    it('sollte 404 zurückgeben, wenn die ID nicht existiert', () => {
      return request(app.getHttpServer())
        .patch('/orders/nicht-existent/status')
        .send({ status: 'storniert' })
        .expect(404);
    });
  });
});
