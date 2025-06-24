import { useState, useEffect, useContext } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material'
import {
  Search as SearchIcon,
  Quiz as QuizIcon,
  AccessTime as TimeIcon,
  Grade as GradeIcon,
  Add as AddIcon
} from '@mui/icons-material'
import axios from 'axios'
import AuthContext from '../../context/AuthContext'
import { useLoading } from '../../context/LoadingContext'
import { CourseGridSkeleton } from '../ui/LoadingComponents'

interface Quiz {
  _id: string
  title: string
  description: string
  course: {
    _id: string
    title: string
  }
  module?: {
    _id: string
    title: string
  }
  timeLimit: number
  passingScore: number
  totalPoints: number
  questions: any[]
  status: 'draft' | 'published' | 'archived'
  createdAt: string
  attemptsCount?: number
  canAttempt?: boolean
  attempts?: number
  lastScore?: number
}

const Quizzes = () => {
  const { courseId } = useParams<{ courseId?: string }>()
  const { user } = useContext(AuthContext)
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true)
        setError(null)
        
        let url = '/api/quizzes'
        if (courseId) {
          url += `?course=${courseId}`
        }
        
        const res = await axios.get(url)
        setQuizzes(res.data.data)
        setLoading(false)
      } catch (err: any) {
        console.error('Error fetching quizzes:', err)
        setError(err.response?.data?.error || 'Failed to load quizzes')
        setLoading(false)
      }
    }
    
    fetchQuizzes()
  }, [courseId])
  
  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const isInstructor = user?.role === 'instructor' || user?.role === 'admin'
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading quizzes...
        </Typography>
      </Container>
    )
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {courseId ? 'Course Quizzes' : 'All Quizzes'}
        </Typography>
        
        {isInstructor && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={RouterLink}
            to={courseId ? `/courses/${courseId}/quizzes/create` : '/quizzes/create'}
          >
            Create Quiz
          </Button>
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search quizzes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Paper>
      
      {filteredQuizzes.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <QuizIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No quizzes found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try a different search term' : 'No quizzes are available yet'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredQuizzes.map(quiz => (
            <Grid item xs={12} md={6} lg={4} key={quiz._id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="div" gutterBottom>
                      {quiz.title}
                    </Typography>
                    <Chip 
                      label={quiz.status} 
                      color={
                        quiz.status === 'published' ? 'success' : 
                        quiz.status === 'draft' ? 'default' : 'error'
                      }
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {quiz.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip 
                      icon={<TimeIcon />} 
                      label={`${quiz.timeLimit} min`} 
                      size="small" 
                      variant="outlined"
                    />
                    <Chip 
                      icon={<GradeIcon />} 
                      label={`${quiz.passingScore}% to pass`} 
                      size="small" 
                      variant="outlined"
                    />
                    <Chip 
                      icon={<QuizIcon />} 
                      label={`${quiz.questions.length} questions`} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                  
                  {quiz.module && (
                    <Typography variant="body2" color="text.secondary">
                      Module: {quiz.module.title}
                    </Typography>
                  )}
                  
                  {!courseId && (
                    <Typography variant="body2" color="text.secondary">
                      Course: {quiz.course.title}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  {isInstructor ? (
                    <>
                      <Button 
                        size="small" 
                        component={RouterLink} 
                        to={`/quizzes/${quiz._id}/edit`}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small" 
                        component={RouterLink} 
                        to={`/quizzes/${quiz._id}/attempts`}
                      >
                        View Attempts
                      </Button>
                    </>
                  ) : (
                    <Button 
                      size="small" 
                      component={RouterLink} 
                      to={`/quizzes/${quiz._id}`}
                      disabled={quiz.status !== 'published' || quiz.canAttempt === false}
                    >
                      {quiz.attemptsCount && quiz.attemptsCount > 0 ? 'Retake Quiz' : 'Take Quiz'}
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

export default Quizzes 