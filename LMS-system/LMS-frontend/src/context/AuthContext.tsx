import { createContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

interface User {
  _id: string
  name: string
  email: string
  role: string
  tenantId: string
  profile?: {
    avatar?: string
    bio?: string
  }
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
  updateUser: (userData: Partial<User>) => void
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
  updateUser: () => {},
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string>(localStorage.getItem('tenantId') || 'default')
  
  const navigate = useNavigate()

  // Debug token on mount
  useEffect(() => {
    console.log('AuthContext initialized with token:', token ? `${token.substring(0, 20)}...` : 'null');
    console.log('AuthContext initialized with tenantId:', tenantId);
  }, []);

  // Set tenant ID in localStorage when it changes
  useEffect(() => {
    if (tenantId) {
      localStorage.setItem('tenantId', tenantId);
      console.log('Setting tenant ID in localStorage:', tenantId);
    }
  }, [tenantId])

  // Load user if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        console.log('No token available, skipping user load');
        setIsLoading(false)
        return
      }

      try {
        console.log('Loading user with token:', token.substring(0, 20) + '...');
        // Ensure the Authorization header is set correctly for this specific request
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenantId
          }
        };
        
        // Get the user profile which includes profile information like avatar
        const res = await axios.get('/api/auth/me', config)
        
        // Set complete user data with profile information
        setUser(res.data.data)
        setIsAuthenticated(true)
        
        // Update localStorage with the latest user data
        localStorage.setItem('user', JSON.stringify(res.data.data))
        
        console.log('Loaded user with profile:', res.data.data)
      } catch (err) {
        console.error('Failed to load user from API:', err)
        
        // Try to get user from localStorage as fallback
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser)
            console.log('Loaded user from localStorage:', parsedUser)
            setUser(parsedUser)
            setIsAuthenticated(true)
          } catch (parseErr) {
            console.error('Failed to parse stored user data:', parseErr)
            localStorage.removeItem('user')
            localStorage.removeItem('token')
            setToken(null)
            setUser(null)
            setIsAuthenticated(false)
            setError('Authentication failed. Please login again.')
          }
        } else {
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
          setIsAuthenticated(false)
          setError('Authentication failed. Please login again.')
        }
      }
      
      setIsLoading(false)
    }

    loadUser()
  }, [token, tenantId])

  const login = async (email: string, password: string, loginTenantId?: string) => {
    try {
      // Use provided tenant ID or fallback to current tenant ID
      const currentTenantId = loginTenantId || tenantId
      
      // Update tenant ID in context and localStorage
      if (loginTenantId) {
        setTenantId(loginTenantId)
      }
      
      console.log(`Attempting login for ${email} with tenant: ${currentTenantId}`);
      
      // Explicitly set headers for this request
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentTenantId
        }
      };
      
      const res = await axios.post('/api/auth/login', { email, password }, config)
      
      console.log('Login successful, received token:', res.data.token.substring(0, 20) + '...');
      
      // Store token in localStorage
      localStorage.setItem('token', res.data.token)
      
      // Store the complete user object for persistence across sessions
      localStorage.setItem('user', JSON.stringify(res.data.user))
      
      setToken(res.data.token)
      setUser(res.data.user)
      
      // Update tenant ID if it came from user data
      if (res.data.user && res.data.user.tenantId) {
        setTenantId(res.data.user.tenantId)
      }
      
      setIsAuthenticated(true)
      setError(null)
      navigate('/')
    } catch (err: any) {
      console.error('Login failed:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    }
  }

  const register = async (name: string, email: string, password: string, registerTenantId?: string, role?: string) => {
    try {
      // Use provided tenant ID or fallback to current tenant ID
      const currentTenantId = registerTenantId || tenantId
      
      // Update tenant ID in context and localStorage
      if (registerTenantId) {
        setTenantId(registerTenantId)
      }
      
      console.log(`Registering user: ${email} with tenant: ${currentTenantId}, role: ${role || 'student'}`)
      
      // Add role to registration data if provided
      const registrationData = { name, email, password, role: role || 'student' }
      
      // Set headers with tenant ID explicitly for this request
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentTenantId
        }
      }
      
      const res = await axios.post('/api/auth/register', registrationData, config)
      
      console.log('Registration response:', res.data)
      
      localStorage.setItem('token', res.data.token)
      setToken(res.data.token)
      setUser(res.data.user)
      
      // Update tenant ID if it came from user data
      if (res.data.user && res.data.user.tenantId) {
        setTenantId(res.data.user.tenantId)
      }
      
      setIsAuthenticated(true)
      setError(null)
      navigate('/')
    } catch (err: any) {
      console.error('Registration error:', err.response?.data || err.message)
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    // Don't clear tenant ID on logout
    navigate('/login')
  }

  const clearError = () => {
    setError(null)
  }

  // Update user data (e.g., after profile update)
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = {
        ...user,
        ...userData
      }
      
      console.log('Updating user in AuthContext:', updatedUser);
      console.log('Profile data before update:', user.profile);
      console.log('Profile data in update:', userData.profile);
      console.log('Avatar URL:', userData.profile?.avatar);
      
      // Update user in state
      setUser(updatedUser)
      
      // Update user in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      console.log('User updated and saved to localStorage:', updatedUser)
    }
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
        setTenantId,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext 