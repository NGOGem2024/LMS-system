import { useState, useContext } from 'react'
import { Outlet, useNavigate, Link } from 'react-router-dom'
import { 
  AppBar, 
  Box, 
  Toolbar, 
  IconButton, 
  Typography, 
  Menu, 
  MenuItem, 
  Container, 
  Avatar, 
  Button, 
  Tooltip, 
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material'
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon
} from '@mui/icons-material'
import AuthContext from '../../context/AuthContext'

// Define interface for User with profile
interface User {
  _id: string
  name: string
  email: string
  role: string
  tenantId: string
  profile?: {
    avatar?: string
    bio?: string
  }
}

interface LayoutProps {
  toggleDarkMode: () => void
  darkMode: boolean
}

const Layout = ({ toggleDarkMode, darkMode }: LayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null)
  
  const { user, logout, isAuthenticated } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget)
  }

  const handleCloseUserMenu = () => {
    setAnchorElUser(null)
  }

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen)
  }

  const handleLogout = () => {
    logout()
    handleCloseUserMenu()
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    setDrawerOpen(false)
  }

  // Add a function to get the full image URL
  const getFullImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return undefined;
    
    // If it's already a data URL (from preview), return as is
    if (imagePath.startsWith('data:')) {
      return imagePath;
    }
    
    // If it's a relative path, prepend the base URL
    if (imagePath.startsWith('/')) {
      return `${window.location.origin}${imagePath}`;
    }
    
    return imagePath;
  };

  const isAdmin = user?.role === 'admin'

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <List>
        <ListItem sx={{ py: 2 }}>
          <Typography variant="h6" component="div">
            LMS System
          </Typography>
        </ListItem>
        <Divider />
        <ListItem button onClick={() => handleNavigate('/')}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button onClick={() => handleNavigate('/courses')}>
          <ListItemIcon>
            <SchoolIcon />
          </ListItemIcon>
          <ListItemText primary="Courses" />
        </ListItem>
        <ListItem button onClick={() => handleNavigate('/assignments')}>
          <ListItemIcon>
            <AssignmentIcon />
          </ListItemIcon>
          <ListItemText primary="Resources" />
        </ListItem>
        <ListItem button onClick={() => handleNavigate('/profile')}>
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItem>
        {isAdmin && (
          <>
            <Divider />
            <ListItem button onClick={() => handleNavigate('/admin')}>
              <ListItemIcon>
                <AdminIcon />
              </ListItemIcon>
              <ListItemText primary="Admin Dashboard" />
            </ListItem>
            <ListItem button onClick={() => handleNavigate('/admin/users')}>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="User Management" />
            </ListItem>
            <ListItem button onClick={() => handleNavigate('/admin/courses')}>
              <ListItemIcon>
                <SchoolIcon />
              </ListItemIcon>
              <ListItemText primary="Course Management" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  )

  if (!isAuthenticated) {
    return <Outlet />
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontWeight: 700,
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              LMS
            </Typography>

            <Box sx={{ flexGrow: 1 }} />

            <IconButton onClick={toggleDarkMode} color="inherit">
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>

            <Box sx={{ flexGrow: 0, ml: 2 }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar 
                    alt={user?.name || 'User'} 
                    src={getFullImageUrl(user?.profile?.avatar)}
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/profile'); }}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography textAlign="center">Profile</Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography textAlign="center">Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
      >
        {drawer}
      </Drawer>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          mt: '64px'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

export default Layout 