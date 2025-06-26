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
  Stack
} from '@mui/material'
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

const AddCourse = () => {
  const navigate = useNavigate();
  const { token, tenantId } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState<string>('');
  
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
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
    
    // Validate required fields
    if (!formData.title || !formData.description || !formData.category) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    
    try {
      // Ensure headers are set correctly
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      };
      
      console.log('Submitting course data:', formData);
      console.log('Using headers:', config.headers);
      
      // Use the simplified endpoint
      const response = await axios.post('/api/courses/simple', formData, config);
      console.log('Course creation response:', response.data);
      
      // Set success state
      setSuccess('Course created successfully!');
      
      // Wait for the database to process the new course
      // Then try to verify the course exists before navigating
      setTimeout(async () => {
        try {
          // Verify the course is accessible by trying to fetch it
          const verifyResponse = await axios.get(`/api/courses/${response.data.data._id}`, config);
          console.log('Course verification response:', verifyResponse.data);
          
                     // Course exists and is accessible, navigate to courses with query param
           navigate('/courses?newCourse=true');
         } catch (verifyErr) {
           console.warn('Could not verify course, but will navigate anyway:', verifyErr);
           // Navigate to courses even if verification fails
           navigate('/courses?newCourse=true');
        }
      }, 3000); // Give more time (3 seconds) for the database to process the new course
    } catch (err: any) {
      console.error('Course creation error:', err);
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);
        
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
        // The request was made but no response was received
        console.error('Error request:', err.request);
        setError('No response received from server. Please check your connection and try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('An error occurred while creating the course. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Add New Course
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
            label="Course Title"
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
            id="shortDescription"
            label="Short Description"
            name="shortDescription"
            value={formData.shortDescription}
            onChange={handleChange}
            disabled={loading}
            helperText="Brief summary of the course (max 200 characters)"
          />
          
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
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
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
            />
            
            <FormControl fullWidth required>
              <InputLabel id="level-label">Level</InputLabel>
              <Select
                labelId="level-label"
                id="level"
                name="level"
                value={formData.level}
                label="Level"
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
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
          </Box>
          
          <TextField
            margin="normal"
            fullWidth
            id="thumbnail"
            label="Thumbnail URL"
            name="thumbnail"
            value={formData.thumbnail}
            onChange={handleChange}
            disabled={loading}
            helperText="URL or path to course thumbnail image"
          />
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Tags
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
              />
              <Button 
                variant="contained" 
                onClick={handleAddTag} 
                disabled={loading || !tagInput.trim()}
                sx={{ ml: 1, mt: 1 }}
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
                />
              ))}
            </Stack>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
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
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublic}
                  onChange={handleSwitchChange}
                  name="isPublic"
                  disabled={loading}
                />
              }
              label="Make course public"
              sx={{ ml: 2 }}
            />
          </Box>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
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
              {loading ? 'Creating...' : 'Create Course'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddCourse; 