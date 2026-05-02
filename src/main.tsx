import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'

if ('serviceWorker' in navigator) {
  import('@serwist/window').then(({ Serwist }) => {
    const sw = new Serwist('/sw.js', { scope: '/', type: 'classic' })
    void sw.register()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
