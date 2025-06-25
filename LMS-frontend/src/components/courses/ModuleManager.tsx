import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  Paper
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material'
import axios from 'axios'

interface Module {
  _id: string;
  title: string;
  description: string;
  order: number;
  duration: number;
  status: 'draft' | 'published' | 'archived';
}

interface ModuleFormData {
  title: string;
  description: string;
  duration: number;
  status: 'draft' | 'published' | 'archived';
}

interface ModuleManagerProps {
  courseId: string;
}

const ModuleManager = ({ courseId }: ModuleManagerProps) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ModuleFormData>({
    title: '',
    description: '',
    duration: 0,
    status: 'draft'
  });

  useEffect(() => {
    fetchModules();
  }, [courseId]);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/courses/${courseId}/modules`);
      setModules(res.data);
    } catch (err) {
      console.error('Error fetching modules:', err);
      setError('Failed to load modules. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (module?: Module) => {
    if (module) {
      setEditingModuleId(module._id);
      setFormData({
        title: module.title,
        description: module.description,
        duration: module.duration,
        status: module.status
      });
    } else {
      setEditingModuleId(null);
      setFormData({
        title: '',
        description: '',
        duration: 0,
        status: 'draft'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingModuleId(null);
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

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (editingModuleId) {
        // Update existing module
        await axios.put(`/api/modules/${editingModuleId}`, formData);
        setSuccess('Module updated successfully!');
      } else {
        // Create new module
        await axios.post(`/api/courses/${courseId}/modules`, formData);
        setSuccess('Module created successfully!');
      }
      
      // Refresh modules list
      fetchModules();
      handleCloseDialog();
      
      // Clear success message after a delay
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error saving module:', err);
      
      if (err.response) {
        setError(err.response.data?.error || 'Failed to save module. Please try again.');
      } else if (err.request) {
        setError('No response received from server. Please check your connection and try again.');
      } else {
        setError('An error occurred while saving the module. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      await axios.delete(`/api/modules/${moduleId}`);
      setSuccess('Module deleted successfully!');
      
      // Refresh modules list
      fetchModules();
      
      // Clear success message after a delay
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error deleting module:', err);
      
      if (err.response) {
        setError(err.response.data?.error || 'Failed to delete module. Please try again.');
      } else if (err.request) {
        setError('No response received from server. Please check your connection and try again.');
      } else {
        setError('An error occurred while deleting the module. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Course Modules</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          Add Module
        </Button>
      </Box>
      
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
      
      {loading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />}
      
      {modules.length === 0 && !loading ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
          No modules found. Add your first module to organize your course content.
        </Typography>
      ) : (
        <List>
          {modules
            .sort((a, b) => a.order - b.order)
            .map((module, index) => (
              <Box key={module._id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <DragIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  <ListItemText
                    primary={module.title}
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          {module.description.substring(0, 100)}
                          {module.description.length > 100 ? '...' : ''}
                        </Typography>
                        <Box sx={{ display: 'flex', mt: 1 }}>
                          <Typography variant="caption" sx={{ mr: 2 }}>
                            Duration: {module.duration} min
                          </Typography>
                          <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                            Status: {module.status}
                          </Typography>
                        </Box>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleOpenDialog(module)} sx={{ mr: 1 }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDeleteModule(module._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </Box>
            ))}
        </List>
      )}
      
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingModuleId ? 'Edit Module' : 'Add Module'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            id="title"
            name="title"
            label="Module Title"
            type="text"
            fullWidth
            required
            value={formData.title}
            onChange={handleChange}
            disabled={loading}
          />
          
          <TextField
            margin="dense"
            id="description"
            name="description"
            label="Description"
            multiline
            rows={4}
            fullWidth
            required
            value={formData.description}
            onChange={handleChange}
            disabled={loading}
          />
          
          <TextField
            margin="dense"
            id="duration"
            name="duration"
            label="Duration (minutes)"
            type="number"
            fullWidth
            value={formData.duration}
            onChange={handleChange}
            disabled={loading}
            inputProps={{ min: 0 }}
          />
          
          <FormControl fullWidth margin="dense">
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || !formData.title || !formData.description}
          >
            {loading ? <CircularProgress size={24} /> : (editingModuleId ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ModuleManager; 