import { useState, useEffect, FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

interface Course {
  _id: string;
  title: string;
}

interface CoursesResponse {
  courses: Course[];
  totalRecords: number;
}

interface Module {
  _id: string;
  title: string;
}

interface AssignmentFormData {
  title: string;
  description: string;
  instructions: string;
  course: string;
  module: string;
  dueDate: Date | null;
  totalPoints: number;
  passingPoints: number;
  submissionType: 'file' | 'text' | 'link' | 'multiple';
  allowLateSubmissions: boolean;
  latePenalty: number;
  status: 'draft' | 'published';
}

const CreateAssignment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    description: '',
    instructions: '',
    course: '',
    module: '',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
    totalPoints: 100,
    passingPoints: 60,
    submissionType: 'file',
    allowLateSubmissions: false,
    latePenalty: 0,
    status: 'draft'
  });

  useEffect(() => {
    // Fetch courses when component mounts
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const res = await axios.get<CoursesResponse>('/api/courses');
        setCourses(res.data.courses);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoadingCourses(false);
      }
    };
    
    fetchCourses();
  }, []);

  useEffect(() => {
    // Fetch modules when course changes, but with more robust error handling
    if (formData.course) {
      setLoadingModules(true);
      setError(null); // Clear previous errors
      
      // Set a timeout for the module fetch
      const fetchModulesWithTimeout = async () => {
        try {
          // Create a timeout promise
          const timeoutPromise = new Promise<{ data: Module[] }>((_, reject) => {
            setTimeout(() => reject(new Error('Module fetch timed out')), 8000); // Increased timeout to 8 seconds
          });
          
          // Actual fetch promise
          const fetchPromise = axios.get<Module[]>(`/api/courses/${formData.course}/modules`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          // Race them
          const res = await Promise.race([fetchPromise, timeoutPromise]);
          setModules(res.data || []);
          
          if (res.data && res.data.length === 0) {
            console.log('No modules found for this course');
          }
        } catch (err: any) {
          console.error('Error or timeout fetching modules:', err);
          // Set modules to empty array
          setModules([]);
          
          // Handle based on error type
          if (err.response && err.response.status === 401) {
            console.log('Authentication issue when fetching modules. Continuing without modules.');
            // Don't show error to user if it's just an auth issue
          } else if (err.response && err.response.status === 403) {
            console.log('Authorization issue when fetching modules. Continuing without modules.');
            // Don't show error to user if it's just an auth issue
          } else {
            // Show a user-friendly message
            setError('Unable to load modules. You can continue creating the assignment without selecting a module.');
          }
          // Log the error for debugging
          console.log('Continuing without modules - they will be optional');
        } finally {
          setLoadingModules(false);
        }
      };
      
      fetchModulesWithTimeout();
    } else {
      setModules([]);
    }
  }, [formData.course]);

  // Handle change for text inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle change for select inputs
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      dueDate: e.target.value ? new Date(e.target.value) : null
    });
  };
  
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validate required fields
    if (!formData.title || !formData.description || !formData.instructions || !formData.course || !formData.dueDate) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    
    try {
      // Create a copy of formData with module field only if it's not empty
      const submissionData = { ...formData } as Partial<AssignmentFormData>;
      if (!submissionData.module || submissionData.module === '') {
        delete submissionData.module; // Remove module if it's empty
      }
      
      // Set longer timeout for the assignment creation request
      const createAssignmentWithTimeout = async () => {
        try {
          // Set up axios with a longer timeout
          const response = await axios({
            method: 'post',
            url: '/api/assignments',
            data: submissionData,
            timeout: 15000 // 15 seconds timeout
          });
          
          console.log('Assignment creation response:', response.data);
          
          setSuccess('Assignment created successfully!');
          setTimeout(() => {
            navigate('/assignments');
          }, 2000);
        } catch (err: any) {
          if (err.code === 'ECONNABORTED') {
            throw new Error('Request timed out. The server might be busy. Please try again.');
          }
          throw err; // Re-throw other errors to be caught by the outer try/catch
        }
      };
      
      await createAssignmentWithTimeout();
    } catch (err: any) {
      console.error('Assignment creation error:', err);
      
      if (err.response) {
        const errorMessage = err.response.data?.error || 'Failed to create assignment. Please try again.';
        setError(`Server Error: ${errorMessage}`);
        console.error('Error response:', err.response.data);
      } else if (err.request) {
        setError('No response received from server. Please check your connection and try again.');
      } else {
        setError('An error occurred while creating the assignment. ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Format date for datetime-local input
  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Add a base class for all select elements
  const selectClassName = `
    block w-full px-3 py-2 
    bg-[#1e2736] border border-white/10 
    rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
    text-white 
    disabled:opacity-50
    [&>option]:bg-[#1e2736] [&>option]:text-white
  `;

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="bg-[#1e2736] backdrop-blur-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-6">
          Create New Assignment
        </h1>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-md p-4 mb-6">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-500 rounded-md p-4 mb-6">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-200 mb-1">
              Assignment Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              disabled={loading}
              required
              className="block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
              placeholder="Enter assignment title"
            />
            {!formData.title && error !== null && (
              <p className="mt-1 text-sm text-red-500">Title is required</p>
            )}
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-1">
              Short Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleInputChange}
              disabled={loading}
              required
              className="block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
              placeholder="Brief description of the assignment"
            />
            {!formData.description && error !== null && (
              <p className="mt-1 text-sm text-red-500">Description is required</p>
            )}
          </div>
          
          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-200 mb-1">
              Detailed Instructions *
            </label>
            <textarea
              id="instructions"
              name="instructions"
              rows={4}
              value={formData.instructions}
              onChange={handleInputChange}
              disabled={loading}
              required
              className="block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
              placeholder="Detailed instructions for students"
            />
            {!formData.instructions && error !== null && (
              <p className="mt-1 text-sm text-red-500">Instructions are required</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="course" className="block text-sm font-medium text-gray-200 mb-1">
                Course *
              </label>
              <select
                id="course"
                name="course"
                value={formData.course}
                onChange={handleSelectChange}
                disabled={loading || loadingCourses}
                required
                className={selectClassName}
              >
                <option value="" className="bg-[#1e2736] text-white">Select a course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id} className="bg-[#1e2736] text-white">
                    {course.title}
                  </option>
                ))}
              </select>
              {!formData.course && error !== null && (
                <p className="mt-1 text-sm text-red-500">Course is required</p>
              )}
            </div>
            
            <div>
              <label htmlFor="module" className="block text-sm font-medium text-gray-200 mb-1">
                Module {loadingModules ? '(Loading...)' : '(Optional)'}
              </label>
              <select
                id="module"
                name="module"
                value={formData.module}
                onChange={handleSelectChange}
                disabled={loadingModules}
                className={selectClassName}
              >
                <option value="" className="bg-[#1e2736] text-white">None (Optional)</option>
                {modules.map(module => (
                  <option key={module._id} value={module._id} className="bg-[#1e2736] text-white">
                    {module.title}
                  </option>
                ))}
              </select>
              {error && error.includes('modules') && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-200 mb-1">
                Due Date *
              </label>
              <input
                type="datetime-local"
                id="dueDate"
                name="dueDate"
                value={formatDateForInput(formData.dueDate)}
                onChange={handleDateChange}
                disabled={loading}
                required
                className="block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              />
              {!formData.dueDate && error !== null && (
                <p className="mt-1 text-sm text-red-500">Due date is required</p>
              )}
            </div>
            
            <div>
              <label htmlFor="submissionType" className="block text-sm font-medium text-gray-200 mb-1">
                Submission Type *
              </label>
              <select
                id="submissionType"
                name="submissionType"
                value={formData.submissionType}
                onChange={handleSelectChange}
                disabled={loading}
                required
                className={selectClassName}
              >
                <option value="file" className="bg-[#1e2736] text-white">File Upload</option>
                <option value="text" className="bg-[#1e2736] text-white">Text Entry</option>
                <option value="link" className="bg-[#1e2736] text-white">URL Link</option>
                <option value="multiple" className="bg-[#1e2736] text-white">Multiple Types</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="totalPoints" className="block text-sm font-medium text-gray-200 mb-1">
                Total Points
              </label>
              <input
                type="number"
                id="totalPoints"
                name="totalPoints"
                value={formData.totalPoints}
                onChange={handleInputChange}
                disabled={loading}
                min={1}
                className="block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              />
            </div>
            
            <div>
              <label htmlFor="passingPoints" className="block text-sm font-medium text-gray-200 mb-1">
                Passing Points
              </label>
              <input
                type="number"
                id="passingPoints"
                name="passingPoints"
                value={formData.passingPoints}
                onChange={handleInputChange}
                disabled={loading}
                min={0}
                max={formData.totalPoints}
                className="block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              />
              {formData.passingPoints > formData.totalPoints && (
                <p className="mt-1 text-sm text-red-500">Cannot be greater than total points</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-200 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleSelectChange}
                disabled={loading}
                className={selectClassName}
              >
                <option value="draft" className="bg-[#1e2736] text-white">Draft</option>
                <option value="published" className="bg-[#1e2736] text-white">Published</option>
              </select>
              <p className="mt-1 text-xs text-gray-400">
                {formData.status === 'draft' 
                  ? 'Students cannot see draft assignments' 
                  : 'Assignment will be visible to students'}
              </p>
            </div>
            
            <div>
              <label htmlFor="allowLateSubmissions" className="block text-sm font-medium text-gray-200 mb-1">
                Allow Late Submissions
              </label>
              <select
                id="allowLateSubmissions"
                name="allowLateSubmissions"
                value={formData.allowLateSubmissions ? "true" : "false"}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    allowLateSubmissions: e.target.value === "true"
                  });
                }}
                disabled={loading}
                className={selectClassName}
              >
                <option value="true" className="bg-[#1e2736] text-white">Yes</option>
                <option value="false" className="bg-[#1e2736] text-white">No</option>
              </select>
            </div>
          </div>
          
          {formData.allowLateSubmissions && (
            <div>
              <label htmlFor="latePenalty" className="block text-sm font-medium text-gray-200 mb-1">
                Late Penalty (%)
              </label>
              <input
                type="number"
                id="latePenalty"
                name="latePenalty"
                value={formData.latePenalty}
                onChange={handleInputChange}
                disabled={loading}
                min={0}
                max={100}
                className="block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              />
              <p className="mt-1 text-xs text-gray-400">
                Percentage points deducted for late submissions
              </p>
            </div>
          )}
          
          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={() => navigate('/assignments')}
              disabled={loading}
              className="px-6 py-2 border border-white/10 text-white rounded-md hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssignment; 