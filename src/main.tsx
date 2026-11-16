import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@gravity-ui/uikit/styles/styles.css';
import './index.css';
import App from './App.tsx';
import { DemoProvider } from './demo/DemoContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DemoProvider>
      <App />
    </DemoProvider>
  </StrictMode>,
);
