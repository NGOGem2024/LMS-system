import { useState, useEffect, FormEvent } from 'react'
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  TextField,
  IconButton,
  Divider,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material'
import {
  PeopleAlt as UsersIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'
import axios from 'axios'

interface User {
  _id: string
  name: string
  email: string
  role: string
  institution?: string
  createdAt: string
}

interface UserFormData {
  name: string
  email: string
  role: string
  password: string
  institution?: string
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  
  // Dialog state
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'student',
    password: '',
    institution: ''
  })
  const [formErrors, setFormErrors] = useState<{
    name?: string
    email?: string
    role?: string
    password?: string
  }>({})

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const res = await axios.get('/api/admin/users')
        setUsers(res.data)
        setFilteredUsers(res.data)
      } catch (err: any) {
        setError('Failed to load users. Please try again later.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUsers()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.institution && user.institution.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredUsers(filtered)
      setPage(0) // Reset to first page when search changes
    } else {
      setFilteredUsers(users)
    }
  }, [searchTerm, users])

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleOpenAddDialog = () => {
    setFormData({
      name: '',
      email: '',
      role: 'student',
      password: '',
      institution: ''
    })
    setFormErrors({})
    setOpenAddDialog(true)
  }

  const handleOpenEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
      institution: user.institution || ''
    })
    setFormErrors({})
    setOpenEditDialog(true)
  }

  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setOpenDeleteDialog(true)
  }

  const handleCloseDialogs = () => {
    setOpenAddDialog(false)
    setOpenEditDialog(false)
    setOpenDeleteDialog(false)
    setSelectedUser(null)
  }

  const validateForm = (isEdit: boolean = false) => {
    const errors: {
      name?: string
      email?: string
      role?: string
      password?: string
    } = {}
    let isValid = true

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
      isValid = false
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid'
      isValid = false
    }

    if (!formData.role) {
      errors.role = 'Role is required'
      isValid = false
    }

    if (!isEdit && !formData.password.trim()) {
      errors.password = 'Password is required'
      isValid = false
    } else if (!isEdit && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleAddUser = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setError(null)
    setSuccess(null)
    
    try {
      const res = await axios.post('/api/admin/users', formData)
      
      // Update users list
      setUsers([...users, res.data])
      
      setSuccess('User added successfully!')
      handleCloseDialogs()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add user. Please try again.')
      console.error(err)
    }
  }

  const handleEditUser = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!validateForm(true) || !selectedUser) {
      return
    }
    
    setError(null)
    setSuccess(null)
    
    const userData = { ...formData }
    if (!userData.password) {
      delete userData.password // Don't send password if not changed
    }
    
    try {
      const res = await axios.put(`/api/admin/users/${selectedUser._id}`, userData)
      
      // Update users list
      setUsers(users.map(user => 
        user._id === selectedUser._id ? { ...user, ...res.data } : user
      ))
      
      setSuccess('User updated successfully!')
      handleCloseDialogs()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user. Please try again.')
      console.error(err)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) {
      return
    }
    
    setError(null)
    setSuccess(null)
    
    try {
      await axios.delete(`/api/admin/users/${selectedUser._id}`)
      
      // Update users list
      setUsers(users.filter(user => user._id !== selectedUser._id))
      
      setSuccess('User deleted successfully!')
      handleCloseDialogs()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user. Please try again.')
      console.error(err)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when field is edited
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleRoleChange = (e: any) => {
    setFormData(prev => ({ ...prev, role: e.target.value }))
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          component={RouterLink}
          to="/admin"
          startIcon={<BackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <UsersIcon sx={{ mr: 1 }} fontSize="large" color="primary" />
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
      </Box>
      
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
      
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search users by name, email, role or institution"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              fullWidth
              onClick={handleOpenAddDialog}
            >
              Add New User
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="users table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Institution</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.institution || '-'}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenEditDialog(user)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDeleteDialog(user)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Add User Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <Box component="form" onSubmit={handleAddUser} noValidate>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="name"
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
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
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required error={!!formErrors.role}>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    id="role"
                    name="role"
                    value={formData.role}
                    label="Role"
                    onChange={handleRoleChange}
                  >
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="instructor">Instructor</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                  {formErrors.role && <Typography color="error">{formErrors.role}</Typography>}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="password"
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="institution"
                  label="Institution (Optional)"
                  name="institution"
                  value={formData.institution}
                  onChange={handleFormChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialogs}>Cancel</Button>
            <Button type="submit" variant="contained">Add User</Button>
          </DialogActions>
        </Box>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <Box component="form" onSubmit={handleEditUser} noValidate>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="name"
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
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
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required error={!!formErrors.role}>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    id="role"
                    name="role"
                    value={formData.role}
                    label="Role"
                    onChange={handleRoleChange}
                  >
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="instructor">Instructor</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                  {formErrors.role && <Typography color="error">{formErrors.role}</Typography>}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="password"
                  label="Password (Leave blank to keep current)"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="institution"
                  label="Institution (Optional)"
                  name="institution"
                  value={formData.institution}
                  onChange={handleFormChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialogs}>Cancel</Button>
            <Button type="submit" variant="contained">Update User</Button>
          </DialogActions>
        </Box>
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDialogs}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the user "{selectedUser?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default UserManagement 