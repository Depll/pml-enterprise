import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { CartProvider } from './context/CartContext' // IMPORTIEREN

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <CartProvider> {/* UM DIE APP WICKELN */}
      <App />
    </CartProvider>
    </BrowserRouter>
  </StrictMode>,
)