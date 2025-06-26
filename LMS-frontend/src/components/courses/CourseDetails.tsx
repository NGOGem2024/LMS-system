import { useState, useEffect, useContext } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import AuthContext from '../../context/AuthContext'
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent,
  CardMedia,
  LinearProgress,
  Alert,
  Chip,
  Avatar,
  Skeleton
} from '@mui/material'
import {
  Description as ContentIcon,
  Assignment as AssignmentIcon,
  Forum as DiscussionIcon,
  PlayCircleOutline as VideoIcon,
  InsertDriveFile as FileIcon,
  Quiz as QuizIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as IncompleteIcon,
  CheckCircle
} from '@mui/icons-material'
import axios from 'axios'
import ModuleManager from './ModuleManager'
import { 
  PageLoading, 
  ContentPlaceholder, 
  AssignmentListSkeleton 
} from '../ui/LoadingComponents'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`course-tabpanel-${index}`}
      aria-labelledby={`course-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

interface Course {
  _id: string
  title: string
  description: string
  instructor: {
    _id: string
    name: string
    bio: string
    imageUrl?: string
  }
  category: string
  imageUrl?: string
  thumbnail?: string
  enrolledCount: number
  isEnrolled: boolean
  progress: number
  modules: Module[]
  assignments: Assignment[]
  quizzes: Quiz[]
}

interface Module {
  _id: string
  title: string
  description: string
  order: number
  content: ModuleContent[]
}

interface ModuleContent {
  _id: string
  title: string
  type: 'video' | 'document' | 'quiz'
  completed: boolean
  duration?: number
}

interface Assignment {
  _id: string
  title: string
  description: string
  dueDate: string
  points: number
  submitted: boolean
}

interface Quiz {
  _id: string
  title: string
  description: string
  timeLimit: number
  passingScore: number
  questions: any[]
  status: 'draft' | 'published' | 'archived'
}

const CourseDetails = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useContext(AuthContext)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const res = await axios.get(`/api/courses/${id}`)
        setCourse(res.data)
      } catch (err: any) {
        setError('Failed to load course details. Please try again later.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      fetchCourse()
    }
  }, [id])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleEnroll = async () => {
    if (!course) return
    
    try {
      await axios.post(`/api/courses/${course._id}/enroll`)
      setCourse({
        ...course,
        isEnrolled: true,
        enrolledCount: course.enrolledCount + 1
      })
    } catch (err: any) {
      setError('Failed to enroll in course. Please try again.')
      console.error(err)
    }
  }

  const markContentCompleted = async (moduleId: string, contentId: string) => {
    if (!course) return
    
    try {
      await axios.post(`/api/courses/${course._id}/modules/${moduleId}/content/${contentId}/complete`)
      
      // Update the course state to reflect completion
      const updatedModules = course.modules.map(module => {
        if (module._id === moduleId) {
          return {
            ...module,
            content: module.content.map(content => {
              if (content._id === contentId) {
                return { ...content, completed: true }
              }
              return content
            })
          }
        }
        return module
      })
      
      // Calculate new progress
      const allContent = updatedModules.flatMap(module => module.content)
      const completedContent = allContent.filter(content => content.completed)
      const newProgress = (completedContent.length / allContent.length) * 100
      
      setCourse({
        ...course,
        modules: updatedModules,
        progress: newProgress
      })
    } catch (err: any) {
      setError('Failed to mark content as completed. Please try again.')
      console.error(err)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <PageLoading />
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <ContentPlaceholder lines={1} />
                  <Box sx={{ my: 2 }}>
                    <ContentPlaceholder lines={3} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Skeleton variant="rectangular" width={80} height={32} />
                    <Skeleton variant="rectangular" width={100} height={32} />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Skeleton variant="rectangular" height={200} width="100%" />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ mb: 3 }}>
              <Skeleton variant="rectangular" height={48} width="100%" />
              <Box sx={{ p: 3 }}>
                <AssignmentListSkeleton count={3} />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    )
  }

  if (!course) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Course not found or has been removed.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={4}>
        {/* Course Header */}
        <Grid item xs={12}>
          <Paper
            sx={{
              position: 'relative',
              backgroundColor: 'grey.800',
              color: '#fff',
              mb: 4,
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundImage: `url(${course.thumbnail || course.imageUrl || 'https://source.unsplash.com/random?education'})`,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                right: 0,
                left: 0,
                backgroundColor: 'rgba(0,0,0,.6)',
              }}
            />
            <Grid container>
              <Grid item md={8}>
                <Box
                  sx={{
                    position: 'relative',
                    p: { xs: 3, md: 6 },
                  }}
                >
                  <Chip 
                    label={course.category} 
                    sx={{ mb: 2 }} 
                    color="primary" 
                  />
                  <Typography component="h1" variant="h3" color="inherit" gutterBottom>
                    {course.title}
                  </Typography>
                  <Typography variant="subtitle1" color="inherit" paragraph>
                    {course.description}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      src={course.instructor.imageUrl}
                      alt={course.instructor.name}
                      sx={{ mr: 2 }}
                    />
                    <Typography variant="subtitle1">
                      Instructor: {course.instructor.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    {course.enrolledCount} students enrolled
                  </Typography>
                  
                  {course.isEnrolled ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                      <Box sx={{ width: '100%', mr: 1, maxWidth: 300 }}>
                        <LinearProgress variant="determinate" value={course.progress} />
                      </Box>
                      <Box sx={{ minWidth: 35 }}>
                        <Typography variant="body2">{`${Math.round(
                          course.progress,
                        )}%`}</Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Button 
                      variant="contained" 
                      color="primary" 
                      sx={{ mt: 2 }}
                      onClick={handleEnroll}
                    >
                      Enroll Now
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Course Content */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Content" />
              <Tab label="Assignments" />
              <Tab label="Quizzes" />
              <Tab label="Discussion" />
              <Tab label="About" />
            </Tabs>
            
            {/* Content Tab */}
            <TabPanel value={tabValue} index={0}>
              {/* Show module manager for instructors and admins */}
              {user && (user.role === 'instructor' || user.role === 'admin') && 
                course.instructor._id === user._id && (
                <ModuleManager courseId={course._id} />
              )}
              
              {course.modules.length > 0 ? (
                course.modules
                  .sort((a, b) => a.order - b.order)
                  .map((module) => (
                    <Box key={module._id} sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom>
                        {module.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {module.description}
                      </Typography>
                      
                      <List>
                        {module.content.map((content) => (
                          <ListItem
                            key={content._id}
                            button
                            onClick={() => !content.completed && markContentCompleted(module._id, content._id)}
                          >
                            <ListItemIcon>
                              {content.type === 'video' && <VideoIcon />}
                              {content.type === 'document' && <FileIcon />}
                              {content.type === 'quiz' && <QuizIcon />}
                            </ListItemIcon>
                            <ListItemText 
                              primary={content.title} 
                              secondary={content.duration ? `Duration: ${content.duration} min` : null}
                            />
                            <ListItemIcon>
                              {content.completed ? <CompletedIcon color="success" /> : <IncompleteIcon />}
                            </ListItemIcon>
                          </ListItem>
                        ))}
                      </List>
                      <Divider sx={{ mt: 2, mb: 2 }} />
                    </Box>
                  ))
              ) : (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography variant="body1" color="text.secondary">
                    No content available for this course yet.
                  </Typography>
                  {user && (user.role === 'instructor' || user.role === 'admin') && 
                    course.instructor._id === user._id && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Use the module manager above to add content to your course.
                    </Typography>
                  )}
                </Box>
              )}
            </TabPanel>
            
            {/* Assignments Tab */}
            <TabPanel value={tabValue} index={1}>
              {course.assignments.length > 0 ? (
                <Grid container spacing={3}>
                  {course.assignments.map((assignment) => (
                    <Grid item xs={12} sm={6} md={4} key={assignment._id}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" component="div">
                            {assignment.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {assignment.description}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2">
                              Points: {assignment.points}
                            </Typography>
                          </Box>
                          <Box sx={{ mt: 2 }}>
                            {assignment.submitted ? (
                              <Chip 
                                label="Submitted" 
                                color="success" 
                                size="small" 
                                icon={<CompletedIcon />} 
                              />
                            ) : (
                              <Button
                                variant="contained"
                                size="small"
                                component={RouterLink}
                                to={`/assignments/${assignment._id}/submit`}
                              >
                                Submit
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography variant="body1" color="text.secondary">
                    No assignments available for this course yet.
                  </Typography>
                </Box>
              )}
            </TabPanel>
            
            {/* Quizzes Tab */}
            <TabPanel value={tabValue} index={2}>
              {user && (user.role === 'instructor' || user.role === 'admin') && (
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    component={RouterLink}
                    to={`/courses/${course._id}/quizzes/create`}
                    startIcon={<QuizIcon />}
                  >
                    Create Quiz
                  </Button>
                </Box>
              )}
              
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  component={RouterLink}
                  to={`/courses/${course._id}/quizzes`}
                >
                  View All Quizzes
                </Button>
              </Box>
              
              {course.quizzes && course.quizzes.length > 0 ? (
                <Grid container spacing={3}>
                  {course.quizzes
                    .filter(quiz => quiz.status === 'published' || user?.role === 'instructor' || user?.role === 'admin')
                    .slice(0, 6)
                    .map((quiz) => (
                      <Grid item xs={12} sm={6} md={4} key={quiz._id}>
                        <Card>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Typography variant="h6" component="div">
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
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2">
                                Time: {quiz.timeLimit} minutes
                              </Typography>
                              <Typography variant="body2">
                                Pass: {quiz.passingScore}%
                              </Typography>
                            </Box>
                            <Box sx={{ mt: 2 }}>
                              {user?.role === 'student' ? (
                                <Button
                                  variant="contained"
                                  size="small"
                                  component={RouterLink}
                                  to={`/quizzes/${quiz._id}`}
                                  disabled={quiz.status !== 'published'}
                                >
                                  Take Quiz
                                </Button>
                              ) : (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  component={RouterLink}
                                  to={`/quizzes/${quiz._id}/edit`}
                                >
                                  Edit Quiz
                                </Button>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography variant="body1" color="text.secondary">
                    No quizzes available for this course yet.
                  </Typography>
                </Box>
              )}
            </TabPanel>
            
            {/* Discussion Tab */}
            <TabPanel value={tabValue} index={3}>
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="body1" color="text.secondary">
                  Discussion forum will be available soon.
                </Typography>
              </Box>
            </TabPanel>
            
            {/* About Tab */}
            <TabPanel value={tabValue} index={4}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="240"
                      image={course.instructor.imageUrl || `https://source.unsplash.com/random?professor,${course.instructor._id}`}
                      alt={course.instructor.name}
                    />
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {course.instructor.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {course.instructor.bio || "No instructor bio available."}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    About This Course
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {course.description}
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    What You'll Learn
                  </Typography>
                  <List>
                    {course.modules.map((module) => (
                      <ListItem key={module._id}>
                        <ListItemIcon>
                          <ContentIcon />
                        </ListItemIcon>
                        <ListItemText primary={module.title} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default CourseDetails 