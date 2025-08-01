// import { useState, useEffect, useContext } from 'react'
// import { Link as RouterLink } from 'react-router-dom'
// import {
//   AcademicCapIcon,
//   ClipboardDocumentIcon,
//   ChartBarIcon,
//   CheckCircleIcon,
//   ClockIcon,
//   PlayCircleIcon,
//   ArrowRightIcon
// } from '@heroicons/react/24/outline'
// import axios from 'axios'
// import AuthContext from '../../context/AuthContext'

// interface Subject {
//   _id: string
//   name: string
//   description: string
//   progress?: number
//   imageUrl?: string
// }

// interface ProgressStats {
//   totalSubjects: number
//   completedSubjects: number
//   inProgressSubjects: number
//   totalAssignments: number
//   completedAssignments: number
//   pendingAssignments: number
//   overallProgress: number
// }

// interface Assignment {
//   _id: string
//   title: string
//   dueDate: string
//   subject?: {
//     _id: string
//     name: string
//   }
//   status?: string
// }

// interface SubjectsResponse {
//   subjects: Subject[]
//   totalRecords: number
// }

// interface AssignmentsResponse {
//   assignments: Assignment[]
//   totalRecords: number
// }

// const Dashboard = () => {
//   const [subjects, setSubjects] = useState<Subject[]>([])
//   const [assignments, setAssignments] = useState<Assignment[]>([])
//   const [progressStats, setProgressStats] = useState<ProgressStats>({
//     totalSubjects: 0,
//     completedSubjects: 0,
//     inProgressSubjects: 0,
//     totalAssignments: 0,
//     completedAssignments: 0,
//     pendingAssignments: 0,
//     overallProgress: 0
//   })
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
  
//   const { user } = useContext(AuthContext)

//   useEffect(() => {
//     const fetchDashboardData = async () => {
//       setLoading(true)
//       setError(null)
      
//       try {
//         // Fetch enrolled subjects
//         const subjectsRes = await axios.get<SubjectsResponse>('/api/curriculum/subjects')
//         setSubjects(subjectsRes.data.subjects?.slice(0, 3) || []) // Show only 3 latest subjects
        
//         // Fetch upcoming assignments
//         const assignmentsRes = await axios.get<AssignmentsResponse>('/api/assignments/upcoming')
//         setAssignments(assignmentsRes.data.assignments ? assignmentsRes.data.assignments.slice(0, 5) : []) // Show only 5 upcoming assignments
        
//         let statsData = null
        
//         try {
//           // Fetch progress statistics - handle in a separate try/catch
//           const statsRes = await axios.get('/api/progress/stats')
//           statsData = statsRes.data
          
//           // Map old course-based stats to new subject-based stats
//           setProgressStats({
//             totalSubjects: statsData.totalSubjects || 0,
//             completedSubjects: statsData.completedSubjects || 0,
//             inProgressSubjects: statsData.inProgressSubjects || 0,
//             totalAssignments: statsData.totalAssignments || 0,
//             completedAssignments: statsData.completedAssignments || 0,
//             pendingAssignments: statsData.pendingAssignments || 0,
//             overallProgress: statsData.overallProgress || 0
//           })
//         } catch (statsErr) {
//           console.error('Failed to fetch progress stats:', statsErr)
//           // statsData will remain null and we'll use the fallback below
//         }
        
//         // If API failed or returned no data, calculate stats from the subjects and assignments
//         if (!statsData || !statsData.totalSubjects) {
//           console.log('Using fallback stats calculation')
//           const allSubjects = subjectsRes.data.subjects || []
//           const upcomingAssignments = assignmentsRes.data.assignments || []
//           const completedSubjects = allSubjects.filter((s: Subject) => s.progress === 100).length
//           const inProgressSubjects = allSubjects.filter((s: Subject) => s.progress && s.progress > 0 && s.progress < 100).length
//           const totalAssignments = upcomingAssignments.length
//           const completedAssignments = upcomingAssignments.filter((a: Assignment) => a.status === 'completed').length
          
//           setProgressStats({
//             totalSubjects: allSubjects.length,
//             completedSubjects,
//             inProgressSubjects,
//             totalAssignments,
//             completedAssignments,
//             pendingAssignments: totalAssignments - completedAssignments,
//             overallProgress: allSubjects.length > 0 
//               ? allSubjects.reduce((sum: number, subject: Subject) => sum + (subject.progress || 0), 0) / allSubjects.length
//               : 0
//           })
//         }
//       } catch (err: any) {
//         setError('Failed to load dashboard data. Please try again later.')
//         console.error('Dashboard data fetch error:', err)
//       } finally {
//         setLoading(false)
//       }
//     }
    
//     fetchDashboardData()
//   }, [])

//   if (loading) {
//     return (
//       <div className="container mx-auto px-6 py-8">
//         <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 mb-6 animate-pulse">
//           <div className="h-8 w-2/3 bg-white/10 rounded-lg mb-3"></div>
//           <div className="h-4 w-1/2 bg-white/10 rounded-lg"></div>
//         </div>
        
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
//           {[1, 2, 3, 4].map((item) => (
//             <div key={item} className="bg-white/5 backdrop-blur-sm rounded-lg p-6 animate-pulse">
//               <div className="h-10 bg-white/10 rounded-lg w-1/2 mx-auto mb-2"></div>
//               <div className="h-4 bg-white/10 rounded-lg w-2/3 mx-auto"></div>
//             </div>
//           ))}
//         </div>
        
//         <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 mb-6 animate-pulse">
//           <div className="h-6 bg-white/10 rounded-lg w-1/4 mb-4"></div>
//           <div className="h-4 bg-white/10 rounded-lg w-full mb-2"></div>
//         </div>
        
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {[1, 2].map((item) => (
//             <div key={item} className="bg-white/5 backdrop-blur-sm rounded-lg p-6 animate-pulse min-h-[250px]">
//               <div className="h-6 bg-white/10 rounded-lg w-1/3 mb-4"></div>
//               <div className="h-24 bg-white/10 rounded-lg w-full mb-2"></div>
//             </div>
//           ))}
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="container mx-auto px-6 py-8">
//       {/* Welcome Header - More compact with subtle pattern */}
//       <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg p-6 mb-6 relative overflow-hidden group transition-all hover:shadow-lg hover:shadow-blue-500/10">
//         <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[gradient_8s_linear_infinite]"></div>
//         <div className="relative flex items-center justify-between">
//           <div>
//             <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
//               Welcome back, {user?.name}!
//             </h1>
//             <p className="text-white/80 text-sm">Ready to continue your learning journey?</p>
//           </div>
//           <div className="hidden md:block">
//             <RouterLink 
//               to="/courses" 
//               className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all group-hover:translate-x-1"
//             >
//               Browse Curriculum
//               <ArrowRightIcon className="w-4 h-4 ml-2" />
//             </RouterLink>
//           </div>
//         </div>
//       </div>
      
//       {error && (
//         <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-4 mb-6">
//           {error}
//         </div>
//       )}
      
//       {/* Stats Overview - Improved hierarchy and interactions */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
//         <div className="group bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-lg p-6 border border-white/5 transition-all hover:border-blue-500/20 hover:from-blue-500/20 hover:to-purple-500/20">
//           <div className="flex items-start justify-between mb-2">
//             <div className="p-2 bg-blue-500/10 rounded-lg transition-transform group-hover:scale-110 group-hover:bg-blue-500/20">
//               <AcademicCapIcon className="w-6 h-6 text-blue-500" />
//             </div>
//             <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">Total</span>
//           </div>
//           <div className="mt-4">
//             <div className="text-4xl font-bold text-white mb-2 transition-all group-hover:scale-105 group-hover:translate-x-1">{progressStats.totalSubjects}</div>
//             <div className="text-sm text-blue-200/60 font-medium uppercase tracking-wide">Subjects</div>
//           </div>
//         </div>
        
//         <div className="group bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-lg p-6 border border-white/5 transition-all hover:border-purple-500/20 hover:from-purple-500/20 hover:to-pink-500/20">
//           <div className="flex items-start justify-between mb-2">
//             <div className="p-2 bg-purple-500/10 rounded-lg transition-transform group-hover:scale-110 group-hover:bg-purple-500/20">
//               <ChartBarIcon className="w-6 h-6 text-purple-500" />
//             </div>
//             <span className="text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">Progress</span>
//           </div>
//           <div className="mt-4">
//             <div className="text-4xl font-bold text-white mb-2 transition-all group-hover:scale-105 group-hover:translate-x-1">{progressStats.overallProgress.toFixed(0)}%</div>
//             <div className="text-sm text-purple-200/60 font-medium uppercase tracking-wide">Overall Completion</div>
//           </div>
//         </div>
        
//         <div className="group bg-gradient-to-br from-indigo-500/10 to-blue-500/10 backdrop-blur-sm rounded-lg p-6 border border-white/5 transition-all hover:border-indigo-500/20 hover:from-indigo-500/20 hover:to-blue-500/20">
//           <div className="flex items-start justify-between mb-2">
//             <div className="p-2 bg-indigo-500/10 rounded-lg transition-transform group-hover:scale-110 group-hover:bg-indigo-500/20">
//               <ClipboardDocumentIcon className="w-6 h-6 text-indigo-500" />
//             </div>
//             <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full">Total</span>
//           </div>
//           <div className="mt-4">
//             <div className="text-4xl font-bold text-white mb-2 transition-all group-hover:scale-105 group-hover:translate-x-1">{progressStats.totalAssignments}</div>
//             <div className="text-sm text-indigo-200/60 font-medium uppercase tracking-wide">Assignments</div>
//           </div>
//         </div>
        
//         <div className="group bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-lg p-6 border border-white/5 transition-all hover:border-green-500/20 hover:from-green-500/20 hover:to-emerald-500/20">
//           <div className="flex items-start justify-between mb-2">
//             <div className="p-2 bg-green-500/10 rounded-lg transition-transform group-hover:scale-110 group-hover:bg-green-500/20">
//               <CheckCircleIcon className="w-6 h-6 text-green-500" />
//             </div>
//             <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded-full">Completed</span>
//           </div>
//           <div className="mt-4">
//             <div className="text-4xl font-bold text-white mb-2 transition-all group-hover:scale-105 group-hover:translate-x-1">{progressStats.completedSubjects}</div>
//             <div className="text-sm text-green-200/60 font-medium uppercase tracking-wide">Subjects Finished</div>
//           </div>
//         </div>
//       </div>
      
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//         {/* Recent Subjects */}
//         <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
//           <div className="flex items-center gap-2 mb-6">
//             <AcademicCapIcon className="w-5 h-5 text-blue-500" />
//             <h3 className="text-white font-semibold">Recent Subjects</h3>
//           </div>
          
//           <div>
//             {subjects.length > 0 ? (
//               <div className="space-y-4">
//                 {subjects.map((subject) => (
//                   <div key={subject._id} className="bg-white/5 rounded-lg overflow-hidden">
//                     <div className="p-4">
//                       <h3 className="text-lg font-semibold text-white mb-1">
//                         {subject.name}
//                       </h3>
//                       <p className="text-sm text-gray-400 mb-3 line-clamp-2">
//                         {subject.description}
//                       </p>
//                       {subject.progress !== undefined && (
//                         <div className="flex items-center gap-2">
//                           <div className="flex-1 h-1.5 bg-white/5 rounded-full">
//                             <div 
//                               className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
//                               style={{ width: `${subject.progress}%` }}
//                             ></div>
//                           </div>
//                           <span className="text-xs font-medium text-white">
//                             {Math.round(subject.progress)}%
//                           </span>
//                         </div>
//                       )}
//                     </div>
//                     <div className="border-t border-white/5 px-4 py-2">
//                       <RouterLink 
//                         to={`/curriculum/subjects/${subject._id}`}
//                         className="text-sm text-blue-400 hover:text-blue-300 inline-flex items-center"
//                       >
//                         Continue Learning
//                         <ArrowRightIcon className="w-3 h-3 ml-1" />
//                       </RouterLink>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-center py-8">
//                 <p className="text-gray-400 mb-4">No subjects available yet.</p>
//                 <RouterLink 
//                   to="/courses" 
//                   className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 transition-all"
//                 >
//                   Browse Curriculum
//                 </RouterLink>
//               </div>
//             )}
//           </div>
//         </div>
        
//         {/* Upcoming Assignments */}
//         <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
//           <div className="flex items-center gap-2 mb-6">
//             <ClipboardDocumentIcon className="w-5 h-5 text-blue-500" />
//             <h3 className="text-white font-semibold">Upcoming Assignments</h3>
//           </div>
          
//           <div>
//             {assignments.length > 0 ? (
//               <div className="space-y-2">
//                 {assignments.map((assignment) => (
//                   <RouterLink 
//                     key={assignment._id}
//                     to={`/assignments/${assignment._id}`}
//                     className="block bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
//                   >
//                     <div className="flex items-start justify-between gap-4">
//                       <div className="flex-1">
//                         <h4 className="font-medium text-white mb-1">{assignment.title}</h4>
//                         <p className="text-sm text-gray-400">
//                           {assignment.subject?.name || 'General'}
//                         </p>
//                       </div>
//                       <div className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium">
//                         Due {new Date(assignment.dueDate).toLocaleDateString(undefined, { 
//                           month: 'short', 
//                           day: 'numeric' 
//                         })}
//                       </div>
//                     </div>
//                   </RouterLink>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-center py-8">
//                 <p className="text-gray-400">No upcoming assignments.</p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Learning Progress Section - Moved to bottom */}
//       <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
//         <h3 className="flex items-center gap-2 mb-6 text-white font-semibold">
//           <ChartBarIcon className="w-5 h-5 text-blue-500" />
//           <span>Learning Progress</span>
//         </h3>
        
//         <div className="h-2 bg-white/5 rounded-full mb-6">
//           <div 
//             className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
//             style={{ width: `${progressStats.overallProgress}%` }}
//           ></div>
//         </div>
        
//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//           <div className="bg-white/5 rounded-lg p-4 text-center">
//             <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 text-blue-500 mb-3">
//               <PlayCircleIcon className="w-6 h-6" />
//             </div>
//             <div className="text-xl font-bold text-white mb-1">{progressStats.inProgressSubjects}</div>
//             <div className="text-sm text-gray-400">In Progress</div>
//           </div>
          
//           <div className="bg-white/5 rounded-lg p-4 text-center">
//             <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10 text-green-500 mb-3">
//               <CheckCircleIcon className="w-6 h-6" />
//             </div>
//             <div className="text-xl font-bold text-white mb-1">{progressStats.completedSubjects}</div>
//             <div className="text-sm text-gray-400">Completed</div>
//           </div>
          
//           <div className="bg-white/5 rounded-lg p-4 text-center">
//             <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-yellow-500/10 text-yellow-500 mb-3">
//               <ClockIcon className="w-6 h-6" />
//             </div>
//             <div className="text-xl font-bold text-white mb-1">{progressStats.pendingAssignments}</div>
//             <div className="text-sm text-gray-400">Pending</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default Dashboard 


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
// import axios from 'axios'
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

const Dashboard = () => {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [progressStats, setProgressStats] = useState<ProgressStats>({
    totalSubjects: 0,
    completedSubjects: 0,
    inProgressSubjects: 0,
    totalAssignments: 0,
    completedAssignments: 0,
    pendingAssignments: 0,
    overallProgress: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useContext(AuthContext)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // API CALLS COMMENTED OUT - SHOWING DEFAULT VALUES
        
        // Fetch enrolled subjects
        // const subjectsRes = await axios.get<SubjectsResponse>('/api/curriculum/subjects')
        // setSubjects(subjectsRes.data.subjects?.slice(0, 3) || []) // Show only 3 latest subjects
        setSubjects([]) // Default empty array
        
        // Fetch upcoming assignments
        // const assignmentsRes = await axios.get<AssignmentsResponse>('/api/assignments/upcoming')
        // setAssignments(assignmentsRes.data.assignments ? assignmentsRes.data.assignments.slice(0, 5) : []) // Show only 5 upcoming assignments
        setAssignments([]) // Default empty array
        
        // let statsData = null
        
        // try {
        //   // Fetch progress statistics - handle in a separate try/catch
        //   const statsRes = await axios.get('/api/progress/stats')
        //   statsData = statsRes.data
        //   
        //   // Map old course-based stats to new subject-based stats
        //   setProgressStats({
        //     totalSubjects: statsData.totalSubjects || 0,
        //     completedSubjects: statsData.completedSubjects || 0,
        //     inProgressSubjects: statsData.inProgressSubjects || 0,
        //     totalAssignments: statsData.totalAssignments || 0,
        //     completedAssignments: statsData.completedAssignments || 0,
        //     pendingAssignments: statsData.pendingAssignments || 0,
        //     overallProgress: statsData.overallProgress || 0
        //   })
        // } catch (statsErr) {
        //   console.error('Failed to fetch progress stats:', statsErr)
        //   // statsData will remain null and we'll use the fallback below
        // }
        
        // Set default stats to all zeros
        setProgressStats({
          totalSubjects: 0,
          completedSubjects: 0,
          inProgressSubjects: 0,
          totalAssignments: 0,
          completedAssignments: 0,
          pendingAssignments: 0,
          overallProgress: 0
        })
        
        // If API failed or returned no data, calculate stats from the subjects and assignments
        // if (!statsData || !statsData.totalSubjects) {
        //   console.log('Using fallback stats calculation')
        //   const allSubjects = subjectsRes.data.subjects || []
        //   const upcomingAssignments = assignmentsRes.data.assignments || []
        //   const completedSubjects = allSubjects.filter((s: Subject) => s.progress === 100).length
        //   const inProgressSubjects = allSubjects.filter((s: Subject) => s.progress && s.progress > 0 && s.progress < 100).length
        //   const totalAssignments = upcomingAssignments.length
        //   const completedAssignments = upcomingAssignments.filter((a: Assignment) => a.status === 'completed').length
        //   
        //   setProgressStats({
        //     totalSubjects: allSubjects.length,
        //     completedSubjects,
        //     inProgressSubjects,
        //     totalAssignments,
        //     completedAssignments,
        //     pendingAssignments: totalAssignments - completedAssignments,
        //     overallProgress: allSubjects.length > 0 
        //       ? allSubjects.reduce((sum: number, subject: Subject) => sum + (subject.progress || 0), 0) / allSubjects.length
        //       : 0
        //   })
        // }
      } catch (err: any) {
        // setError('Failed to load dashboard data. Please try again later.')
        // console.error('Dashboard data fetch error:', err)
        setError(null) // No error since we're not making API calls
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 mb-6 animate-pulse">
          <div className="h-8 w-2/3 bg-white/10 rounded-lg mb-3"></div>
          <div className="h-4 w-1/2 bg-white/10 rounded-lg"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="bg-white/5 backdrop-blur-sm rounded-lg p-6 animate-pulse">
              <div className="h-10 bg-white/10 rounded-lg w-1/2 mx-auto mb-2"></div>
              <div className="h-4 bg-white/10 rounded-lg w-2/3 mx-auto"></div>
            </div>
          ))}
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 mb-6 animate-pulse">
          <div className="h-6 bg-white/10 rounded-lg w-1/4 mb-4"></div>
          <div className="h-4 bg-white/10 rounded-lg w-full mb-2"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((item) => (
            <div key={item} className="bg-white/5 backdrop-blur-sm rounded-lg p-6 animate-pulse min-h-[250px]">
              <div className="h-6 bg-white/10 rounded-lg w-1/3 mb-4"></div>
              <div className="h-24 bg-white/10 rounded-lg w-full mb-2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Welcome Header - More compact with subtle pattern */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg p-6 mb-6 relative overflow-hidden group transition-all hover:shadow-lg hover:shadow-blue-500/10">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[gradient_8s_linear_infinite]"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-white/80 text-sm">Ready to continue your learning journey?</p>
          </div>
          <div className="hidden md:block">
            <RouterLink 
              to="/courses" 
              className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all group-hover:translate-x-1"
            >
              Browse Curriculum
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </RouterLink>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}
      
      {/* Stats Overview - Improved hierarchy and interactions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="group bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-lg p-6 border border-white/5 transition-all hover:border-blue-500/20 hover:from-blue-500/20 hover:to-purple-500/20">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg transition-transform group-hover:scale-110 group-hover:bg-blue-500/20">
              <AcademicCapIcon className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">Total</span>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-bold text-white mb-2 transition-all group-hover:scale-105 group-hover:translate-x-1">{progressStats.totalSubjects}</div>
            <div className="text-sm text-blue-200/60 font-medium uppercase tracking-wide">Subjects</div>
          </div>
        </div>
        
        <div className="group bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-lg p-6 border border-white/5 transition-all hover:border-purple-500/20 hover:from-purple-500/20 hover:to-pink-500/20">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg transition-transform group-hover:scale-110 group-hover:bg-purple-500/20">
              <ChartBarIcon className="w-6 h-6 text-purple-500" />
            </div>
            <span className="text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">Progress</span>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-bold text-white mb-2 transition-all group-hover:scale-105 group-hover:translate-x-1">{progressStats.overallProgress.toFixed(0)}%</div>
            <div className="text-sm text-purple-200/60 font-medium uppercase tracking-wide">Overall Completion</div>
          </div>
        </div>
        
        <div className="group bg-gradient-to-br from-indigo-500/10 to-blue-500/10 backdrop-blur-sm rounded-lg p-6 border border-white/5 transition-all hover:border-indigo-500/20 hover:from-indigo-500/20 hover:to-blue-500/20">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg transition-transform group-hover:scale-110 group-hover:bg-indigo-500/20">
              <ClipboardDocumentIcon className="w-6 h-6 text-indigo-500" />
            </div>
            <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full">Total</span>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-bold text-white mb-2 transition-all group-hover:scale-105 group-hover:translate-x-1">{progressStats.totalAssignments}</div>
            <div className="text-sm text-indigo-200/60 font-medium uppercase tracking-wide">Assignments</div>
          </div>
        </div>
        
        <div className="group bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-lg p-6 border border-white/5 transition-all hover:border-green-500/20 hover:from-green-500/20 hover:to-emerald-500/20">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg transition-transform group-hover:scale-110 group-hover:bg-green-500/20">
              <CheckCircleIcon className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded-full">Completed</span>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-bold text-white mb-2 transition-all group-hover:scale-105 group-hover:translate-x-1">{progressStats.completedSubjects}</div>
            <div className="text-sm text-green-200/60 font-medium uppercase tracking-wide">Subjects Finished</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Recent Subjects */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <AcademicCapIcon className="w-5 h-5 text-blue-500" />
            <h3 className="text-white font-semibold">Recent Subjects</h3>
          </div>
          
          <div>
            {subjects.length > 0 ? (
              <div className="space-y-4">
                {subjects.map((subject) => (
                  <div key={subject._id} className="bg-white/5 rounded-lg overflow-hidden">
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {subject.name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {subject.description}
                      </p>
                      {subject.progress !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                              style={{ width: `${subject.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-white">
                            {Math.round(subject.progress)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-white/5 px-4 py-2">
                      <RouterLink 
                        to={`/curriculum/subjects/${subject._id}`}
                        className="text-sm text-blue-400 hover:text-blue-300 inline-flex items-center"
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
                <p className="text-gray-400 mb-4">No subjects available yet.</p>
                <RouterLink 
                  to="/courses" 
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 transition-all"
                >
                  Browse Curriculum
                </RouterLink>
              </div>
            )}
          </div>
        </div>
        
        {/* Upcoming Assignments */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <ClipboardDocumentIcon className="w-5 h-5 text-blue-500" />
            <h3 className="text-white font-semibold">Upcoming Assignments</h3>
          </div>
          
          <div>
            {assignments.length > 0 ? (
              <div className="space-y-2">
                {assignments.map((assignment) => (
                  <RouterLink 
                    key={assignment._id}
                    to={`/assignments/${assignment._id}`}
                    className="block bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-1">{assignment.title}</h4>
                        <p className="text-sm text-gray-400">
                          {assignment.subject?.name || 'General'}
                        </p>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium">
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
              <div className="text-center py-8">
                <p className="text-gray-400">No upcoming assignments.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Learning Progress Section - Moved to bottom */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <h3 className="flex items-center gap-2 mb-6 text-white font-semibold">
          <ChartBarIcon className="w-5 h-5 text-blue-500" />
          <span>Learning Progress</span>
        </h3>
        
        <div className="h-2 bg-white/5 rounded-full mb-6">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progressStats.overallProgress}%` }}
          ></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 text-blue-500 mb-3">
              <PlayCircleIcon className="w-6 h-6" />
            </div>
            <div className="text-xl font-bold text-white mb-1">{progressStats.inProgressSubjects}</div>
            <div className="text-sm text-gray-400">In Progress</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10 text-green-500 mb-3">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <div className="text-xl font-bold text-white mb-1">{progressStats.completedSubjects}</div>
            <div className="text-sm text-gray-400">Completed</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-yellow-500/10 text-yellow-500 mb-3">
              <ClockIcon className="w-6 h-6" />
            </div>
            <div className="text-xl font-bold text-white mb-1">{progressStats.pendingAssignments}</div>
            <div className="text-sm text-gray-400">Pending</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard