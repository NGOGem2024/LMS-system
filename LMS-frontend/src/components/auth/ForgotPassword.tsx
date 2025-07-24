import { useState, FormEvent } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
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
    <div className="flex min-h-screen items-center justify-center bg-[#0a0f1c] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 shadow-xl animate-fade-in">
          <div className="flex flex-col items-center">
            {/* Animated gradient border with icon */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/80 via-purple-500/80 to-pink-500/80 animate-gradient p-0.5">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-pink-500/40 animate-spin-slow blur-sm opacity-30"></div>
                <div className="relative w-full h-full rounded-full bg-gradient-to-r from-blue-500/90 to-purple-500/90 flex items-center justify-center overflow-hidden shadow-md shadow-blue-500/10">
                  <LockClosedIcon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="mt-6 text-3xl font-bold text-white">
              Forgot Password
            </h1>
            <p className="mt-2 text-gray-400">
              Don't worry, we'll help you reset it.
            </p>
          </div>
          
          {formError && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg animate-slide-in-down">
              {formError}
            </div>
          )}
          
          {successMessage && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg animate-slide-in-down">
              {successMessage}
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <p className="text-gray-400 mb-4">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="block w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your email"
                />
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0f1c] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Reset Password'}
              </button>
            </div>
            
            <div className="text-center">
              <RouterLink 
                to="/login" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Back to Sign In
              </RouterLink>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword 