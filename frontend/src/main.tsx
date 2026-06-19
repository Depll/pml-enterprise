import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CartProvider } from './context/CartContext' // <-- HIER IMPORTIEREN

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CartProvider> {/* <-- HIER UM DIE APP WICKELN */}
      <App />
    </CartProvider>
  </StrictMode>,
)