import { useState, useEffect } from 'react'
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
  LinearProgress,
  Card,
  CardContent,
  Skeleton
} from '@mui/material'
import {
  Timer as TimerIcon,
  CheckCircle as CorrectIcon,
  Cancel as IncorrectIcon
} from '@mui/icons-material'
import axios from 'axios'
import { useLoading } from '../../context/LoadingContext'

interface Question {
  _id: string
  text: string
  options: string[]
  correctAnswer?: number
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
  questions: Question[]
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
  const { setPageLoading } = useLoading()
  
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  
  // Load quiz and start attempt
  useEffect(() => {
    const fetchQuizAndStartAttempt = async () => {
      setPageLoading(true)
      setError(null)
      
      try {
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
      } finally {
        setPageLoading(false)
      }
    }
    
    fetchQuizAndStartAttempt()
  }, [id, setPageLoading])
  
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
  
  if (isComplete) {
    // Show results
    const isPassed = score >= quiz.passingScore
    
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Quiz Results
          </Typography>
          
          <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h2" color={isPassed ? 'success.main' : 'error.main'}>
              {score}%
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
              {isPassed ? 
                'Congratulations! You passed the quiz.' : 
                `Sorry, you didn't pass. Required: ${quiz.passingScore}%`}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" gutterBottom>
              Correct answers: {Math.round((score / 100) * quiz.questions.length)} 
              out of {quiz.questions.length}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={score} 
              color={isPassed ? 'success' : 'error'} 
              sx={{ height: 10, borderRadius: 5, my: 2 }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => navigate(`/courses/${quiz.course._id}`)}
            >
              Return to Course
            </Button>
            <Button 
              variant="contained" 
              onClick={() => navigate('/quizzes')}
            >
              All Quizzes
            </Button>
          </Box>
        </Paper>
        
        {/* Detailed review - optional */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Review Questions
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          {quiz.questions.map((question, index) => (
            <Card key={index} sx={{ mb: 2, border: '1px solid', borderColor: answers[index] === question.correctAnswer ? 'success.light' : 'error.light' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {answers[index] === question.correctAnswer ? 
                    <CorrectIcon color="success" sx={{ mr: 1 }} /> : 
                    <IncorrectIcon color="error" sx={{ mr: 1 }} />}
                  <Typography variant="h6">
                    Question {index + 1}
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                  {question.text}
                </Typography>
                
                <FormControl component="fieldset">
                  <RadioGroup value={answers[index]}>
                    {question.options.map((option, optIndex) => (
                      <FormControlLabel 
                        key={optIndex}
                        value={optIndex}
                        control={<Radio />}
                        label={option}
                        disabled
                        sx={{ 
                          ...(optIndex === question.correctAnswer && {
                            color: 'success.main',
                            fontWeight: 'bold'
                          })
                        }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>
          ))}
        </Paper>
      </Container>
    )
  }
  
  const currentQuestion = quiz.questions[currentQuestionIndex]
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            {quiz.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TimerIcon sx={{ mr: 1, color: timeRemaining < 60000 ? 'error.main' : 'inherit' }} />
            <Typography 
              variant="h6" 
              color={timeRemaining < 60000 ? 'error.main' : 'inherit'}
              sx={{ fontFamily: 'monospace' }}
            >
              {formatTimeRemaining()}
            </Typography>
          </Box>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={(currentQuestionIndex + 1) / quiz.questions.length * 100} 
          sx={{ height: 8, borderRadius: 4, mb: 3 }}
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        ) : (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                {currentQuestion.text}
              </Typography>
              
              <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }}>
                <RadioGroup 
                  value={answers[currentQuestionIndex]?.selectedOptions?.[0] || ''}
                  onChange={(e) => handleAnswerChange(
                    currentQuestion._id, 
                    e.target.value, 
                    'multiple-choice'
                  )}
                >
                  {currentQuestion.options.map((option, index) => (
                    <FormControlLabel 
                      key={index}
                      value={option}
                      control={<Radio />}
                      label={option}
                      sx={{ 
                        mb: 1, 
                        p: 1, 
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
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