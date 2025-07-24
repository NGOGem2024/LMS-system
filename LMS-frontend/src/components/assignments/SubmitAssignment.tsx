import { useState, useEffect, FormEvent, useContext } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import AuthContext from '../../context/AuthContext'
import {
  ClipboardDocumentIcon,
  ArrowUpTrayIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import axios from 'axios'

interface Assignment {
  _id: string
  title: string
  description: string
  instructions: string
  dueDate: string
  course: {
    _id: string
    title: string
  }
}

const SubmitAssignment = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Redirect if user is instructor or admin
  useEffect(() => {
    if (user && (user.role === 'instructor' || user.role === 'admin') && id) {
      navigate(`/assignments/${id}`, { 
        state: { message: 'Instructors and admins cannot submit assignments' } 
      });
    }
  }, [user, id, navigate]);
  
  // Form state
  const [submissionType, setSubmissionType] = useState<'text' | 'file'>('text')
  const [textSubmission, setTextSubmission] = useState('')
  const [fileSubmission, setFileSubmission] = useState<File | null>(null)
  const [comments, setComments] = useState('')
  const [formErrors, setFormErrors] = useState<{
    submission?: string
    comments?: string
  }>({})

  useEffect(() => {
    const fetchAssignment = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const res = await axios.get(`/api/assignments/${id}`)
        setAssignment(res.data)
      } catch (err: any) {
        setError('Failed to load assignment details. Please try again later.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      fetchAssignment()
    }
  }, [id])

  const validateForm = () => {
    const errors: { submission?: string; comments?: string } = {}
    let isValid = true

    if (submissionType === 'text' && !textSubmission.trim()) {
      errors.submission = 'Please enter your submission text'
      isValid = false
    } else if (submissionType === 'file' && !fileSubmission) {
      errors.submission = 'Please select a file to upload'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !assignment) {
      return
    }
    
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    
    try {
      const formData = new FormData()
      formData.append('assignmentId', assignment._id)
      formData.append('submissionType', submissionType)
      
      if (submissionType === 'text') {
        formData.append('textContent', textSubmission)
      } else if (submissionType === 'file' && fileSubmission) {
        formData.append('file', fileSubmission)
      }
      
      if (comments) {
        formData.append('comments', comments)
      }
      
      await axios.post('/api/assignments/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setSuccess('Assignment submitted successfully!')
      
      // Redirect to assignment details page after 2 seconds
      setTimeout(() => {
        navigate(`/assignments/${assignment._id}`)
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit assignment. Please try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileSubmission(e.target.files[0])
      // Clear any previous submission error
      setFormErrors(prev => ({ ...prev, submission: undefined }))
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

  const isPastDue = new Date(assignment.dueDate) < new Date()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-4">
        <RouterLink
          to={`/assignments/${assignment._id}`}
          className="flex items-center text-primary-main hover:text-primary-dark"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          <span>Back to Assignment</span>
        </RouterLink>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-4">
          <ClipboardDocumentIcon className="h-8 w-8 text-primary-main mr-3" />
          <h1 className="text-xl font-bold">
            Submit: {assignment.title}
          </h1>
        </div>
        
        <hr className="my-4 border-gray-200 dark:border-gray-700" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium">
              Course: {assignment.course.title}
            </p>
          </div>
          <div>
            <p className="font-medium">
              Due Date: {new Date(assignment.dueDate).toLocaleDateString()}
              {isPastDue && (
                <span className="ml-2 text-error-main">
                  (Past Due)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-error-light text-error-dark border border-error-main rounded-md p-4 mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-success-light text-success-dark border border-success-main rounded-md p-4 mb-6">
          {success}
        </div>
      )}
      
      {isPastDue && (
        <div className="bg-warning-light text-warning-dark border border-warning-main rounded-md p-4 mb-6">
          This assignment is past due. Your submission may be marked as late.
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          Assignment Instructions
        </h2>
        <p className="mb-6">
          {assignment.instructions}
        </p>
        
        <hr className="my-6 border-gray-200 dark:border-gray-700" />
        
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold mb-4">
            Your Submission
          </h2>
          
          <div className="mb-6">
            <label htmlFor="submission-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Submission Type
            </label>
            <select
              id="submission-type"
              value={submissionType}
              onChange={(e) => setSubmissionType(e.target.value as 'text' | 'file')}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-main focus:border-primary-main dark:bg-gray-700 dark:text-white"
            >
              <option value="text">Text Submission</option>
              <option value="file">File Upload</option>
            </select>
          </div>
          
          {submissionType === 'text' ? (
            <div className="mb-6">
              <label htmlFor="text-submission" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Answer
              </label>
              <textarea
                id="text-submission"
                name="textSubmission"
                rows={10}
                value={textSubmission}
                onChange={(e) => setTextSubmission(e.target.value)}
                disabled={submitting}
                className={`block w-full px-3 py-2 border ${
                  formErrors.submission ? 'border-error-main' : 'border-gray-300 dark:border-gray-600'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary-main focus:border-primary-main dark:bg-gray-700 dark:text-white`}
                required
              ></textarea>
              {formErrors.submission && (
                <p className="mt-1 text-sm text-error-main">{formErrors.submission}</p>
              )}
            </div>
          ) : (
            <div className="mb-6">
              <div className="flex flex-col items-start">
                <label htmlFor="file-upload" className="mb-2">
                  <span className="inline-flex items-center px-4 py-2 border border-primary-main text-primary-main rounded hover:bg-primary-light/10 cursor-pointer">
                    <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                    Upload File
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                    disabled={submitting}
                    className="hidden"
                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  />
                </label>
                {fileSubmission && (
                  <p className="text-sm mt-1">
                    Selected file: {fileSubmission.name}
                  </p>
                )}
                {formErrors.submission && (
                  <p className="mt-1 text-sm text-error-main">{formErrors.submission}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Accepted file types: PDF, Word documents, text files
                </p>
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Additional Comments (Optional)
            </label>
            <textarea
              id="comments"
              name="comments"
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={submitting}
              className={`block w-full px-3 py-2 border ${
                formErrors.comments ? 'border-error-main' : 'border-gray-300 dark:border-gray-600'
              } rounded-md shadow-sm focus:outline-none focus:ring-primary-main focus:border-primary-main dark:bg-gray-700 dark:text-white`}
            ></textarea>
            {formErrors.comments && (
              <p className="mt-1 text-sm text-error-main">{formErrors.comments}</p>
            )}
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-6 py-3 bg-primary-main text-white rounded hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-main disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SubmitAssignment 