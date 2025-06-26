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
  Avatar
} from '@mui/material'
import { SelectChangeEvent } from '@mui/material/Select'
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
  
  // Add state for thumbnail file
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

  // Add handler for thumbnail file selection
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setThumbnailError('Please select an image file');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setThumbnailError('Image size should be less than 2MB');
        return;
      }
      
      setThumbnailFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous errors
      setThumbnailError(null);
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
      // Create FormData for multipart/form-data request (for file upload)
      const courseFormData = new FormData();
      
      // Append all form fields
      courseFormData.append('title', formData.title);
      courseFormData.append('description', formData.description);
      courseFormData.append('shortDescription', formData.shortDescription);
      courseFormData.append('duration', formData.duration.toString());
      courseFormData.append('level', formData.level);
      courseFormData.append('category', formData.category);
      courseFormData.append('price', formData.price.toString());
      courseFormData.append('status', formData.status);
      courseFormData.append('isPublic', formData.isPublic.toString());
      
      // Append tags as JSON string
      courseFormData.append('tags', JSON.stringify(formData.tags));
      
      // Append thumbnail file if available
      if (thumbnailFile) {
        courseFormData.append('thumbnail', thumbnailFile);
      } else if (formData.thumbnail) {
        courseFormData.append('thumbnailUrl', formData.thumbnail);
      }
      
      // Ensure headers are set correctly for multipart/form-data
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      };
      
      console.log('Submitting course data with thumbnail');
      
      // Use the simplified endpoint
      const response = await axios.post('/api/courses/simple', courseFormData, config);
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

  // Add function to get the full image URL
  const getFullImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return undefined;
    
    // If it's already a data URL (from preview), return as is
    if (imagePath.startsWith('data:')) {
      return imagePath;
    }
    
    // If it's a relative path, use it as is (the proxy will handle it)
    if (imagePath.startsWith('/')) {
      return imagePath;
    }
    
    return imagePath;
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
                onChange={handleSelectChange}
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
          
          {/* Replace the thumbnail TextField with file upload */}
          <Box sx={{ mt: 3, mb: 3, textAlign: 'center' }}>
            <Typography variant="subtitle1" gutterBottom>
              Course Thumbnail
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
              <Box
                sx={{
                  width: 200,
                  height: 120,
                  mx: 'auto',
                  mb: 1,
                  border: '1px dashed grey',
                  borderRadius: 1,
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
                  <Typography variant="body2" color="text.secondary">
                    Click to upload thumbnail
                  </Typography>
                )}
              </Box>
              <Button
                component="span"
                variant="outlined"
                size="small"
                disabled={loading}
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
          </Box>
          
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
                onChange={handleSelectChange}
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