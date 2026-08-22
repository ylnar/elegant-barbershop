import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Aktifkan stylesheet font yang sudah di-preload (aman CSP — tanpa inline handler)
(function activateFontStylesheet() {
  const link = document.getElementById('font-css') as HTMLLinkElement | null;
  if (!link) return;
  let activated = false;
  const activate = () => {
    if (activated) return;
    activated = true;
    link.rel = 'stylesheet';
  };
  link.addEventListener('load', activate);
  // Fallback bila resource selesai dimuat sebelum listener terpasang
  setTimeout(activate, 1200);
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
