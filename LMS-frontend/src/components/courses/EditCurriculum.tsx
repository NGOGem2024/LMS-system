import React, { useState, useEffect } from 'react';
import { BookOpenIcon, BuildingLibraryIcon, ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface AvailableOptionsResponse {
  success: boolean;
  data: {
    boards: string[];
    grades: string[];
  };
}

interface Subject {
  _id: string;
  subject: string;
  board: string;
  grade: string;
  medium: string[];
}

const boardFullForms: { [key: string]: string } = {
  CBSE: "Central Board of Secondary Education",
  SSC: "State Board of Education",
};

const subjectImageMap: { [key: string]: string } = {
  "Mathematics": "https://learnomicstorage.blob.core.windows.net/subjectimages/8th-ssc/Mathematics-8th-semi_1750765092439.png?sv=2025-05-05&st=2025-06-24T11%3A38%3A15Z&se=2026-06-24T11%3A38%3A15Z&sr=b&sp=r&sig=adbz3dJ1WMgOchy9GGbk5NhGNsRwtCO02%2BhOGFyMvAI%3D",
  "English": "https://learnomicstorage.blob.core.windows.net/learnomicstorage/Subjects%20Image/8th-marathi/English-8th-marathi-semi.png?sp=r&st=2025-06-24T09:47:45Z&se=2026-06-24T17:47:45Z&spr=https&sv=2024-11-04&sr=b&sig=%2FMVBAbIhHSjmYLcgFTeYvedseR%2Fk9EIB5b462yyf3W0%3D",
  "General Science": "https://learnomicstorage.blob.core.windows.net/subjectimages/8th-ssc/science-8th-semi_1750765140158.png?sv=2025-05-05&st=2025-06-24T11%3A39%3A03Z&se=2026-06-24T11%3A39%3A03Z&sr=b&sp=r&sig=0Kz3HFdAAHBj0wrdToGkXuURP5lCmseWDIaBkZ3nCIQ%3D",
  "बालभारती": "https://learnomicstorage.blob.core.windows.net/learnomicstorage/Subjects%20Image/8th-marathi/Marathi-8th-marathi%2Bsemi.png?sp=r&st=2025-06-24T09:56:06Z&se=2026-06-24T17:56:06Z&spr=https&sv=2024-11-04&sr=b&sig=BTD8aZmyQAm4Eju4FoUPS3qK7sWV41fTaHuRHw45iLg%3D",
  "इतिहास व नागरिकशास्त्र": "https://learnomicstorage.blob.core.windows.net/subjectimages/8th-ssc/history-8th-marathi_1750764861510.png?sv=2025-05-05&st=2025-06-24T11%3A34%3A27Z&se=2026-06-24T11%3A34%3A27Z&sr=b&sp=r&sig=jcBgM4UeWXsXnoBPklTDdOheCk%2FgqOuzv3ZCOpTVVr8%3D",
  "भूगोल": "https://learnomicstorage.blob.core.windows.net/learnomicstorage/Subjects%20Image/8th-marathi/Geography-8th-marathi.png?sp=r&st=2025-06-24T09:55:07Z&se=2026-06-24T17:55:07Z&spr=https&sv=2024-11-04&sr=b&sig=2tF%2BUgY%2FzzB3b92Vwv1h6LAvNv3OurqR5aWTSroqM5E%3D",
  "हिंदी": "https://learnomicstorage.blob.core.windows.net/subjectimages/8th-ssc/hindi-8th-marathi-semi.png?sp=r&st=2025-06-25T09:58:12Z&se=2026-06-25T17:58:12Z&spr=https&sv=2024-11-04&sr=b&sig=49nw9TKIlXIw%2FkCnH5WNOgnu7MmZ2lO3vxpLP%2F6H5ZI%3D",
  // Add more as needed
};

const EditCurriculum: React.FC = () => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [mediums, setMediums] = useState<string[]>([]);
  const [showMediums, setShowMediums] = useState<boolean>(false);
  const [grades, setGrades] = useState<string[]>([]);
  const [showGrades, setShowGrades] = useState<boolean>(false);
  const [hasMediums, setHasMediums] = useState<boolean>(false);
  const [selectedMedium, setSelectedMedium] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showSubjects, setShowSubjects] = useState<boolean>(false);

  // Fetch available options when component mounts
  useEffect(() => {
    const fetchAvailableOptions = async () => {
      try {
        setLoading(true);
        const response = await axios.get<AvailableOptionsResponse>('http://localhost:5000/api/curriculum/available-options', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.data.success) {
          setBoards(response.data.data.boards);
        } else {
          throw new Error('Failed to fetch available options');
        }
      } catch (err) {
        console.error('Error fetching available options:', err);
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || err.message || 'Failed to load available options');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load available options');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableOptions();
  }, []);

  const handleEditCurriculum = () => {
    if (!selectedBoard) {
      alert('Please select a board to proceed');
      return;
    }
    
    // Here you can implement the edit curriculum logic
    console.log('Editing curriculum for board:', selectedBoard);
    // You can navigate to the actual edit form or open a modal
  };

  const handleEditSubject = async (subjectId: string) => {
    try {
      setLoading(true);
      
      // Fetch the complete curriculum data for this subject
      const response = await axios.get(`http://localhost:5000/api/curriculum/curriculum/${subjectId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.data.success) {
        // Navigate to CurriculumForm with the curriculum data
        navigate('/courses/curriculum', { 
          state: { 
            editMode: true, 
            subjectId: subjectId,
            curriculumData: response.data.data 
          } 
        });
      } else {
        setError('Failed to fetch curriculum data for editing');
      }
    } catch (err) {
      console.error('Error fetching curriculum data:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch curriculum data');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch curriculum data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGrade = async (grade: string) => {
    // Show confirmation dialog
    const confirmationMessage = `Are you sure you want to delete grade "${grade}" from board "${selectedBoard}"${hasMediums && selectedMedium ? ` with medium "${selectedMedium}"` : ''}?\n\nThis will permanently delete:\n• All subjects in this grade\n• All chapters, topics, and subtopics\n• All videos and quizzes\n\nThis action cannot be undone!`;
    
    console.log('Delete confirmation message:', confirmationMessage);
    console.log('Selected medium:', selectedMedium);
    console.log('Has mediums:', hasMediums);
    
    const isConfirmed = window.confirm(confirmationMessage);

    if (!isConfirmed) {
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        board: selectedBoard,
        grade: grade,
        ...(hasMediums && selectedMedium && { medium: selectedMedium })
      };

      console.log('Delete grade payload:', payload);

      const response = await axios.delete('http://localhost:5000/api/curriculum/grade', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: payload
      });

      if (response.data.success) {
        // Show success message
        alert(`Successfully deleted grade "${grade}"!\n\nDeleted:\n• ${response.data.deletedCounts.subjects} subjects\n• ${response.data.deletedCounts.chapters} chapters\n• ${response.data.deletedCounts.topics} topics\n• ${response.data.deletedCounts.subtopics} subtopics\n• ${response.data.deletedCounts.videos} videos\n• ${response.data.deletedCounts.quizzes} quizzes`);
        
        // Refresh the current view
        if (showSubjects) {
          // If we're showing subjects, go back to grades view
          setShowSubjects(false);
          setShowGrades(true);
          setSubjects([]);
        } else if (showGrades) {
          // If we're showing grades, refresh the grades list
          try {
            const res = await axios.get(`http://localhost:5000/api/curriculum/grades/${selectedBoard}${hasMediums && selectedMedium ? `?medium=${encodeURIComponent(selectedMedium)}` : ''}`);
            setGrades(res.data.data || []);
          } catch (err) {
            console.error('Error refreshing grades:', err);
            setGrades([]);
          }
        }
      } else {
        setError(response.data.message || 'Failed to delete grade');
      }
    } catch (err) {
      console.error('Error deleting grade:', err);
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to delete grade';
        const errorDetails = err.response?.data?.query ? `\n\nQuery details: ${JSON.stringify(err.response.data.query, null, 2)}` : '';
        setError(errorMessage + errorDetails);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to delete grade');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string, subjectName: string) => {
    // Show confirmation dialog
    const isConfirmed = window.confirm(
      `Are you sure you want to delete subject "${subjectName}"?\n\nThis will permanently delete:\n• All chapters, topics, and subtopics for this subject\n• All videos and quizzes for this subject\n\nThis action cannot be undone!`
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await axios.delete(`http://localhost:5000/api/curriculum/subject/${subjectId}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.success) {
        // Show success message
        alert(`Successfully deleted subject "${subjectName}"!\n\nDeleted:\n• ${response.data.deletedCounts.chapters} chapters\n• ${response.data.deletedCounts.topics} topics\n• ${response.data.deletedCounts.subtopics} subtopics\n• ${response.data.deletedCounts.videos} videos\n• ${response.data.deletedCounts.quizzes} quizzes`);
        
        // Refresh the subjects list
        try {
          const payload = {
            board: selectedBoard,
            grade: selectedGrade,
            ...(hasMediums && selectedMedium && { medium: selectedMedium })
          };

          const subjectsResponse = await axios.post('http://localhost:5000/api/curriculum/subjects', payload, {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (Array.isArray(subjectsResponse.data)) {
            setSubjects(subjectsResponse.data);
          }
        } catch (err) {
          console.error('Error refreshing subjects:', err);
          // If refresh fails, go back to grades view
          setShowSubjects(false);
          setShowGrades(true);
          setSubjects([]);
        }
      } else {
        setError(response.data.message || 'Failed to delete subject');
      }
    } catch (err) {
      console.error('Error deleting subject:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.message || 'Failed to delete subject');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to delete subject');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 animate-pulse">
            <BookOpenIcon className="h-8 w-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading available boards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-full mb-6">
            <BookOpenIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] p-6">
      <div className="w-full px-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-xl">
            <BookOpenIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Edit Curriculum
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Select a board to customize and edit your educational curriculum structure
          </p>
          
        
        </div>

        {/* Boards Selection Section */}
        <div className="mb-12">
          {/* Navigation Cards */}
          {(showMediums || showGrades || showSubjects) && (
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                {/* Boards Card */}
                <div 
                  onClick={() => {
                    setShowGrades(false);
                    setShowMediums(false);
                    setShowSubjects(false);
                    setGrades([]);
                    setMediums([]);
                    setSubjects([]);
                  }}
                  className="group flex items-center space-x-3 p-4 rounded-xl bg-[#252b3a] border-2 border-slate-600 hover:border-blue-400 hover:bg-[#2a3441] cursor-pointer transition-all duration-300 transform hover:scale-105"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <BuildingLibraryIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Go Back To</p>
                    <p className="font-semibold text-white group-hover:text-blue-300">Boards</p>
                  </div>
                </div>

                {showMediums && !showGrades && !showSubjects && (
                  <>
                    <ChevronRightIcon className="h-6 w-6 text-gray-500" />

                    <div className="flex items-center space-x-3 p-4 rounded-xl bg-[#2a3441] border-2 border-green-400">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                        <BookOpenIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Current Level</p>
                        <p className="font-semibold text-white">Mediums</p>
                      </div>
                    </div>
                  </>
                )}

                {showGrades && hasMediums && !showSubjects && (
                  <>
                    <ChevronRightIcon className="h-6 w-6 text-gray-500" />

                    <div 
                      onClick={() => {
                        setShowGrades(false);
                        setGrades([]);
                      }}
                      className="group flex items-center space-x-3 p-4 rounded-xl bg-[#252b3a] border-2 border-slate-600 hover:border-green-400 hover:bg-[#2a3441] cursor-pointer transition-all duration-300 transform hover:scale-105"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                        <BookOpenIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Go Back To</p>
                        <p className="font-semibold text-white group-hover:text-green-300">Mediums</p>
                      </div>
                    </div>

                    <ChevronRightIcon className="h-6 w-6 text-gray-500" />

                    <div className="flex items-center space-x-3 p-4 rounded-xl bg-[#2a3441] border-2 border-green-400">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                        <BookOpenIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Current Level</p>
                        <p className="font-semibold text-white">Grades</p>
                      </div>
                    </div>
                  </>
                )}

                {showSubjects && hasMediums && (
                  <>
                    <ChevronRightIcon className="h-6 w-6 text-gray-500" />

                    <div 
                      onClick={() => {
                        setShowSubjects(false);
                        setShowMediums(true);
                        setShowGrades(false);
                        setSubjects([]);
                      }}
                      className="group flex items-center space-x-3 p-4 rounded-xl bg-[#252b3a] border-2 border-slate-600 hover:border-green-400 hover:bg-[#2a3441] cursor-pointer transition-all duration-300 transform hover:scale-105"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                        <BookOpenIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Go Back To</p>
                        <p className="font-semibold text-white group-hover:text-green-300">Mediums</p>
                      </div>
                    </div>

                    <ChevronRightIcon className="h-6 w-6 text-gray-500" />

                    <div 
                      onClick={() => {
                        setShowSubjects(false);
                        setShowGrades(true);
                        setSubjects([]);
                      }}
                      className="group flex items-center space-x-3 p-4 rounded-xl bg-[#252b3a] border-2 border-slate-600 hover:border-purple-400 hover:bg-[#2a3441] cursor-pointer transition-all duration-300 transform hover:scale-105"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                        <BookOpenIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Go Back To</p>
                        <p className="font-semibold text-white group-hover:text-purple-300">Grades</p>
                      </div>
                    </div>

                    <ChevronRightIcon className="h-6 w-6 text-gray-500" />

                    <div className="flex items-center space-x-3 p-4 rounded-xl bg-[#2a3441] border-2 border-green-400">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                        <BookOpenIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Current Level</p>
                        <p className="font-semibold text-white">Subjects</p>
                      </div>
                    </div>
                  </>
                )}

                {showGrades && !hasMediums && !showSubjects && (
                  <>
                    <ChevronRightIcon className="h-6 w-6 text-gray-500" />

                    <div className="flex items-center space-x-3 p-4 rounded-xl bg-[#2a3441] border-2 border-green-400">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                        <BookOpenIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Current Level</p>
                        <p className="font-semibold text-white">Grades</p>
                      </div>
                    </div>
                  </>
                )}

                {showSubjects && !hasMediums && (
                  <>
                    <ChevronRightIcon className="h-6 w-6 text-gray-500" />

                    <div 
                      onClick={() => {
                        setShowSubjects(false);
                        setShowGrades(true);
                        setSubjects([]);
                      }}
                      className="group flex items-center space-x-3 p-4 rounded-xl bg-[#252b3a] border-2 border-slate-600 hover:border-purple-400 hover:bg-[#2a3441] cursor-pointer transition-all duration-300 transform hover:scale-105"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                        <BookOpenIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Go Back To</p>
                        <p className="font-semibold text-white group-hover:text-purple-300">Grades</p>
                      </div>
                    </div>

                    <ChevronRightIcon className="h-6 w-6 text-gray-500" />

                    <div className="flex items-center space-x-3 p-4 rounded-xl bg-[#2a3441] border-2 border-green-400">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                        <BookOpenIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Current Level</p>
                        <p className="font-semibold text-white">Subjects</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center space-x-3">
              <BuildingLibraryIcon className="h-8 w-8 text-blue-400" />
              <h2 className="text-3xl font-bold text-white">
                {showSubjects ? 'Available Subjects' : showGrades ? 'Available Grades' : showMediums ? 'Available Mediums' : 'Available Boards'}
              </h2>
            </div>
          </div>
          
          {showGrades ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {grades.length > 0 ? grades.map((grade, idx) => (
                <div key={idx} className="group relative p-6 rounded-2xl bg-[#252b3a] border-2 border-slate-600 hover:border-slate-500 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-4 flex-1 cursor-pointer"
                      onClick={async () => {
                        try {
                          setSelectedGrade(grade);
                          setLoading(true);
                          
                          // Prepare payload with all selected options
                          const payload = {
                            board: selectedBoard,
                            grade: grade,
                            ...(hasMediums && { medium: selectedMedium })
                          };

                          // Call POST /subjects API
                          const response = await axios.post('http://localhost:5000/api/curriculum/subjects', payload, {
                            headers: {
                              'Content-Type': 'application/json'
                            }
                          });

                          console.log('Subjects response:', response.data);
                          
                          // Store subjects and show them
                          if (Array.isArray(response.data)) {
                            setSubjects(response.data);
                            setShowSubjects(true);
                            setShowGrades(false); // Hide grades view when showing subjects
                            setShowMediums(false); // Also hide mediums view when showing subjects
                          } else {
                            setError('Invalid subjects response format');
                          }
                          
                        } catch (err) {
                          console.error('Error fetching subjects:', err);
                          if (axios.isAxiosError(err)) {
                            setError(err.response?.data?.message || err.message || 'Failed to fetch subjects');
                          } else {
                            setError(err instanceof Error ? err.message : 'Failed to fetch subjects');
                          }
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      <div className="flex-shrink-0 w-4 h-4 rounded-full border-2 border-blue-400 bg-blue-400 shadow-lg shadow-blue-400/50"></div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors">{grade}</h3>
                      </div>
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGrade(grade);
                      }}
                      className="ml-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                      title={`Delete grade ${grade}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-16 col-span-full">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2a3441] rounded-full mb-4">
                    <BuildingLibraryIcon className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-xl">No grades available for this board</p>
                </div>
              )}
            </div>
          ) : showSubjects ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
              {subjects.length > 0 ? subjects.map((subject, idx) => (
                <div key={subject._id || idx} className="group relative bg-[#252b3a] border-2 border-slate-600 hover:border-slate-500 hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl overflow-hidden">
                  {/* Image placeholder area */}
                  <div className="relative w-full h-68">
                    {subjectImageMap[subject.subject] ? (
                      <img
                        src={subjectImageMap[subject.subject]}
                        alt="Subject Preview"
                        className="w-full h-full rounded-t-2xl object-top object-cover scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-t-2xl">
                        <BookOpenIcon className="h-16 w-16 text-white/60" />
                      </div>
                    )}
                  </div>
                  
                  {/* Subject information */}
                  <div className="p-4 pb-20 relative">
                    <h3 className="text-lg font-semibold text-white group-hover:text-green-300 transition-colors mb-3 mt-2 line-clamp-2">
                      {subject.subject}
                    </h3>
                    
                    <div className="space-y-2 text-sm pr-24">
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                        <span className="text-gray-300">Board: <span className="text-white">{subject.board}</span></span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                        <span className="text-gray-300">Grade: <span className="text-white">{subject.grade}</span></span>
                      </div>
                      
                      {subject.medium && subject.medium.length > 0 && (
                        <div className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-300">Medium: </span>
                            <span className="text-white break-words">
                              {subject.medium.length > 1 
                                ? subject.medium.map((med, index) => (
                                    <span key={index}>
                                      {med}
                                      {index < subject.medium.length - 1 && <br />}
                                    </span>
                                  ))
                                : subject.medium.join(', ')
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-1">
                      {/* Edit Button */}
                      <button
                        className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold shadow-md hover:from-purple-600 hover:to-blue-600 transition-all duration-200 cursor-pointer text-sm"
                        onClick={() => handleEditSubject(subject._id)}
                        title="Edit subject"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                          <path d="M15.04 7.13c.39-.39 1.02-.39 1.41 0l.42.42c.39.39.39 1.02 0 1.41l-7.09 7.09-2.12.71.71-2.12 7.09-7.09z" fill="none" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Edit
                      </button>
                      
                      {/* Delete Button */}
                      <button
                        className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-semibold shadow-md hover:from-red-600 hover:to-pink-600 transition-all duration-200 cursor-pointer text-sm"
                        onClick={() => handleDeleteSubject(subject._id, subject.subject)}
                        title="Delete subject"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-16 col-span-full">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2a3441] rounded-full mb-4">
                    <BookOpenIcon className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-xl">No subjects available for the selected criteria</p>
                </div>
              )}
            </div>
          ) : showMediums ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {mediums.length > 0 ? mediums.map((medium, idx) => (
                <div key={idx} className="group relative p-6 rounded-2xl bg-[#252b3a] border-2 border-slate-600 hover:border-slate-500 hover:shadow-xl cursor-pointer transition-all duration-300 transform hover:scale-105"
                  onClick={async () => {
                    try {
                      setSelectedMedium(medium);
                      setLoading(true);
                      setShowGrades(false);
                      setShowSubjects(false);
                      const res = await axios.get(`http://localhost:5000/api/curriculum/grades/${selectedBoard}?medium=${encodeURIComponent(medium)}`);
                      setGrades(res.data.data || []);
                      setShowGrades(true);
                    } catch (err) {
                      setError('Failed to fetch grades');
                      setGrades([]);
                      setShowGrades(false);
                      setSubjects([]);
                      setShowSubjects(false);
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full border-2 border-blue-400 bg-blue-400 shadow-lg shadow-blue-400/50"></div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors">{medium}</h3>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-16 col-span-full">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2a3441] rounded-full mb-4">
                    <BuildingLibraryIcon className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-xl">No mediums available for this board</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {boards.map((board, index) => (
                <div 
                  key={index}
                  onClick={async () => {
                    setSelectedBoard(board);
                    if (board === 'SSC') {
                      try {
                        setLoading(true);
                        setShowMediums(false);
                        setShowGrades(false);
                        setShowSubjects(false);
                        setHasMediums(true);
                        const res = await axios.get(`http://localhost:5000/api/curriculum/mediums/${board}`);
                        console.log('Mediums response:', res.data);
                        setMediums(res.data.data || []);
                        setShowMediums(true);
                      } catch (err) {
                        setError('Failed to fetch mediums');
                        setMediums([]);
                        setShowMediums(false);
                        setSubjects([]);
                        setShowSubjects(false);
                      } finally {
                        setLoading(false);
                      }
                    } else if (board === 'CBSE') {
                      try {
                        setLoading(true);
                        setShowMediums(false);
                        setShowGrades(false);
                        setShowSubjects(false);
                        setHasMediums(false);
                        const res = await axios.get(`http://localhost:5000/api/curriculum/grades/${board}`);
                        setGrades(res.data.data || []);
                        setShowGrades(true);
                      } catch (err) {
                        setError('Failed to fetch grades');
                        setGrades([]);
                        setShowGrades(false);
                        setSubjects([]);
                        setShowSubjects(false);
                      } finally {
                        setLoading(false);
                      }
                    } else {
                      setShowMediums(false);
                      setShowGrades(false);
                      setShowSubjects(false);
                      setMediums([]);
                      setGrades([]);
                      setSubjects([]);
                      setHasMediums(false);
                    }
                  }}
                  className={`group relative p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    selectedBoard === board
                      ? 'bg-[#2a3441] border-2 border-blue-400 shadow-2xl shadow-blue-500/25'
                      : 'bg-[#252b3a] border-2 border-slate-600 hover:border-slate-500 hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                      selectedBoard === board
                        ? 'bg-blue-400 border-blue-400 shadow-lg shadow-blue-400/50'
                        : 'border-gray-400 group-hover:border-gray-300'
                    }`}>
                      {selectedBoard === board && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors">
                        {board === 'SSC' ? 'State Board' : board}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        {boardFullForms[board] || board}
                      </p>
                    </div>
                  </div>
                  
                  {/* Animated border effect */}
                  <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                    selectedBoard === board
                      ? 'bg-blue-500/10 opacity-100'
                      : 'opacity-0 group-hover:opacity-100 bg-slate-500/5'
                  }`}></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Board Summary */}
        {/* Removed Selected Board Summary and Edit Curriculum button as per request */}
      </div>
    </div>
  );
};

export default EditCurriculum;