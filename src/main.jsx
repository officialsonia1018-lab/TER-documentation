import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ModuleProvider } from './context/ModuleContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ModuleProvider>
          <App />
        </ModuleProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
