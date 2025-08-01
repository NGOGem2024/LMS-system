// import { useState, useContext, FormEvent } from 'react'
// import { Link as RouterLink } from 'react-router-dom'
// import { 
//   LockClosedIcon, 
//   ChevronDownIcon,
//   EnvelopeIcon,
//   KeyIcon,
//   BuildingOfficeIcon
// } from '@heroicons/react/24/outline'
// import AuthContext from '../../context/AuthContext'
// import axios from 'axios'

// const Login = () => {
//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const [selectedTenant, setSelectedTenant] = useState('default')
//   const [formErrors, setFormErrors] = useState<{email?: string, password?: string}>({})
//   const [isSubmitting, setIsSubmitting] = useState(false)
  
//   const { login, error, clearError, tenantId, setTenantId } = useContext(AuthContext)

//   // Available organizations with user-friendly names
//   const organizations = [
//     { id: 'default', name: 'Learnomic' },
//     { id: 'ngo', name: 'NobleGiving' }
//   ]

//   const validateForm = () => {
//     const errors: {email?: string, password?: string} = {}
//     let isValid = true

//     if (!email) {
//       errors.email = 'Email is required'
//       isValid = false
//     } else if (!/\S+@\S+\.\S+/.test(email)) {
//       errors.email = 'Email is invalid'
//       isValid = false
//     }

//     if (!password) {
//       errors.password = 'Password is required'
//       isValid = false
//     }

//     setFormErrors(errors)
//     return isValid
//   }

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault()
//     clearError()
    
//     if (validateForm()) {
//       setIsSubmitting(true)
      
//       try {
//         // Use direct axios call with explicit headers for better error handling
//         const response = await axios.post('/api/auth/login', 
//           { email, password },
//           { 
//             headers: { 
//               'x-tenant-id': selectedTenant,
//               'Content-Type': 'application/json'
//             }
//           }
//         )
        
//         console.log('Login successful:', response.data)
//         // If successful direct call, use the context method to update state
//         await login(email, password, selectedTenant)
//       } catch (err) {
//         console.error('Login error:', err)
//       } finally {
//         setIsSubmitting(false)
//       }
//     }
//   }

//   const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedTenant(e.target.value)
//     setTenantId(e.target.value)
//   }

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-[#0a0f1c] py-12 px-4 sm:px-6 lg:px-8">
//       <div className="w-full max-w-md">
//         <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 shadow-xl animate-fade-in">
//           <div className="flex flex-col items-center">
//             {/* Animated gradient border with reduced intensity */}
//             <div className="relative w-16 h-16">
//               <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/80 via-purple-500/80 to-pink-500/80 animate-gradient p-0.5">
//                 <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-pink-500/40 animate-spin-slow blur-sm opacity-30"></div>
//                 <div className="relative w-full h-full rounded-full bg-gradient-to-r from-blue-500/90 to-purple-500/90 flex items-center justify-center overflow-hidden shadow-md shadow-blue-500/10">
//                   <LockClosedIcon className="h-8 w-8 text-white" />
//                 </div>
//               </div>
//             </div>
            
//             <h1 className="mt-6 text-3xl font-bold text-white">
//               Sign In
//             </h1>
//             <p className="mt-2 text-gray-400">
//               Welcome back! Please enter your details.
//             </p>
//           </div>
          
//           {error && (
//             <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg animate-slide-in-down">
//               {error}
//             </div>
//           )}
          
//           <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
//             <div className="space-y-6">
//               <div>
//                 <label htmlFor="tenant-select" className="block text-sm font-medium text-gray-200 mb-2">
//                   Organization
//                 </label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
//                   </div>
//                   <select
//                     id="tenant-select"
//                     value={selectedTenant}
//                     onChange={handleTenantChange}
//                     className="block w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
//                   >
//                     {organizations.map((org) => (
//                       <option key={org.id} value={org.id} className="bg-[#1e2736] text-white">
//                         {org.name}
//                       </option>
//                     ))}
//                   </select>
//                   <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
//                     <ChevronDownIcon className="h-5 w-5" />
//                   </div>
//                 </div>
//               </div>
              
//               <div>
//                 <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
//                   Email Address
//                 </label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <EnvelopeIcon className="h-5 w-5 text-gray-400" />
//                   </div>
//                   <input
//                     id="email"
//                     name="email"
//                     type="email"
//                     autoComplete="email"
//                     required
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     className={`block w-full pl-10 pr-3 py-2 bg-white/5 border ${
//                       formErrors.email ? 'border-red-500' : 'border-white/10'
//                     } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400`}
//                     placeholder="Enter your email"
//                   />
//                 </div>
//                 {formErrors.email && (
//                   <p className="mt-2 text-sm text-red-500">{formErrors.email}</p>
//                 )}
//               </div>
              
//               <div>
//                 <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
//                   Password
//                 </label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <KeyIcon className="h-5 w-5 text-gray-400" />
//                   </div>
//                   <input
//                     id="password"
//                     name="password"
//                     type="password"
//                     autoComplete="current-password"
//                     required
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     className={`block w-full pl-10 pr-3 py-2 bg-white/5 border ${
//                       formErrors.password ? 'border-red-500' : 'border-white/10'
//                     } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400`}
//                     placeholder="••••••••"
//                   />
//                 </div>
//                 {formErrors.password && (
//                   <p className="mt-2 text-sm text-red-500">{formErrors.password}</p>
//                 )}
//               </div>
//             </div>
            
//             <div>
//               <button
//                 type="submit"
//                 disabled={isSubmitting}
//                 className="w-full flex justify-center items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0f1c] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 cursor-pointer"
//               >
//                 {isSubmitting ? (
//                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                 ) : 'Sign In'}
//               </button>
//             </div>
            
//             <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
//               <RouterLink 
//                 to="/forgot-password" 
//                 className="text-gray-400 hover:text-white transition-colors"
//               >
//                 Forgot password?
//               </RouterLink>
//               <RouterLink 
//                 to="/register" 
//                 className="text-blue-400 hover:text-blue-300 transition-colors"
//               >
//                 Don't have an account? Sign Up
//               </RouterLink>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default Login 

import { useState, useContext, FormEvent, useEffect } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { 
  LockClosedIcon, 
  ChevronDownIcon,
  EnvelopeIcon,
  KeyIcon,
  BuildingOfficeIcon,
  CheckIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import AuthContext from '../../context/AuthContext'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<{ id: string; name: string } | null>(null)
  const [formErrors, setFormErrors] = useState<{
    email?: string, 
    password?: string,
    organization?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false) // Track if user has interacted after error
  
  const { login, error, clearError, tenantId, setTenantId } = useContext(AuthContext)
  const location = useLocation()
  
  // Get success message from registration if it exists
  const successMessage = location.state?.message

  // Clear any existing errors when component mounts
  useEffect(() => {
    clearError()
  }, [clearError])

  // Available organizations with user-friendly names
  const organizations = [
    { id: 'default', name: 'Learnomic' },
    { id: 'ngo', name: 'NobleGiving' }
  ]

  const handleOrgInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setOrgName(inputValue)

    // Find matching organization (case-insensitive)
    const matchedOrg = organizations.find(
      org => org.name.toLowerCase() === inputValue.toLowerCase()
    )

    if (matchedOrg) {
      setSelectedOrg(matchedOrg)
      setTenantId(matchedOrg.id)
      // Clear any existing organization error
      setFormErrors(prev => ({ ...prev, organization: undefined }))
    } else {
      setSelectedOrg(null)
      setTenantId('')
    }

    // Only clear auth errors if user has significantly changed input after an error
    if (error && hasUserInteracted) {
      clearError()
      setHasUserInteracted(false)
    }
  }

  const validateForm = () => {
    const errors: {
      email?: string, 
      password?: string,
      organization?: string
    } = {}
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

    if (!selectedOrg) {
      errors.organization = 'Please enter a valid organization name'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors and reset interaction flag
    clearError()
    setHasUserInteracted(false)
    
    if (validateForm()) {
      setIsSubmitting(true)
      
      try {
        console.log(`Attempting login with email: ${email}, tenant: ${selectedOrg?.id}`)
        await login(email, password, selectedOrg!.id)
        console.log('Login successful through context')
        // If we reach here, login was successful
      } catch (err) {
        console.error('Login failed:', err)
        // The AuthContext has already set the error message
        // Set interaction flag so user can clear error by typing after seeing it
        setTimeout(() => {
          setHasUserInteracted(true)
        }, 2000) // Give user 2 seconds to see the error
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  // Modified input change handler - only clear auth errors after user has had time to see them
  const handleInputChange = (field: string, value: string) => {
    switch (field) {
      case 'email':
        setEmail(value)
        break
      case 'password':
        setPassword(value)
        break
    }

    // Only clear auth errors if user has interacted after seeing the error
    // and has made substantial changes (more than just a few characters)
    if (error && hasUserInteracted) {
      clearError()
      setHasUserInteracted(false)
    }
  }

  // Set interaction flag when user starts typing after an error appears
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setHasUserInteracted(true)
      }, 2000) // Allow 2 seconds for user to read the error
      
      return () => clearTimeout(timer)
    }
  }, [error])

  const isOrgValid = selectedOrg !== null
  const hasOrgError = formErrors.organization && orgName.trim() !== ''

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0f1c] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 shadow-xl animate-fade-in">
          <div className="flex flex-col items-center">
            {/* Animated gradient border with reduced intensity */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/80 via-purple-500/80 to-pink-500/80 animate-gradient p-0.5">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-pink-500/40 animate-spin-slow blur-sm opacity-30"></div>
                <div className="relative w-full h-full rounded-full bg-gradient-to-r from-blue-500/90 to-purple-500/90 flex items-center justify-center overflow-hidden shadow-md shadow-blue-500/10">
                  <LockClosedIcon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="mt-6 text-3xl font-bold text-white">
              Sign In
            </h1>
            <p className="mt-2 text-gray-400">
              Welcome back! Please enter your details.
            </p>
          </div>
          
          {/* Success message from registration */}
          {successMessage && !error && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg animate-slide-in-down">
              {successMessage}
            </div>
          )}
          
          {/* Error message - Enhanced error display */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg animate-slide-in-down">
              <div className="flex items-center">
                <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-200 mb-2">
                  Organization
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    value={orgName}
                    onChange={handleOrgInputChange}
                    className={`block w-full pl-10 pr-10 py-2 bg-white/5 border ${
                      isOrgValid 
                        ? 'border-green-500/50 focus:ring-green-500' 
                        : hasOrgError 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-white/10 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-white placeholder-gray-400 transition-colors`}
                    placeholder="Enter organization name"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {isOrgValid && (
                      <CheckIcon className="h-5 w-5 text-green-500" />
                    )}
                    {hasOrgError && (
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
                
                {/* Organization validation feedback */}
                {isOrgValid && (
                  <p className="mt-2 text-sm text-green-400 flex items-center">
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Valid organization: {selectedOrg.name}
                  </p>
                )}
                
                {formErrors.organization && (
                  <p className="mt-2 text-sm text-red-500 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {formErrors.organization}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 bg-white/5 border ${
                      formErrors.email ? 'border-red-500' : 'border-white/10'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400`}
                    placeholder="Enter your email"
                  />
                </div>
                {formErrors.email && (
                  <p className="mt-2 text-sm text-red-500">{formErrors.email}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 bg-white/5 border ${
                      formErrors.password ? 'border-red-500' : 'border-white/10'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400`}
                    placeholder="••••••••"
                  />
                </div>
                {formErrors.password && (
                  <p className="mt-2 text-sm text-red-500">{formErrors.password}</p>
                )}
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
                ) : 'Sign In'}
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
              <RouterLink 
                to="/forgot-password" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Forgot password?
              </RouterLink>
              <RouterLink 
                to="/register" 
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Don't have an account? Sign Up
              </RouterLink>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login