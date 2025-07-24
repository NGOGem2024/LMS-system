import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Select, { SingleValue, MultiValue } from 'react-select';
import {
  AcademicCapIcon,
  BookmarkIcon,
  BookOpenIcon,
  ChevronRightIcon,
  EyeIcon,
  PlayCircleIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

// TypeScript Interfaces
interface Question {
  que: string;
  opt: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: string;
  explanation: string;
}

interface Quiz {
  questions: Question[];
}

interface Video {
  videoUrl: string;
  quiz: Quiz;
}

interface Chapter {
  chapterName: string;
  topicName: string;
  subtopicName: string;
  videos: Video[];
}

interface FormData {
  subject?: string;
  subjectName: string;
  board: string;
  grade: string;
  medium: string[];
  chapters: Chapter[];
}

interface Toast {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface DeleteConfirm {
  path: string;
  index: number;
  itemName: string;
}

interface SelectOption {
  readonly value: string;
  readonly label: string;
}

// Toast Component
const Toast: React.FC<{ message: string; type: string; onClose: () => void }> = ({ message, type, onClose }) => {
  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500' :
      type === 'error' ? 'bg-red-500' :
      'bg-blue-500'
    } text-white`}>
      <div className="flex items-center">
        <span className="mr-2">{message}</span>
        <button onClick={onClose} className="ml-4">×</button>
      </div>
    </div>
  );
};

// Add these helper components at the bottom of the file
function Badge({ children, color }: { children: React.ReactNode; color: "blue" | "green" | "yellow" }) {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

function Counter({ color, value, label }: { color: string; value: number; label: string }) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    yellow: "text-yellow-600 bg-yellow-50",
  } as Record<string, string>;
  return (
    <div className={`rounded-lg p-4 text-center ${colorClasses[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="font-medium text-gray-900">{value || "Not specified"}</p>
    </div>
  );
}

// Update the main component to include Step 2 and 3
const CurriculumForm: React.FC = () => {
  const initialFormData: FormData = {
    subjectName: '',
    board: '',
    grade: '',
    medium: [],
    chapters: [{
      chapterName: '',
      topicName: '',
      subtopicName: '',
      videos: [{
        videoUrl: '',
        quiz: {
          questions: Array(10).fill(null).map(() => ({
            que: '',
            opt: { a: '', b: '', c: '', d: '' },
            correctAnswer: '',
            explanation: ''
          }))
        }
      }]
    }]
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const [boards, setBoards] = useState<string[]>([]);
  const [mediums, setMediums] = useState<string[]>([]);
  const [inputMedium, setInputMedium] = useState('');
  const [inputBoard, setInputBoard] = useState('');

  // Add new state for step management
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    { title: 'Basic Info', icon: BookOpenIcon },
    { title: 'Chapters', icon: AcademicCapIcon },
    { title: 'Review', icon: EyeIcon },
  ];

  useEffect(() => {
    const fetchBoardsAndMediums = async () => {
      try {
        const [boardsRes, mediumsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/curriculum/boards'),
          axios.get('http://localhost:5000/api/curriculum/mediums')
        ]);
        
        setBoards(boardsRes.data.data || []);
        setMediums(mediumsRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch boards/mediums:', error);
      }
    };
    fetchBoardsAndMediums();
  }, []);

  useEffect(() => {
    if (formData.board !== 'SSC') {
      setFormData(prev => ({ ...prev, medium: [] }));
    }
  }, [formData.board]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleInputChange = (path: string, value: any) => {
    const keys = path.split('.');
    setFormData(prevData => {
      const newData = { ...prevData };
      let current = newData as any;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const addNewItem = (path: string) => {
    setFormData(prevData => {
      const keys = path.split('.');
      const newData = JSON.parse(JSON.stringify(prevData));
      let current = newData as any;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      const lastKey = keys[keys.length - 1];

      if (!Array.isArray(current[lastKey])) {
        current[lastKey] = [];
      }

      if (lastKey === 'chapters') {
        current[lastKey].push({
          chapterName: '',
          topicName: '',
          subtopicName: '',
          videos: [{
            videoUrl: '',
            quiz: { 
              questions: Array(10).fill(null).map(() => ({
                que: '',
                opt: { a: '', b: '', c: '', d: '' },
                correctAnswer: '',
                explanation: ''
              }))
            }
          }]
        });
      } else if (lastKey === 'videos') {
        current[lastKey].push({
          videoUrl: '',
          quiz: { 
            questions: Array(10).fill(null).map(() => ({
              que: '',
              opt: { a: '', b: '', c: '', d: '' },
              correctAnswer: '',
              explanation: ''
            }))
          }
        });
      } else if (lastKey === 'questions') {
        current[lastKey].push({
          que: '',
          opt: { a: '', b: '', c: '', d: '' },
          correctAnswer: '',
          explanation: ''
        });
      }

      return newData;
    });
  };

  const confirmDelete = (path: string, index: number, itemName: string) => {
    setShowDeleteConfirm({ path, index, itemName });
  };

  const handleDeleteConfirm = () => {
    if (showDeleteConfirm) {
      removeItem(showDeleteConfirm.path, showDeleteConfirm.index);
      setToast({
        type: 'info',
        message: `${showDeleteConfirm.itemName} removed successfully!`
      });
      setShowDeleteConfirm(null);
      
      setTimeout(() => {
        setToast(null);
      }, 3000);
    }
  };

  const removeItem = (path: string, index: number) => {
    const keys = path.split('.');
    
    setFormData(prevData => {
      const newData = JSON.parse(JSON.stringify(prevData)); // Deep clone to avoid mutation
      let current = newData as any;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      const lastKey = keys[keys.length - 1];
      current[lastKey].splice(index, 1);
      
      return newData;
    });
  };

  // Modify the step navigation handler
  const handleStepChange = (newStep: number) => {
    if (newStep === 1) {
      // When moving to Step 2, prevent form submission
      setActiveStep(newStep);
    } else {
      setActiveStep(newStep);
    }
  };

  // Modify the form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Only submit when explicitly clicking the submit button in step 3
    if (activeStep === 2) {
      // Check for minimum 10 questions per video
      const isValidChapterQuizCount = formData.chapters.every(chapter => 
        chapter.videos.every(video => 
          video.quiz.questions.length >= 10
        )
      );

      if (!isValidChapterQuizCount) {
        setToast({ type: 'error', message: 'Each video must have at least 10 questions.' });
        return;
      }

      setLoading(true);
      setError(null);
      setResponse(null);
      setToast(null);

      try {
        const payload = {
          subject: formData.subjectName,
          board: formData.board,
          grade: formData.grade,
          medium: formData.medium,
          chapters: formData.chapters
        };

        const response = await axios.post(
          'http://localhost:5000/api/curriculum/postCurriculumForm',
          payload,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
            
        setResponse(response.data);
        setToast({
          type: 'success',
          message: 'Curriculum added successfully!'
        });
        
        setFormData(initialFormData);
      } catch (err: any) {
        console.error('Error response:', err.response?.data);
        const errorMessage = err.response?.data?.message || 'Failed to add curriculum. Please try again.';
        setError(err.response?.data || { message: errorMessage });
        setToast({
          type: 'error',
          message: errorMessage
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const calculateProgress = useMemo(() => {
    let totalFields = 3;
    let filledFields = 0;

    if (formData.subjectName) filledFields++;
    if (formData.board) filledFields++;
    if (formData.grade) filledFields++;

    if (formData.board === 'SSC' && formData.medium) filledFields++;

    formData.chapters.forEach(chapter => {
      totalFields++; // Chapter name
      if (chapter.chapterName) filledFields++;

      if (chapter.topicName) filledFields++;
      if (chapter.subtopicName) filledFields++;

      chapter.videos?.forEach(video => {
        totalFields++; // Video URL
        if (video.videoUrl) filledFields++;

        video.quiz?.questions?.forEach(question => {
          totalFields += 6; // que, a, b, c, d, correctAnswer
          if (question.que) filledFields++;
          if (question.opt.a) filledFields++;
          if (question.opt.b) filledFields++;
          if (question.opt.c) filledFields++;
          if (question.opt.d) filledFields++;
          if (question.correctAnswer) filledFields++;
        });
      });
    });

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  }, [formData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Delete {showDeleteConfirm.itemName}?
            </h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete this {showDeleteConfirm.itemName}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
            <AcademicCapIcon className="h-10 w-10" />
          </div>
          <h2 className="mb-4 text-4xl font-bold text-gray-900">Create Amazing Curriculum</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Build engaging educational content with our intuitive curriculum builder. Add chapters, videos, and interactive quizzes to create the perfect learning experience.
          </p>
        </section>

        {/* Progress Overview */}
        <section className="mb-12 rounded-xl bg-white/60 p-6 shadow backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Progress Overview</h3>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {calculateProgress}% Complete
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all"
              style={{ width: `${calculateProgress}%` }}
            />
          </div>
        </section>

        {/* Step Navigation */}
        <nav className="mb-12 flex justify-center gap-8">
          {steps.map(({ title, icon: Icon }, idx) => {
            const active = idx === activeStep;
            const done = idx < activeStep;
            return (
              <div key={title} className="flex items-center">
                <button
                  onClick={() => setActiveStep(idx)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                    active
                      ? "border-blue-600 bg-blue-600 text-white shadow-lg"
                      : done
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-gray-300 bg-white text-gray-400 hover:border-gray-400"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </button>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${active ? "text-blue-600" : "text-gray-500"}`}>
                    Step {idx + 1}
                  </p>
                  <p className={`text-xs ${active ? "text-blue-600" : "text-gray-400"}`}>{title}</p>
                </div>
                {idx < steps.length - 1 && <ChevronRightIcon className="mx-6 h-5 w-5 text-gray-300" />}
              </div>
            );
          })}
        </nav>

        {/* Step Content */}
        {activeStep === 0 && (
          <section className="rounded-xl bg-white/60 shadow-xl backdrop-blur-sm">
            <header className="flex flex-col gap-2 p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 p-2">
                  <BookOpenIcon className="h-full w-full text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Basic Information</h3>
              </div>
              <p className="text-gray-600">Let's start with the fundamentals of your curriculum.</p>
            </header>

            <div className="space-y-8 p-6 pt-0">
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Subject Name */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1 text-base font-medium text-gray-700">
                    Subject Name
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subjectName}
                    onChange={(e) => handleInputChange('subjectName', e.target.value)}
                    className="h-12 w-full rounded-lg border border-gray-200 bg-white/80 px-4 text-base outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g., Mathematics"
                    required
                  />
                </div>

                {/* Grade */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1 text-base font-medium text-gray-700">
                    Grade Level
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.grade}
                    onChange={(e) => handleInputChange('grade', e.target.value)}
                    className="h-12 w-full rounded-lg border border-gray-200 bg-white/80 px-4 text-base outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g., 10"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                {/* Board Selection */}
                <div className="space-y-2">
                  <label className="block text-base font-medium text-gray-700">Educational Board</label>
                  <Select<SelectOption, false>
                    menuPortalTarget={document.body}
                    isClearable
                    styles={{
                      menuPortal: base => ({ ...base, zIndex: 9999 }),
                      control: base => ({
                        ...base,
                        minHeight: 48,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderColor: '#E5E7EB',
                        '&:hover': {
                          borderColor: '#3B82F6'
                        }
                      }),
                      menu: base => ({
                        ...base,
                        backgroundColor: '#2a3041',
                        border: '1px solid #374151'
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused ? '#374151' : '#2a3041',
                        color: '#E5E7EB',
                        '&:active': {
                          backgroundColor: '#4B5563'
                        }
                      }),
                      singleValue: base => ({
                        ...base,
                        color: '#111827'
                      }),
                      input: base => ({
                        ...base,
                        color: '#111827'
                      }),
                      placeholder: base => ({
                        ...base,
                        color: '#9CA3AF'
                      })
                    }}
                    options={boards.map(b => ({ value: b, label: b }))}
                    value={formData.board ? { value: formData.board, label: formData.board } : null}
                    onChange={(selectedOption) => {
                      handleInputChange('board', selectedOption?.value || '');
                    }}
                    placeholder="Select board"
                  />
                  
                  <div className="flex">
                    <input
                      type="text"
                      value={inputBoard}
                      onChange={(e) => setInputBoard(e.target.value)}
                      className="flex-1 rounded-l-lg border border-gray-200 bg-white/80 px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Add new board"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = inputBoard.trim();
                        if (trimmed && !boards.includes(trimmed)) {
                          setBoards(prev => [...prev, trimmed]);
                          handleInputChange('board', trimmed);
                        }
                        setInputBoard('');
                      }}
                      className="rounded-r-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-white transition-colors hover:from-blue-700 hover:to-indigo-700"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Medium Selection */}
                <div className="space-y-2">
                  <label className="block text-base font-medium text-gray-700">Medium of Instruction</label>
                  <Select<SelectOption, true>
                    isMulti
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: base => ({ ...base, zIndex: 9999 }),
                      control: base => ({
                        ...base,
                        minHeight: 48,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderColor: '#E5E7EB',
                        '&:hover': {
                          borderColor: '#3B82F6'
                        }
                      }),
                      menu: base => ({
                        ...base,
                        backgroundColor: '#2a3041',
                        border: '1px solid #374151'
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused ? '#374151' : '#2a3041',
                        color: '#E5E7EB',
                        '&:active': {
                          backgroundColor: '#4B5563'
                        }
                      }),
                      multiValue: base => ({
                        ...base,
                        backgroundColor: '#374151'
                      }),
                      multiValueLabel: base => ({
                        ...base,
                        color: '#E5E7EB'
                      }),
                      multiValueRemove: base => ({
                        ...base,
                        color: '#E5E7EB',
                        '&:hover': {
                          backgroundColor: '#4B5563',
                          color: '#E5E7EB'
                        }
                      }),
                      input: base => ({
                        ...base,
                        color: '#111827'
                      }),
                      placeholder: base => ({
                        ...base,
                        color: '#9CA3AF'
                      })
                    }}
                    options={mediums.map(m => ({ value: m, label: m }))}
                    value={formData.medium?.map(m => ({ value: m, label: m })) || []}
                    onChange={(selectedOptions) => {
                      const values = selectedOptions ? selectedOptions.map(option => option.value) : [];
                      handleInputChange('medium', values);
                    }}
                    placeholder="Select medium(s)"
                  />
                  
                  <div className="flex">
                    <input
                      type="text"
                      value={inputMedium}
                      onChange={(e) => setInputMedium(e.target.value)}
                      className="flex-1 rounded-l-lg border border-gray-200 bg-white/80 px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Add new medium"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = inputMedium.trim();
                        if (trimmed && !mediums.includes(trimmed)) {
                          setMediums(prev => [...prev, trimmed]);
                          handleInputChange('medium', [...formData.medium, trimmed]);
                        }
                        setInputMedium('');
                      }}
                      className="rounded-r-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-white transition-colors hover:from-blue-700 hover:to-indigo-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => handleStepChange(1)}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-medium text-white transition-all hover:from-blue-700 hover:to-indigo-700"
                >
                  Continue to Chapters
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Chapters Step */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <section className="rounded-xl bg-white/60 p-6 shadow-xl backdrop-blur-sm">
              <header className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  <AcademicCapIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Curriculum Chapters</h3>
                  <p className="mt-1 text-gray-600">
                    Structure your content into organized chapters with videos and quizzes
                  </p>
                </div>
              </header>
            </section>

            {formData.chapters.map((chapter, chapterIndex) => (
              <section key={chapterIndex} className="rounded-xl bg-white/60 shadow-xl backdrop-blur-sm">
                <header className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-lg font-bold text-white">
                      {chapterIndex + 1}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">Chapter {chapterIndex + 1}</h4>
                      <div className="mt-1 flex gap-4">
                        <Badge color="blue">{chapter.videos.length} videos</Badge>
                        <Badge color="green">
                          {chapter.videos.reduce((sum, v) => sum + v.quiz.questions.length, 0)} questions
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {formData.chapters.length > 1 && (
                    <button
                      type="button"
                      onClick={() => confirmDelete(`chapters`, chapterIndex, 'chapter')}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </header>

                <div className="space-y-8 p-6 pt-0">
                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Chapter Name *</label>
                      <input
                        type="text"
                        value={chapter.chapterName}
                        onChange={(e) => handleInputChange(`chapters.${chapterIndex}.chapterName`, e.target.value)}
                        className="h-12 w-full rounded-lg border border-gray-200 bg-white/80 px-4 text-base outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="e.g., Introduction to Algebra"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Topic Name</label>
                      <input
                        type="text"
                        value={chapter.topicName}
                        onChange={(e) => handleInputChange(`chapters.${chapterIndex}.topicName`, e.target.value)}
                        className="h-12 w-full rounded-lg border border-gray-200 bg-white/80 px-4 text-base outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="e.g., Linear Equations"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Subtopic Name</label>
                      <input
                        type="text"
                        value={chapter.subtopicName}
                        onChange={(e) => handleInputChange(`chapters.${chapterIndex}.subtopicName`, e.target.value)}
                        className="h-12 w-full rounded-lg border border-gray-200 bg-white/80 px-4 text-base outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="e.g., Solving for X"
                      />
                    </div>
                  </div>

                  {/* Videos Section */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h5 className="text-lg font-semibold text-gray-900">Video Content</h5>
                      <button
                        type="button"
                        onClick={() => addNewItem(`chapters.${chapterIndex}.videos`)}
                        className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <PlusIcon className="mr-2 h-4 w-4" /> Add Video
                      </button>
                    </div>

                    {chapter.videos.map((video, videoIndex) => (
                      <div
                        key={videoIndex}
                        className="rounded-lg border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6"
                      >
                        {/* Video Content */}
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                                <PlayCircleIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <h6 className="font-semibold text-gray-900">Video {videoIndex + 1}</h6>
                                <Badge color="yellow">{video.quiz.questions.length} questions</Badge>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => confirmDelete(`chapters.${chapterIndex}.videos`, videoIndex, 'video')}
                              className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="space-y-6">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Video URL *</label>
                              <input
                                type="url"
                                value={video.videoUrl}
                                onChange={(e) =>
                                  handleInputChange(`chapters.${chapterIndex}.videos.${videoIndex}.videoUrl`, e.target.value)
                                }
                                className="h-12 w-full rounded-lg border border-gray-200 bg-white/80 px-4 text-base outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                placeholder="https://youtube.com/watch?v=..."
                              />
                            </div>

                            {/* Questions Section */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h6 className="font-semibold text-gray-900">Quiz Questions</h6>
                              </div>

                              {/* Questions List */}
                              {video.quiz.questions.map((question, questionIndex) => (
                                <div
                                  key={questionIndex}
                                  className="rounded-lg border border-gray-200 bg-white/80 p-6 space-y-6"
                                >
                                  {/* Question Header */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-sm font-bold text-white">
                                        {questionIndex + 1}
                                      </div>
                                      <span className="font-medium text-gray-900">Question {questionIndex + 1}</span>
                                    </div>
                                    {video.quiz.questions.length > 10 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          confirmDelete(
                                            `chapters.${chapterIndex}.videos.${videoIndex}.quiz.questions`,
                                            questionIndex,
                                            'question'
                                          )
                                        }
                                        className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>

                                  {/* Question Form */}
                                  <div className="space-y-6">
                                    <div className="space-y-2">
                                      <label className="block text-sm font-medium text-gray-700">Question *</label>
                                      <input
                                        type="text"
                                        value={question.que}
                                        onChange={(e) =>
                                          handleInputChange(
                                            `chapters.${chapterIndex}.videos.${videoIndex}.quiz.questions.${questionIndex}.que`,
                                            e.target.value
                                          )
                                        }
                                        className="h-12 w-full rounded-lg border border-gray-200 bg-white/80 px-4 text-base outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Enter your question"
                                        required
                                      />
                                    </div>

                                    <div className="grid gap-4 lg:grid-cols-2">
                                      {['A', 'B', 'C', 'D'].map((opt) => (
                                        <div key={opt} className="space-y-2">
                                          <label className="block text-sm font-medium text-gray-700">
                                            Option {opt} *
                                          </label>
                                          <input
                                            type="text"
                                            value={question.opt[opt.toLowerCase() as keyof typeof question.opt]}
                                            onChange={(e) =>
                                              handleInputChange(
                                                `chapters.${chapterIndex}.videos.${videoIndex}.quiz.questions.${questionIndex}.opt.${opt.toLowerCase()}`,
                                                e.target.value
                                              )
                                            }
                                            className="h-12 w-full rounded-lg border border-gray-200 bg-white/80 px-4 text-base outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                            placeholder={`Option ${opt}`}
                                            required
                                          />
                                        </div>
                                      ))}
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-2">
                                      <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                          Correct Answer *
                                        </label>
                                        <select
                                          value={question.correctAnswer}
                                          onChange={(e) =>
                                            handleInputChange(
                                              `chapters.${chapterIndex}.videos.${videoIndex}.quiz.questions.${questionIndex}.correctAnswer`,
                                              e.target.value
                                            )
                                          }
                                          className="h-12 w-full rounded-lg border border-gray-200 bg-white/80 px-4 text-base outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                          required
                                        >
                                          <option value="">Select correct answer</option>
                                          <option value="a">Option A</option>
                                          <option value="b">Option B</option>
                                          <option value="c">Option C</option>
                                          <option value="d">Option D</option>
                                        </select>
                                      </div>

                                      <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Explanation</label>
                                        <input
                                          type="text"
                                          value={question.explanation}
                                          onChange={(e) =>
                                            handleInputChange(
                                              `chapters.${chapterIndex}.videos.${videoIndex}.quiz.questions.${questionIndex}.explanation`,
                                              e.target.value
                                            )
                                          }
                                          className="h-12 w-full rounded-lg border border-gray-200 bg-white/80 px-4 text-base outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                          placeholder="Explain why this is the correct answer..."
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              {/* Add Question Button - Moved to bottom */}
                              <div className="flex justify-center mt-4">
                                <button
                                  type="button"
                                  onClick={() => addNewItem(`chapters.${chapterIndex}.videos.${videoIndex}.quiz.questions`)}
                                  className="inline-flex items-center rounded-lg px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                >
                                  <PlusIcon className="mr-2 h-4 w-4" /> Add Another Question
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ))}

            {/* Add Chapter Button */}
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => addNewItem("chapters")}
                className="inline-flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-8 py-4 text-base font-medium text-gray-700 hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PlusIcon className="mr-2 h-5 w-5" />
                Add New Chapter
              </button>
            </div>

            {/* Navigation */}
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => handleStepChange(0)}
                className="inline-flex items-center justify-center rounded-lg px-8 py-3 text-base font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
              >
                Back to Basic Info
              </button>
              <button
                type="button"
                onClick={() => handleStepChange(2)}
                className="inline-flex items-center justify-center rounded-lg px-8 py-3 text-base font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Review & Submit
                <ChevronRightIcon className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Review Step */}
        {activeStep === 2 && (
          <section className="rounded-xl bg-white/60 shadow-xl backdrop-blur-sm">
            <header className="flex flex-col gap-2 p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 p-2">
                  <EyeIcon className="h-full w-full text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Review Your Curriculum</h3>
              </div>
              <p className="text-gray-600">
                Take a final look at your curriculum before publishing
              </p>
            </header>

            <div className="space-y-8 p-6 pt-0">
              {/* Basic Summary */}
              <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 p-6">
                <h4 className="mb-4 text-lg font-semibold text-gray-900">Curriculum Summary</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Subject</p>
                    <p className="font-medium text-gray-900">{formData.subjectName || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Grade</p>
                    <p className="font-medium text-gray-900">{formData.grade || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Board</p>
                    <p className="font-medium text-gray-900">{formData.board || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Medium</p>
                    <p className="font-medium text-gray-900">{formData.medium.length > 0 ? formData.medium.join(', ') : "Not specified"}</p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-6">
                  <span className="text-4xl font-bold text-blue-600">{formData.chapters.length}</span>
                  <span className="mt-1 text-sm text-blue-600">Chapters</span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-6">
                  <span className="text-4xl font-bold text-green-600">
                    {formData.chapters.reduce((sum, chapter) => sum + chapter.videos.length, 0)}
                  </span>
                  <span className="mt-1 text-sm text-green-600">Videos</span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 p-6">
                  <span className="text-4xl font-bold text-yellow-600">
                    {formData.chapters.reduce((sum, chapter) => 
                      sum + chapter.videos.reduce((vSum, video) => vSum + video.quiz.questions.length, 0), 0
                    )}
                  </span>
                  <span className="mt-1 text-sm text-yellow-600">Questions</span>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => handleStepChange(1)}
                  className="rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back to Chapters
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-3 text-sm font-medium text-white hover:from-emerald-700 hover:to-green-700"
                >
                  <SparklesIcon className="h-4 w-4" />
                  Publish Curriculum
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default CurriculumForm;
