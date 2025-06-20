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

const Register = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedTenant, setSelectedTenant] = useState('default')
  const [formErrors, setFormErrors] = useState<{
    name?: string,
    email?: string,
    password?: string,
    confirmPassword?: string
  }>({})
  
  const { register, error, clearError, tenantId, setTenantId } = useContext(AuthContext)

  // Available tenants
  const tenants = [
    { id: 'default', name: 'LearnMsDb' },
    { id: 'ngo', name: 'NgoLms' }
  ]

  const validateForm = () => {
    const errors: {
      name?: string,
      email?: string,
      password?: string,
      confirmPassword?: string
    } = {}
    let isValid = true

    if (!name) {
      errors.name = 'Name is required'
      isValid = false
    }

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
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
      isValid = false
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
      isValid = false
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    
    if (validateForm()) {
      await register(name, email, password, selectedTenant)
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
          Sign up
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="tenant-select-label">Database</InputLabel>
                <Select
                  labelId="tenant-select-label"
                  id="tenant-select"
                  value={selectedTenant}
                  label="Database"
                  onChange={handleTenantChange}
                >
                  {tenants.map((tenant) => (
                    <MenuItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                autoComplete="name"
                name="name"
                required
                fullWidth
                id="name"
                label="Full Name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!formErrors.password}
                helperText={formErrors.password}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign Up
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  )
}

export default Register 