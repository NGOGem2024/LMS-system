import { createContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

interface User {
  _id: string
  name: string
  email: string
  role: string
  tenantId: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  tenantId: string
  login: (email: string, password: string, tenantId?: string) => Promise<void>
  register: (name: string, email: string, password: string, tenantId?: string, role?: string) => Promise<void>
  logout: () => void
  error: string | null
  clearError: () => void
  setTenantId: (id: string) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  tenantId: 'default',
  login: async () => {},
  register: async () => {},
  logout: () => {},
  error: null,
  clearError: () => {},
  setTenantId: () => {},
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string>(localStorage.getItem('tenantId') || 'default')
  
  const navigate = useNavigate()

  // Set auth token and tenant for axios requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Setting Authorization header:', `Bearer ${token}`);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      console.log('Removing Authorization header');
    }
    
    // Set tenant ID header
    if (tenantId) {
      axios.defaults.headers.common['X-Tenant-ID'] = tenantId;
      localStorage.setItem('tenantId', tenantId);
      console.log('Setting X-Tenant-ID header:', tenantId);
    }
  }, [token, tenantId])

  // Load user if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const res = await axios.get('/api/auth/me')
        setUser(res.data.data)
        setIsAuthenticated(true)
      } catch (err) {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
        setIsAuthenticated(false)
        setError('Authentication failed. Please login again.')
      }
      
      setIsLoading(false)
    }

    loadUser()
  }, [token])

  const login = async (email: string, password: string, loginTenantId?: string) => {
    try {
      // Use provided tenant ID or fallback to current tenant ID
      const currentTenantId = loginTenantId || tenantId
      
      // Set tenant ID header for this request
      axios.defaults.headers.common['X-Tenant-ID'] = currentTenantId
      
      const res = await axios.post('/api/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      setToken(res.data.token)
      setUser(res.data.user)
      
      // Update tenant ID if it came from user data
      if (res.data.user && res.data.user.tenantId) {
        setTenantId(res.data.user.tenantId)
      } else if (loginTenantId) {
        // Otherwise use the provided tenant ID
        setTenantId(loginTenantId)
      }
      
      setIsAuthenticated(true)
      setError(null)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    }
  }

  const register = async (name: string, email: string, password: string, registerTenantId?: string, role?: string) => {
    try {
      // Use provided tenant ID or fallback to current tenant ID
      const currentTenantId = registerTenantId || tenantId
      
      // Set tenant ID header for this request
      axios.defaults.headers.common['X-Tenant-ID'] = currentTenantId
      
      // Add role to registration data if provided
      const registrationData = { name, email, password, role: role || 'student' }
      
      const res = await axios.post('/api/auth/register', registrationData)
      localStorage.setItem('token', res.data.token)
      setToken(res.data.token)
      setUser(res.data.user)
      
      // Update tenant ID if it came from user data
      if (res.data.user && res.data.user.tenantId) {
        setTenantId(res.data.user.tenantId)
      } else if (registerTenantId) {
        // Otherwise use the provided tenant ID
        setTenantId(registerTenantId)
      }
      
      setIsAuthenticated(true)
      setError(null)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    // Don't clear tenant ID on logout
    navigate('/login')
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        tenantId,
        login,
        register,
        logout,
        error,
        clearError,
        setTenantId
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext 