/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from '../database/entities/order.entity';
import { NotFoundException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;

  // Zentrales Mock-Objekt für das TypeORM Repository
  const mockOrderRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    create: jest.fn().mockImplementation((dto) => ({ ...dto })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('sollte eine Bestellung mit formatierten Positionen erfolgreich erstellen', async () => {
      const createOrderDto: any = {
        customerName: 'Max Mustermann',
        positions: [
          {
            productId: '42', // Als String geliefert
            quantity: 2,
            priceSnapshot: 11.5,
            selectedSize: undefined, // Sollte zu '' werden
            selectedIngredientsIds: null, // Sollte zu [] werden
          },
        ],
      };

      // Mock für save: Gibt das manipulierte Objekt mit einer Mock-ID zurück
      mockOrderRepository.save.mockImplementation((order) =>
        Promise.resolve({ id: 'new-order-999', ...order }),
      );

      const result = await service.createOrder(createOrderDto);

      // Überprüfung 1: Wurde das Repository mit den Basisdaten aufgerufen?
      expect(mockOrderRepository.create).toHaveBeenCalledWith({
        customerName: 'Max Mustermann',
      });

      // Überprüfung 2: Datentypen und Standard-Fallbacks prüfen
      const savedPositions =
        mockOrderRepository.save.mock.calls[0][0].positions;

      expect(savedPositions[0].productId).toBe(42); // String zu Number Konvertierung
      expect(savedPositions[0].selectedSize).toBe(''); // undefined Fallback
      expect(savedPositions[0].selectedIngredientsIds).toEqual([]); // null Fallback
      expect(savedPositions[0].quantity).toBe(2);

      // Überprüfung 3: Rückgabewert des Services validieren
      expect(result).toHaveProperty('id', 'new-order-999');
    });
  });

  describe('updateStatus', () => {
    it('sollte den Status und den Stornogrund erfolgreich aktualisieren', async () => {
      const mockOrder = { id: 'order-123', status: 'open', stornoReason: null };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockImplementation((order) =>
        Promise.resolve(order),
      );

      const result = await service.updateStatus(
        'order-123',
        'storniert',
        'Keine Zutaten mehr da',
      );

      expect(mockOrderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'order-123' },
      });
      expect(mockOrderRepository.save).toHaveBeenCalledWith({
        id: 'order-123',
        status: 'storniert',
        stornoReason: 'Keine Zutaten mehr da',
      });

      expect(result.status).toBe('storniert');
      expect(result.stornoReason).toBe('Keine Zutaten mehr da');
    });

    it('sollte eine NotFoundException werfen, wenn die Bestellung nicht existiert', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus('nicht-existent', 'storniert', 'Grund'),
      ).rejects.toThrow(NotFoundException);

      expect(mockOrderRepository.save).not.toHaveBeenCalled();
    });
  });
});
