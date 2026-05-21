import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouter } from './router';
import { ToastContainer } from './components/ui/ToastContainer';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root nao encontrado no HTML');

createRoot(root).render(
  <StrictMode>
    <AppRouter />
    <ToastContainer />
  </StrictMode>,
);
