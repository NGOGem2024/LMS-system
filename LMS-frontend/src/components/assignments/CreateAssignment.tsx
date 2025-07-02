import { useState, useEffect, FormEvent, ReactNode } from 'react'
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
  Grid,
  Switch,
  FormControlLabel,
  InputAdornment
} from '@mui/material'
import { SelectChangeEvent } from '@mui/material/Select'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import axios from 'axios'

interface Course {
  _id: string;
  title: string;
}

interface CoursesResponse {
  courses: Course[];
  totalRecords: number;
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
        const res = await axios.get<CoursesResponse>('/api/courses');
        setCourses(res.data.courses);
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
    // Fetch modules when course changes, but with more robust error handling
    if (formData.course) {
      setLoadingModules(true);
      setError(null); // Clear previous errors
      
      // Set a timeout for the module fetch
      const fetchModulesWithTimeout = async () => {
        try {
          // Create a timeout promise
          const timeoutPromise = new Promise<{ data: Module[] }>((_, reject) => {
            setTimeout(() => reject(new Error('Module fetch timed out')), 8000); // Increased timeout to 8 seconds
          });
          
          // Actual fetch promise
          const fetchPromise = axios.get<Module[]>(`/api/courses/${formData.course}/modules`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          // Race them
          const res = await Promise.race([fetchPromise, timeoutPromise]);
          setModules(res.data || []);
          
          if (res.data && res.data.length === 0) {
            console.log('No modules found for this course');
          }
        } catch (err: any) {
          console.error('Error or timeout fetching modules:', err);
          // Set modules to empty array
          setModules([]);
          
          // Handle based on error type
          if (err.response && err.response.status === 401) {
            console.log('Authentication issue when fetching modules. Continuing without modules.');
            // Don't show error to user if it's just an auth issue
          } else if (err.response && err.response.status === 403) {
            console.log('Authorization issue when fetching modules. Continuing without modules.');
            // Don't show error to user if it's just an auth issue
          } else {
            // Show a user-friendly message
            setError('Unable to load modules. You can continue creating the assignment without selecting a module.');
          }
          // Log the error for debugging
          console.log('Continuing without modules - they will be optional');
        } finally {
          setLoadingModules(false);
        }
      };
      
      fetchModulesWithTimeout();
    } else {
      setModules([]);
    }
  }, [formData.course]);

  // Handle change for text inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle change for select inputs
  const handleSelectChange = (e: SelectChangeEvent<unknown>, child: ReactNode) => {
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
  
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
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
      // Create a copy of formData with module field only if it's not empty
      const submissionData = { ...formData } as Partial<AssignmentFormData>;
      if (!submissionData.module || submissionData.module === '') {
        delete submissionData.module; // Remove module if it's empty
      }
      
      // Set longer timeout for the assignment creation request
      const createAssignmentWithTimeout = async () => {
        try {
          // Set up axios with a longer timeout
          const response = await axios({
            method: 'post',
            url: '/api/assignments',
            data: submissionData,
            timeout: 15000 // 15 seconds timeout
          });
          
          console.log('Assignment creation response:', response.data);
          
          setSuccess('Assignment created successfully!');
          setTimeout(() => {
            navigate('/assignments');
          }, 2000);
        } catch (err: any) {
          if (err.code === 'ECONNABORTED') {
            throw new Error('Request timed out. The server might be busy. Please try again.');
          }
          throw err; // Re-throw other errors to be caught by the outer try/catch
        }
      };
      
      await createAssignmentWithTimeout();
    } catch (err: any) {
      console.error('Assignment creation error:', err);
      
      if (err.response) {
        const errorMessage = err.response.data?.error || 'Failed to create assignment. Please try again.';
        setError(`Server Error: ${errorMessage}`);
        console.error('Error response:', err.response.data);
      } else if (err.request) {
        setError('No response received from server. Please check your connection and try again.');
      } else {
        setError('An error occurred while creating the assignment. ' + err.message);
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
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
                    onChange={handleSelectChange}
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
                <FormControl fullWidth variant="outlined" sx={{ mt: 3 }} disabled={loadingModules}>
                  <InputLabel id="module-label">Module {loadingModules ? '(Loading...)' : '(Optional)'}</InputLabel>
                  <Select
                    labelId="module-label"
                    id="module"
                    name="module"
                    value={formData.module}
                    onChange={handleSelectChange}
                    label={`Module ${loadingModules ? '(Loading...)' : '(Optional)'}`}
                  >
                    <MenuItem value="">
                      <em>None (Optional)</em>
                    </MenuItem>
                    {modules.length > 0 ? (
                      modules.map(module => (
                        <MenuItem key={module._id} value={module._id}>
                          {module.title}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="" disabled>
                        {loadingModules ? 'Loading modules...' : 'No modules available'}
                      </MenuItem>
                    )}
                  </Select>
                  {error && error.includes('modules') && (
                    <FormHelperText error>
                      {error}
                    </FormHelperText>
                  )}
                  {!loadingModules && modules.length === 0 && !error && (
                    <FormHelperText>
                      No modules found for this course. You can create the assignment without a module.
                    </FormHelperText>
                  )}
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
                    onChange={handleSelectChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                    onChange={handleSelectChange}
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
                  <InputLabel id="allow-late-label">Allow Late Submissions</InputLabel>
                  <Select
                    labelId="allow-late-label"
                    id="allowLateSubmissions"
                    name="allowLateSubmissions"
                    value={formData.allowLateSubmissions ? "true" : "false"}
                    label="Allow Late Submissions"
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        allowLateSubmissions: e.target.value === "true"
                      });
                    }}
                    disabled={loading}
                  >
                    <MenuItem value="true">Yes</MenuItem>
                    <MenuItem value="false">No</MenuItem>
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
                onChange={handleInputChange}
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