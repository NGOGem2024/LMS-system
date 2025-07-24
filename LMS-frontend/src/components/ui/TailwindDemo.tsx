import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Divider,
  Alert,
  Chip,
  Badge,
  IconButton,
  CircularProgress
} from '../../utils/tailwindHelpers';
import { PlusIcon, TrashIcon, BookOpenIcon, VideoCameraIcon, EyeIcon } from '@heroicons/react/24/outline';

const TailwindDemo = () => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setShowAlert(true);
      
      // Hide alert after 3 seconds
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
    }, 1500);
  };
  
  return (
    <Container maxWidth="lg">
      <Typography variant="h3" align="center" className="mt-8 mb-6">
        Tailwind CSS Components
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper className="p-6 mb-6">
            <Typography variant="h5" className="mb-4">
              Form Elements
            </Typography>
            
            <form onSubmit={handleSubmit}>
              <TextField
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                fullWidth
                className="mb-4"
              />
              
              <TextField
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                type="email"
                required
                fullWidth
                className="mb-4"
              />
              
              <Box className="flex justify-end">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  className="mt-2"
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} className="mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit'
                  )}
                </Button>
              </Box>
            </form>
            
            {showAlert && (
              <Alert severity="success" className="mt-4">
                Form submitted successfully!
              </Alert>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper className="p-6 mb-6">
            <Typography variant="h5" className="mb-4">
              Buttons & Icons
            </Typography>
            
            <Box className="flex flex-wrap gap-2 mb-4">
              <Button variant="contained" color="primary">Primary</Button>
              <Button variant="contained" color="secondary">Secondary</Button>
              <Button variant="contained" color="error">Error</Button>
              <Button variant="contained" color="warning">Warning</Button>
              <Button variant="contained" color="success">Success</Button>
            </Box>
            
            <Box className="flex flex-wrap gap-2 mb-4">
              <Button variant="outlined" color="primary">Primary</Button>
              <Button variant="outlined" color="secondary">Secondary</Button>
              <Button variant="outlined" color="error">Error</Button>
            </Box>
            
            <Box className="flex flex-wrap gap-2 mb-4">
              <Button variant="text" color="primary">Primary</Button>
              <Button variant="text" color="secondary">Secondary</Button>
            </Box>
            
            <Divider className="my-4" />
            
            <Box className="flex flex-wrap gap-2">
              <IconButton color="primary">
                <PlusIcon className="w-5 h-5" />
              </IconButton>
              
              <IconButton color="error">
                <TrashIcon className="w-5 h-5" />
              </IconButton>
              
              <IconButton color="default">
                <EyeIcon className="w-5 h-5" />
              </IconButton>
              
              <Badge badgeContent={3} color="primary">
                <IconButton color="default">
                  <BookOpenIcon className="w-5 h-5" />
                </IconButton>
              </Badge>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper className="p-6 mb-6">
            <Typography variant="h5" className="mb-4">
              Cards & Chips
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardMedia
                    component="img"
                    image="https://source.unsplash.com/random/800x450?education"
                    alt="Course image"
                    height={200}
                  />
                  <CardContent>
                    <Typography variant="h6" className="mb-2">
                      Introduction to Tailwind CSS
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Learn how to build beautiful interfaces with Tailwind CSS, a utility-first CSS framework.
                    </Typography>
                    
                    <Box className="flex gap-1 mt-2">
                      <Chip label="Frontend" size="small" color="primary" />
                      <Chip label="CSS" size="small" color="secondary" />
                      <Chip label="Beginner" size="small" color="success" />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" color="primary">
                      Learn More
                    </Button>
                    <Button size="small" variant="outlined" color="primary">
                      Enroll
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardMedia
                    component="img"
                    image="https://source.unsplash.com/random/800x450?react"
                    alt="Course image"
                    height={200}
                  />
                  <CardContent>
                    <Typography variant="h6" className="mb-2">
                      React with Tailwind
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Build modern React applications with Tailwind CSS for rapid UI development.
                    </Typography>
                    
                    <Box className="flex gap-1 mt-2">
                      <Chip label="React" size="small" color="primary" />
                      <Chip label="Tailwind" size="small" color="secondary" />
                      <Chip label="Intermediate" size="small" color="warning" />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" color="primary">
                      Learn More
                    </Button>
                    <Button size="small" variant="outlined" color="primary">
                      Enroll
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardMedia
                    component="img"
                    image="https://source.unsplash.com/random/800x450?typescript"
                    alt="Course image"
                    height={200}
                  />
                  <CardContent>
                    <Typography variant="h6" className="mb-2">
                      TypeScript Fundamentals
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Master TypeScript to build type-safe applications with better developer experience.
                    </Typography>
                    
                    <Box className="flex gap-1 mt-2">
                      <Chip label="TypeScript" size="small" color="primary" />
                      <Chip label="JavaScript" size="small" color="secondary" />
                      <Chip label="Advanced" size="small" color="error" />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" color="primary">
                      Learn More
                    </Button>
                    <Button size="small" variant="outlined" color="primary">
                      Enroll
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TailwindDemo; 