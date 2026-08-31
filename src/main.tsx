import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import 'antd/dist/reset.css'
import './index.css'
import App from './App.tsx'

// HashRouter, nie BrowserRouter: `dist/` jest serwowane jako statyczne pliki
// (nginx / CDN), więc odświeżenie adresu `/coupons` bez przepisywania żądań na
// `index.html` kończyłoby się błędem 404. Adres `#/coupons` działa na dowolnym
// serwerze statycznym bez dodatkowej konfiguracji.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
