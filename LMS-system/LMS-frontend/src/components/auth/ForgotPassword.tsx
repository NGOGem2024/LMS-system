import { useState, FormEvent } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Avatar,
  Button,
  TextField,
  Link,
  Grid,
  Box,
  Typography,
  Container,
  Alert,
  Paper
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import axios from 'axios'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    if (!email) {
      setFormError('Email is required')
      return false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError('Email is invalid')
      return false
    }
    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSuccessMessage(null)
    
    if (validateForm()) {
      setIsSubmitting(true)
      try {
        await axios.post('/api/auth/forgot-password', { email })
        setSuccessMessage('Password reset instructions have been sent to your email.')
        setEmail('')
      } catch (err: any) {
        setFormError(err.response?.data?.message || 'Failed to process your request. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={3}
        sx={{
          marginTop: 8,
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Forgot Password
        </Typography>
        
        {formError && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {formError}
          </Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ width: '100%', mt: 2 }}>
            {successMessage}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter your email address and we'll send you instructions to reset your password.
          </Typography>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Reset Password'}
          </Button>
          <Grid container>
            <Grid item xs>
              <Link component={RouterLink} to="/login" variant="body2">
                Back to Login
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  )
}

export default ForgotPassword 