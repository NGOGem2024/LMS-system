import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  TextField,
  CircularProgress,
  Alert,
  Stack,
  LinearProgress
} from '@mui/material'
import axios from 'axios'
import AuthContext from '../../context/AuthContext'

interface QuizQuestion {
  _id: string
  questionText: string
  questionType: 'multiple-choice' | 'true-false' | 'short-answer' | 'matching' | 'fill-in-blanks'
  options: { _id: string; text: string }[]
  points: number
  difficulty: string
}

interface Quiz {
  _id: string
  title: string
  description: string
  course: {
    _id: string
    title: string
  }
  module?: {
    _id: string
    title: string
  }
  timeLimit: number
  passingScore: number
  totalPoints: number
  shuffleQuestions: boolean
  questions: QuizQuestion[]
  attemptLimit: number
  canAttempt: boolean
  attemptsCount: number
}

interface QuizAttempt {
  _id: string
  quiz: string
  startTime: string
  answers: {
    questionId: string
    selectedOptions?: string[]
    textAnswer?: string
  }[]
}

interface Answer {
  questionId: string
  selectedOptions?: string[]
  textAnswer?: string
}

const QuizAttempt = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Load quiz and start attempt
  useEffect(() => {
    const fetchQuizAndStartAttempt = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch quiz details
        const quizRes = await axios.get(`/api/quizzes/${id}`)
        setQuiz(quizRes.data.data)
        
        // Check if user can attempt
        if (!quizRes.data.data.canAttempt) {
          setError(`You have reached the maximum number of attempts (${quizRes.data.data.attemptLimit})`)
          setLoading(false)
          return
        }
        
        // Start a new attempt
        const attemptRes = await axios.post(`/api/quizzes/${id}/attempt`)
        setAttempt(attemptRes.data.data)
        
        // Initialize answers array
        const initialAnswers = quizRes.data.data.questions.map(q => ({
          questionId: q._id,
          selectedOptions: [],
          textAnswer: ''
        }))
        setAnswers(initialAnswers)
        
        // Set time remaining if there's a time limit
        if (quizRes.data.data.timeLimit) {
          const startTime = new Date(attemptRes.data.data.startTime).getTime()
          const endTime = startTime + (quizRes.data.data.timeLimit * 60 * 1000)
          setTimeRemaining(Math.max(0, endTime - Date.now()))
        }
        
        setLoading(false)
      } catch (err: any) {
        console.error('Error starting quiz attempt:', err)
        setError(err.response?.data?.error || 'Failed to start quiz attempt')
        setLoading(false)
      }
    }
    
    fetchQuizAndStartAttempt()
  }, [id])
  
  // Timer countdown
  useEffect(() => {
    if (!timeRemaining) return
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (!prev || prev <= 1000) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prev - 1000
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [timeRemaining])
  
  // Handle answer changes
  const handleAnswerChange = (questionId: string, value: string | string[], type: string) => {
    setAnswers(prev => 
      prev.map(a => {
        if (a.questionId === questionId) {
          if (type === 'multiple-choice') {
            return { ...a, selectedOptions: [value as string] }
          } else if (type === 'checkbox') {
            const selectedOptions = [...(a.selectedOptions || [])]
            const valueStr = value as string
            
            if (selectedOptions.includes(valueStr)) {
              return { 
                ...a, 
                selectedOptions: selectedOptions.filter(id => id !== valueStr)
              }
            } else {
              return { ...a, selectedOptions: [...selectedOptions, valueStr] }
            }
          } else if (type === 'text') {
            return { ...a, textAnswer: value as string }
          }
        }
        return a
      })
    )
  }
  
  // Navigate to next/previous question
  const handleNavigation = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }
  
  // Submit quiz attempt
  const handleSubmit = async () => {
    if (!attempt) return
    
    try {
      setSubmitting(true)
      setError(null)
      
      await axios.put(`/api/quizzes/attempts/${attempt._id}`, {
        answers
      })
      
      setSuccess('Quiz submitted successfully!')
      setTimeout(() => {
        navigate(`/courses/${quiz?.course._id}`)
      }, 2000)
    } catch (err: any) {
      console.error('Error submitting quiz:', err)
      setError(err.response?.data?.error || 'Failed to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }
  
  // Format time remaining
  const formatTimeRemaining = () => {
    if (!timeRemaining) return ''
    
    const minutes = Math.floor(timeRemaining / 60000)
    const seconds = Math.floor((timeRemaining % 60000) / 1000)
    
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }
  
  // Calculate progress
  const calculateProgress = () => {
    if (!quiz) return 0
    
    const answeredQuestions = answers.filter(a => 
      (a.selectedOptions && a.selectedOptions.length > 0) || 
      (a.textAnswer && a.textAnswer.trim() !== '')
    ).length
    
    return Math.round((answeredQuestions / quiz.questions.length) * 100)
  }
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading quiz...
        </Typography>
      </Container>
    )
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Container>
    )
  }
  
  if (!quiz || !attempt) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Quiz not found or could not start attempt
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Container>
    )
  }
  
  const currentQuestion = quiz.questions[currentQuestionIndex]
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">{quiz.title}</Typography>
          
          {timeRemaining !== null && (
            <Box sx={{ 
              p: 1, 
              border: '1px solid', 
              borderColor: timeRemaining < 60000 ? 'error.main' : 'primary.main',
              borderRadius: 1,
              color: timeRemaining < 60000 ? 'error.main' : 'primary.main',
              fontWeight: 'bold'
            }}>
              Time: {formatTimeRemaining()}
            </Box>
          )}
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={(currentQuestionIndex + 1) / quiz.questions.length * 100} 
            sx={{ mt: 1 }}
          />
        </Box>
        
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        ) : (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                {currentQuestion.questionText}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ({currentQuestion.points} points) • {currentQuestion.difficulty}
              </Typography>
              
              {currentQuestion.questionType === 'multiple-choice' && (
                <FormControl component="fieldset" fullWidth sx={{ mt: 2 }}>
                  <RadioGroup
                    value={answers[currentQuestionIndex]?.selectedOptions?.[0] || ''}
                    onChange={(e) => handleAnswerChange(
                      currentQuestion._id, 
                      e.target.value, 
                      'multiple-choice'
                    )}
                  >
                    {currentQuestion.options.map(option => (
                      <FormControlLabel
                        key={option._id}
                        value={option._id}
                        control={<Radio />}
                        label={option.text}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}
              
              {currentQuestion.questionType === 'true-false' && (
                <FormControl component="fieldset" fullWidth sx={{ mt: 2 }}>
                  <RadioGroup
                    value={answers[currentQuestionIndex]?.selectedOptions?.[0] || ''}
                    onChange={(e) => handleAnswerChange(
                      currentQuestion._id, 
                      e.target.value, 
                      'multiple-choice'
                    )}
                  >
                    <FormControlLabel value="true" control={<Radio />} label="True" />
                    <FormControlLabel value="false" control={<Radio />} label="False" />
                  </RadioGroup>
                </FormControl>
              )}
              
              {currentQuestion.questionType === 'short-answer' && (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  placeholder="Type your answer here..."
                  value={answers[currentQuestionIndex]?.textAnswer || ''}
                  onChange={(e) => handleAnswerChange(
                    currentQuestion._id, 
                    e.target.value, 
                    'text'
                  )}
                  sx={{ mt: 2 }}
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                variant="outlined"
                onClick={() => handleNavigation('prev')}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              
              {currentQuestionIndex < quiz.questions.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={() => handleNavigation('next')}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </Button>
              )}
            </Box>
          </>
        )}
      </Paper>
      
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Quiz Progress: {calculateProgress()}%
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={calculateProgress()} 
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {quiz.questions.map((q, index) => {
            const isAnswered = answers[index] && 
              ((answers[index].selectedOptions && answers[index].selectedOptions.length > 0) || 
              (answers[index].textAnswer && answers[index].textAnswer.trim() !== ''))
            
            return (
              <Button
                key={q._id}
                variant={currentQuestionIndex === index ? 'contained' : 'outlined'}
                color={isAnswered ? 'success' : 'primary'}
                size="small"
                onClick={() => setCurrentQuestionIndex(index)}
                sx={{ minWidth: 36, height: 36, p: 0 }}
              >
                {index + 1}
              </Button>
            )
          })}
        </Box>
      </Paper>
    </Container>
  )
}

export default QuizAttempt 