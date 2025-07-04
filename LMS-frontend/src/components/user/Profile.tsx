import { useState, useEffect, useContext, FormEvent } from 'react'
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Avatar,
  Button,
  TextField,
  Divider,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
  Skeleton
} from '@mui/material'
import {
  Person as PersonIcon,
  Email as EmailIcon,
  VpnKey as PasswordIcon,
  Save as SaveIcon,
  School as SchoolIcon,
  Badge as BadgeIcon
} from '@mui/icons-material'
import axios from 'axios'
import AuthContext from '../../context/AuthContext'
import { 
  PageLoading, 
  ProfileSkeleton, 
  LoadingButton, 
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <PageLoading />
        <Typography variant="h4" sx={{ mb: 4, opacity: 0.7 }}>
          Profile
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <ProfileSkeleton />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" sx={{ mb: 3, opacity: 0.7 }}>
                Personal Information
              </Typography>
              <Box sx={{ mb: 4 }}>
                <ContentPlaceholder lines={5} />
              </Box>
            </Paper>
            
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 3, opacity: 0.7 }}>
                Stats & Achievements
              </Typography>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Card>
                    <CardContent>
                      <Skeleton variant="text" height={24} width="60%" />
                      <Skeleton variant="text" height={40} width="40%" />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card>
                    <CardContent>
                      <Skeleton variant="text" height={24} width="60%" />
                      <Skeleton variant="text" height={40} width="40%" />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Typography variant="h6" sx={{ mb: 2, opacity: 0.7 }}>
                Achievements
              </Typography>
              <List>
                {[1, 2, 3].map((_, index) => (
                  <ListItem key={index} sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 2 }}>
                    <ListItemIcon>
                      <Skeleton variant="circular" width={40} height={40} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Skeleton variant="text" width="70%" />} 
                      secondary={<Skeleton variant="text" width="90%" />} 
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    )
  }

  if (!profileData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Failed to load profile data. Please try again later.
        </Alert>
      </Container>
    )
  }

  // Log avatar sources for debugging
  console.log('Avatar sources:', {
    preview: avatarPreview,
    profileData: profileData?.avatar,
    userProfile: user?.profile?.avatar,
    baseUrl: window.location.origin
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={4}>
        {/* Profile Overview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              src={getFullImageUrl(avatarPreview || profileData.avatar || user?.profile?.avatar)}
              sx={{
                width: 100,
                height: 100,
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main'
              }}
            >
              {profileData.name.charAt(0)}
            </Avatar>
            
            <Typography variant="h5" gutterBottom>
              {profileData.name}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {profileData.email}
            </Typography>
            
            <Chip 
              label={profileData.role.toUpperCase()} 
              color="primary" 
              size="small" 
              sx={{ mt: 1 }} 
            />
            
            {profileData.institution && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SchoolIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {profileData.institution}
                </Typography>
              </Box>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Enrolled Courses" 
                  secondary={profileData.enrolledCourses} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Completed Courses" 
                  secondary={profileData.completedCourses} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Achievements" 
                  secondary={profileData.achievements.length} 
                />
              </ListItem>
            </List>
            
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setPasswordDialogOpen(true)}
              startIcon={<PasswordIcon />}
              sx={{ mt: 2 }}
            >
              Change Password
            </Button>
          </Paper>
          
          {/* Achievements */}
          {profileData.achievements.length > 0 && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BadgeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Achievements
                </Typography>
              </Box>
              
              <List dense>
                {profileData.achievements.map((achievement) => (
                  <ListItem key={achievement._id}>
                    <ListItemIcon>
                      {/* Use a default icon if the achievement icon is not available */}
                      <BadgeIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={achievement.title} 
                      secondary={achievement.description} 
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Grid>
        
        {/* Profile Edit Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PersonIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Edit Profile
              </Typography>
            </Box>
            
            <Box component="form" onSubmit={handleProfileUpdate} noValidate>
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="avatar-upload"
                  type="file"
                  onChange={handleAvatarChange}
                />
                <label htmlFor="avatar-upload">
                  <Avatar
                    src={getFullImageUrl(avatarPreview || profileData.avatar || user?.profile?.avatar)}
                    sx={{
                      width: 100,
                      height: 100,
                      mx: 'auto',
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                  >
                    {profileData.name.charAt(0)}
                  </Avatar>
                  <Button
                    component="span"
                    variant="outlined"
                    size="small"
                  >
                    Upload Photo
                  </Button>
                </label>
                {formErrors.avatar && (
                  <Typography color="error" variant="caption" display="block" sx={{ mt: 1 }}>
                    {formErrors.avatar}
                  </Typography>
                )}
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="name"
                    label="Full Name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    value={profileData.email}
                    disabled
                    InputProps={{
                      startAdornment: (
                        <EmailIcon color="action" sx={{ mr: 1 }} />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="bio"
                    label="Bio"
                    name="bio"
                    multiline
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    error={!!formErrors.bio}
                    helperText={formErrors.bio}
                    placeholder="Tell us about yourself..."
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <LoadingButton loading={isSaving}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </LoadingButton>
              </Box>
            </Box>
          </Paper>
          
          {/* Learning Progress */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <SchoolIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Learning Progress
              </Typography>
            </Box>
            
            {profileData.enrolledCourses > 0 ? (
              <Typography variant="body2" paragraph>
                You have completed {profileData.completedCourses} out of {profileData.enrolledCourses} enrolled courses.
              </Typography>
            ) : (
              <Typography variant="body2" paragraph>
                You are not enrolled in any courses yet.
              </Typography>
            )}
            
            {/* We could add more detailed progress information here */}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <Box component="form" onSubmit={handlePasswordUpdate} noValidate>
          <DialogContent>
            <DialogContentText>
              To change your password, please enter your current password and then your new password.
            </DialogContentText>
            <TextField
              margin="dense"
              id="current-password"
              label="Current Password"
              type="password"
              fullWidth
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              error={!!formErrors.currentPassword}
              helperText={formErrors.currentPassword}
            />
            <TextField
              margin="dense"
              id="new-password"
              label="New Password"
              type="password"
              fullWidth
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={!!formErrors.newPassword}
              helperText={formErrors.newPassword}
            />
            <TextField
              margin="dense"
              id="confirm-password"
              label="Confirm New Password"
              type="password"
              fullWidth
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialogOpen(false)} disabled={isChangingPassword}>Cancel</Button>
            <LoadingButton loading={isChangingPassword}>
              <Button type="submit" variant="contained" disabled={isChangingPassword}>
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </LoadingButton>
          </DialogActions>
        </Box>
      </Dialog>
    </Container>
  )
}

export default Profile 