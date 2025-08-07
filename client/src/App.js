import React, { useState } from 'react';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import Login from './components/Login';
import Register from './components/Register';
import ChatDashboard from './components/ChatDashboard';
import EmailVerification from './components/EmailVerification';

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <ChatDashboard />;
  }

  if (showEmailVerification) {
    return (
      <EmailVerification 
        email={verificationEmail}
        onBackToLogin={() => {
          setShowEmailVerification(false);
          setShowRegister(false);
        }}
      />
    );
  }

  return showRegister ? (
    <Register 
      onSwitchToLogin={() => setShowRegister(false)}
      onEmailVerificationRequired={(email) => {
        setVerificationEmail(email);
        setShowEmailVerification(true);
      }}
    />
  ) : (
    <Login 
      onSwitchToRegister={() => setShowRegister(true)}
      onEmailVerificationRequired={(email) => {
        setVerificationEmail(email);
        setShowEmailVerification(true);
      }}
    />
  );
};

function App() {
  return (
    <CustomThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}

export default App;
