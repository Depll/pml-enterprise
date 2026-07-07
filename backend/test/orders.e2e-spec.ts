/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  NotFoundException,
  BadRequestException,
  ValidationPipe,
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
          const allowedStatuses = ['open', 'zubereitung', 'erledigt', 'storniert'];
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
    app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
);
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

    it('sollte leeres Array zurückgeben, wenn keine Bestellungen existieren', () => {
      mockOrdersService.findAllOrders.mockResolvedValueOnce([]);
      return request(app.getHttpServer())
        .get('/orders')
        .expect(200)
        .expect([]);
    });

    it('sollte mehrere Bestellungen mit unterschiedlichen Status zurückgeben', () => {
      mockOrdersService.findAllOrders.mockResolvedValueOnce([
        { id: 'order-1', status: 'open', customerName: 'Kunde A', totalPrice: 25.5 },
        { id: 'order-2', status: 'zubereitung', customerName: 'Kunde B', totalPrice: 18.0 },
        { id: 'order-3', status: 'erledigt', customerName: 'Kunde C', totalPrice: 42.0 },
      ]);
      return request(app.getHttpServer())
        .get('/orders')
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toBe(3);
          expect(res.body[0].status).toBe('open');
          expect(res.body[1].status).toBe('zubereitung');
          expect(res.body[2].status).toBe('erledigt');
        });
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
          expect(res.body.positions[0].productId).toBe(12);
        });
    });

    it('sollte Bestellung mit Pizza und Größe anlegen', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .send({
          customerName: 'Pizza Lover',
          street: 'Hauptstr.',
          houseNumber: '42',
          postcode: '51375',
          city: 'Leverkusen',
          phone: '0123456789',
          email: 'pizza@example.com',
          positions: [
            {
              productId: '1',
              quantity: 2,
              priceSnapshot: 12.0,
              selectedSize: 'XXL',
              selectedIngredientsIds: [2, 5],
              removedIngredientsIds: [],
            },
          ],
          totalPrice: 24.0,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.positions[0].selectedSize).toBe('XXL');
          expect(res.body.positions[0].selectedIngredientsIds).toContain(2);
        });
    });

    it('sollte Bestellung mit Salat und Dressing-Option anlegen', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .send({
          customerName: 'Salad Enthusiast',
          street: 'Gartenstr.',
          houseNumber: '15',
          postcode: '51371',
          city: 'Leverkusen',
          phone: '0111222333',
          positions: [
            {
              productId: '50',
              quantity: 1,
              priceSnapshot: 8.0,
              selectedOption: 'Joghurt-Dressing',
              comment: 'Bitte extra Öl hinzufügen',
            },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.positions[0].selectedOption).toBe('Joghurt-Dressing');
          expect(res.body.positions[0].comment).toBe('Bitte extra Öl hinzufügen');
        });
    });

    it('sollte Bestellung mit Nudeln und Sorte anlegen', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .send({
          customerName: 'Pasta Fan',
          street: 'Noodle Ave',
          houseNumber: '7',
          postcode: '51377',
          city: 'Leverkusen',
          phone: '0122334455',
          positions: [
            {
              productId: '60',
              quantity: 1,
              priceSnapshot: 9.5,
              selectedOption: 'Tagliatelle',
            },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.positions[0].selectedOption).toBe('Tagliatelle');
        });
    });

    it('sollte Bestellung mit mehreren Positionen anlegen', () => {
      mockOrdersService.createOrder.mockImplementationOnce((dto) => {
        return Promise.resolve({
          id: 'multi-order-123',
          customerName: dto.customerName,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          positions: (dto.positions || []).map((p: any) => ({
            ...p,
            productId: Number(p.productId),
          })),
          totalPrice: 45.5,
        });
      });

      return request(app.getHttpServer())
        .post('/orders')
        .send({
          customerName: 'Multi Order',
          street: 'Test St',
          houseNumber: '99',
          postcode: '51373',
          city: 'Leverkusen',
          phone: '01234567890',
          positions: [
            {
              productId: '1',
              quantity: 1,
              priceSnapshot: 12.0,
              selectedSize: 'Normal',
            },
            {
              productId: '50',
              quantity: 2,
              priceSnapshot: 8.0,
              selectedOption: 'Essig-Öl-Dressing',
            },
            { productId: '60', quantity: 1, priceSnapshot: 9.5 },
          ],
          totalPrice: 45.5,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.positions.length).toBe(3);
          expect(res.body.totalPrice).toBe(45.5);
        });
    });

    it('sollte 400 zurückgeben, wenn Pflichtfelder fehlen', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .send({ positions: [] })
        .expect(400);
    });

    it('sollte 400 zurückgeben, wenn customerName leer ist', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .send({
          customerName: '',
          street: 'Test',
          houseNumber: '1',
          postcode: '51371',
          city: 'Leverkusen',
          phone: '0123456789',
          positions: [{ productId: '1', quantity: 1, priceSnapshot: 10.0 }],
        })
        .expect(400);
    });

    it('sollte 400 zurückgeben, wenn Positionen leer sind', () => {
      mockOrdersService.createOrder.mockImplementationOnce(() => {
        throw new BadRequestException('Mindestens eine Position erforderlich');
      });

      return request(app.getHttpServer())
        .post('/orders')
        .send({
          customerName: 'Test Customer',
          street: 'Test',
          houseNumber: '1',
          postcode: '51371',
          city: 'Leverkusen',
          phone: '0123456789',
          positions: [],
        })
        .expect(400);
    });

    it('sollte 400 zurückgeben, wenn Postleitzahl ungültig ist', () => {
      mockOrdersService.createOrder.mockImplementationOnce(() => {
        throw new BadRequestException('Postleitzahl nicht im Liefergebiet');
      });

      return request(app.getHttpServer())
        .post('/orders')
        .send({
          customerName: 'Wrong Area',
          street: 'Test',
          houseNumber: '1',
          postcode: '99999',
          city: 'Unknown City',
          phone: '0123456789',
          positions: [{ productId: '1', quantity: 1, priceSnapshot: 10.0 }],
        })
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

    it('sollte von open zu zubereitung wechseln', () => {
      mockOrdersService.updateStatus.mockResolvedValueOnce({
        id: 'order-1',
        status: 'zubereitung',
      });
      return request(app.getHttpServer())
        .patch('/orders/order-1/status')
        .send({ status: 'zubereitung' })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('zubereitung');
        });
    });

    it('sollte von zubereitung zu erledigt wechseln', () => {
      mockOrdersService.updateStatus.mockResolvedValueOnce({
        id: 'order-2',
        status: 'erledigt',
      });
      return request(app.getHttpServer())
        .patch('/orders/order-2/status')
        .send({ status: 'erledigt' })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('erledigt');
        });
    });

    it('sollte Bestellung stornieren und Grund speichern', () => {
      mockOrdersService.updateStatus.mockResolvedValueOnce({
        id: 'order-3',
        status: 'storniert',
        stornoReason: 'Kundenverifizierung fehlgeschlagen',
      });
      return request(app.getHttpServer())
        .patch('/orders/order-3/status')
        .send({
          status: 'storniert',
          stornoReason: 'Kundenverifizierung fehlgeschlagen',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.stornoReason).toBe(
            'Kundenverifizierung fehlgeschlagen',
          );
        });
    });

    it('sollte 400 zurückgeben, wenn ein ungültiger Status gesendet wird', () => {
      return request(app.getHttpServer())
        .patch('/orders/order-1/status')
        .send({ status: 'komischer-status' })
        .expect(400);
    });

    it('sollte 400 zurückgeben, wenn Status fehlt', () => {
      mockOrdersService.updateStatus.mockImplementationOnce(() => {
        throw new BadRequestException('Status ist erforderlich');
      });
      return request(app.getHttpServer())
        .patch('/orders/order-1/status')
        .send({})
        .expect(400);
    });

    it('sollte 404 zurückgeben, wenn die ID nicht existiert', () => {
      return request(app.getHttpServer())
        .patch('/orders/nicht-existent/status')
        .send({ status: 'storniert' })
        .expect(404);
    });

    it('sollte 400 zurückgeben, wenn Status-Übergang ungültig ist', () => {
      mockOrdersService.updateStatus.mockImplementationOnce(() => {
        throw new BadRequestException(
          'Ungültige Status-Transition: erledigt -> open',
        );
      });
      return request(app.getHttpServer())
        .patch('/orders/order-1/status')
        .send({ status: 'open' })
        .expect(400);
    });

    it('sollte stornoReason optional akzeptieren', () => {
      mockOrdersService.updateStatus.mockResolvedValueOnce({
        id: 'order-4',
        status: 'storniert',
      });
      return request(app.getHttpServer())
        .patch('/orders/order-4/status')
        .send({ status: 'storniert' })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('storniert');
        });
    });
  });

  // --- ORDER LIFECYCLE TEST ---
  describe('Order Lifecycle (Integrationstest)', () => {
    it('sollte komplette Bestellung von Erstellung bis Abschluss durchlaufen', () => {
      // Schritt 1: Bestellung erstellen
      let orderId = '';

      return request(app.getHttpServer())
        .post('/orders')
        .send({
          customerName: 'Lifecycle Test Customer',
          street: 'Lifecycle St',
          houseNumber: '42',
          postcode: '51375',
          city: 'Leverkusen',
          phone: '0123456789',
          positions: [
            {
              productId: '1',
              quantity: 1,
              priceSnapshot: 12.0,
              selectedSize: 'Normal',
            },
          ],
          totalPrice: 12.0,
        })
        .expect(201)
        .then((res) => {
          orderId = res.body.id;
          expect(orderId).toBeDefined();

          // Schritt 2: Status zu "zubereitung" ändern
          return request(app.getHttpServer())
            .patch(`/orders/${orderId}/status`)
            .send({ status: 'zubereitung' })
            .expect(200);
        })
        .then(() => {
          // Schritt 3: Status zu "erledigt" ändern
          return request(app.getHttpServer())
            .patch(`/orders/${orderId}/status`)
            .send({ status: 'erledigt' })
            .expect(200)
            .expect((res) => {
              expect(res.body.status).toBe('erledigt');
            });
        });
    });

    it('sollte Bestellung stornieren mit Grund speichern und Lifecycle beenden', () => {
      let orderId = '';

      return request(app.getHttpServer())
        .post('/orders')
        .send({
          customerName: 'Cancellation Test',
          street: 'Cancel St',
          houseNumber: '1',
          postcode: '51371',
          city: 'Leverkusen',
          phone: '0987654321',
          positions: [
            {
              productId: '50',
              quantity: 1,
              priceSnapshot: 8.0,
              selectedOption: 'Joghurt-Dressing',
            },
          ],
          totalPrice: 8.0,
        })
        .expect(201)
        .then((res) => {
          orderId = res.body.id;

          // Direkt stornieren mit Grund
          return request(app.getHttpServer())
            .patch(`/orders/${orderId}/status`)
            .send({
              status: 'storniert',
              stornoReason: 'Kunde machte falsche Angaben',
            })
            .expect(200);
        })
        .then((res) => {
          expect(res.body.status).toBe('storniert');
          expect(res.body.stornoReason).toBe('Kunde machte falsche Angaben');
        });
    });
  });

  // --- ERROR HANDLING TEST ---
  describe('Error Handling', () => {
    it('sollte 500 bei internem Server-Fehler zurückgeben', () => {
      mockOrdersService.findAllOrders.mockRejectedValueOnce(
        new Error('Database connection failed'),
      );
      return request(app.getHttpServer())
        .get('/orders')
        .expect(500);
    });

    it('sollte 400 bei ungültigem JSON zurückgeben', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });
  });
});
