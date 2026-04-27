import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';
import PasswordGate from './PasswordGate';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <PasswordGate>
      <App />
    </PasswordGate>
  </React.StrictMode>
);
