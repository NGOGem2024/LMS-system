import { useState, useEffect, useContext } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Alert,
  Link
} from '@mui/material'
import {
  School as CourseIcon,
  Assignment as AssignmentIcon,
  Timeline as ProgressIcon,
  CheckCircle as CompletedIcon,
  Schedule as ScheduleIcon,
  PlayCircleOutline as OngoingIcon
} from '@mui/icons-material'
import axios from 'axios'
import AuthContext from '../../context/AuthContext'

interface Course {
  _id: string
  title: string
  description: string
  progress: number
  imageUrl?: string
}

interface ProgressStats {
  totalCourses: number
  completedCourses: number
  inProgressCourses: number
  totalAssignments: number
  completedAssignments: number
  pendingAssignments: number
  overallProgress: number
}

interface Assignment {
  _id: string
  title: string
  dueDate: string
  course: {
    _id: string
    title: string
  }
  status?: string
}

const Dashboard = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [progressStats, setProgressStats] = useState<ProgressStats>({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalAssignments: 0,
    completedAssignments: 0,
    pendingAssignments: 0,
    overallProgress: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useContext(AuthContext)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Fetch enrolled courses
        const coursesRes = await axios.get('/api/courses/enrolled')
        setCourses(coursesRes.data.slice(0, 3)) // Show only 3 latest courses
        
        // Fetch upcoming assignments
        const assignmentsRes = await axios.get('/api/assignments/upcoming')
        setAssignments(assignmentsRes.data.slice(0, 5)) // Show only 5 upcoming assignments
        
        // Fetch progress statistics
        const statsRes = await axios.get('/api/progress/stats')
        setProgressStats(statsRes.data)
        
        // If API is not ready, calculate some stats from the courses and assignments
        if (!statsRes.data || !statsRes.data.totalCourses) {
          const allCourses = coursesRes.data as Course[]
          const completedCourses = allCourses.filter((c: Course) => c.progress === 100).length
          const inProgressCourses = allCourses.filter((c: Course) => c.progress > 0 && c.progress < 100).length
          const totalAssignments = assignmentsRes.data.length
          const completedAssignments = assignmentsRes.data.filter((a: Assignment) => a.status === 'completed').length
          
          setProgressStats({
            totalCourses: allCourses.length,
            completedCourses,
            inProgressCourses,
            totalAssignments,
            completedAssignments,
            pendingAssignments: totalAssignments - completedAssignments,
            overallProgress: allCourses.length > 0 
              ? allCourses.reduce((sum: number, course: Course) => sum + course.progress, 0) / allCourses.length
              : 0
          })
        }
      } catch (err: any) {
        setError('Failed to load dashboard data. Please try again later.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.name}!
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Recent Courses */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 350,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CourseIcon color="primary" sx={{ mr: 1 }} />
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Recent Courses
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {courses.length > 0 ? (
              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <Grid container spacing={2}>
                  {courses.map((course) => (
                    <Grid item xs={12} key={course._id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" component="div">
                            {course.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {course.description}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress variant="determinate" value={course.progress} />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                              <Typography variant="body2" color="text.secondary">{`${Math.round(
                                course.progress,
                              )}%`}</Typography>
                            </Box>
                          </Box>
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            component={RouterLink} 
                            to={`/courses/${course._id}`}
                          >
                            View Course
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  No courses enrolled yet.{' '}
                  <Link component={RouterLink} to="/courses">
                    Browse courses
                  </Link>
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 'auto', pt: 2 }}>
              <Button 
                component={RouterLink} 
                to="/courses" 
                variant="outlined" 
                fullWidth
              >
                View All Courses
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Upcoming Assignments */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 350,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AssignmentIcon color="primary" sx={{ mr: 1 }} />
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Upcoming Assignments
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {assignments.length > 0 ? (
              <List sx={{ width: '100%', flexGrow: 1, overflow: 'auto' }}>
                {assignments.map((assignment) => (
                  <ListItem
                    key={assignment._id}
                    button
                    component={RouterLink}
                    to={`/assignments/${assignment._id}`}
                    divider
                  >
                    <ListItemText
                      primary={assignment.title}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {assignment.course.title}
                          </Typography>
                          {` — Due: ${new Date(assignment.dueDate).toLocaleDateString()}`}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  No upcoming assignments.
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 'auto', pt: 2 }}>
              <Button 
                component={RouterLink} 
                to="/assignments" 
                variant="outlined" 
                fullWidth
              >
                View All Assignments
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Learning Progress */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ProgressIcon color="primary" sx={{ mr: 1 }} />
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Learning Progress
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h5" color="primary">
                    {progressStats.overallProgress.toFixed(0)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall Progress
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={progressStats.overallProgress} 
                    sx={{ mt: 2, height: 10, borderRadius: 5 }} 
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CourseIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">{progressStats.totalCourses}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Courses
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CompletedIcon color="success" sx={{ mr: 1 }} />
                        <Typography variant="h6">{progressStats.completedCourses}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Completed
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <OngoingIcon color="info" sx={{ mr: 1 }} />
                        <Typography variant="h6">{progressStats.inProgressCourses}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        In Progress
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">{progressStats.totalAssignments}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Assignments
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CompletedIcon color="success" sx={{ mr: 1 }} />
                        <Typography variant="h6">{progressStats.completedAssignments}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Completed
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ScheduleIcon color="warning" sx={{ mr: 1 }} />
                        <Typography variant="h6">{progressStats.pendingAssignments}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Pending
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default Dashboard 