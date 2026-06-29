/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
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
    updateStatus: jest
      .fn()
      .mockImplementation(
        (id: string, status: string, stornoReason?: string) => {
          if (id === 'nicht-existent') {
            throw new NotFoundException(
              `Bestellung mit ID ${id} nicht gefunden`,
            );
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
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/orders (GET) - sollte alle Bestellungen zurückgeben', () => {
    return request(app.getHttpServer())
      .get('/orders')
      .expect(200)
      .expect([{ id: 'order-1', status: 'open', customerName: 'E2E Tester' }]);
  });

  it('/orders/:id/status (PATCH) - sollte Status erfolgreich updaten', () => {
    return request(app.getHttpServer())
      .patch('/orders/order-1/status')
      .send({ status: 'storniert', stornoReason: 'Kunde wünscht Stornierung' })
      .expect(200)
      .expect({
        id: 'order-1',
        status: 'storniert',
        stornoReason: 'Kunde wünscht Stornierung',
      });
  });

  it('/orders/:id/status (PATCH) - sollte 404 zurückgeben, wenn die ID fehlt', () => {
    return request(app.getHttpServer())
      .patch('/orders/nicht-existent/status')
      .send({ status: 'storniert' })
      .expect(404);
  });
});
