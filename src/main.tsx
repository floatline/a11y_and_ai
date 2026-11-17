import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configure } from '@gravity-ui/uikit';
import '@gravity-ui/uikit/styles/styles.css';
import './index.css';
import App from './App.tsx';
import { DemoProvider } from './demo/DemoContext';

// Gravity's own screen-reader strings (hidden «Закрыть» in dialogs, list messages) are English by default.
configure({ lang: 'ru' });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DemoProvider>
      <App />
    </DemoProvider>
  </StrictMode>,
);
