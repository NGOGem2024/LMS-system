import { useState, useContext } from 'react'
import { Outlet, useNavigate, Link } from 'react-router-dom'
import { 
  Bars3Icon,
  MoonIcon,
  SunIcon,
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
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  
  const { user, logout, isAuthenticated } = useContext(AuthContext)
  const navigate = useNavigate()

  // Theme-aware styling
  const themeClasses = {
    bg: darkMode ? 'bg-[#0f172a]' : 'bg-gray-50',
    sidebarBg: darkMode ? 'bg-[#1e2736]' : 'bg-white',
    border: darkMode ? 'border-white/10' : 'border-gray-200',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textSecondary: darkMode ? 'text-gray-400' : 'text-gray-500',
    hoverBg: darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100',
    activeLink: darkMode 
      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white font-semibold' 
      : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-gray-900 font-semibold',
    inactiveLink: darkMode 
      ? 'text-gray-400 hover:bg-white/5 hover:text-white font-medium' 
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium',
    modalBg: darkMode ? 'bg-[#1e2736]' : 'bg-white',
    buttonText: darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
  }

  const handleUserMenuToggle = () => setUserMenuOpen(!userMenuOpen)
  const handleDrawerToggle = () => setDrawerOpen(!drawerOpen)
  const handleLogoutClick = () => {
    setUserMenuOpen(false)
    setShowLogoutConfirm(true)
  }
  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false)
    logout()
  }
  const handleLogoutCancel = () => setShowLogoutConfirm(false)

  const handleNavigate = (path: string) => {
    navigate(path)
    setDrawerOpen(false)
  }

  const getFullImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return undefined
    if (imagePath.startsWith('data:')) return imagePath
    if (imagePath.startsWith('/')) return `${window.location.origin}${imagePath}`
    return imagePath
  }

  const isAdmin = user?.role === 'admin'

  const getActiveLinkClass = (path: string) => {
    const currentPath = window.location.pathname
    return currentPath === path || currentPath.startsWith(path + "/") 
      ? themeClasses.activeLink 
      : themeClasses.inactiveLink
  }

  const getRoleBadgeColor = (role: string | undefined) => {
    switch (role?.toLowerCase()) {
      case 'admin': return darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-800'
      case 'instructor': return darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-800'
      default: return darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-800'
    }
  }

  if (!isAuthenticated) return <Outlet />

  return (
    <>
      <div className={`min-h-screen ${themeClasses.bg}`}>
        {/* Mobile backdrop */}
        {drawerOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={handleDrawerToggle}
          />
        )}
        
        {/* Sidebar - Mobile */}
        <div 
          className={`fixed inset-y-0 left-0 w-64 ${themeClasses.sidebarBg} transform transition-transform duration-300 ease-in-out z-40 lg:hidden ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className={`flex items-center gap-3 px-4 py-3 border-b ${themeClasses.border}`}>
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg transition-transform hover:scale-105">
              <AcademicCapIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className={`${themeClasses.text} font-bold tracking-wide`}>LMS System</div>
              <div className={`text-xs ${themeClasses.textSecondary} font-medium`}>Learning Hub</div>
            </div>
          </div>
          
          <nav className="p-4 space-y-2">
            <button 
              onClick={() => handleNavigate('/')}
              className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${getActiveLinkClass('/')}`}
            >
              <HomeIcon className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            
            <button 
              onClick={() => handleNavigate('/coursestest')}
              className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${getActiveLinkClass('/courses')}`}
            >
              <AcademicCapIcon className="w-5 h-5" />
              <span>Courses</span>
            </button>
            
            <button 
              onClick={() => handleNavigate('/assignments')}
              className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${getActiveLinkClass('/assignments')}`}
            >
              <ClipboardDocumentIcon className="w-5 h-5" />
              <span>Assignments</span>
            </button>
            
            <button 
              onClick={() => handleNavigate('/profile')}
              className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${getActiveLinkClass('/profile')}`}
            >
              <UserIcon className="w-5 h-5" />
              <span>Profile</span>
            </button>
            
            {isAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <div className={`px-3 text-xs font-bold ${themeClasses.textSecondary} uppercase tracking-wider`}>
                    Admin
                  </div>
                </div>
                
                <button 
                  onClick={() => handleNavigate('/admin')}
                  className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${getActiveLinkClass('/admin')}`}
                >
                  <Cog8ToothIcon className="w-5 h-5" />
                  <span>Admin Dashboard</span>
                </button>
                
                <button 
                  onClick={() => handleNavigate('/admin/users')}
                  className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${getActiveLinkClass('/admin/users')}`}
                >
                  <UserGroupIcon className="w-5 h-5" />
                  <span>User Management</span>
                </button>
                
                <button 
                  onClick={() => handleNavigate('/admin/courses')}
                  className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${getActiveLinkClass('/admin/courses')}`}
                >
                  <AcademicCapIcon className="w-5 h-5" />
                  <span>Course Management</span>
                </button>
              </>
            )}
          </nav>
          
          <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${themeClasses.border}`}>
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
                <div className={`text-sm font-medium ${themeClasses.text} truncate`}>{user?.name}</div>
                <div className={`text-xs ${themeClasses.textSecondary} capitalize truncate`}>{user?.role}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar - Desktop */}
        <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col lg:w-64 ${themeClasses.sidebarBg} border-r ${themeClasses.border}`}>
          <div className={`flex items-center gap-3 px-4 py-3 border-b ${themeClasses.border}`}>
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg transition-transform hover:scale-105">
              <AcademicCapIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className={`${themeClasses.text} font-bold tracking-wide`}>LMS System</div>
              <div className={`text-xs ${themeClasses.textSecondary} font-medium`}>Learning Hub</div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <button 
              onClick={() => handleNavigate('/')}
              className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${getActiveLinkClass('/')}`}
            >
              <HomeIcon className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            
            <button 
              onClick={() => handleNavigate('/coursestest')}
              className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${getActiveLinkClass('/courses')}`}
            >
              <AcademicCapIcon className="w-5 h-5" />
              <span>Course Management</span>
            </button>
            
            <button 
              onClick={() => handleNavigate('/assignments')}
              className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${getActiveLinkClass('/assignments')}`}
            >
              <ClipboardDocumentIcon className="w-5 h-5" />
              <span>Knowledge check</span>
            </button>
            
            <button 
              onClick={() => handleNavigate('/admin/users')}
              className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${getActiveLinkClass('/admin/users')}`}
            >
              <UserGroupIcon className="w-5 h-5" />
              <span>User Management</span>
            </button>
            
            <button 
              onClick={() => handleNavigate('/profile')}
              className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${getActiveLinkClass('/profile')}`}
            >
              <UserIcon className="w-5 h-5" />
              <span>Profile</span>
            </button>
          </nav>
          
          <div className={`p-4 border-t ${themeClasses.border}`}>
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
                <div className={`text-sm font-medium ${themeClasses.text} truncate`}>{user?.name}</div>
                <div className={`text-xs ${themeClasses.textSecondary} capitalize truncate`}>{user?.role}</div>
              </div>
              <button 
                onClick={toggleDarkMode}
                className={`p-2 ${themeClasses.buttonText} transition-colors`}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="lg:pl-64">
          {/* Top navigation */}
          <header className={`sticky top-0 z-20 ${darkMode ? 'bg-[#1e2736]/80' : 'bg-white/80'} backdrop-blur-sm border-b ${themeClasses.border}`}>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleDrawerToggle}
                  className={`lg:hidden p-2 ${themeClasses.buttonText} transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'} rounded-lg`}
                >
                  <Bars3Icon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={toggleDarkMode}
                  className={`p-2 ${themeClasses.buttonText} transition-all ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'} rounded-lg hidden lg:block`}
                  aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                </button>
                
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
                    <span className={`absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 ${darkMode ? 'border-[#1e2736]' : 'border-white'} rounded-full`} />
                  </button>
                  
                  {userMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40 cursor-pointer"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      
                      <div className={`absolute right-0 mt-2 w-72 ${themeClasses.modalBg} rounded-lg shadow-xl ${darkMode ? 'shadow-black/40' : 'shadow-black/10'} border ${themeClasses.border} overflow-hidden z-50`}>
                        <div className={`p-4 border-b ${themeClasses.border}`}>
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
                              <div className={`font-medium ${themeClasses.text} truncate`}>{user?.name}</div>
                              <div className={`text-sm ${themeClasses.textSecondary} truncate mb-2`}>{user?.email}</div>
                              <div className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${getRoleBadgeColor(user?.role)}`}>
                                {user?.role || 'Student'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-2">
                          <button
                            onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                            className={`flex items-center w-full gap-3 px-3 py-2 text-sm ${themeClasses.textSecondary} rounded-md ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'} hover:${themeClasses.text} transition-colors group cursor-pointer`}
                          >
                            <UserIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                            <span>View Profile</span>
                          </button>
                          
                          <button
                            onClick={handleLogoutClick}
                            className={`flex items-center w-full gap-3 px-3 py-2 text-sm ${themeClasses.textSecondary} rounded-md ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'} hover:${themeClasses.text} transition-colors group cursor-pointer`}
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
          <main className={`min-h-screen ${themeClasses.bg}`}>
            <Outlet />
          </main>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer" 
          style={{ zIndex: 9999 }}
          onClick={handleLogoutCancel}
        >
          <div 
            className={`relative ${themeClasses.modalBg} rounded-lg shadow-xl w-full max-w-sm mx-auto border ${themeClasses.border}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${themeClasses.text}`}>Sign Out</h3>
                <button 
                  onClick={handleLogoutCancel}
                  className={`${themeClasses.buttonText} transition-colors rounded-lg p-1 ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'} cursor-pointer`}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <p className={`${themeClasses.textSecondary} mb-4`}>
                Are you sure you want to sign out?
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={handleLogoutCancel}
                  className={`px-4 py-2 text-sm font-medium ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors rounded-lg ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'} cursor-pointer`}
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