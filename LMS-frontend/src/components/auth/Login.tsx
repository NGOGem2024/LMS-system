import { useState, useContext, FormEvent } from 'react'
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
  Paper,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import AuthContext from '../../context/AuthContext'
import axios from 'axios'
import { LoadingButton } from '../ui/LoadingComponents'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedTenant, setSelectedTenant] = useState('default')
  const [formErrors, setFormErrors] = useState<{email?: string, password?: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { login, error, clearError, tenantId, setTenantId } = useContext(AuthContext)

  // Available organizations with user-friendly names
  const organizations = [
    { id: 'default', name: 'Learnomic' },
    { id: 'ngo', name: 'NobleGiving' }
  ]

  const validateForm = () => {
    const errors: {email?: string, password?: string} = {}
    let isValid = true

    if (!email) {
      errors.email = 'Email is required'
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid'
      isValid = false
    }

    if (!password) {
      errors.password = 'Password is required'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    
    if (validateForm()) {
      setIsSubmitting(true)
      
      try {
        // Use direct axios call with explicit headers for better error handling
        const response = await axios.post('/api/auth/login', 
          { email, password },
          { 
            headers: { 
              'x-tenant-id': selectedTenant,
              'Content-Type': 'application/json'
            }
          }
        )
        
        console.log('Login successful:', response.data)
        // If successful direct call, use the context method to update state
        await login(email, password, selectedTenant)
      } catch (err) {
        console.error('Login error:', err)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleTenantChange = (e: SelectChangeEvent) => {
    setSelectedTenant(e.target.value)
    setTenantId(e.target.value)
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
          Sign in
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="tenant-select-label">Organization</InputLabel>
            <Select
              labelId="tenant-select-label"
              id="tenant-select"
              value={selectedTenant}
              label="Organization"
              onChange={handleTenantChange}
            >
              {organizations.map((org) => (
                <MenuItem key={org.id} value={org.id}>
                  {org.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
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
            error={!!formErrors.email}
            helperText={formErrors.email}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!formErrors.password}
            helperText={formErrors.password}
          />
          <LoadingButton loading={isSubmitting}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isSubmitting}
            >
              Sign In
            </Button>
          </LoadingButton>
          <Grid container>
            <Grid item xs>
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                Forgot password?
              </Link>
            </Grid>
            <Grid item>
              <Link component={RouterLink} to="/register" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  )
}

export default Login 