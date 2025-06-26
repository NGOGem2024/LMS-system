import { useState, useEffect, useContext } from 'react'
import { Link as RouterLink } from 'react-router-dom'
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
  Warning as OverdueIcon
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
  points: number
  status: 'completed' | 'pending' | 'overdue'
}

interface Course {
  _id: string
  title: string
}

interface CoursesResponse {
  courses: Course[]
  totalRecords: number
}

const Assignments = () => {
  const { user } = useContext(AuthContext);
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Fetch assignments
        const assignmentsRes = await axios.get('/api/assignments')
        setAssignments(assignmentsRes.data)
        setFilteredAssignments(assignmentsRes.data)
        
        // Fetch courses for filter
        const coursesRes = await axios.get<CoursesResponse>('/api/courses/enrolled')
        setCourses(coursesRes.data.courses)
      } catch (err: any) {
        setError('Failed to load assignments. Please try again later.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAssignments()
  }, [])

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
    
    // Filter by tab (status)
    if (tabValue === 1) {
      filtered = filtered.filter(assignment => assignment.status === 'pending')
    } else if (tabValue === 2) {
      filtered = filtered.filter(assignment => assignment.status === 'completed')
    } else if (tabValue === 3) {
      filtered = filtered.filter(assignment => assignment.status === 'overdue')
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
      case 'completed':
        return <Chip 
          icon={<CompletedIcon />} 
          label="Completed" 
          color="success" 
          size="small" 
        />
      case 'overdue':
        return <Chip 
          icon={<OverdueIcon />} 
          label="Overdue" 
          color="error" 
          size="small" 
        />
      default:
        return <Chip 
          icon={<PendingIcon />} 
          label="Pending" 
          color="primary" 
          size="small" 
        />
    }
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
            Assignments
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
                    {getStatusChip(assignment.status)}
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
                      Points: {assignment.points}
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
                  {assignment.status === 'pending' && (
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