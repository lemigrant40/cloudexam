import { Trophy, Home } from 'lucide-react';
import logo from '../assets/logo.png';

function FinishedScreen({ roomData, onBackToHome }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Logo in top-right corner */}
      <div className="absolute top-6 right-6">
        <img src={logo} alt="Cloudera Logo" className="h-12 w-auto" />
      </div>

      <div className="max-w-2xl w-full text-center">
        {/* Trophy Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl mb-6 animate-bounce">
          <Trophy className="w-12 h-12 text-white" />
        </div>

        {/* Heading */}
        <h1 className="text-5xl font-bold text-white mb-4">
          Exam Complete!
        </h1>

        <p className="text-xl text-slate-300 mb-8">
          Great job! You've completed all {roomData?.totalQuestions || 'the'} questions.
        </p>

        {/* Stats Card */}
        <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Session Summary</h2>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-700/50 rounded-xl p-6">
              <p className="text-slate-400 text-sm mb-2">Total Questions</p>
              <p className="text-4xl font-bold text-white">
                {roomData?.totalQuestions || 0}
              </p>
            </div>

            <div className="bg-slate-700/50 rounded-xl p-6">
              <p className="text-slate-400 text-sm mb-2">Participants</p>
              <p className="text-4xl font-bold text-white">
                {roomData?.players?.length || 0}
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm">
              💡 Review the explanations to reinforce your learning
            </p>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-2 border-purple-500/30 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-2">
            Keep Learning!
          </h3>
          <p className="text-slate-300">
            Collaborative learning is one of the most effective ways to prepare for certification exams.
            Practice regularly with your team to build confidence and knowledge.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onBackToHome}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-blue-500/50 flex items-center gap-3"
          >
            <Home className="w-6 h-6" />
            Back to Home
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12">
          <p className="text-slate-500 text-sm">
            CloudExam Prep - Collaborative Exam Preparation Platform
          </p>
        </div>
      </div>
    </div>
  );
}

export default FinishedScreen;
