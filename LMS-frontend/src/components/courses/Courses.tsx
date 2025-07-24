import { useContext } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { BookOpenIcon, PlusIcon } from '@heroicons/react/24/outline'
import AuthContext from '../../context/AuthContext'

const Courses = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="flex flex-col min-h-[80vh] items-center justify-center w-full">
      <div className="flex items-center mb-8">
        <BookOpenIcon className="h-10 w-10 text-white mr-3" />
        <h1 className="text-4xl font-bold text-white">Curriculum</h1>
      </div>
      <div className="flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to Curriculum Management</h2>
        <p className="text-gray-400 max-w-xl mb-8">
          This is where you can create and manage your educational content structure.
        </p>
        {user && (user.role === 'instructor' || user.role === 'admin') && (
          <RouterLink
            to="/courses/curriculum"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md font-semibold shadow-md hover:from-blue-600 hover:to-purple-600 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Curriculum
          </RouterLink>
        )}
      </div>
      {/* Floating action button for mobile */}
      {user && (user.role === 'instructor' || user.role === 'admin') && (
        <RouterLink
          to="/courses/curriculum"
          className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center shadow-lg md:hidden"
          aria-label="add"
        >
          <PlusIcon className="h-6 w-6" />
        </RouterLink>
      )}
    </div>
  )
}

export default Courses 