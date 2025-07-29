import { useState, useEffect, useContext } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  AcademicCapIcon,
  ClipboardDocumentIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  PlayCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import axios from 'axios'
import AuthContext from '../../context/AuthContext'

interface Subject {
  _id: string
  name: string
  description: string
  progress?: number
  imageUrl?: string
}

interface ProgressStats {
  totalSubjects: number
  completedSubjects: number
  inProgressSubjects: number
  totalAssignments: number
  completedAssignments: number
  pendingAssignments: number
  overallProgress: number
}

interface Assignment {
  _id: string
  title: string
  dueDate: string
  subject?: {
    _id: string
    name: string
  }
  status?: string
}

interface SubjectsResponse {
  subjects: Subject[]
  totalRecords: number
}

interface AssignmentsResponse {
  assignments: Assignment[]
  totalRecords: number
}

const Dashboard = ({ darkMode }: { darkMode: boolean }) =>{
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [progressStats, setProgressStats] = useState<ProgressStats>({
    totalSubjects: 10,
    completedSubjects: 4,
    inProgressSubjects: 3,
    totalAssignments: 10,
    completedAssignments: 5,
    pendingAssignments: 5,
    overallProgress: 80
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useContext(AuthContext)

  // Theme-aware styling - Fixed to match Layout component
  const themeClasses = {
    bg: darkMode ? 'bg-[#0f172a]' : 'bg-gray-50',
    cardBg: darkMode ? 'bg-[#1e2736]' : 'bg-white',
    border: darkMode ? 'border-white/10' : 'border-gray-200',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textSecondary: darkMode ? 'text-gray-400' : 'text-gray-500',
    hoverBg: darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100',
    gradientBorder: darkMode ? 'border-white/5' : 'border-gray-200',
    buttonText: darkMode ? 'text-white' : 'text-gray-900',
    skeletonBg: darkMode ? 'bg-white/10' : 'bg-gray-200'
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Fetch enrolled subjects
        const subjectsRes = await axios.get<SubjectsResponse>('/api/curriculum/subjects')
        setSubjects(subjectsRes.data.subjects?.slice(0, 3) || [])
        
        // Fetch upcoming assignments
        const assignmentsRes = await axios.get<AssignmentsResponse>('/api/assignments/upcoming')
        setAssignments(assignmentsRes.data.assignments ? assignmentsRes.data.assignments.slice(0, 5) : [])
        
        let statsData = null
        
        try {
          const statsRes = await axios.get('/api/progress/stats')
          statsData = statsRes.data
          
          setProgressStats({
            totalSubjects: statsData.totalSubjects || 0,
            completedSubjects: statsData.completedSubjects || 0,
            inProgressSubjects: statsData.inProgressSubjects || 0,
            totalAssignments: statsData.totalAssignments || 0,
            completedAssignments: statsData.completedAssignments || 0,
            pendingAssignments: statsData.pendingAssignments || 0,
            overallProgress: statsData.overallProgress || 0
          })
        } catch (statsErr) {
          console.error('Failed to fetch progress stats:', statsErr)
          const allSubjects = subjectsRes.data.subjects || []
          const upcomingAssignments = assignmentsRes.data.assignments || []
          const completedSubjects = allSubjects.filter((s: Subject) => s.progress === 100).length
          const inProgressSubjects = allSubjects.filter((s: Subject) => s.progress && s.progress > 0 && s.progress < 100).length
          const totalAssignments = upcomingAssignments.length
          const completedAssignments = upcomingAssignments.filter((a: Assignment) => a.status === 'completed').length
          
          setProgressStats({
            totalSubjects: allSubjects.length,
            completedSubjects,
            inProgressSubjects,
            totalAssignments,
            completedAssignments,
            pendingAssignments: totalAssignments - completedAssignments,
            overallProgress: allSubjects.length > 0 
              ? allSubjects.reduce((sum: number, subject: Subject) => sum + (subject.progress || 0), 0) / allSubjects.length
              : 0
          })
        }
      } catch (err: any) {
        console.error('Dashboard data fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className={`min-h-screen ${themeClasses.bg}`}>
        <div className="container mx-auto px-6 py-8">
          <div className={`${themeClasses.cardBg} rounded-lg p-8 mb-6 animate-pulse border ${themeClasses.border}`}>
            <div className={`h-8 w-2/3 ${themeClasses.skeletonBg} rounded-lg mb-3`}></div>
            <div className={`h-4 w-1/2 ${themeClasses.skeletonBg} rounded-lg`}></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className={`${themeClasses.cardBg} rounded-lg p-6 animate-pulse border ${themeClasses.border}`}>
                <div className={`h-10 ${themeClasses.skeletonBg} rounded-lg w-1/2 mx-auto mb-2`}></div>
                <div className={`h-4 ${themeClasses.skeletonBg} rounded-lg w-2/3 mx-auto`}></div>
              </div>
            ))}
          </div>
          
          <div className={`${themeClasses.cardBg} rounded-lg p-6 mb-6 animate-pulse border ${themeClasses.border}`}>
            <div className={`h-6 ${themeClasses.skeletonBg} rounded-lg w-1/4 mb-4`}></div>
            <div className={`h-4 ${themeClasses.skeletonBg} rounded-lg w-full mb-2`}></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((item) => (
              <div key={item} className={`${themeClasses.cardBg} rounded-lg p-6 animate-pulse min-h-[250px] border ${themeClasses.border}`}>
                <div className={`h-6 ${themeClasses.skeletonBg} rounded-lg w-1/3 mb-4`}></div>
                <div className={`h-24 ${themeClasses.skeletonBg} rounded-lg w-full mb-2`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${themeClasses.bg}`}>
      <div className="container mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className={`bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg p-6 mb-6 relative overflow-hidden group transition-all hover:shadow-lg ${darkMode ? 'hover:shadow-blue-500/10' : 'hover:shadow-blue-500/20'}`}>
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[gradient_8s_linear_infinite]"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
                Welcome back, {user?.name}!
              </h1>
            </div>
            <div className="hidden md:block">
              <RouterLink 
                to="/coursestest" 
                className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all group-hover:translate-x-1"
              >
                Browse Courses
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </RouterLink>
            </div>
          </div>
        </div>
        
        {error && (
          <div className={`bg-red-500/10 border ${darkMode ? 'border-red-500/20' : 'border-red-500/30'} text-red-500 rounded-lg p-4 mb-6`}>
            {error}
          </div>
        )}
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Courses Card */}
          <div className={`group ${darkMode ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10' : 'bg-blue-50'} backdrop-blur-sm rounded-lg p-6 border ${themeClasses.border} transition-all ${darkMode ? 'hover:border-blue-500/20' : 'hover:border-blue-500/30'}`}>
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 ${darkMode ? 'bg-blue-500/10' : 'bg-blue-100'} rounded-lg transition-transform group-hover:scale-110`}>
                <AcademicCapIcon className={`w-6 h-6 ${darkMode ? 'text-blue-500' : 'text-blue-600'}`} />
              </div>
              <span className={`text-xs font-medium ${darkMode ? 'text-blue-400 bg-blue-500/10' : 'text-blue-600 bg-blue-100'} px-2 py-1 rounded-full`}>Total</span>
            </div>
            <div className="mt-4">
              <div className={`text-4xl font-bold ${themeClasses.text} mb-2 transition-all group-hover:scale-105 group-hover:translate-x-1`}>{progressStats.totalSubjects}</div>
              <div className={`text-sm ${darkMode ? 'text-blue-200/60' : 'text-blue-600/80'} font-medium uppercase tracking-wide`}>Courses</div>
            </div>
          </div>
          
          {/* Progress Card */}
          <div className={`group ${darkMode ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10' : 'bg-purple-50'} backdrop-blur-sm rounded-lg p-6 border ${themeClasses.border} transition-all ${darkMode ? 'hover:border-purple-500/20' : 'hover:border-purple-500/30'}`}>
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 ${darkMode ? 'bg-purple-500/10' : 'bg-purple-100'} rounded-lg transition-transform group-hover:scale-110`}>
                <ChartBarIcon className={`w-6 h-6 ${darkMode ? 'text-purple-500' : 'text-purple-600'}`} />
              </div>
              <span className={`text-xs font-medium ${darkMode ? 'text-purple-400 bg-purple-500/10' : 'text-purple-600 bg-purple-100'} px-2 py-1 rounded-full`}>Progress</span>
            </div>
            <div className="mt-4">
              <div className={`text-4xl font-bold ${themeClasses.text} mb-2 transition-all group-hover:scale-105 group-hover:translate-x-1`}>{progressStats.overallProgress.toFixed(0)}%</div>
              <div className={`text-sm ${darkMode ? 'text-purple-200/60' : 'text-purple-600/80'} font-medium uppercase tracking-wide`}>Overall Completion</div>
            </div>
          </div>
          
          {/* Assignments Card */}
          <div className={`group ${darkMode ? 'bg-gradient-to-br from-indigo-500/10 to-blue-500/10' : 'bg-indigo-50'} backdrop-blur-sm rounded-lg p-6 border ${themeClasses.border} transition-all ${darkMode ? 'hover:border-indigo-500/20' : 'hover:border-indigo-500/30'}`}>
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-100'} rounded-lg transition-transform group-hover:scale-110`}>
                <ClipboardDocumentIcon className={`w-6 h-6 ${darkMode ? 'text-indigo-500' : 'text-indigo-600'}`} />
              </div>
              <span className={`text-xs font-medium ${darkMode ? 'text-indigo-400 bg-indigo-500/10' : 'text-indigo-600 bg-indigo-100'} px-2 py-1 rounded-full`}>Total</span>
            </div>
            <div className="mt-4">
              <div className={`text-4xl font-bold ${themeClasses.text} mb-2 transition-all group-hover:scale-105 group-hover:translate-x-1`}>{progressStats.totalAssignments}</div>
              <div className={`text-sm ${darkMode ? 'text-indigo-200/60' : 'text-indigo-600/80'} font-medium uppercase tracking-wide`}>Knowledge Check</div>
            </div>
          </div>
          
          {/* Completed Card */}
          <div className={`group ${darkMode ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10' : 'bg-green-50'} backdrop-blur-sm rounded-lg p-6 border ${themeClasses.border} transition-all ${darkMode ? 'hover:border-green-500/20' : 'hover:border-green-500/30'}`}>
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 ${darkMode ? 'bg-green-500/10' : 'bg-green-100'} rounded-lg transition-transform group-hover:scale-110`}>
                <CheckCircleIcon className={`w-6 h-6 ${darkMode ? 'text-green-500' : 'text-green-600'}`} />
              </div>
              <span className={`text-xs font-medium ${darkMode ? 'text-green-400 bg-green-500/10' : 'text-green-600 bg-green-100'} px-2 py-1 rounded-full`}>Completed</span>
            </div>
            <div className="mt-4">
              <div className={`text-4xl font-bold ${themeClasses.text} mb-2 transition-all group-hover:scale-105 group-hover:translate-x-1`}>{progressStats.completedSubjects}</div>
              <div className={`text-sm ${darkMode ? 'text-green-200/60' : 'text-green-600/80'} font-medium uppercase tracking-wide`}>Courses Finished</div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Recent Subjects */}
          <div className={`${themeClasses.cardBg} rounded-lg p-6 border ${themeClasses.border}`}>
            <div className="flex items-center gap-2 mb-6">
              <AcademicCapIcon className={`w-5 h-5 ${darkMode ? 'text-blue-500' : 'text-blue-600'}`} />
              <h3 className={`${themeClasses.text} font-semibold`}>Recent Courses</h3>
            </div>
            
            <div>
              {subjects.length > 0 ? (
                <div className="space-y-4">
                  {subjects.map((subject) => (
                    <div key={subject._id} className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-lg overflow-hidden border ${themeClasses.border}`}>
                      <div className="p-4">
                        <h3 className={`text-lg font-semibold ${themeClasses.text} mb-1`}>
                          {subject.name}
                        </h3>
                        <p className={`text-sm ${themeClasses.textSecondary} mb-3 line-clamp-2`}>
                          {subject.description}
                        </p>
                        {subject.progress !== undefined && (
                          <div className="flex items-center gap-2">
                            <div className={`flex-1 h-1.5 ${darkMode ? 'bg-white/10' : 'bg-gray-200'} rounded-full`}>
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${subject.progress}%` }}
                              ></div>
                            </div>
                            <span className={`text-xs font-medium ${themeClasses.text}`}>
                              {Math.round(subject.progress)}%
                            </span>
                          </div>
                        )}
                      </div>
                      <div className={`border-t ${themeClasses.border} px-4 py-2`}>
                        <RouterLink 
                          to={`/curriculum/subjects/${subject._id}`}
                          className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} inline-flex items-center`}
                        >
                          Continue Learning
                          <ArrowRightIcon className="w-3 h-3 ml-1" />
                        </RouterLink>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <RouterLink 
                    to="/coursestest" 
                    className={`inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 transition-all`}
                  >
                    Browse Courses
                  </RouterLink>
                </div>
              )}
            </div>
          </div>
          
          {/* Upcoming Assignments */}
          <div className={`${themeClasses.cardBg} rounded-lg p-6 border ${themeClasses.border}`}>
            <div className="flex items-center gap-2 mb-6">
              <ClipboardDocumentIcon className={`w-5 h-5 ${darkMode ? 'text-blue-500' : 'text-blue-600'}`} />
              <h3 className={`${themeClasses.text} font-semibold`}>Upcoming Knowledge Check Docs</h3>
            </div>
            
            <div>
              {assignments.length > 0 ? (
                <div className="space-y-2">
                  {assignments.map((assignment) => (
                    <RouterLink 
                      key={assignment._id}
                      to={`/assignments/${assignment._id}`}
                      className={`block ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'} rounded-lg p-4 transition-colors border ${themeClasses.border}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className={`font-medium ${themeClasses.text} mb-1`}>{assignment.title}</h4>
                          <p className={`text-sm ${themeClasses.textSecondary}`}>
                            {assignment.subject?.name || 'General'}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full ${darkMode ? 'bg-yellow-500/10 text-yellow-500' : 'bg-yellow-100 text-yellow-700'} text-xs font-medium`}>
                          Due {new Date(assignment.dueDate).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                    </RouterLink>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${themeClasses.textSecondary}`}>
                  No upcoming docs.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Learning Progress Section */}
        <div className={`${themeClasses.cardBg} rounded-lg p-6 border ${themeClasses.border}`}>
          <h3 className={`flex items-center gap-2 mb-6 ${themeClasses.text} font-semibold`}>
            <ChartBarIcon className={`w-5 h-5 ${darkMode ? 'text-blue-500' : 'text-blue-600'}`} />
            <span>Learning Progress</span>
          </h3>
          
          <div className={`h-2 ${darkMode ? 'bg-white/10' : 'bg-gray-200'} rounded-full mb-6`}>
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progressStats.overallProgress}%` }}
            ></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-lg p-4 text-center border ${themeClasses.border}`}>
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${darkMode ? 'bg-blue-500/10' : 'bg-blue-100'} ${darkMode ? 'text-blue-500' : 'text-blue-600'} mb-3`}>
                <PlayCircleIcon className="w-6 h-6" />
              </div>
              <div className={`text-xl font-bold ${themeClasses.text} mb-1`}>{progressStats.inProgressSubjects}</div>
              <div className={`text-sm ${themeClasses.textSecondary}`}>In Progress</div>
            </div>
            
            <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-lg p-4 text-center border ${themeClasses.border}`}>
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${darkMode ? 'bg-green-500/10' : 'bg-green-100'} ${darkMode ? 'text-green-500' : 'text-green-600'} mb-3`}>
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <div className={`text-xl font-bold ${themeClasses.text} mb-1`}>{progressStats.completedSubjects}</div>
              <div className={`text-sm ${themeClasses.textSecondary}`}>Completed</div>
            </div>
            
            <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-lg p-4 text-center border ${themeClasses.border}`}>
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${darkMode ? 'bg-yellow-500/10' : 'bg-yellow-100'} ${darkMode ? 'text-yellow-500' : 'text-yellow-600'} mb-3`}>
                <ClockIcon className="w-6 h-6" />
              </div>
              <div className={`text-xl font-bold ${themeClasses.text} mb-1`}>{progressStats.pendingAssignments}</div>
              <div className={`text-sm ${themeClasses.textSecondary}`}>Pending</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard