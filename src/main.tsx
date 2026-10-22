import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { useConfigurator } from './store/configurator'
import './styles.css'

// handy for scripted checks during development
if (import.meta.env.DEV) (window as unknown as { __atelier: typeof useConfigurator }).__atelier = useConfigurator

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
