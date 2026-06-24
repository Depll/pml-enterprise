import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CartProvider } from './context/CartContext' // IMPORTIEREN

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CartProvider> {/* UM DIE APP WICKELN */}
      <App />
    </CartProvider>
  </StrictMode>,
)