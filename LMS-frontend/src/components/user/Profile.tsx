import { useState, useEffect, useContext, FormEvent } from 'react'
import {
  UserIcon,
  EnvelopeIcon,
  KeyIcon,
  AcademicCapIcon,
  IdentificationIcon,
  ArrowPathIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import axios from 'axios'
import AuthContext from '../../context/AuthContext'
import { 
  PageLoading, 
  ProfileSkeleton, 
  ContentPlaceholder 
} from '../ui/LoadingComponents'

interface ProfileData {
  name: string
  email: string
  role: string
  bio?: string
  institution?: string
  enrolledCourses: number
  completedCourses: number
  achievements: Achievement[]
  avatar?: string
}

interface Achievement {
  _id: string
  title: string
  description: string
  dateEarned: string
  icon: string
}

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formErrors, setFormErrors] = useState<{
    name?: string
    bio?: string
    avatar?: string
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
  }>({})
  
  // Dialog state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const res = await axios.get('/api/users/profile')
        // Handle the API response structure which includes data in a nested 'data' property
        const userData = res.data.data || res.data;
        
        // Use avatar from auth context if available (to ensure consistency)
        const avatarUrl = user?.profile?.avatar || userData.profile?.avatar;
        
        setProfileData({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          bio: userData.profile?.bio || '',
          avatar: avatarUrl,
          enrolledCourses: userData.enrolledCourses || 0,
          completedCourses: userData.completedCourses || 0,
          achievements: userData.achievements || []
        });
        
        // Initialize form fields
        setName(userData.name)
        setBio(userData.profile?.bio || '')
      } catch (err: any) {
        setError('Failed to load profile data. Please try again later.')
        console.error('Profile fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProfileData()
  }, [user])

  const validateProfileForm = () => {
    const errors: { name?: string; bio?: string } = {}
    let isValid = true

    if (!name.trim()) {
      errors.name = 'Name is required'
      isValid = false
    }

    setFormErrors(prev => ({ ...prev, ...errors }))
    return isValid
  }

  const validatePasswordForm = () => {
    const errors: { 
      currentPassword?: string
      newPassword?: string
      confirmPassword?: string
    } = {}
    let isValid = true

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required'
      isValid = false
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required'
      isValid = false
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters'
      isValid = false
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password'
      isValid = false
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
      isValid = false
    }

    setFormErrors(prev => ({ ...prev, ...errors }))
    return isValid
  }

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!validateProfileForm()) {
      return
    }
    
    setError(null)
    setSuccess(null)
    setIsSaving(true)
    
    try {
      // Create form data for multipart/form-data request (for file upload)
      const formData = new FormData();
      formData.append('name', name);
      formData.append('bio', bio || '');
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      
      // Use multipart/form-data request
      const response = await axios.put('/api/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Get the updated user data from the response
      const updatedUserData = response.data.data;
      
      // Update user in auth context to persist the changes
      updateUser({
        name: updatedUserData.name,
        profile: {
          avatar: updatedUserData.profile?.avatar,
          bio: updatedUserData.profile?.bio
        }
      });
      
      setSuccess('Profile updated successfully!')
      
      // Update profile data
      if (profileData) {
        setProfileData({
          ...profileData,
          name: updatedUserData.name,
          bio: updatedUserData.profile?.bio || '',
          avatar: updatedUserData.profile?.avatar
        })
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFormErrors(prev => ({
          ...prev,
          avatar: 'Please select an image file'
        }));
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setFormErrors(prev => ({
          ...prev,
          avatar: 'Image size should be less than 2MB'
        }));
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous errors
      setFormErrors(prev => ({
        ...prev,
        avatar: undefined
      }));
    }
  }

  const handlePasswordUpdate = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!validatePasswordForm()) {
      return
    }
    
    setError(null)
    setSuccess(null)
    setIsChangingPassword(true)
    
    try {
      await axios.put('/api/users/password', {
        currentPassword,
        newPassword
      })
      
      setSuccess('Password updated successfully!')
      setPasswordDialogOpen(false)
      
      // Clear password fields
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setFormErrors(prev => ({
        ...prev,
        currentPassword: err.response?.data?.message || 'Failed to update password. Please try again.'
      }))
      console.error(err)
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Add a function to get the full image URL
  const getFullImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return undefined;
    
    // If it's already a data URL (from preview), return as is
    if (imagePath.startsWith('data:')) {
      return imagePath;
    }
    
    // If it's a relative path, use it as is (the proxy will handle it)
    if (imagePath.startsWith('/')) {
      return imagePath;
    }
    
    return imagePath;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <PageLoading />
        <h1 className="text-2xl font-bold text-white mb-6 opacity-70">
          Profile
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
              <ProfileSkeleton />
            </div>
          </div>
          
          <div className="md:col-span-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4 opacity-70">
                Personal Information
              </h2>
              <div className="mb-6">
                <ContentPlaceholder lines={5} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-4">
          Failed to load profile data. Please try again later.
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-8 animate-fade-in">
        My Profile
      </h1>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-4 mb-6 animate-slide-in-down">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg p-4 mb-6 animate-slide-in-down">
          {success}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Profile Overview */}
        <div className="md:col-span-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              {/* Animated gradient border with reduced intensity */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/80 via-purple-500/80 to-pink-500/80 animate-gradient p-0.5">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-pink-500/40 animate-spin-slow blur-sm opacity-30"></div>
                <div className="relative w-full h-full rounded-full bg-gradient-to-r from-blue-500/90 to-purple-500/90 flex items-center justify-center overflow-hidden shadow-md shadow-blue-500/10">
                  {profileData.avatar || avatarPreview ? (
                    <img 
                      src={getFullImageUrl(avatarPreview || profileData.avatar || user?.profile?.avatar)} 
                      alt={profileData.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">{profileData.name.charAt(0)}</span>
                  )}
                </div>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold text-white mb-1">
              {profileData.name}
            </h2>
            
            <p className="text-gray-400 mb-2">
              {profileData.email}
            </p>
            
            <span className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-3 py-1 rounded-full mt-1 shadow-lg shadow-blue-500/20">
              {profileData.role.toUpperCase()}
            </span>
            
            {profileData.institution && (
              <div className="mt-4 flex items-center justify-center text-gray-300">
                <AcademicCapIcon className="h-4 w-4 mr-2" />
                <span className="text-sm">{profileData.institution}</span>
              </div>
            )}
            
            <div className="border-t border-white/10 my-4" />
            
            <ul className="text-left space-y-4">
              <li className="flex justify-between items-center">
                <span className="text-gray-400">Enrolled Courses</span>
                <span className="text-white font-medium">{profileData.enrolledCourses}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-gray-400">Completed Courses</span>
                <span className="text-white font-medium">{profileData.completedCourses}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-gray-400">Achievements</span>
                <span className="text-white font-medium">{profileData.achievements.length}</span>
              </li>
            </ul>
            
            <button
              onClick={() => setPasswordDialogOpen(true)}
              className="mt-6 inline-flex items-center px-4 py-2 border border-white/10 text-white rounded-md hover:bg-white/5 transition-colors w-full justify-center cursor-pointer"
            >
              <KeyIcon className="h-4 w-4 mr-2" />
              Change Password
            </button>
          </div>
          
          {/* Achievements */}
          {profileData.achievements.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 mt-6">
              <div className="flex items-center mb-6">
                <IdentificationIcon className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold text-white">
                  Achievements
                </h3>
              </div>
              
              <ul className="space-y-4">
                {profileData.achievements.map((achievement) => (
                  <li key={achievement._id} className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center mr-3">
                      <IdentificationIcon className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium text-white">{achievement.title}</div>
                      <div className="text-sm text-gray-400">{achievement.description}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Profile Edit Form */}
        <div className="md:col-span-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-center mb-6">
              <UserIcon className="h-5 w-5 text-blue-500 mr-2" />
              <h2 className="text-xl font-semibold text-white">
                Edit Profile
              </h2>
            </div>
            
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="text-center">
                <input
                  accept="image/*"
                  className="hidden"
                  id="avatar-upload"
                  type="file"
                  onChange={handleAvatarChange}
                />
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="relative w-24 h-24 mx-auto mb-3">
                    {/* Animated gradient border with reduced intensity */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/80 via-purple-500/80 to-pink-500/80 animate-gradient p-0.5">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-pink-500/40 animate-spin-slow blur-sm opacity-30"></div>
                      <div className="relative w-full h-full rounded-full bg-gradient-to-r from-blue-500/90 to-purple-500/90 flex items-center justify-center overflow-hidden group shadow-md shadow-blue-500/10">
                        {avatarPreview || profileData.avatar ? (
                          <>
                            <img 
                              src={getFullImageUrl(avatarPreview || profileData.avatar)} 
                              alt={profileData.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <PhotoIcon className="h-6 w-6" />
                            </div>
                          </>
                        ) : (
                          <span className="text-2xl">{profileData.name.charAt(0)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    Click to upload photo
                  </span>
                </label>
                {formErrors.avatar && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.avatar}
                  </p>
                )}
              </div>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                    required
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center px-3 py-2 bg-white/5 border border-white/10 rounded-md">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      disabled
                      className="block w-full bg-transparent border-none focus:outline-none text-gray-400"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-200 mb-1">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                  {formErrors.bio && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.bio}</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                      Saving...
                    </>
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Learning Progress */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 mt-6">
            <div className="flex items-center mb-4">
              <AcademicCapIcon className="h-5 w-5 text-blue-500 mr-2" />
              <h2 className="text-xl font-semibold text-white">
                Learning Progress
              </h2>
            </div>
            
            {profileData.enrolledCourses > 0 ? (
              <div className="text-gray-300">
                <p className="mb-4">
                  You have completed {profileData.completedCourses} out of {profileData.enrolledCourses} enrolled courses.
                </p>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${(profileData.completedCourses / profileData.enrolledCourses) * 100}%` 
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-400">
                You are not enrolled in any courses yet.
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Password Change Dialog */}
      {passwordDialogOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2736] rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Change Password</h2>
              
              <form onSubmit={handlePasswordUpdate} className="space-y-6">
                <p className="text-gray-400 mb-4">
                  To change your password, please enter your current password and then your new password.
                </p>
                
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-200 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    required
                  />
                  {formErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.currentPassword}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-200 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    required
                  />
                  {formErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.newPassword}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-200 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    required
                  />
                  {formErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.confirmPassword}</p>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setPasswordDialogOpen(false)}
                    disabled={isChangingPassword}
                    className="px-4 py-2 border border-white/10 text-white rounded-md hover:bg-white/5 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 flex items-center cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? (
                      <>
                        <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                        Updating...
                      </>
                    ) : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile 