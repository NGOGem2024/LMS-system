import { useState, FormEvent, useContext } from 'react'
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
  Description
} from '@mui/icons-material'
import axios from 'axios'
import AuthContext from '../../context/AuthContext'

interface CourseFormData {
  title: string;
  description: string;
  shortDescription: string;
  duration: number;
  level: string;
  category: string;
  price: number;
  status: string;
  isPublic: boolean;
  thumbnail: string;
  tags: string[];
}

const steps = ['Basic Info', 'Details', 'Media & Settings'];

const AddCourse = () => {
  const navigate = useNavigate();
  const { token, tenantId } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState<string>('');
  const [activeStep, setActiveStep] = useState(0);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    shortDescription: '',
    duration: 4,
    level: 'beginner',
    category: '',
    price: 0,
    status: 'draft',
    isPublic: false,
    thumbnail: '',
    tags: []
  });

  const handleNext = () => {
    // Validate current step before proceeding
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

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setThumbnailError('Please select an image file');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        setThumbnailError('Image size should be less than 2MB');
        return;
      }
      
      setThumbnailFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setThumbnailError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Final validation before submission
    if (!formData.title || !formData.description || !formData.category) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    
    try {
      const courseFormData = new FormData();
      
      courseFormData.append('title', formData.title);
      courseFormData.append('description', formData.description);
      courseFormData.append('shortDescription', formData.shortDescription);
      courseFormData.append('duration', formData.duration.toString());
      courseFormData.append('level', formData.level);
      courseFormData.append('category', formData.category);
      courseFormData.append('price', formData.price.toString());
      courseFormData.append('status', formData.status);
      courseFormData.append('isPublic', formData.isPublic.toString());
      courseFormData.append('tags', JSON.stringify(formData.tags));
      
      if (thumbnailFile) {
        courseFormData.append('thumbnail', thumbnailFile);
      } else if (formData.thumbnail) {
        courseFormData.append('thumbnailUrl', formData.thumbnail);
      }
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      };
      
      const response = await axios.post('/api/courses/simple', courseFormData, config);
      
      setSuccess('Course created successfully!');
      
      setTimeout(async () => {
        try {
          const verifyResponse = await axios.get(`/api/courses/${response.data.data._id}`, config);
          navigate('/courses?newCourse=true');
        } catch (verifyErr) {
          navigate('/courses?newCourse=true');
        }
      }, 3000);
    } catch (err: any) {
      console.error('Course creation error:', err);
      
      if (err.response) {
        if (err.response.status === 401) {
          setError('Authentication error. Please log in again.');
        } else if (err.response.status === 403) {
          setError('You do not have permission to create courses.');
        } else if (err.response.status === 504 || err.response.status === 408) {
          setError('Request timed out. Please try again later.');
        } else {
          setError(err.response.data?.error || 'Failed to create course. Please try again.');
        }
      } else if (err.request) {
        setError('No response received from server. Please check your connection and try again.');
      } else {
        setError('An error occurred while creating the course. Please try again.');
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
                required
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
                label="Duration (weeks)"
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
                <InputLabel id="level-label">Level</InputLabel>
                <Select
                  labelId="level-label"
                  id="level"
                  name="level"
                  value={formData.level}
                  label="Level"
                  onChange={handleSelectChange}
                  disabled={loading}
                >
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
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
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="price"
                label="Price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                disabled={loading}
                inputProps={{ min: 0, step: 0.01 }}
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
              <Typography variant="subtitle1" gutterBottom>
                Course Thumbnail
                <Tooltip title="Add an eye-catching image that represents your course">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <HelpOutline fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="thumbnail-upload"
                type="file"
                onChange={handleThumbnailChange}
                disabled={loading}
              />
              <label htmlFor="thumbnail-upload">
                <Card
                  sx={{
                    width: '100%',
                    height: 200,
                    mb: 2,
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundImage: thumbnailPreview ? `url(${thumbnailPreview})` : 'none',
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                >
                  {!thumbnailPreview && (
                    <CardContent sx={{ textAlign: 'center' }}>
                      <AddPhotoAlternate color="action" fontSize="large" />
                      <Typography variant="body2" color="text.secondary">
                        Click to upload or drag and drop
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Recommended size: 1280x720px (Max 2MB)
                      </Typography>
                    </CardContent>
                  )}
                </Card>
                <Button
                  component="span"
                  variant="outlined"
                  size="small"
                  disabled={loading}
                  startIcon={<AddPhotoAlternate />}
                >
                  Upload Thumbnail
                </Button>
              </label>
              {thumbnailError && (
                <Typography color="error" variant="caption" display="block" sx={{ mt: 1 }}>
                  {thumbnailError}
                </Typography>
              )}
              {!thumbnailFile && (
                <TextField
                  margin="normal"
                  fullWidth
                  id="thumbnail"
                  label="Or enter thumbnail URL"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={handleChange}
                  disabled={loading}
                  size="small"
                />
              )}
            </Grid>
            
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
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Info color="info" sx={{ mr: 1 }} /> Course Preview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review your course details before publishing. Make sure all information is accurate and complete.
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    <strong>Title:</strong> {formData.title || 'Not set'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Duration:</strong> {formData.duration} weeks
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Level:</strong> {formData.level.charAt(0).toUpperCase() + formData.level.slice(1)}
                </Typography>
              </Card>
            </Grid>
          </Grid>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Create New Course
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Fill in the details below to create your new course. You can save as draft and come back later.
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
        
        {/* Form is now only around the submit button to prevent auto-submission */}
        <Box>
          {getStepContent(activeStep)}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={activeStep === 0 ? () => navigate(-1) : handleBack}
            disabled={loading }
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
                {loading ? 'Creating Course...' : 'Create Course'}
              </Button>
            </form>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default AddCourse;