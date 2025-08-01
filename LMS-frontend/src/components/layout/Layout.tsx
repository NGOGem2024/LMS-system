import { useState, useContext } from 'react'
import { Outlet, useNavigate, Link } from 'react-router-dom'
import { 
  Bars3Icon,
  HomeIcon,
  AcademicCapIcon,
  ClipboardDocumentIcon,
  UserIcon,
  Cog8ToothIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
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

const Layout = ({  }: LayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  
  const { user, logout, isAuthenticated } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleUserMenuToggle = () => {
    setUserMenuOpen(!userMenuOpen)
  }

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen)
  }

  const handleLogoutClick = () => {
    setUserMenuOpen(false)
    setShowLogoutConfirm(true)
  }

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false)
    logout()
  }

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false)
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

  const getActiveLinkClass = (path: string) => {
    const currentPath = window.location.pathname;
    return currentPath === path || currentPath.startsWith(path + "/") 
      ? "sidebar-nav-item active" 
      : "sidebar-nav-item";
  };

  // Helper function to get role badge color
  const getRoleBadgeColor = (role: string | undefined) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-red-500/10 text-red-400';
      case 'instructor':
        return 'bg-purple-500/10 text-purple-400';
      default:
        return 'bg-blue-500/10 text-blue-400';
    }
  };

  if (!isAuthenticated) {
    return <Outlet />
  }

  return (
    <>
      <div className="min-h-screen">
        {/* Mobile backdrop */}
        {drawerOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={handleDrawerToggle}
          ></div>
        )}
        
        {/* Sidebar - Mobile */}
        <div 
          className={`fixed inset-y-0 left-0 w-64 transform transition-transform duration-300 ease-in-out z-40 lg:hidden sidebar ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg transition-transform hover:scale-105">
              <AcademicCapIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold tracking-wide">LMS System</div>
              <div className="text-xs text-gray-400 font-medium">Learning Hub</div>
            </div>
          </div>
          
          <nav className="p-4 space-y-2">
            <button 
              onClick={() => handleNavigate('/')}
              className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                getActiveLinkClass('/') === 'sidebar-nav-item active'
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white font-semibold'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
              }`}
            >
              <HomeIcon className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            
            <button 
              onClick={() => handleNavigate('/courses')}
              className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                getActiveLinkClass('/courses') === 'sidebar-nav-item active'
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white font-semibold'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
              }`}
            >
              <AcademicCapIcon className="w-5 h-5" />
              <span>Curriculum</span>
            </button>
            
            <button 
              onClick={() => handleNavigate('/assignments')}
              className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                getActiveLinkClass('/assignments') === 'sidebar-nav-item active'
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white font-semibold'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
              }`}
            >
              <ClipboardDocumentIcon className="w-5 h-5" />
              <span>Assignments</span>
            </button>
            
            <button 
              onClick={() => handleNavigate('/profile')}
              className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                getActiveLinkClass('/profile') === 'sidebar-nav-item active'
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white font-semibold'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
              }`}
            >
              <UserIcon className="w-5 h-5" />
              <span>Profile</span>
            </button>
            
            {isAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <div className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Admin
                  </div>
                </div>
                
                <button 
                  onClick={() => handleNavigate('/admin')}
                  className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                    getActiveLinkClass('/admin') === 'sidebar-nav-item active'
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white font-semibold'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
                  }`}
                >
                  <Cog8ToothIcon className="w-5 h-5" />
                  <span>Admin Dashboard</span>
                </button>
                
                <button 
                  onClick={() => handleNavigate('/admin/users')}
                  className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                    getActiveLinkClass('/admin/users') === 'sidebar-nav-item active'
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white font-semibold'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
                  }`}
                >
                  <UserGroupIcon className="w-5 h-5" />
                  <span>User Management</span>
                </button>
                
                <button 
                  onClick={() => handleNavigate('/admin/courses')}
                  className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                    getActiveLinkClass('/admin/courses') === 'sidebar-nav-item active'
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white font-semibold'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
                  }`}
                >
                  <AcademicCapIcon className="w-5 h-5" />
                  <span>Course Management</span>
                </button>
              </>
            )}
          </nav>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                {user?.profile?.avatar ? (
                  <img 
                    src={getFullImageUrl(user.profile.avatar)} 
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>{user?.name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{user?.name}</div>
                <div className="text-xs text-gray-400 capitalize truncate">{user?.role}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar - Desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col lg:w-64 sidebar">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg transition-transform hover:scale-105">
              <AcademicCapIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold tracking-wide">LMS System</div>
              <div className="text-xs text-gray-400 font-medium">Learning Hub</div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <button 
              onClick={() => handleNavigate('/')}
              className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                getActiveLinkClass('/') === 'sidebar-nav-item active'
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white font-semibold'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
              }`}
            >
              <HomeIcon className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            
            <button 
              onClick={() => handleNavigate('/courses')}
              className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                getActiveLinkClass('/courses') === 'sidebar-nav-item active'
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white font-semibold'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
              }`}
            >
              <AcademicCapIcon className="w-5 h-5" />
              <span>Curriculum</span>
            </button>
            
            <button 
              onClick={() => handleNavigate('/assignments')}
              className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                getActiveLinkClass('/assignments') === 'sidebar-nav-item active'
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white font-semibold'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
              }`}
            >
              <ClipboardDocumentIcon className="w-5 h-5" />
              <span>Assignments</span>
            </button>
            
            <button 
              onClick={() => handleNavigate('/profile')}
              className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                getActiveLinkClass('/profile') === 'sidebar-nav-item active'
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white font-semibold'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
              }`}
            >
              <UserIcon className="w-5 h-5" />
              <span>Profile</span>
            </button>
            
            {isAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <div className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Admin
                  </div>
                </div>
                
                <button 
                  onClick={() => handleNavigate('/admin')}
                  className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                    getActiveLinkClass('/admin') === 'sidebar-nav-item active'
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white font-semibold'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
                  }`}
                >
                  <Cog8ToothIcon className="w-5 h-5" />
                  <span>Admin Dashboard</span>
                </button>
                
                <button 
                  onClick={() => handleNavigate('/admin/users')}
                  className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                    getActiveLinkClass('/admin/users') === 'sidebar-nav-item active'
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white font-semibold'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
                  }`}
                >
                  <UserGroupIcon className="w-5 h-5" />
                  <span>User Management</span>
                </button>
                
                <button 
                  onClick={() => handleNavigate('/admin/courses')}
                  className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                    getActiveLinkClass('/admin/courses') === 'sidebar-nav-item active'
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white font-semibold'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
                  }`}
                >
                  <AcademicCapIcon className="w-5 h-5" />
                  <span>Course Management</span>
                </button>
              </>
            )}
          </nav>
          
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                {user?.profile?.avatar ? (
                  <img 
                    src={getFullImageUrl(user.profile.avatar)} 
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>{user?.name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{user?.name}</div>
                <div className="text-xs text-gray-400 capitalize truncate">{user?.role}</div>
              </div>
              {/* Dark mode toggle hidden for now */}
              {/* <button 
                onClick={toggleDarkMode}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button> */}
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="lg:pl-64">
          {/* Top navigation */}
          <header className="sticky top-0 z-20 backdrop-blur-sm border-b border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleDrawerToggle}
                  className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-lg"
                >
                  <Bars3Icon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Dark mode toggle hidden for now */}
                {/* <button 
                  onClick={toggleDarkMode}
                  className="p-2 text-gray-400 hover:text-white transition-all hover:bg-white/5 rounded-lg hidden lg:block"
                  aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                </button> */}
                
                <div className="relative">
                  <button
                    onClick={handleUserMenuToggle}
                    className="group w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium ring-0 ring-blue-500/30 transition-all hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105 focus:ring-4 cursor-pointer"
                  >
                    {user?.profile?.avatar ? (
                      <img 
                        src={getFullImageUrl(user.profile.avatar)} 
                        alt={user.name}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-sm">{user?.name?.charAt(0) || 'U'}</span>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#1e2736] rounded-full"></span>
                  </button>
                  
                  {userMenuOpen && (
                    <>
                      {/* Backdrop for closing dropdown */}
                      <div 
                        className="fixed inset-0 z-40 cursor-pointer"
                        onClick={() => setUserMenuOpen(false)}
                      ></div>
                      
                      {/* Dropdown menu */}
                      <div className="absolute right-0 mt-2 w-72 bg-[#1e2736] rounded-lg shadow-xl shadow-black/40 border border-white/10 overflow-hidden z-50">
                        <div className="p-4 border-b border-white/10">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                              {user?.profile?.avatar ? (
                                <img 
                                  src={getFullImageUrl(user.profile.avatar)} 
                                  alt={user.name}
                                  className="w-full h-full rounded-lg object-cover"
                                />
                              ) : (
                                <span className="text-base">{user?.name?.charAt(0) || 'U'}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white truncate">{user?.name}</div>
                              <div className="text-sm text-gray-400 truncate mb-2">{user?.email}</div>
                              <div className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${getRoleBadgeColor(user?.role)}`}>
                                {user?.role || 'Student'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-2">
                          <button
                            onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                            className="flex items-center w-full gap-3 px-3 py-2 text-sm text-gray-400 rounded-md hover:bg-white/5 hover:text-white transition-colors group cursor-pointer"
                          >
                            <UserIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                            <span>View Profile</span>
                          </button>
                          
                          <button
                            onClick={handleLogoutClick}
                            className="flex items-center w-full gap-3 px-3 py-2 text-sm text-gray-400 rounded-md hover:bg-white/5 hover:text-white transition-colors group cursor-pointer"
                          >
                            <ArrowRightOnRectangleIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                </div>
              </div>
            </div>
          </header>
          
          {/* Page content */}
          <main className="min-h-screen">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Logout Confirmation Modal - Moved outside main layout */}
      {showLogoutConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer" 
          style={{ zIndex: 9999 }}
          onClick={handleLogoutCancel}
        >
          <div 
            className="relative bg-[#1e2736] rounded-lg shadow-xl w-full max-w-sm mx-auto border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Sign Out</h3>
                <button 
                  onClick={handleLogoutCancel}
                  className="text-gray-400 hover:text-white transition-colors rounded-lg p-1 hover:bg-white/5 cursor-pointer"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-300 mb-4">
                Are you sure you want to sign out?
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={handleLogoutCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Layout 