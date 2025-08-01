// import { useState, useContext, FormEvent } from 'react'
// import { Link as RouterLink } from 'react-router-dom'
// import { 
//   LockClosedIcon, 
//   ArrowPathIcon, 
//   ChevronDownIcon,
//   EnvelopeIcon,
//   KeyIcon,
//   UserIcon,
//   BuildingOfficeIcon,
//   UserGroupIcon
// } from '@heroicons/react/24/outline'
// import AuthContext from '../../context/AuthContext'

// const Register = () => {
//   const [name, setName] = useState('')
//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const [confirmPassword, setConfirmPassword] = useState('')
//   const [selectedTenant, setSelectedTenant] = useState('default')
//   const [role, setRole] = useState('student')
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [formErrors, setFormErrors] = useState<{
//     name?: string,
//     email?: string,
//     password?: string,
//     confirmPassword?: string
//   }>({})
  
//   const { register, error, clearError, tenantId, setTenantId } = useContext(AuthContext)

//   // Available organizations with user-friendly names
//   const organizations = [
//     { id: 'default', name: 'Learnomic' },
//     { id: 'ngo', name: 'NobleGiving' }
//   ]

//   // Available roles
//   const roles = [
//     // { value: 'student', label: 'Student' },
//     { value: 'instructor', label: 'Instructor' },
//     { value: 'admin', label: 'Admin' }
//   ]

//   const validateForm = () => {
//     const errors: {
//       name?: string,
//       email?: string,
//       password?: string,
//       confirmPassword?: string
//     } = {}
//     let isValid = true

//     if (!name) {
//       errors.name = 'Name is required'
//       isValid = false
//     }

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
//     } else if (password.length < 6) {
//       errors.password = 'Password must be at least 6 characters'
//       isValid = false
//     } 

//     if (!confirmPassword) {
//       errors.confirmPassword = 'Please confirm your password'
//       isValid = false
//     } else if (password !== confirmPassword) {
//       errors.confirmPassword = 'Passwords do not match'
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
//         console.log(`Registering user with email: ${email}, tenant: ${selectedTenant}, role: ${role}`)
//         await register(name, email, password, selectedTenant, role)
//         console.log('Registration successful through context')
//       } catch (err) {
//         console.error('Registration error:', err)
//       } finally {
//         setIsSubmitting(false)
//       }
//     }
//   }

//   const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedTenant(e.target.value)
//     setTenantId(e.target.value)
//   }

//   const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setRole(e.target.value)
//   }

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-[#0a0f1c] py-12 px-4 sm:px-6 lg:px-8">
//       <div className="w-full max-w-4xl">
//         <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 shadow-xl animate-fade-in">
//           <div className="flex flex-col items-center mb-8">
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
//               Create Account
//             </h1>
//             <p className="mt-2 text-gray-400">
//               Please fill in your details to get started
//             </p>
//           </div>
          
//           {error && (
//             <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg animate-slide-in-down">
//               {error}
//             </div>
//           )}
          
//           <form className="mt-8" onSubmit={handleSubmit}>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
//                 <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
//                   Full Name
//                 </label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <UserIcon className="h-5 w-5 text-gray-400" />
//                   </div>
//                   <input
//                     type="text"
//                     id="name"
//                     name="name"
//                     autoComplete="name"
//                     required
//                     value={name}
//                     onChange={(e) => setName(e.target.value)}
//                     className={`block w-full pl-10 pr-3 py-2 bg-white/5 border ${
//                       formErrors.name ? 'border-red-500' : 'border-white/10'
//                     } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400`}
//                     placeholder="Enter your full name"
//                   />
//                 </div>
//                 {formErrors.name && (
//                   <p className="mt-2 text-sm text-red-500">{formErrors.name}</p>
//                 )}
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
//                     type="email"
//                     id="email"
//                     name="email"
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
//                 <label htmlFor="role-select" className="block text-sm font-medium text-gray-200 mb-2">
//                   Role
//                 </label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <UserGroupIcon className="h-5 w-5 text-gray-400" />
//                   </div>
//                   <select
//                     id="role-select"
//                     value={role}
//                     onChange={handleRoleChange}
//                     className="block w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
//                   >
//                     {roles.map((role) => (
//                       <option key={role.value} value={role.value} className="bg-[#1e2736] text-white">
//                         {role.label}
//                       </option>
//                     ))}
//                   </select>
//                   <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
//                     <ChevronDownIcon className="h-5 w-5" />
//                   </div>
//                 </div>
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
//                     type="password"
//                     id="password"
//                     name="password"
//                     autoComplete="new-password"
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
              
//               <div>
//                 <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200 mb-2">
//                   Confirm Password
//                 </label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <KeyIcon className="h-5 w-5 text-gray-400" />
//                   </div>
//                   <input
//                     type="password"
//                     id="confirmPassword"
//                     name="confirmPassword"
//                     required
//                     value={confirmPassword}
//                     onChange={(e) => setConfirmPassword(e.target.value)}
//                     className={`block w-full pl-10 pr-3 py-2 bg-white/5 border ${
//                       formErrors.confirmPassword ? 'border-red-500' : 'border-white/10'
//                     } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400`}
//                     placeholder="••••••••"
//                   />
//                 </div>
//                 {formErrors.confirmPassword && (
//                   <p className="mt-2 text-sm text-red-500">{formErrors.confirmPassword}</p>
//                 )}
//               </div>
//             </div>
            
//             <div className="mt-8">
//               <button
//                 type="submit"
//                 disabled={isSubmitting}
//                 className="w-full flex justify-center items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0f1c] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 cursor-pointer"
//               >
//                 {isSubmitting ? (
//                   <ArrowPathIcon className="animate-spin h-5 w-5" />
//                 ) : (
//                   'Create Account'
//                 )}
//               </button>
//             </div>
            
//             <div className="mt-6 text-center">
//               <RouterLink 
//                 to="/login" 
//                 className="text-gray-400 hover:text-white transition-colors"
//               >
//                 Already have an account? <span className="text-blue-400 hover:text-blue-300">Sign in</span>
//               </RouterLink>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default Register 


import { useState, useContext, FormEvent } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { 
  LockClosedIcon, 
  ArrowPathIcon, 
  ChevronDownIcon,
  EnvelopeIcon,
  KeyIcon,
  UserIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CheckIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import AuthContext from '../../context/AuthContext'

const Register = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<{ id: string; name: string } | null>(null)
  const [role, setRole] = useState('student')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<{
    name?: string,
    email?: string,
    password?: string,
    confirmPassword?: string,
    organization?: string
  }>({})
  
  const { register, error, clearError, tenantId, setTenantId } = useContext(AuthContext)

  // Available organizations with user-friendly names
  const organizations = [
    { id: 'default', name: 'Learnomic' },
    { id: 'ngo', name: 'NobleGiving' }
  ]

  // Available roles
  const roles = [
    // { value: 'student', label: 'Student' },
    { value: 'instructor', label: 'Instructor' },
    { value: 'admin', label: 'Admin' }
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
  }

  const validateForm = () => {
    const errors: {
      name?: string,
      email?: string,
      password?: string,
      confirmPassword?: string,
      organization?: string
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

    if (!selectedOrg) {
      errors.organization = 'Please enter a valid organization name'
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
        console.log(`Registering user with email: ${email}, tenant: ${selectedOrg?.id}, role: ${role}`)
        await register(name, email, password, selectedOrg!.id, role)
        console.log('Registration successful through context')
      } catch (err) {
        console.error('Registration error:', err)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value)
  }

  const isOrgValid = selectedOrg !== null
  const hasOrgError = formErrors.organization && orgName.trim() !== ''

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0f1c] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 shadow-xl animate-fade-in">
          <div className="flex flex-col items-center mb-8">
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
              Create Account
            </h1>
            <p className="mt-2 text-gray-400">
              Please fill in your details to get started
            </p>
          </div>
          
          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg animate-slide-in-down">
              {error}
            </div>
          )}
          
          <form className="mt-8" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                
                {/* Helper text showing valid organizations */}
                {/* <div className="mt-2 p-2 bg-white/5 rounded-md">
                  <p className="text-xs text-gray-400 mb-1">Valid organizations:</p>
                  <div className="text-xs text-gray-300 space-y-1">
                    {organizations.map(org => (
                      <div key={org.id} className="flex justify-between">
                        <span>{org.name}</span>
                        <span className="text-gray-500">({org.id})</span>
                      </div>
                    ))}
                  </div>
                </div> */}
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 bg-white/5 border ${
                      formErrors.name ? 'border-red-500' : 'border-white/10'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400`}
                    placeholder="Enter your full name"
                  />
                </div>
                {formErrors.name && (
                  <p className="mt-2 text-sm text-red-500">{formErrors.name}</p>
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
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                <label htmlFor="role-select" className="block text-sm font-medium text-gray-200 mb-2">
                  Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserGroupIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="role-select"
                    value={role}
                    onChange={handleRoleChange}
                    className="block w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value} className="bg-[#1e2736] text-white">
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <ChevronDownIcon className="h-5 w-5" />
                  </div>
                </div>
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
                    type="password"
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 bg-white/5 border ${
                      formErrors.confirmPassword ? 'border-red-500' : 'border-white/10'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400`}
                    placeholder="••••••••"
                  />
                </div>
                {formErrors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-500">{formErrors.confirmPassword}</p>
                )}
              </div>
            </div>
            
            <div className="mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0f1c] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <ArrowPathIcon className="animate-spin h-5 w-5" />
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <RouterLink 
                to="/login" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Already have an account? <span className="text-blue-400 hover:text-blue-300">Sign in</span>
              </RouterLink>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register