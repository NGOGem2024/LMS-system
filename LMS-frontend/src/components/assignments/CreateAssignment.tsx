import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress,
  Chip,
  Grid
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import axios from 'axios'

interface Course {
  _id: string;
  title: string;
}

interface Module {
  _id: string;
  title: string;
}

interface AssignmentFormData {
  title: string;
  description: string;
  instructions: string;
  course: string;
  module: string;
  dueDate: Date | null;
  totalPoints: number;
  passingPoints: number;
  submissionType: 'file' | 'text' | 'link' | 'multiple';
  allowLateSubmissions: boolean;
  latePenalty: number;
  status: 'draft' | 'published';
}

const CreateAssignment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    description: '',
    instructions: '',
    course: '',
    module: '',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
    totalPoints: 100,
    passingPoints: 60,
    submissionType: 'file',
    allowLateSubmissions: false,
    latePenalty: 0,
    status: 'draft'
  });

  useEffect(() => {
    // Fetch courses when component mounts
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const res = await axios.get('/api/courses');
        setCourses(res.data);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoadingCourses(false);
      }
    };
    
    fetchCourses();
  }, []);

  useEffect(() => {
    // Fetch modules when course changes
    if (formData.course) {
      const fetchModules = async () => {
        setLoadingModules(true);
        try {
          const res = await axios.get(`/api/courses/${formData.course}/modules`);
          setModules(res.data);
        } catch (err) {
          console.error('Error fetching modules:', err);
          setModules([]);
        } finally {
          setLoadingModules(false);
        }
      };
      
      fetchModules();
    } else {
      setModules([]);
    }
  }, [formData.course]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleDateChange = (newDate: Date | null) => {
    setFormData({
      ...formData,
      dueDate: newDate
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validate required fields
    if (!formData.title || !formData.description || !formData.instructions || !formData.course || !formData.dueDate) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.post('/api/assignments', formData);
      console.log('Assignment creation response:', response.data);
      
      setSuccess('Assignment created successfully!');
      setTimeout(() => {
        navigate('/assignments');
      }, 2000);
    } catch (err: any) {
      console.error('Assignment creation error:', err);
      
      if (err.response) {
        setError(err.response.data?.error || 'Failed to create assignment. Please try again.');
      } else if (err.request) {
        setError('No response received from server. Please check your connection and try again.');
      } else {
        setError('An error occurred while creating the assignment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Create New Assignment
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="title"
              label="Assignment Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              disabled={loading}
              error={!formData.title && error !== null}
              helperText={!formData.title && error !== null ? 'Title is required' : ''}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              multiline
              rows={2}
              id="description"
              label="Short Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={loading}
              error={!formData.description && error !== null}
              helperText={!formData.description && error !== null ? 'Description is required' : ''}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              multiline
              rows={4}
              id="instructions"
              label="Detailed Instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              disabled={loading}
              error={!formData.instructions && error !== null}
              helperText={!formData.instructions && error !== null ? 'Instructions are required' : ''}
            />
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!formData.course && error !== null}>
                  <InputLabel id="course-label">Course</InputLabel>
                  <Select
                    labelId="course-label"
                    id="course"
                    name="course"
                    value={formData.course}
                    label="Course"
                    onChange={handleChange}
                    disabled={loading || loadingCourses}
                  >
                    {courses.map((course) => (
                      <MenuItem key={course._id} value={course._id}>
                        {course.title}
                      </MenuItem>
                    ))}
                  </Select>
                  {!formData.course && error !== null && (
                    <FormHelperText>Course is required</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="module-label">Module (Optional)</InputLabel>
                  <Select
                    labelId="module-label"
                    id="module"
                    name="module"
                    value={formData.module}
                    label="Module (Optional)"
                    onChange={handleChange}
                    disabled={loading || loadingModules || !formData.course}
                  >
                    {modules.map((module) => (
                      <MenuItem key={module._id} value={module._id}>
                        {module.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <DateTimePicker
                  label="Due Date *"
                  value={formData.dueDate}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !formData.dueDate && error !== null,
                      helperText: !formData.dueDate && error !== null ? 'Due date is required' : ''
                    }
                  }}
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel id="submission-type-label">Submission Type</InputLabel>
                  <Select
                    labelId="submission-type-label"
                    id="submissionType"
                    name="submissionType"
                    value={formData.submissionType}
                    label="Submission Type"
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <MenuItem value="file">File Upload</MenuItem>
                    <MenuItem value="text">Text Entry</MenuItem>
                    <MenuItem value="link">URL Link</MenuItem>
                    <MenuItem value="multiple">Multiple Types</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="totalPoints"
                  label="Total Points"
                  name="totalPoints"
                  type="number"
                  value={formData.totalPoints}
                  onChange={handleChange}
                  disabled={loading}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="passingPoints"
                  label="Passing Points"
                  name="passingPoints"
                  type="number"
                  value={formData.passingPoints}
                  onChange={handleChange}
                  disabled={loading}
                  inputProps={{ min: 0, max: formData.totalPoints }}
                  error={formData.passingPoints > formData.totalPoints}
                  helperText={formData.passingPoints > formData.totalPoints ? 'Cannot be greater than total points' : ''}
                />
              </Grid>
            </Grid>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    id="status"
                    name="status"
                    value={formData.status}
                    label="Status"
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="published">Published</MenuItem>
                  </Select>
                  <FormHelperText>
                    {formData.status === 'draft' ? 'Students cannot see draft assignments' : 'Assignment will be visible to students'}
                  </FormHelperText>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="late-submissions-label">Allow Late Submissions</InputLabel>
                  <Select
                    labelId="late-submissions-label"
                    id="allowLateSubmissions"
                    name="allowLateSubmissions"
                    value={formData.allowLateSubmissions}
                    label="Allow Late Submissions"
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <MenuItem value={true}>Yes</MenuItem>
                    <MenuItem value={false}>No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            {formData.allowLateSubmissions && (
              <TextField
                margin="normal"
                fullWidth
                id="latePenalty"
                label="Late Penalty (%)"
                name="latePenalty"
                type="number"
                value={formData.latePenalty}
                onChange={handleChange}
                disabled={loading}
                inputProps={{ min: 0, max: 100 }}
                helperText="Percentage points deducted for late submissions"
              />
            )}
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/assignments')}
                disabled={loading}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading ? 'Creating...' : 'Create Assignment'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default CreateAssignment; 