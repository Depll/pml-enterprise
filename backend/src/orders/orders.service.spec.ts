import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from '../database/entities/order.entity';
import { NotFoundException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;

  // Hier definieren wir die Mock-Funktionen direkt
  const mockOrderRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
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

      // Wir prüfen direkt das Mock-Objekt – das verhindert Linter- und Jest-Fehler
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

      // Auch hier prüfen wir direkt den Mock
      expect(mockOrderRepository.save).not.toHaveBeenCalled();
    });
  });
});
