import { useState, FormEvent, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import AuthContext from '../../context/AuthContext'
import Select from 'react-select'
import {
  AcademicCapIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  InformationCircleIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ClockIcon,
  TagIcon,
  DocumentTextIcon, // Correct icon for FileText
  EyeIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline'
interface CourseFormData {
  title: string;
  description: string;
  shortDescription: string;
  duration: number;
  category: string;
  status: string;
  isPublic: boolean;
  tags: string[];
  iconName: string;
}

const steps = ['Basic Info', 'Details', 'Settings'];

const AddCourseTest = () => {
  const navigate = useNavigate();
  const { token, tenantId } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState<string>('');
  const [activeStep, setActiveStep] = useState(0);
  
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    shortDescription: '',
    duration: 0,
    category: '',
    status: 'draft',
    isPublic: false,
    tags: [],
    iconName: 'Users'
  });

  // Define icon components
  const iconComponents = {
    Users: UsersIcon,
    Target: TagIcon,
    Video: VideoCameraIcon,
    FileText: DocumentTextIcon
  };

  const iconOptions = [
    { value: 'Users', label: 'Users' },
    { value: 'Target', label: 'Target' },
    { value: 'Video', label: 'Video' },
    { value: 'FileText', label: 'File Text' }
  ];

  // Custom option component to display icons
  const OptionWithIcon = ({ innerProps, label, data }: any) => {
    const Icon = iconComponents[data.value as keyof typeof iconComponents];
    return (
      <div {...innerProps} className="flex items-center p-2 hover:bg-gray-700 cursor-pointer">
        <Icon className="w-4 h-4 mr-2" />
        <span>{label}</span>
      </div>
    );
  };

  // Custom single value component to display selected icon
  const SingleValueWithIcon = ({ children, data }: any) => {
    const Icon = iconComponents[data.value as keyof typeof iconComponents];
    return (
      <div className="flex items-center">
        <Icon className="w-4 h-4 mr-2" />
        <span>{children}</span>
      </div>
    );
  };

  const handleNext = () => {
    if (activeStep === 0 && (!formData.title || !formData.description)) {
      setError('Please fill in all required fields');
      return;
    }
    if (activeStep === 1 && !formData.category) {
      setError('Please select a category');
      return;
    }
    
    setError(null);
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSelectChange = (selectedOption: any) => {
    setFormData({
      ...formData,
      iconName: selectedOption.value
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!formData.title || !formData.description || !formData.category) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    
    try {
      const courseData = {
        title: formData.title,
        description: formData.description,
        shortDescription: formData.shortDescription,
        duration: formData.duration,
        category: formData.category,
        status: formData.status,
        isPublic: formData.isPublic,
        tags: formData.tags,
        iconName: formData.iconName,
      };
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.post('/api/ngo-lms/courses', courseData, config);
      
      setSuccess('Course created successfully!');
      
      setTimeout(() => {
        navigate('/coursestest?newCourse=true');
      }, 2000);
    } catch (err: any) {
      console.error('Course creation error:', err);
      
      if (err.response) {
        if (err.response.status === 401) {
          setError('Authentication error. Please log in again.');
        } else if (err.response.status === 403) {
          setError('You do not have permission to create courses.');
        } else if (err.response.status === 504 || err.response.status === 408) {
          setError('Request timed out. Please try again later.');
        } else {
          setError(err.response.data?.message || 'Failed to create course. Please try again.');
        }
      } else if (err.request) {
        setError('No response received from server. Please check your connection and try again.');
      } else {
        setError('An error occurred while creating the course. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Course Title *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  disabled={loading}
                  className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Enter course title"
                  required
                />
              </div>
              {!formData.title && error && (
                <p className="mt-1 text-sm text-red-400">Title is required</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Short Description
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  disabled={loading}
                  className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Brief summary of the course (max 200 characters)"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                rows={4}
                className="block w-full px-3 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                placeholder="Detailed description of the course content and objectives"
                required
              />
              {!formData.description && error && (
                <p className="mt-1 text-sm text-red-400">Description is required</p>
              )}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duration (minutes) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    disabled={loading}
                    min="1"
                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Course Icon
                </label>
                <Select
                  name="iconName"
                  value={iconOptions.find(option => option.value === formData.iconName)}
                  onChange={handleSelectChange}
                  isDisabled={loading}
                  options={iconOptions}
                  components={{
                    Option: OptionWithIcon,
                    SingleValue: SingleValueWithIcon
                  }}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      minHeight: '14px'
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: '#1f2937',
                      color: 'white'
                    }),
                    option: (base, { isFocused }) => ({
                      ...base,
                      backgroundColor: isFocused ? '#374151' : '#1f2937',
                      color: 'white'
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: 'white'
                    }),
                    input: (base) => ({
                      ...base,
                      color: 'white'
                    })
                  }}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={loading}
                className="block w-full px-3 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                placeholder="e.g., Programming, Design, Business"
                required
              />
              {!formData.category && error && (
                <p className="mt-1 text-sm text-red-400">Category is required</p>
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TagIcon className="h-5 w-5 text-gray-400" />
                <label className="block text-sm font-medium text-gray-300">
                  Tags
                </label>
                <div className="group relative">
                  <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                    Add relevant tags to help students find your course
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Add a tag and press Enter"
                />
                <button 
                  type="button"
                  onClick={handleAddTag} 
                  disabled={loading || !tagInput.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span 
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      disabled={loading}
                      className="ml-1 hover:text-blue-100 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    formData.isPublic ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {formData.isPublic ? (
                      <GlobeAltIcon className="h-6 w-6" />
                    ) : (
                      <LockClosedIcon className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {formData.isPublic ? 'Public Course' : 'Private Course'}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {formData.isPublic 
                        ? 'Visible to all users on the platform' 
                        : 'Only visible to enrolled students'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleChange}
                    disabled={loading}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-500"></div>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Course Status
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'draft', label: 'Draft', desc: 'Work in progress', color: 'yellow' },
                  { value: 'published', label: 'Published', desc: 'Live and accessible', color: 'green' },
                  { value: 'archived', label: 'Archived', desc: 'Hidden from view', color: 'gray' }
                ].map((status) => (
                  <label key={status.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={status.value}
                      checked={formData.status === status.value}
                      onChange={handleChange}
                      disabled={loading}
                      className="sr-only peer"
                    />
                    <div className={`p-4 rounded-lg border-2 transition-all peer-checked:border-blue-500 peer-checked:bg-blue-500/10 ${
                      formData.status === status.value 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}>
                      <div className={`w-8 h-8 rounded-full mb-2 flex items-center justify-center ${
                        status.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                        status.color === 'green' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        <div className="w-3 h-3 rounded-full bg-current"></div>
                      </div>
                      <h4 className="font-medium text-white mb-1">{status.label}</h4>
                      <p className="text-sm text-gray-400">{status.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <EyeIcon className="h-6 w-6 text-gray-400" />
                  <h3 className="text-lg font-semibold text-white">Course Preview</h3>
                </div>
                
                <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                  <div className="h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center relative">
                    {formData.iconName && (
                      <>
                        {(() => {
                          const Icon = iconComponents[formData.iconName as keyof typeof iconComponents];
                          return <Icon className="h-12 w-12 text-white opacity-40" />;
                        })()}
                        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white">
                          {formData.isPublic ? 'Public' : 'Private'}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-semibold text-white truncate">
                        {formData.title || 'Course Title'}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                        formData.status === 'published' ? 'bg-green-500/20 text-green-400' :
                        formData.status === 'archived' ? 'bg-gray-500/20 text-gray-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {formData.shortDescription || formData.description || 'Course description will appear here...'}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>{Math.floor(formData.duration / 60)}h {formData.duration % 60}m</span>
                      </div>
                      {formData.category && (
                        <div className="flex items-center gap-1">
                          <TagIcon className="h-4 w-4" />
                          <span>{formData.category}</span>
                        </div>
                      )}
                    </div>
                    
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {formData.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                        {formData.tags.length > 2 && (
                          <span className="px-2 py-1 bg-white/10 text-gray-400 text-xs rounded-full">
                            +{formData.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <button className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md text-sm font-medium">
                      Start Course
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Setup Progress</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Course title', completed: !!formData.title },
                    { label: 'Description', completed: !!formData.description },
                    { label: 'Category', completed: !!formData.category },
                    { label: 'Settings configured', completed: true }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        item.completed ? 'bg-green-500' : 'bg-white/10'
                      }`}>
                        {item.completed && <CheckCircleIcon className="h-3 w-3 text-white" />}
                      </div>
                      <span className={item.completed ? 'text-white' : 'text-gray-400'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Complete</span>
                    <span className="text-white">
                      {Math.round([
                        !!formData.title,
                        !!formData.description,
                        !!formData.category,
                        true
                      ].filter(Boolean).length * 25)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all" 
                      style={{ 
                        width: `${[
                          !!formData.title,
                          !!formData.description,
                          !!formData.category,
                          true
                        ].filter(Boolean).length * 25}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
            <AcademicCapIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Create New Course</h1>
            <p className="text-gray-400">Fill in the details below to create your new course. You can save as draft and come back later.</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          {error && (
            <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 p-4 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-green-500/10 border-b border-green-500/20 text-green-400 p-4 flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5" />
              <span>{success}</span>
            </div>
          )}

          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isActive = index === activeStep;
                const isCompleted = index < activeStep;
                return (
                  <div key={step} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isActive 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white/10 text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`}>
                      {step}
                    </span>
                    {index < steps.length - 1 && (
                      <div className={`w-16 h-px mx-4 ${
                        isCompleted ? 'bg-green-500' : 'bg-white/10'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {getStepContent(activeStep)}
          </div>

          <div className="p-6 border-t border-white/10 flex justify-between">
            <button
              type="button"
              onClick={activeStep === 0 ? () => navigate(-1) : handleBack}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 border border-white/10 text-white rounded-md hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              {activeStep === 0 ? 'Cancel' : 'Back'}
            </button>
            
            {activeStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  loading || 
                  (activeStep === 0 && (!formData.title || !formData.description)) ||
                  (activeStep === 1 && !formData.category)
                }
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !formData.title || !formData.description || !formData.category}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-md hover:from-green-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    Creating Course...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Create Course
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCourseTest;