import { createContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

interface User {
  _id: string
  name: string
  email: string
  role: string
  tenant?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  error: null,
  clearError: () => {},
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  const navigate = useNavigate()

  // Set auth token for axios requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  // Load user if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const res = await axios.get('/api/auth/me')
        setUser(res.data)
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

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      setToken(res.data.token)
      setUser(res.data.user)
      setIsAuthenticated(true)
      setError(null)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await axios.post('/api/auth/register', { name, email, password })
      localStorage.setItem('token', res.data.token)
      setToken(res.data.token)
      setUser(res.data.user)
      setIsAuthenticated(true)
      setError(null)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
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
        login,
        register,
        logout,
        error,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext 