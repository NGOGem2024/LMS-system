import { useState, FormEvent, useContext, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Chip,
  Stack,
  Grid,
  Card,
  CardContent,
  Divider,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Tooltip
} from '@mui/material'
import { SelectChangeEvent } from '@mui/material/Select'
import {
  AddPhotoAlternate,
  Cancel,
  CheckCircle,
  HelpOutline,
  Info,
  Public,
  Lock,
  Schedule,
  School,
  LocalOffer,
  Description,
  
} from '@mui/icons-material'
import axios from 'axios'
import AuthContext from '../../context/AuthContext'

interface CourseFormData {
  title: string;
  description: string;
  shortDescription: string;
  duration: number;
  category: string;
  status: string;
  isPublic: boolean;
  tags: string[];
  iconName: string;
}

const steps = ['Basic Info', 'Details', 'Settings'];

const UpdateCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, tenantId } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState<string>('');
  const [activeStep, setActiveStep] = useState(0);
  
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    shortDescription: '',
    duration: 480, // in minutes (8 hours)
    category: '',
    status: 'draft',
    isPublic: false,
    tags: [],
    iconName: 'Users'
  });

  const iconOptions = [
    { value: 'School', label: 'Education', icon: <School /> },
    { value: 'LocalOffer', label: 'Offer', icon: <LocalOffer /> },
    { value: 'Description', label: 'Document', icon: <Description /> }
  ];

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        
        const response = await axios.get(`/api/ngo-lms/courses/${id}`, config);
        
        if (response.data.success) {
          const course = response.data.data;
          setFormData({
            title: course.title,
            description: course.description,
            shortDescription: course.shortDescription || '',
            duration: course.duration || 480,
            category: course.category || '',
            status: course.status || 'draft',
            isPublic: course.isPublic || false,
            tags: course.tags || [],
            iconName: course.iconName || 'Users'
          });
        }
      } catch (err: any) {
        console.error('Error fetching course:', err);
        setError('Failed to load course data. Please try again.');
      } finally {
        setLoadingCourse(false);
      }
    };

    if (id) {
      fetchCourse();
    }
  }, [id, token]);

  const handleNext = () => {
    if (activeStep === 0 && (!formData.title || !formData.description)) {
      setError('Please fill in all required fields');
      return;
    }
    if (activeStep === 1 && !formData.category) {
      setError('Please select a category');
      return;
    }
    
    setError(null);
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!formData.title || !formData.description || !formData.category) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    
    try {
      const courseData = {
        title: formData.title,
        description: formData.description,
        shortDescription: formData.shortDescription,
        duration: formData.duration,
        category: formData.category,
        status: formData.status,
        isPublic: formData.isPublic,
        tags: formData.tags,
        iconName: formData.iconName,
      };
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.put(`/api/ngo-lms/courses/${id}`, courseData, config);
      
      setSuccess('Course updated successfully!');
      
      setTimeout(() => {
        navigate('/coursestest');
      }, 2000);
    } catch (err: any) {
      console.error('Course update error:', err);
      
      if (err.response) {
        if (err.response.status === 401) {
          setError('Authentication error. Please log in again.');
        } else if (err.response.status === 403) {
          setError('You do not have permission to update courses.');
        } else if (err.response.status === 404) {
          setError('Course not found. It may have been deleted.');
        } else if (err.response.status === 504 || err.response.status === 408) {
          setError('Request timed out. Please try again later.');
        } else {
          setError(err.response.data?.message || 'Failed to update course. Please try again.');
        }
      } else if (err.request) {
        setError('No response received from server. Please check your connection and try again.');
      } else {
        setError('An error occurred while updating the course. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="title"
                label="Course Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={loading}
                error={!formData.title && error !== null}
                helperText={!formData.title && error !== null ? 'Title is required' : ''}
                InputProps={{
                  startAdornment: (
                    <School color="action" sx={{ mr: 1 }} />
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                margin="normal"
                fullWidth
                id="shortDescription"
                label="Short Description"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                disabled={loading}
                helperText="Brief summary of the course (max 200 characters)"
                InputProps={{
                  startAdornment: (
                    <Description color="action" sx={{ mr: 1 }} />
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                margin="normal"
                required
                fullWidth
                multiline
                rows={4}
                id="description"
                label="Full Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                error={!formData.description && error !== null}
                helperText={!formData.description && error !== null ? 'Description is required' : ''}
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                id="duration"
                label="Duration (minutes)"
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleChange}
                disabled={loading}
                inputProps={{ min: 1 }}
                InputProps={{
                  startAdornment: (
                    <Schedule color="action" sx={{ mr: 1 }} />
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="icon-label">Course Icon</InputLabel>
                <Select
                  labelId="icon-label"
                  id="iconName"
                  name="iconName"
                  value={formData.iconName}
                  label="Course Icon"
                  onChange={handleSelectChange}
                  disabled={loading}
                >
                  {iconOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {option.icon}
                        <Typography sx={{ ml: 1 }}>{option.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="category"
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={loading}
                error={!formData.category && error !== null}
                helperText={!formData.category && error !== null ? 'Category is required' : ''}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Tags
                <Tooltip title="Add relevant tags to help students find your course">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <HelpOutline fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                <TextField
                  fullWidth
                  id="tagInput"
                  label="Add Tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  helperText="Press Enter to add a tag"
                  InputProps={{
                    startAdornment: (
                      <LocalOffer color="action" sx={{ mr: 1 }} />
                    ),
                  }}
                />
                <Button 
                  variant="contained" 
                  onClick={handleAddTag} 
                  disabled={loading || !tagInput.trim()}
                  sx={{ ml: 1, mt: 1 }}
                  startIcon={<CheckCircle />}
                >
                  Add
                </Button>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {formData.tags.map((tag) => (
                  <Chip 
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    disabled={loading}
                    deleteIcon={<Cancel />}
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPublic}
                    onChange={handleSwitchChange}
                    name="isPublic"
                    disabled={loading}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {formData.isPublic ? (
                      <>
                        <Public color="primary" sx={{ mr: 1 }} />
                        <Typography>Public Course</Typography>
                      </>
                    ) : (
                      <>
                        <Lock color="action" sx={{ mr: 1 }} />
                        <Typography>Private Course</Typography>
                      </>
                    )}
                  </Box>
                }
                sx={{ ml: 0 }}
              />
              <Typography variant="caption" color="text.secondary" display="block">
                {formData.isPublic 
                  ? 'This course will be visible to all users' 
                  : 'This course will only be visible to enrolled students'}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Course Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  name="status"
                  value={formData.status}
                  label="Course Status"
                  onChange={handleSelectChange}
                  disabled={loading}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Info color="info" sx={{ mr: 1 }} /> Course Preview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review your course details before saving changes.
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    <strong>Title:</strong> {formData.title || 'Not set'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Duration:</strong> {formData.duration} minutes
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Category:</strong> {formData.category || 'Not set'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Status:</strong> {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                </Typography>
                {formData.tags.length > 0 && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Tags:</strong> {formData.tags.join(', ')}
                  </Typography>
                )}
              </Card>
            </Grid>
          </Grid>
        );
      default:
        return 'Unknown step';
    }
  };

  if (loadingCourse) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading course data...
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Edit Course Test
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Update the details below to modify your course.
        </Typography>
        
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
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box>
          {getStepContent(activeStep)}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={activeStep === 0 ? () => navigate(-1) : handleBack}
            disabled={loading}
            startIcon={<Cancel />}
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={
                loading || 
                (activeStep === 0 && (!formData.title || !formData.description)) ||
                (activeStep === 1 && !formData.category)
              }
            >
              Next
            </Button>
          ) : (
            <form onSubmit={handleSubmit}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
              >
                {loading ? 'Updating Course...' : 'Save Changes'}
              </Button>
            </form>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default UpdateCourse;