import { CartProvider } from './context/CartContext';
import { Menu } from './components/Menu';

function App() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <Menu />
      </div>
    </CartProvider>
  );
}

export default App;