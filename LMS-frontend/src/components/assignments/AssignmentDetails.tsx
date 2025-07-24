import { useState, useEffect, useContext } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import AuthContext from '../../context/AuthContext'
import {
  ClipboardDocumentIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon as ClockIconOutline,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import axios from 'axios'

interface Assignment {
  _id: string
  title: string
  description: string
  instructions: string
  dueDate: string
  totalPoints: number
  passingPoints: number
  status: 'draft' | 'published' | 'archived'
  submissionStatus?: 'pending' | 'overdue' | 'submitted' | 'late' | 'graded' | 'passed' | 'failed' | 'resubmit' | 'missed'
  allowLateSubmissions: boolean
  latePenalty: number 
  submissionType: 'text' | 'file' | 'link' | 'multiple'
  maxFileSize?: number
  createdAt: string
  attachments?: {
    name: string
    fileUrl: string
    fileType: string
  }[]
  course: {
    _id: string
    title: string
  }
  submission?: {
    _id: string
    submittedAt: string
    grade?: number
    feedback?: string
    status?: string
  }
}

const AssignmentDetails = () => {
  const { id } = useParams<{ id: string }>()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useContext(AuthContext)

  useEffect(() => {
    const fetchAssignment = async () => {
      setLoading(true)
      setError(null)
      
      try {
        console.log(`Fetching assignment with id: ${id}`)
        const res = await axios.get(`/api/assignments/${id}`)
        console.log('Assignment response:', res.data)
        
        if (res.data) {
          setAssignment(res.data)
        } else {
          setError('Assignment not found or invalid response format')
        }
      } catch (err: any) {
        console.error('Error fetching assignment details:', err)
        setError(err.response?.data?.error || 'Failed to load assignment details. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      fetchAssignment()
    }
  }, [id])

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <div className="flex items-center px-3 py-1 rounded-full bg-success-light text-success-dark text-sm">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            <span>Submitted</span>
          </div>
        )
      case 'graded':
        return (
          <div className="flex items-center px-3 py-1 rounded-full bg-success-light text-success-dark text-sm">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            <span>Graded</span>
          </div>
        )
      case 'passed':
        return (
          <div className="flex items-center px-3 py-1 rounded-full bg-success-light text-success-dark text-sm">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            <span>Passed</span>
          </div>
        )
      case 'failed':
        return (
          <div className="flex items-center px-3 py-1 rounded-full bg-error-light text-error-dark text-sm">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            <span>Failed</span>
          </div>
        )
      case 'resubmit':
        return (
          <div className="flex items-center px-3 py-1 rounded-full bg-warning-light text-warning-dark text-sm">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            <span>Needs Revision</span>
          </div>
        )
      case 'late':
        return (
          <div className="flex items-center px-3 py-1 rounded-full bg-warning-light text-warning-dark text-sm">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            <span>Late</span>
          </div>
        )
      case 'overdue':
        return (
          <div className="flex items-center px-3 py-1 rounded-full bg-error-light text-error-dark text-sm">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            <span>Overdue</span>
          </div>
        )
      case 'missed':
        return (
          <div className="flex items-center px-3 py-1 rounded-full bg-error-light text-error-dark text-sm">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            <span>Missed</span>
          </div>
        )
      case 'pending':
      default:
        return (
          <div className="flex items-center px-3 py-1 rounded-full bg-primary-light text-primary-dark text-sm">
            <ClockIconOutline className="h-4 w-4 mr-1" />
            <span>Pending</span>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="w-full h-1 bg-primary-main animate-pulse"></div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-error-light text-error-dark border border-error-main rounded-md p-4">
          Assignment not found or has been removed.
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="bg-error-light text-error-dark border border-error-main rounded-md p-4 mb-6">
          {error}
        </div>
      )}
      
      <div className="flex items-center mb-4">
        <RouterLink
          to="/assignments"
          className="flex items-center text-primary-main hover:text-primary-dark"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          <span>Back to Assignments</span>
        </RouterLink>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Assignment Header */}
        <div className="md:col-span-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <ClipboardDocumentIcon className="h-10 w-10 text-primary-main mr-3" />
                <h1 className="text-2xl font-bold">
                  {assignment.title}
                </h1>
              </div>
              {getStatusChip(assignment.submissionStatus || 'pending')}
            </div>
            
            <hr className="my-4 border-gray-200 dark:border-gray-700" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <AcademicCapIcon className="h-5 w-5 text-gray-500 mt-0.5 mr-2" />
                    <div>
                      <span className="font-medium">Course:</span>{' '}
                      <RouterLink to={`/courses/${assignment.course._id}`} className="text-primary-main hover:text-primary-dark">
                        {assignment.course.title}
                      </RouterLink>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CalendarDaysIcon className="h-5 w-5 text-gray-500 mt-0.5 mr-2" />
                    <div>
                      <span className="font-medium">Due Date:</span>{' '}
                      <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <DocumentTextIcon className="h-5 w-5 text-gray-500 mt-0.5 mr-2" />
                    <div>
                      <span className="font-medium">Points:</span>{' '}
                      <span>{assignment.totalPoints} (Passing: {assignment.passingPoints || Math.round(assignment.totalPoints * 0.6)})</span>
                    </div>
                  </li>
                  {assignment.submission && assignment.submission.submittedAt && (
                    <li className="flex items-start">
                      <ClockIcon className="h-5 w-5 text-gray-500 mt-0.5 mr-2" />
                      <div>
                        <span className="font-medium">Submitted:</span>{' '}
                        <span>{new Date(assignment.submission.submittedAt).toLocaleString()}</span>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            </div>
            
            {/* Display assignment status badge */}
            <div className="flex justify-end mt-4">
              {assignment.status && (
                // Only show status badge if user is instructor/admin OR status is not 'draft'
                (user?.role === 'instructor' || user?.role === 'admin' || assignment.status !== 'draft') && (
                  <span className={`px-2 py-1 text-xs rounded-full border ${
                    assignment.status === 'published' 
                      ? 'border-success-main text-success-dark' 
                      : assignment.status === 'draft' 
                      ? 'border-gray-300 text-gray-600' 
                      : 'border-warning-main text-warning-dark'
                  }`}>
                    Status: {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                  </span>
                )
              )}
              {assignment.createdAt && (
                <span className="text-xs text-gray-500 ml-2 mt-1">
                  Created: {new Date(assignment.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Assignment Content */}
        <div className="md:col-span-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-3">
              Description
            </h2>
            <p className="mb-6">
              {assignment.description}
            </p>
            
            <hr className="my-6 border-gray-200 dark:border-gray-700" />
            
            <h2 className="text-xl font-semibold mb-3">
              Instructions
            </h2>
            <p className="mb-6">
              {assignment.instructions}
            </p>
            
            {/* Submission Information */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-3">
                Submission Information
              </h2>
              <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-900">
                {assignment.submissionType ? (
                  <>
                    <p className="mb-2">
                      <span className="font-medium">Submission Type:</span> {assignment.submissionType.charAt(0).toUpperCase() + assignment.submissionType.slice(1)}
                    </p>
                    
                    {assignment.submissionType === 'file' && assignment.maxFileSize && (
                      <p className="mb-2">
                        <span className="font-medium">Max File Size:</span> {assignment.maxFileSize} MB
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mb-2">
                    <span className="font-medium">Submission Type:</span> Text
                  </p>
                )}
                
                <p>
                  <span className="font-medium">Late Submissions:</span> {assignment.allowLateSubmissions ? 
                    `Allowed${assignment.latePenalty > 0 ? ` (${assignment.latePenalty}% penalty)` : ''}` : 
                    'Not allowed'}
                </p>
              </div>
            </div>
            
            {/* Attachments Section */}
            {assignment.attachments && assignment.attachments.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-3">
                  Attachments
                </h2>
                <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {assignment.attachments.map((attachment, index) => (
                      <li key={index} className="py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <ClipboardDocumentIcon className="h-5 w-5 text-gray-500 mr-2" />
                          <div>
                            <div>{attachment.name}</div>
                            <div className="text-xs text-gray-500">{attachment.fileType}</div>
                          </div>
                        </div>
                        <a 
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 border border-primary-main text-primary-main rounded hover:bg-primary-light/10 text-sm"
                        >
                          Download
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {!assignment.submission && 
             !['submitted', 'late', 'graded', 'passed', 'failed', 'resubmit'].includes(assignment.submissionStatus || '') && 
             assignment.submissionStatus !== 'missed' && 
             user?.role === 'student' && (
              <div className="mt-8">
                <RouterLink
                  to={`/assignments/${assignment._id}/submit`}
                  className="inline-flex items-center px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark"
                >
                  <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
                  Submit Assignment
                </RouterLink>
              </div>
            )}
          </div>
        </div>
        
        {/* Submission Status */}
        <div className="md:col-span-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Submission Status
            </h2>
            
            {assignment.submission ? (
              <>
                <div className="flex items-center mb-4">
                  <CheckCircleIcon className="h-5 w-5 text-success-main mr-2" />
                  <p>
                    Submitted on {new Date(assignment.submission.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                
                {assignment.submission.grade !== undefined ? (
                  <div className="mt-4">
                    <p className="font-semibold mb-1">
                      Grade: {assignment.submission.grade} / {assignment.totalPoints}
                      {assignment.submission.grade >= assignment.totalPoints * 0.6 ? (
                        <span className="ml-2 px-2 py-0.5 bg-success-light text-success-dark text-xs rounded-full">
                          Passed
                        </span>
                      ) : (
                        <span className="ml-2 px-2 py-0.5 bg-error-light text-error-dark text-xs rounded-full">
                          Failed
                        </span>
                      )}
                    </p>
                    
                    {assignment.submission.feedback && (
                      <>
                        <p className="font-semibold mt-4 mb-2">
                          Feedback:
                        </p>
                        <div className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded">
                          <p className="text-sm">
                            {assignment.submission.feedback}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded">
                    Your submission is under review.
                  </div>
                )}
                
                {assignment.submission.status === 'returned' && (
                  <div className="mt-4">
                    <div className="p-3 bg-warning-light text-warning-dark border border-warning-main rounded mb-3">
                      Your submission needs revision. Please review the feedback and resubmit.
                    </div>
                    <RouterLink
                      to={`/assignments/${assignment._id}/submit`}
                      className="block w-full text-center py-2 bg-primary-main text-white rounded hover:bg-primary-dark"
                    >
                      Resubmit Assignment
                    </RouterLink>
                  </div>
                )}
              </>
            ) : (
              <>
                {assignment.submissionStatus === 'missed' ? (
                  <div className="p-3 bg-error-light text-error-dark border border-error-main rounded">
                    This assignment is past due and no longer accepts submissions.
                  </div>
                ) : assignment.submissionStatus === 'overdue' ? (
                  <div className="p-3 bg-warning-light text-warning-dark border border-warning-main rounded">
                    This assignment is past due, but late submissions are still accepted. 
                    {assignment.latePenalty > 0 && ` Note that a ${assignment.latePenalty}% penalty will apply.`}
                  </div>
                ) : (
                  <>
                    {/* Only show this message to students */}
                    {user?.role === 'student' ? (
                      <div className="p-3 bg-warning-light text-warning-dark border border-warning-main rounded">
                        You haven't submitted this assignment yet. The due date is {new Date(assignment.dueDate).toLocaleDateString()}.
                      </div>
                    ) : (user?.role === 'instructor' || user?.role === 'admin') && (
                      <div className="p-3 bg-warning-light text-warning-dark border border-warning-main rounded">
                        Instructors and admins cannot submit assignments.
                      </div>
                    )}
                  </>
                )}
                
                {assignment.submissionStatus !== 'missed' && user?.role === 'student' && (
                  <div className="mt-4">
                    <RouterLink
                      to={`/assignments/${assignment._id}/submit`}
                      className="block w-full text-center py-2 bg-primary-main text-white rounded hover:bg-primary-dark"
                    >
                      Submit Assignment
                    </RouterLink>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssignmentDetails 