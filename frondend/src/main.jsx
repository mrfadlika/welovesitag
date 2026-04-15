import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './components/MiningTheme.css'
import App from './App.jsx'

document.documentElement.dataset.appEnv = import.meta.env.PROD ? 'production' : 'development'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
