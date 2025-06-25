import { useState, useEffect, FormEvent } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  TextField,
  LinearProgress,
  Alert,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  Assignment as AssignmentIcon,
  Upload as UploadIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material'
import axios from 'axios'

interface Assignment {
  _id: string
  title: string
  description: string
  instructions: string
  dueDate: string
  course: {
    _id: string
    title: string
  }
}

const SubmitAssignment = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form state
  const [submissionType, setSubmissionType] = useState<'text' | 'file'>('text')
  const [textSubmission, setTextSubmission] = useState('')
  const [fileSubmission, setFileSubmission] = useState<File | null>(null)
  const [comments, setComments] = useState('')
  const [formErrors, setFormErrors] = useState<{
    submission?: string
    comments?: string
  }>({})

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

  const validateForm = () => {
    const errors: { submission?: string; comments?: string } = {}
    let isValid = true

    if (submissionType === 'text' && !textSubmission.trim()) {
      errors.submission = 'Please enter your submission text'
      isValid = false
    } else if (submissionType === 'file' && !fileSubmission) {
      errors.submission = 'Please select a file to upload'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !assignment) {
      return
    }
    
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    
    try {
      const formData = new FormData()
      formData.append('assignmentId', assignment._id)
      formData.append('submissionType', submissionType)
      
      if (submissionType === 'text') {
        formData.append('textContent', textSubmission)
      } else if (submissionType === 'file' && fileSubmission) {
        formData.append('file', fileSubmission)
      }
      
      if (comments) {
        formData.append('comments', comments)
      }
      
      await axios.post('/api/assignments/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setSuccess('Assignment submitted successfully!')
      
      // Redirect to assignment details page after 2 seconds
      setTimeout(() => {
        navigate(`/assignments/${assignment._id}`)
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit assignment. Please try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileSubmission(e.target.files[0])
      // Clear any previous submission error
      setFormErrors(prev => ({ ...prev, submission: undefined }))
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

  const isPastDue = new Date(assignment.dueDate) < new Date()

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          component={RouterLink}
          to={`/assignments/${assignment._id}`}
          startIcon={<BackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Assignment
        </Button>
      </Box>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AssignmentIcon color="primary" sx={{ fontSize: 30, mr: 2 }} />
          <Typography variant="h5" component="h1">
            Submit: {assignment.title}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">
              Course: {assignment.course.title}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">
              Due Date: {new Date(assignment.dueDate).toLocaleDateString()}
              {isPastDue && (
                <Typography component="span" color="error" sx={{ ml: 1 }}>
                  (Past Due)
                </Typography>
              )}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
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
      
      {isPastDue && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This assignment is past due. Your submission may be marked as late.
        </Alert>
      )}
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Assignment Instructions
        </Typography>
        <Typography variant="body1" paragraph>
          {assignment.instructions}
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Typography variant="h6" gutterBottom>
            Your Submission
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="submission-type-label">Submission Type</InputLabel>
            <Select
              labelId="submission-type-label"
              id="submission-type"
              value={submissionType}
              label="Submission Type"
              onChange={(e) => setSubmissionType(e.target.value as 'text' | 'file')}
            >
              <MenuItem value="text">Text Submission</MenuItem>
              <MenuItem value="file">File Upload</MenuItem>
            </Select>
          </FormControl>
          
          {submissionType === 'text' ? (
            <TextField
              margin="normal"
              required
              fullWidth
              id="text-submission"
              label="Your Answer"
              name="textSubmission"
              multiline
              rows={10}
              value={textSubmission}
              onChange={(e) => setTextSubmission(e.target.value)}
              error={!!formErrors.submission}
              helperText={formErrors.submission}
              disabled={submitting}
            />
          ) : (
            <Box sx={{ mb: 3 }}>
              <input
                accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                disabled={submitting}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  disabled={submitting}
                >
                  Upload File
                </Button>
              </label>
              {fileSubmission && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected file: {fileSubmission.name}
                </Typography>
              )}
              {formErrors.submission && (
                <FormHelperText error>{formErrors.submission}</FormHelperText>
              )}
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Accepted file types: PDF, Word documents, text files
              </Typography>
            </Box>
          )}
          
          <TextField
            margin="normal"
            fullWidth
            id="comments"
            label="Additional Comments (Optional)"
            name="comments"
            multiline
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            error={!!formErrors.comments}
            helperText={formErrors.comments}
            disabled={submitting}
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={submitting}
              size="large"
            >
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}

export default SubmitAssignment 