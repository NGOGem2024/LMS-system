import { useState, useEffect } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import {
  PeopleAlt as UsersIcon,
  School as CoursesIcon,
  Assignment as AssignmentsIcon,
  Business as InstitutionsIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material'
import axios from 'axios'

interface AdminStats {
  totalUsers: number
  totalCourses: number
  totalAssignments: number
  totalInstitutions: number
  recentUsers: RecentUser[]
  recentCourses: RecentCourse[]
}

interface RecentUser {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
}

interface RecentCourse {
  _id: string
  title: string
  instructor: {
    _id: string
    name: string
  }
  enrolledCount: number
  createdAt: string
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAdminStats = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const res = await axios.get('/api/admin/stats')
        setStats(res.data)
      } catch (err: any) {
        setError('Failed to load admin statistics. Please try again later.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAdminStats()
  }, [])

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress />
      </Container>
    )
  }

  if (!stats) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Failed to load admin statistics. Please try again later.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <DashboardIcon sx={{ mr: 1 }} fontSize="large" color="primary" />
        <Typography variant="h4" component="h1">
          Admin Dashboard
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              height: '100%',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.03)',
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <UsersIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Users
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ textAlign: 'center', my: 2 }}>
                {stats.totalUsers}
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                component={RouterLink} 
                to="/admin/users"
                fullWidth
              >
                Manage Users
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              height: '100%',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.03)',
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CoursesIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Courses
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ textAlign: 'center', my: 2 }}>
                {stats.totalCourses}
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                component={RouterLink} 
                to="/admin/courses"
                fullWidth
              >
                Manage Courses
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              height: '100%',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.03)',
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssignmentsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Assignments
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ textAlign: 'center', my: 2 }}>
                {stats.totalAssignments}
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                component={RouterLink} 
                to="/admin/assignments"
                fullWidth
              >
                Manage Assignments
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              height: '100%',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.03)',
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InstitutionsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Institutions
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ textAlign: 'center', my: 2 }}>
                {stats.totalInstitutions}
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                component={RouterLink} 
                to="/admin/institutions"
                fullWidth
              >
                Manage Institutions
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      
      {/* Recent Users */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <UsersIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="h2">
                Recent Users
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Joined</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.recentUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                component={RouterLink} 
                to="/admin/users" 
                size="small"
              >
                View All Users
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Recent Courses */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CoursesIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="h2">
                Recent Courses
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Instructor</TableCell>
                    <TableCell>Enrolled</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.recentCourses.map((course) => (
                    <TableRow key={course._id}>
                      <TableCell>{course.title}</TableCell>
                      <TableCell>{course.instructor.name}</TableCell>
                      <TableCell>{course.enrolledCount}</TableCell>
                      <TableCell>{new Date(course.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                component={RouterLink} 
                to="/admin/courses" 
                size="small"
              >
                View All Courses
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default AdminDashboard 