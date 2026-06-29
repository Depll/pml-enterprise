import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { AdminDashboard } from './AdminDashboard';
import '@testing-library/jest-dom'; // <- Sucht nach globalem 'expect'

// 1. API-Mock-Server definieren
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
        isActive: true,
        ingredients: [
          { id: 1, name: 'Extra Käse', extraPrice: 1.50 }
        ]
      }
    ]
  }
];

const server = setupServer(
  // Mock für das Laden der Bestellungen (leeres Array für dieses Beispiel)
  http.get('http://localhost:3000/orders', () => {
    return HttpResponse.json([]);
  }),

  // Mock für das Laden der Speisekarte
  http.get('http://localhost:3000/menu', () => {
    return HttpResponse.json(mockMenuData);
  }),

  // Mock für das Hinzufügen einer Zutat
  http.post('http://localhost:3000/menu/:productId/ingredient', async ({ request }) => {
    const body = await request.json() as { name: string; extraPrice: number };
    
    // Testen, ob das Frontend das richtige DB-Feld "extraPrice" mitschickt
    if (body.name && typeof body.extraPrice === 'number') {
      return new HttpResponse(null, { status: 201 });
    }
    return new HttpResponse(null, { status: 400 });
  })
);

// Server-Lebenszyklus verwalten
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// 2. Die Test-Fälle
describe('AdminDashboard Integrations-Tests', () => {
  
  test('sollte das Menü laden und den extraPrice korrekt anzeigen', async () => {
    render(<AdminDashboard />);

    // Zum Speisekarte-Tab wechseln
    const menuTabButton = screen.getByRole('button', { name: /Speisekarte verwalten/i });
    fireEvent.click(menuTabButton);

    // Warten, bis das Produkt aus dem API-Mock gerendert wurde
    await waitFor(() => {
      expect(screen.getByDisplayValue('Pizza Margherita')).toBeInTheDocument();
    });

    // Prüfen, ob die Zutat "Extra Käse" mit dem richtigen Preis geladen wird
    expect(screen.getByDisplayValue('Extra Käse')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1,50')).toBeInTheDocument();
  });

  test('sollte eine neue Zutat mit Komma-Eingabe erfolgreich konvertieren und hinzufügen', async () => {
    render(<AdminDashboard />);

    // Tab wechseln
    fireEvent.click(screen.getByRole('button', { name: /Speisekarte verwalten/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Zutat-Name (z.B. Extra Käse)')).toBeInTheDocument();
    });

    // Inputs greifen
    const nameInput = screen.getByPlaceholderText('Zutat-Name (z.B. Extra Käse)');
    const priceInput = screen.getByPlaceholderText('1,50');
    const addButton = screen.getByRole('button', { name: /Extra hinzufügen/i });

    // Werte eintragen (hier testen wir explizit das deutsche Komma)
    fireEvent.change(nameInput, { target: { value: 'Suckuk' } });
    fireEvent.change(priceInput, { target: { value: '2,50' } });
    
    // Klick auf Absenden
    fireEvent.click(addButton);

    // Prüfen, ob die Felder nach dem erfolgreichen POST-Request geleert wurden
    await waitFor(() => {
      expect(nameInput).toHaveValue('');
      expect(priceInput).toHaveValue('');
    });
  });

  test('sollte Bestellungen laden, die E-Mail anzeigen und den Status ändern können', async () => {
    // 1. Temporären API-Mock für diesen spezifischen Test hinzufügen
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
            email: 'max@mustermann.de', // <--- Unsere neue E-Mail
            totalPrice: 25.50,
            status: 'open',
            createdAt: new Date().toISOString(),
            positions: []
          }
        ]);
      }),
      // Mock für das Status-Update
      http.patch('http://localhost:3000/orders/order-123/status', async ({ request }) => {
        const body = await request.json() as { status: string };
        if (body.status === 'preparing') {
          return new HttpResponse(null, { status: 200 });
        }
        return new HttpResponse(null, { status: 400 });
      })
    );

    render(<AdminDashboard />);

    // 2. Prüfen, ob die Bestellung und die E-Mail korrekt im Dokument landen
    await waitFor(() => {
      expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
    });
    expect(screen.getByText('max@mustermann.de')).toBeInTheDocument();

    // 3. Status-Änderung triggern (Button "In den Ofen" o.ä. klicken)
    // Passe den Text hier an das an, was auf deinem Button steht (z.B. "In den Ofen" oder "Umsortieren")
    const statusButton = screen.getByRole('button', { name: /In den Ofen/i });
    fireEvent.click(statusButton);

    // Wenn dein UI den Status nach dem Klick lokal optimistisch aktualisiert,
    // kannst du hier prüfen, ob der Button-Text verschwindet oder sich ändert.
  });
  
});