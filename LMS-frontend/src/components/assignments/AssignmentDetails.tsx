import { useState, useEffect } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import {
  Assignment as AssignmentIcon,
  School as CourseIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Grading as GradingIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Warning as OverdueIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material'
import axios from 'axios'

interface Assignment {
  _id: string
  title: string
  description: string
  instructions: string
  dueDate: string
  points: number
  status: 'completed' | 'pending' | 'overdue'
  course: {
    _id: string
    title: string
  }
  submission?: {
    _id: string
    submittedAt: string
    grade?: number
    feedback?: string
  }
}

const AssignmentDetails = () => {
  const { id } = useParams<{ id: string }>()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAssignment = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const res = await axios.get(`/api/assignments/${id}`)
        setAssignment(res.data)
      } catch (err: any) {
        setError('Failed to load assignment details. Please try again later.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      fetchAssignment()
    }
  }, [id])

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'completed':
        return <Chip 
          icon={<CompletedIcon />} 
          label="Completed" 
          color="success" 
          variant="filled" 
        />
      case 'overdue':
        return <Chip 
          icon={<OverdueIcon />} 
          label="Overdue" 
          color="error" 
          variant="filled" 
        />
      default:
        return <Chip 
          icon={<PendingIcon />} 
          label="Pending" 
          color="primary" 
          variant="filled" 
        />
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress />
      </Container>
    )
  }

  if (!assignment) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Assignment not found or has been removed.
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
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          component={RouterLink}
          to="/assignments"
          startIcon={<BackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Assignments
        </Button>
      </Box>
      
      <Grid container spacing={4}>
        {/* Assignment Header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h4" component="h1">
                  {assignment.title}
                </Typography>
              </Box>
              {getStatusChip(assignment.status)}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CourseIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Course" 
                      secondary={
                        <RouterLink to={`/courses/${assignment.course._id}`}>
                          {assignment.course.title}
                        </RouterLink>
                      } 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Due Date" 
                      secondary={new Date(assignment.dueDate).toLocaleDateString()} 
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <GradingIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Points" 
                      secondary={assignment.points} 
                    />
                  </ListItem>
                  {assignment.submission && assignment.submission.submittedAt && (
                    <ListItem>
                      <ListItemIcon>
                        <TimeIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Submitted" 
                        secondary={new Date(assignment.submission.submittedAt).toLocaleString()} 
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Assignment Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {assignment.description}
            </Typography>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              Instructions
            </Typography>
            <Typography variant="body1" paragraph>
              {assignment.instructions}
            </Typography>
            
            {!assignment.submission && assignment.status !== 'completed' && (
              <Box sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  component={RouterLink}
                  to={`/assignments/${assignment._id}/submit`}
                  startIcon={<AssignmentIcon />}
                >
                  Submit Assignment
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Submission Status */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Submission Status
              </Typography>
              
              {assignment.submission ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CompletedIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      Submitted on {new Date(assignment.submission.submittedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  
                  {assignment.submission.grade !== undefined ? (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Grade: {assignment.submission.grade} / {assignment.points}
                      </Typography>
                      
                      {assignment.submission.feedback && (
                        <>
                          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                            Feedback:
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                            <Typography variant="body2">
                              {assignment.submission.feedback}
                            </Typography>
                          </Paper>
                        </>
                      )}
                    </Box>
                  ) : (
                    <Alert severity="info">
                      Your submission is under review.
                    </Alert>
                  )}
                </>
              ) : (
                <>
                  {assignment.status === 'overdue' ? (
                    <Alert severity="error">
                      This assignment is past due. Contact your instructor if you still need to submit.
                    </Alert>
                  ) : (
                    <Alert severity="warning">
                      You haven't submitted this assignment yet. The due date is {new Date(assignment.dueDate).toLocaleDateString()}.
                    </Alert>
                  )}
                  
                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      component={RouterLink}
                      to={`/assignments/${assignment._id}/submit`}
                    >
                      Submit Assignment
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default AssignmentDetails 