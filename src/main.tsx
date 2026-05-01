import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { handlePollinationsCallback } from './hooks/usePollinationsAuth.ts'

// Must run before React mounts — HashRouter uses # for routing and would
// consume #api_key=... from the Pollinations OAuth redirect before any useEffect fires.
handlePollinationsCallback();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
