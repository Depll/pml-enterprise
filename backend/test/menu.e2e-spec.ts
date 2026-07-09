/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { MenuService } from './../src/menu/menu.service';

describe('MenuController (e2e)', () => {
  let app: INestApplication;

  // Mocking der Service-Methoden basierend auf deiner Implementierung
  const mockMenuService = {
    getMenu: jest.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Pizza',
        products: [
          { id: 10, name: 'Margherita', price: 8.5, sizes: [], options: null, ingredients: [] }
        ]
      }
    ]),
    addProduct: jest.fn().mockImplementation((dto) => {
      return Promise.resolve({
        id: 99,
        name: dto.name,
        price: dto.price,
        description: dto.description,
        categoryId: dto.categoryId,
        isActive: dto.isActive ?? true
      });
    }),
    updateProduct: jest.fn().mockImplementation((id, dto) => {
      if (Number(id) === 404) {
        throw new NotFoundException(`Gericht mit ID ${id} nicht gefunden`);
      }
      return Promise.resolve({ id: Number(id), ...dto });
    }),
    addIngredient: jest.fn().mockImplementation((productId, dto) => {
      if (Number(productId) === 404) {
        throw new NotFoundException(`Produkt mit ID ${productId} nicht gefunden`);
      }
      return Promise.resolve({ id: 50, name: dto.name, extraPrice: dto.price });
    }),
    updateIngredient: jest.fn().mockImplementation((id, dto) => {
      if (Number(id) === 404) {
        throw new NotFoundException(`Zutat mit ID ${id} nicht gefunden`);
      }
      return Promise.resolve({ id: Number(id), ...dto });
    }),
    deleteProduct: jest.fn().mockImplementation((id) => {
      if (Number(id) === 404) {
        throw new NotFoundException(`Gericht mit ID ${id} nicht gefunden`);
      }
      return Promise.resolve({ id: Number(id), name: 'Deleted Pizza' });
    }),
    deleteIngredient: jest.fn().mockImplementation((id) => {
      if (Number(id) === 404) {
        throw new NotFoundException(`Zutat mit ID ${id} nicht gefunden`);
      }
      return Promise.resolve({ id: Number(id), name: 'Deleted Extra' });
    })
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MenuService)
      .useValue(mockMenuService)
      .compile();

    app = moduleFixture.createNestApplication();
    
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

  // 1. GET /menu
  describe('GET /menu', () => {
    it('sollte das gesamte Menü nach Kategorien strukturiert zurückgeben (200)', () => {
      return request(app.getHttpServer())
        .get('/menu')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body[0].name).toBe('Pizza');
          expect(res.body[0].products[0].name).toBe('Margherita');
        });
    });
  });

// 2. POST /menu
  describe('POST /menu', () => {
    it('sollte ein neues Produkt erfolgreich anlegen (201)', () => {
      return request(app.getHttpServer())
        .post('/menu')
        .send({
          sku: 'PIZ-SAL-01', // Das hat gefehlt!
          name: 'Salami',
          price: 9.5,
          description: 'Mit feiner Rindersalami',
          categoryId: 1,
          isActive: true
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Salami');
        });
    });
  });

  // 3. POST /menu/:id/ingredient
  describe('POST /menu/:id/ingredient', () => {
    it('sollte eine Zutat zu einem Produkt hinzufügen (201)', () => {
      return request(app.getHttpServer())
        .post('/menu/10/ingredient')
        .send({ name: 'Extra Käse', price: 1.5 })
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('Extra Käse');
          expect(res.body.extraPrice).toBe(1.5);
        });
    });

    it('sollte 404 zurückgeben, wenn das Produkt nicht existiert', () => {
      return request(app.getHttpServer())
        .post('/menu/404/ingredient')
        .send({ name: 'Pilze', price: 1.0 })
        .expect(404);
    });
  });

  // 4. PATCH /menu/ingredient/:id
  describe('PATCH /menu/ingredient/:id', () => {
    it('sollte eine Zutat erfolgreich aktualisieren (200)', () => {
      return request(app.getHttpServer())
        .patch('/menu/ingredient/50')
        .send({ name: 'Viel extra Käse' })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Viel extra Käse');
        });
    });

    it('sollte 404 werfen, wenn die Zutat-ID unbekannt ist', () => {
      return request(app.getHttpServer())
        .patch('/menu/ingredient/404')
        .send({ name: 'Nix' })
        .expect(404);
    });
  });

  // 5. PATCH /menu/:id
  describe('PATCH /menu/:id', () => {
    it('sollte ein Produkt partiell aktualisieren (200)', () => {
      return request(app.getHttpServer())
        .patch('/menu/10')
        .send({ price: 11.0, isActive: false })
        .expect(200)
        .expect((res) => {
          expect(res.body.price).toBe(11.0);
          expect(res.body.isActive).toBe(false);
        });
    });

    it('sollte 404 werfen, wenn das Produkt beim Update nicht gefunden wird', () => {
      return request(app.getHttpServer())
        .patch('/menu/404')
        .send({ price: 12.0 })
        .expect(404);
    });
  });

  // 6. DELETE /menu/:id
  describe('DELETE /menu/:id', () => {
    it('sollte ein Produkt erfolgreich löschen (200)', () => {
      return request(app.getHttpServer())
        .delete('/menu/10')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(10);
        });
    });

    it('sollte 404 werfen, wenn das zu löschende Produkt nicht existiert', () => {
      return request(app.getHttpServer())
        .delete('/menu/404')
        .expect(404);
    });
  });

  // 7. DELETE /menu/ingredient/:id
  describe('DELETE /menu/ingredient/:id', () => {
    it('sollte eine Zutat erfolgreich löschen (200)', () => {
      return request(app.getHttpServer())
        .delete('/menu/ingredient/50')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(50);
        });
    });

    it('sollte 404 werfen, wenn die Zutat beim Löschen nicht existiert', () => {
      return request(app.getHttpServer())
        .delete('/menu/ingredient/404')
        .expect(404);
    });
  });
});