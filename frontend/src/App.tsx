import { useState } from 'react';
import { useCart } from './context/CartContext';
import { Hero } from './components/Hero';
import { SearchMenu } from './components/SearchMenu';
import { Menu } from './components/Menu';
import { Footer } from './components/Footer';
import { PostcodeModal } from './components/PostcodeModal';
import { CartDrawer } from './components/CartDrawer';
import { LegalNoticeModal } from './components/LegalNoticeModal';
import { PrivacyModal } from './components/PrivacyModal';
import { CheckoutForm } from './components/CheckoutForm';
import { AdminDashboard } from './components/AdminDashboard'; 
import { OrderStatus } from './components/OrderStatus'; 
import { apiService } from './services/api'; // Pfad anpassen, falls nötig

function App() {
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false); 
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isPostcodeModalOpen, setIsPostcodeModalOpen] = useState<boolean>(false);
  const [isLegalNoticeOpen, setIsLegalNoticeOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  
  const [checkoutPrice, setCheckoutPrice] = useState<number>(0);

  const [postcode, setPostcode] = useState<string>(() => {
    return localStorage.getItem('milano_postcode') || localStorage.getItem('milano_plz') || '51373';
  });

  const cartContext = useCart();
  const cartItems = cartContext?.cart || [];
  const totalPrice = cartContext?.totalPrice || 0;
  const clearCart = cartContext?.clearCart || (() => {});
  
  const [postcodeError, setPostcodeError] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('alle');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const queryParams = new URLSearchParams(window.location.search);
  const isCustomerTracking = queryParams.has('id');
  const lastOrderId = localStorage.getItem('milano_last_order_id');
  const [hideBanner, setHideBanner] = useState<boolean>(false);

  const handlePostcodeSave = async (newPostcode: string) => {
    if (!/^\d{5}$/.test(newPostcode)) {
      setPostcodeError('Bitte eine gültige 5-stellige PLZ eingeben.');
      return;
    }

    try {
      // Nutze jetzt den zentralen apiService statt des manuellen fetch
      const data = await apiService.checkPostcode(newPostcode);

      if (data.erlaubt || data.allowed) {
        setPostcode(newPostcode);
        localStorage.setItem('milano_postcode', newPostcode);
        setPostcodeError('');
        setIsPostcodeModalOpen(false);
      } else {
        setPostcodeError('Wir beliefern aktuell nur Leverkusen!');
      }
    } catch (error) {
      setPostcodeError('Verbindung zum Server fehlgeschlagen.');
    }
  };

  if (isCustomerTracking) {
    return <OrderStatus />;
  }

  if (isAdminMode) {
    return (
      <div>
        <div style={{ padding: '10px', backgroundColor: '#2d3748', borderBottom: '1px solid #4a5568' }}>
          <button 
            onClick={() => setIsAdminMode(false)}
            style={{ padding: '6px 12px', backgroundColor: '#4a5568', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            ← Zurück zum Pizza-Shop
          </button>
        </div>
        <AdminDashboard />
      </div>
    );
  }

  return (
    <div className="pml-app-wrapper">
      
      {lastOrderId && !hideBanner && (
        <div style={{ 
          backgroundColor: '#f6ad55', 
          color: '#1a202c', 
          padding: '12px', 
          textAlign: 'center', 
          fontWeight: 'bold', 
          fontSize: '14px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '15px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <span>🛵 Du hast eine aktive Bestellung laufen!</span>
          <a href={`/?id=${lastOrderId}`} style={{ color: '#1a202c', textDecoration: 'underline', fontWeight: '900' }}>
            Hier live verfolgen →
          </a>
          <button 
            onClick={() => setHideBanner(true)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', marginLeft: '25px', color: '#1a202c', fontWeight: 'bold' }}
            title="Diesen Hinweis ausblenden"
          >
            ✕
          </button>
        </div>
      )}

      <Hero 
        onOpenCart={() => setIsCartOpen(true)} 
        onOpenPostcode={() => {
          setPostcodeError('');
          setIsPostcodeModalOpen(true);
        }} 
        currentPostcode={postcode}
      />
      
      <SearchMenu 
        activeCategory={activeCategory}
        onCategoryChange={(cat) => setActiveCategory(cat)}
        onSearchChange={(term) => setSearchTerm(term)}
      />
      
      <Menu 
        activeCategory={activeCategory} 
        searchTerm={searchTerm} 
      />

      <Footer 
        onOpenLegalNotice={() => setIsLegalNoticeOpen(true)} 
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />

      <LegalNoticeModal 
        isOpen={isLegalNoticeOpen} 
        onClose={() => setIsLegalNoticeOpen(false)} 
      />

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />

      <CheckoutForm 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        totalPrice={checkoutPrice > 0 ? checkoutPrice : totalPrice * 0.9}
        cartItems={cartItems}
        currentPostcode={postcode}
        onOrderSuccess={clearCart}
      />

      <PostcodeModal 
        isOpen={isPostcodeModalOpen}
        onClose={() => setIsPostcodeModalOpen(false)}
        onSave={handlePostcodeSave}
        currentPostcode={postcode}
        errorMessage={postcodeError}
      />

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpenCheckout={(finalPrice) => {
          setCheckoutPrice(finalPrice);
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <button
        onClick={() => setIsAdminMode(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          opacity: 0.3,
          backgroundColor: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '10px',
          cursor: 'pointer',
          zIndex: 9999
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.3')}
      >
        🔑 Küchen-Login
      </button>
    </div>
  );
}

export default App;
