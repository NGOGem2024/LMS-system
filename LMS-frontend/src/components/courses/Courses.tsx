import { useState, useEffect, useContext } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  TextField,
  InputAdornment,
  LinearProgress,
  Chip,
  Pagination,
  Alert,
  CardActions,
  Fab
} from '@mui/material'
import {
  Search as SearchIcon,
  School as SchoolIcon,
  Add as AddIcon
} from '@mui/icons-material'
import axios from 'axios'
import AuthContext from '../../context/AuthContext'

interface Course {
  _id: string
  title: string
  description: string
  instructor: {
    _id: string
    name: string
  }
  category: string
  imageUrl?: string
  enrolledCount: number
  isEnrolled?: boolean
  progress?: number
}

const Courses = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const coursesPerPage = 8

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const res = await axios.get('/api/courses')
        setCourses(res.data)
        setFilteredCourses(res.data)
        setTotalPages(Math.ceil(res.data.length / coursesPerPage))
      } catch (err: any) {
        setError('Failed to load courses. Please try again later.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchCourses()
  }, [])

  useEffect(() => {
    const results = courses.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredCourses(results)
    setTotalPages(Math.ceil(results.length / coursesPerPage))
    setPage(1) // Reset to first page when search changes
  }, [searchTerm, courses])

  const handleEnroll = async (courseId: string) => {
    try {
      await axios.post(`/api/courses/${courseId}/enroll`)
      
      // Update the courses state to reflect enrollment
      setCourses(courses.map(course => 
        course._id === courseId 
          ? { ...course, isEnrolled: true, enrolledCount: course.enrolledCount + 1 } 
          : course
      ))
    } catch (err: any) {
      setError('Failed to enroll in course. Please try again.')
      console.error(err)
    }
  }

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

  const paginatedCourses = filteredCourses.slice(
    (page - 1) * coursesPerPage,
    page * coursesPerPage
  )

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SchoolIcon sx={{ mr: 1 }} fontSize="large" color="primary" />
          <Typography variant="h4" component="h1">
            Courses
          </Typography>
        </Box>
        
        {/* Add Course button - only visible to instructors and admins */}
        {user && (user.role === 'instructor' || user.role === 'admin') && (
          <Button
            component={RouterLink}
            to="/courses/add"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add Course
          </Button>
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search courses by title, description, or category"
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
      </Box>
      
      {filteredCourses.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No courses found matching your search criteria.
          </Typography>
          {user && (user.role === 'instructor' || user.role === 'admin') && (
            <Button
              component={RouterLink}
              to="/courses/add"
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ mt: 2 }}
            >
              Add Your First Course
            </Button>
          )}
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedCourses.map((course) => (
              <Grid item key={course._id} xs={12} sm={6} md={4} lg={3}>
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
                  <CardMedia
                    component="img"
                    height="140"
                    image={course.imageUrl || `https://source.unsplash.com/random?education,${course._id}`}
                    alt={course.title}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ mb: 1 }}>
                      <Chip 
                        label={course.category} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </Box>
                    <Typography gutterBottom variant="h6" component="div">
                      {course.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {course.description}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Instructor: {course.instructor.name}
                      </Typography>
                      <Typography variant="body2">
                        Enrolled: {course.enrolledCount} students
                      </Typography>
                    </Box>
                    
                    {course.isEnrolled && course.progress !== undefined && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress variant="determinate" value={course.progress} />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">{`${Math.round(
                            course.progress,
                          )}%`}</Typography>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    {course.isEnrolled ? (
                      <Button 
                        size="small" 
                        component={RouterLink} 
                        to={`/courses/${course._id}`}
                        variant="contained"
                        fullWidth
                      >
                        Continue Learning
                      </Button>
                    ) : (
                      <Button 
                        size="small"
                        onClick={() => handleEnroll(course._id)}
                        variant="contained"
                        fullWidth
                      >
                        Enroll Now
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange} 
              color="primary" 
            />
          </Box>
        </>
      )}
      
      {/* Add a floating action button for mobile */}
      {user && (user.role === 'instructor' || user.role === 'admin') && (
        <Fab
          color="primary"
          aria-label="add"
          component={RouterLink}
          to="/courses/add"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', md: 'none' }
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Container>
  )
}

export default Courses 