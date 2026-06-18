
import { Menu } from './components/Menu';
import { Footer } from './components/Footer';
import { CartProvider } from './context/CartContext';

function App() {
  return (
    <CartProvider>
      <div className="pml-app-wrapper">
        {/* Hier kommt später die Navbar hin */}
        
        {/* Unsere Speisekarte */}
        <Menu />

        {/* Der neu erstellte Footer */}
        <Footer />
      </div>
    </CartProvider>
  );
}

export default App;