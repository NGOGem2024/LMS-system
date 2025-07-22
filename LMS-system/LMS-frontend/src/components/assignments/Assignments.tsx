import { useState, useEffect, useContext } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import AuthContext from '../../context/AuthContext'
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Alert,
  Tabs,
  Tab,
  Divider,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  LinearProgress,
  Skeleton
} from '@mui/material'
import {
  Assignment as AssignmentIcon,
  Search as SearchIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Warning as OverdueIcon,
  ErrorOutline as ErrorIcon
} from '@mui/icons-material'
import axios from 'axios'
import { 
  PageLoading, 
  AssignmentListSkeleton,
  TableSkeleton
} from '../ui/LoadingComponents'

interface Assignment {
  _id: string
  title: string
  description: string
  dueDate: string
  course: {
    _id: string
    title: string
  }
  totalPoints: number
  status: 'draft' | 'published' | 'archived'
  submissionStatus?: 'pending' | 'overdue' | 'submitted' | 'late' | 'graded' | 'passed' | 'failed' | 'resubmit' | 'missed'
}

interface Course {
  _id: string
  title: string
}

interface CoursesResponse {
  courses: Course[]
  totalRecords: number
}

interface AssignmentsResponse {
  assignments: Assignment[]
  totalRecords: number
}

const Assignments = () => {
  const { user, token, tenantId, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<boolean>(false)
  const [tabValue, setTabValue] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [totalAssignments, setTotalAssignments] = useState(0)

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true)
      setError(null)
      setAuthError(false)
      
      try {
        console.log('Fetching assignments...')
        console.log('Current token:', token ? `${token.substring(0, 20)}...` : 'null')
        console.log('Current tenant ID:', tenantId)
        
        if (!token) {
          console.error('No authentication token available');
          setAuthError(true);
          setLoading(false);
          return;
        }
        
        // Set up config with explicit headers
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenantId
          }
        };
        
        // Fetch assignments
        const assignmentsRes = await axios.get<AssignmentsResponse>('/api/assignments', config)
        console.log('Assignments response:', assignmentsRes.data)
        
        if (assignmentsRes.data && assignmentsRes.data.assignments) {
          setAssignments(assignmentsRes.data.assignments)
          setFilteredAssignments(assignmentsRes.data.assignments)
          setTotalAssignments(assignmentsRes.data.totalRecords || assignmentsRes.data.assignments.length)
        } else {
          console.error('Invalid assignments response format:', assignmentsRes.data)
          setError('Invalid response format from server')
        }
        
        // Fetch courses for filter
        try {
          const coursesRes = await axios.get<CoursesResponse>('/api/courses/enrolled', config)
          if (coursesRes.data && coursesRes.data.courses) {
            setCourses(coursesRes.data.courses)
          }
        } catch (courseErr) {
          console.error('Error fetching courses:', courseErr)
          // Don't set error for courses as assignments can still be displayed
        }
      } catch (err: any) {
        console.error('Error fetching assignments:', err)
        
        if (err.response?.status === 401) {
          setAuthError(true);
        } else {
          setError(err.response?.data?.error || 'Failed to load assignments. Please try again later.')
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchAssignments()
  }, [token, tenantId])

  // Handle authentication error
  const handleRelogin = () => {
    logout();
    navigate('/login');
  }

  useEffect(() => {
    // Filter assignments based on search term, course filter, and tab value
    let filtered = assignments
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(assignment => 
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.course.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Filter by course
    if (courseFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.course._id === courseFilter)
    }
    
    // Filter by tab (submissionStatus)
    if (tabValue === 1) {
      // Pending tab - show pending and overdue
      filtered = filtered.filter(assignment => 
        assignment.submissionStatus === 'pending' || 
        assignment.submissionStatus === 'overdue'
      )
    } else if (tabValue === 2) {
      // Completed tab - show submitted, late, passed, graded
      filtered = filtered.filter(assignment => 
        assignment.submissionStatus === 'submitted' || 
        assignment.submissionStatus === 'late' || 
        assignment.submissionStatus === 'passed' || 
        assignment.submissionStatus === 'graded'
      )
    } else if (tabValue === 3) {
      // Overdue tab - show overdue and missed
      filtered = filtered.filter(assignment => 
        assignment.submissionStatus === 'overdue' || 
        assignment.submissionStatus === 'missed'
      )
    }
    
    setFilteredAssignments(filtered)
  }, [searchTerm, courseFilter, tabValue, assignments])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleCourseFilterChange = (event: SelectChangeEvent) => {
    setCourseFilter(event.target.value)
  }

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'graded':
      case 'passed':
        return <Chip 
          icon={<CompletedIcon />} 
          label={status === 'passed' ? 'Passed' : (status === 'graded' ? 'Graded' : 'Submitted')} 
          color="success" 
          size="small" 
        />
      case 'failed':
        return <Chip 
          icon={<OverdueIcon />} 
          label="Failed" 
          color="error" 
          size="small" 
        />
      case 'resubmit':
        return <Chip 
          icon={<OverdueIcon />} 
          label="Needs Revision" 
          color="warning" 
          size="small" 
        />
      case 'late':
        return <Chip 
          icon={<OverdueIcon />} 
          label="Late" 
          color="warning" 
          size="small" 
        />
      case 'overdue':
        return <Chip 
          icon={<OverdueIcon />} 
          label="Overdue" 
          color="error" 
          size="small" 
        />
      case 'missed':
        return <Chip 
          icon={<OverdueIcon />} 
          label="Missed" 
          color="error" 
          size="small" 
        />
      case 'pending':
      default:
        return <Chip 
          icon={<PendingIcon />} 
          label="Pending" 
          color="primary" 
          size="small" 
        />
    }
  }

  if (authError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
          <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" gutterBottom>Authentication Error</Typography>
          <Typography variant="body1" align="center" paragraph>
            Your session has expired or you are not authorized to access this page.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleRelogin}
            sx={{ mt: 2 }}
          >
            Log In Again
          </Button>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <PageLoading />
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <AssignmentIcon sx={{ mr: 1, opacity: 0.5 }} fontSize="large" color="primary" />
          <Typography variant="h4" component="h1" sx={{ opacity: 0.5 }}>
            Assignments
          </Typography>
        </Box>
        
        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={0}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="All" />
            <Tab label="Pending" />
            <Tab label="Completed" />
            <Tab label="Overdue" />
          </Tabs>
        </Paper>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="rectangular" height={56} width="100%" animation="wave" />
          </Box>
          <Box sx={{ width: 200 }}>
            <Skeleton variant="rectangular" height={56} width="100%" animation="wave" />
          </Box>
        </Box>
        
        <TableSkeleton rows={5} cols={3} />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AssignmentIcon sx={{ mr: 1 }} fontSize="large" color="primary" />
          <Typography variant="h4" component="h1">
            Resources
          </Typography>
        </Box>
        
        {/* Create Assignment button - only visible to instructors and admins */}
        {user && (user.role === 'instructor' || user.role === 'admin') && (
          <Button
            component={RouterLink}
            to="/assignments/create"
            variant="contained"
            startIcon={<AssignmentIcon />}
          >
            Create Assignment
          </Button>
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="All" />
          <Tab label="Pending" />
          <Tab label="Completed" />
          <Tab label="Overdue" />
        </Tabs>
      </Paper>
      
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search assignments"
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
          <FormControl fullWidth>
            <InputLabel id="course-filter-label">Filter by Course</InputLabel>
            <Select
              labelId="course-filter-label"
              id="course-filter"
              value={courseFilter}
              label="Filter by Course"
              onChange={handleCourseFilterChange}
            >
              <MenuItem value="all">All Courses</MenuItem>
              {courses.map((course) => (
                <MenuItem key={course._id} value={course._id}>
                  {course.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      {filteredAssignments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="text.secondary">
            No assignments found matching your criteria.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredAssignments.map((assignment) => (
            <Grid item key={assignment._id} xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography gutterBottom variant="h6" component="div">
                      {assignment.title}
                    </Typography>
                    {getStatusChip(assignment.submissionStatus || 'pending')}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{
                    mb: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {assignment.description}
                  </Typography>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      Course: {assignment.course.title}
                    </Typography>
                    <Typography variant="body2">
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      Points: {assignment.totalPoints}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    component={RouterLink} 
                    to={`/assignments/${assignment._id}`}
                    variant="outlined"
                    fullWidth
                  >
                    View Details
                  </Button>
                  {assignment.submissionStatus === 'pending' && (
                    <Button 
                      size="small" 
                      component={RouterLink} 
                      to={`/assignments/${assignment._id}/submit`}
                      variant="contained"
                      fullWidth
                    >
                      Submit
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  )
}

export default Assignments 