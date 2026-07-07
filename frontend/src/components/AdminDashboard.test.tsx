import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { AdminDashboard } from './AdminDashboard';
import '@testing-library/jest-dom';

// Wichtig: Da api.ts nun 'is_active' vom Server erwartet, um es auf 'isActive' 
// zu mappen, muss unser Mock-Server hier 'is_active' ausliefern.
const mockMenuData = [
  {
    id: 1,
    name: 'Pizza',
    products: [
      {
        id: 101,
        sku: 'PROD-1',
        name: 'Pizza Margherita',
        description: 'mit Tomatensauce',
        price: 7.50,
        is_active: true, // Hier korrigiert für das api.ts-Mapping!
        ingredients: [
          { id: 1, name: 'Extra Käse', extraPrice: 1.50 }
        ]
      }
    ]
  }
];

const server = setupServer(
  http.get('http://localhost:3000/orders', () => {
    return HttpResponse.json([]);
  }),

  http.get('http://localhost:3000/menu', () => {
    return HttpResponse.json(mockMenuData);
  }),

  http.post('http://localhost:3000/menu/:productId/ingredient', async ({ request }) => {
    const body = await request.json() as { name: string; price: number };
    
    if (body.name && typeof body.price === 'number') {
      return new HttpResponse(null, { status: 201 });
    }
    return new HttpResponse(null, { status: 400 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AdminDashboard Integrations-Tests', () => {
  
  test('loads the menu and displays extraPrice correctly', async () => {
    render(<AdminDashboard />);

    const menuTabButton = screen.getByRole('button', { name: /Speisekarte verwalten/i });
    fireEvent.click(menuTabButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Pizza Margherita')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('Extra Käse')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1,50')).toBeInTheDocument();
  });

  test('converts comma price input and adds a new ingredient', async () => {
    render(<AdminDashboard />);

    fireEvent.click(screen.getByRole('button', { name: /Speisekarte verwalten/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Zutat-Name (z.B. Extra Käse)')).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Zutat-Name (z.B. Extra Käse)');
    const priceInput = screen.getByPlaceholderText('1,50');
    const addButton = screen.getByRole('button', { name: /Extra hinzufügen/i });

    fireEvent.change(nameInput, { target: { value: 'Suckuk' } });
    fireEvent.change(priceInput, { target: { value: '2,50' } });
    
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(nameInput).toHaveValue('');
      expect(priceInput).toHaveValue('');
    });
  });

  test('loads orders, displays email, and can update status', async () => {
    server.use(
      http.get('http://localhost:3000/orders', () => {
        return HttpResponse.json([
          {
            id: 'order-123',
            customerName: 'Max Mustermann',
            street: 'Hauptstr.',
            houseNumber: '10',
            postcode: '12345',
            city: 'Berlin',
            phone: '01701234567',
            email: 'max@mustermann.de',
            totalPrice: 25.50,
            status: 'open',
            createdAt: new Date().toISOString(),
            positions: []
          }
        ]);
      }),
      http.patch('http://localhost:3000/orders/order-123/status', async ({ request }) => {
        const body = await request.json() as { status: string };
        if (body.status === 'zubereitung') {
          return new HttpResponse(null, { status: 200 });
        }
        return new HttpResponse(null, { status: 400 });
      })
    );

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
    });
    expect(screen.getByText('max@mustermann.de')).toBeInTheDocument();

    const statusButton = screen.getByRole('button', { name: /In den Ofen/i });
    fireEvent.click(statusButton);
  });

  test('sends the cancellation reason to the backend when cancelling', async () => {
    let interceptedBody: any = null;

    server.use(
      http.get('http://localhost:3000/orders', () => {
        return HttpResponse.json([
          {
            id: 'order-storno-123',
            customerName: 'Storno Kunde',
            street: 'Teststraße',
            houseNumber: '1',
            postcode: '12345',
            city: 'Mainz',
            phone: '0151000000',
            email: 'storno@test.de',
            totalPrice: 12.00,
            status: 'open',
            createdAt: new Date().toISOString(),
            positions: []
          }
        ]);
      }),
      http.patch('http://localhost:3000/orders/order-storno-123/status', async ({ request }) => {
        interceptedBody = await request.json();
        return new HttpResponse(null, { status: 200 });
      })
    );

    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Keine Zutaten mehr da');

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Storno Kunde')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /Stornieren/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(interceptedBody).toEqual({
        status: 'storniert',
        stornoReason: 'Keine Zutaten mehr da'
      });
    });

    promptSpy.mockRestore();
  });

  test('reloads orders every 5 seconds', async () => {
    vi.useFakeTimers();
    let callCount = 0;

    server.use(
      http.get('http://localhost:3000/orders', () => {
        callCount++;
        return HttpResponse.json([]);
      })
    );

    render(<AdminDashboard />);

    await vi.advanceTimersByTimeAsync(0);
    expect(callCount).toBe(1);

    await vi.advanceTimersByTimeAsync(5000);
    expect(callCount).toBe(2);

    await vi.advanceTimersByTimeAsync(5000);
    expect(callCount).toBe(3);

    vi.useRealTimers();
  });
});