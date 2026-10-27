import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider, ConfirmProvider } from './components/ui';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
