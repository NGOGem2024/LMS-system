import { useContext } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { BookOpenIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline'
import AuthContext from '../../context/AuthContext'

const Courses = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="flex flex-col min-h-[80vh] items-center justify-center w-full">
      {/* Large Icon Banner */}
      <div className="flex flex-col items-center mb-6">
        <div className="bg-gradient-to-br from-purple-500 to-violet-400 rounded-2xl p-5 mb-6 shadow-lg">
          <BookOpenIcon className="h-14 w-14 text-white" />
        </div>
        <h1 className="text-5xl font-extrabold text-white mb-2">Curriculum</h1>
        <h2 className="text-2xl font-bold text-white mb-4">Welcome to Curriculum Management</h2>
        <p className="text-gray-300 max-w-2xl mb-1 text-lg">
          This is where you can create and manage your educational content structure.<br />
          Build comprehensive learning paths and organize your courses effectively.
        </p>
      </div>
      {/* Action Buttons */}
      {user && (user.role === 'instructor' || user.role === 'admin') && (
        <div className="flex flex-row gap-8 mt-6">
          <RouterLink
            to="/courses/curriculum"
            className="inline-flex items-center px-5 py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-xl font-semibold shadow-xl hover:from-purple-600 hover:to-violet-600 transition-colors text-base focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Curriculum
          </RouterLink>
          <RouterLink
            to="/courses/curriculum/edit"
            className="inline-flex items-center px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-xl font-semibold shadow-xl hover:from-emerald-600 hover:to-teal-500 transition-colors text-base focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            Edit Curriculum
          </RouterLink>
        </div>
      )}
    </div>
  )
}

export default Courses 