import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Link
} from '@mui/material';
import { CheckCircle, Email, Refresh } from '@mui/icons-material';
import axios from 'axios';

const EmailVerification = ({ email, onResendEmail, onBackToLogin }) => {
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, success, error
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  
  useEffect(() => {
    // Check if there's a verification token in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      verifyEmailToken(token);
    }
  }, []);

  const verifyEmailToken = async (token) => {
    setLoading(true);
    try {
      const response = await axios.get(`/auth/verify-email/${token}`);
      
      if (response.data.success) {
        setVerificationStatus('success');
        setMessage(response.data.message);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          onBackToLogin();
        }, 3000);
      }
    } catch (error) {
      setVerificationStatus('error');
      setMessage(error.response?.data?.message || 'Email verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) return;
    
    setResendLoading(true);
    try {
      const response = await axios.post('/auth/resend-verification', { email });
      
      if (response.data.success) {
        setMessage('Verification email sent successfully! Please check your inbox.');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box textAlign="center" py={4}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Verifying your email...
          </Typography>
        </Box>
      );
    }

    if (verificationStatus === 'success') {
      return (
        <Box textAlign="center" py={4}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="success.main">
            Email Verified Successfully!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {message}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Redirecting to login page...
          </Typography>
        </Box>
      );
    }

    if (verificationStatus === 'error') {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="h5" gutterBottom color="error">
            Verification Failed
          </Typography>
          <Alert severity="error" sx={{ mb: 3 }}>
            {message}
          </Alert>
          <Button
            variant="contained"
            onClick={onBackToLogin}
            sx={{ mr: 2 }}
          >
            Back to Login
          </Button>
          {email && (
            <Button
              variant="outlined"
              onClick={handleResendEmail}
              disabled={resendLoading}
              startIcon={resendLoading ? <CircularProgress size={20} /> : <Refresh />}
            >
              Resend Email
            </Button>
          )}
        </Box>
      );
    }

    // Default pending state
    return (
      <Box textAlign="center" py={4}>
        <Email sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Check Your Email
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          We've sent a verification link to:
        </Typography>
        <Typography variant="h6" color="primary" sx={{ mb: 3 }}>
          {email}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Click the link in the email to verify your account. The link will expire in 24 hours.
        </Typography>
        
        {message && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={handleResendEmail}
            disabled={resendLoading}
            startIcon={resendLoading ? <CircularProgress size={20} /> : <Refresh />}
          >
            Resend Email
          </Button>
          <Button
            variant="text"
            onClick={onBackToLogin}
          >
            Back to Login
          </Button>
        </Box>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Didn't receive the email?</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Check your spam/junk folder
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Make sure you entered the correct email address
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Try resending the verification email
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Email Verification
          </Typography>
          {renderContent()}
        </Paper>
      </Box>
    </Container>
  );
};

export default EmailVerification;
