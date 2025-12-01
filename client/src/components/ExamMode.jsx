import { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, BookOpen, Award, XCircle } from 'lucide-react';
import logo from '../assets/logo.png';

function ExamMode({ onExit }) {
  const [examState, setExamState] = useState('intro'); // intro, exam, results
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // {questionIndex: selectedAnswer(s)}
  const [timeRemaining, setTimeRemaining] = useState(90 * 60); // 90 minutes in seconds
  const [examStartTime, setExamStartTime] = useState(null);

  // Exam configuration based on Cloudera CDP Admin exam
  const EXAM_CONFIG = {
    totalQuestions: 80,
    duration: 90, // minutes
    passScore: 60, // percentage
    categories: {
      "Architecture": 14,
      "High Availability": 12.5,
      "Installation": 12.5,
      "Governance": 10,
      "Capacity Management": 10,
      "Cluster Maintenance": 6,
      "HDFS Administration": 10,
      "YARN Administration": 10
    }
  };

  // Start exam timer
  useEffect(() => {
    if (examState !== 'exam') return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [examState]);

  const loadExamQuestions = async () => {
    try {
      const response = await fetch(`${window.location.origin}/api/questions/exam`);
      const data = await response.json();
      setQuestions(data.questions);
      setExamState('exam');
      setExamStartTime(Date.now());
    } catch (error) {
      console.error('Error loading exam questions:', error);
      alert('Failed to load exam questions');
    }
  };

  const handleAnswer = (answer) => {
    const question = questions[currentQuestionIndex];
    const isMultiSelect = Object.keys(question.options).length > 4;

    if (isMultiSelect) {
      // Multiple selection
      const currentAnswers = answers[currentQuestionIndex] || [];
      const newAnswers = currentAnswers.includes(answer)
        ? currentAnswers.filter(a => a !== answer)
        : [...currentAnswers, answer];

      setAnswers({
        ...answers,
        [currentQuestionIndex]: newAnswers
      });
    } else {
      // Single selection
      setAnswers({
        ...answers,
        [currentQuestionIndex]: answer
      });
    }
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const handleFinishExam = () => {
    setExamState('results');
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateResults = () => {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    const categoryResults = {};

    questions.forEach((question, index) => {
      const userAnswer = answers[index];
      const correctAnswer = question.correctAnswers;

      // Initialize category if not exists
      if (!categoryResults[question.category]) {
        categoryResults[question.category] = { correct: 0, total: 0 };
      }
      categoryResults[question.category].total++;

      if (!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
        unanswered++;
      } else {
        const isCorrect = Array.isArray(correctAnswer)
          ? JSON.stringify([...correctAnswer].sort()) === JSON.stringify([...(Array.isArray(userAnswer) ? userAnswer : [userAnswer])].sort())
          : correctAnswer[0] === userAnswer;

        if (isCorrect) {
          correct++;
          categoryResults[question.category].correct++;
        } else {
          incorrect++;
        }
      }
    });

    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= EXAM_CONFIG.passScore;

    return {
      correct,
      incorrect,
      unanswered,
      total: questions.length,
      score,
      passed,
      categoryResults,
      timeTaken: Math.round((Date.now() - examStartTime) / 1000)
    };
  };

  // Intro Screen
  if (examState === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute top-6 right-6">
          <img src={logo} alt="Cloudera Logo" className="h-12 w-auto" />
        </div>

        <div className="max-w-3xl w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl mb-6">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              CDP Admin Exam Simulator
            </h1>
            <p className="text-xl text-slate-300">
              Cloudera Certified Administrator for CDP
            </p>
          </div>

          <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-white mb-6">Exam Details</h2>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-700/50 rounded-xl p-6 text-center">
                <BookOpen className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-1">Questions</p>
                <p className="text-3xl font-bold text-white">{EXAM_CONFIG.totalQuestions}</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-6 text-center">
                <Clock className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-1">Duration</p>
                <p className="text-3xl font-bold text-white">{EXAM_CONFIG.duration} min</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-6 text-center">
                <Award className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-1">Pass Score</p>
                <p className="text-3xl font-bold text-white">{EXAM_CONFIG.passScore}%</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">Exam Coverage:</h3>
              {Object.entries(EXAM_CONFIG.categories).map(([category, percentage]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-slate-300">{category}</span>
                  <span className="text-blue-400 font-semibold">{percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-500/10 border-2 border-yellow-500/50 rounded-xl p-6 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-yellow-400 font-semibold mb-2">Important Notes:</h3>
                <ul className="text-slate-300 space-y-2 text-sm">
                  <li>• Once started, the timer cannot be paused</li>
                  <li>• You can navigate between questions freely</li>
                  <li>• Questions with 5+ options may require multiple answers</li>
                  <li>• Click "Finish Exam" when ready or time will auto-submit</li>
                  <li>• Review your answers before finishing</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onExit}
              className="flex-1 px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={loadExamQuestions}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/50"
            >
              Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Exam Screen
  if (examState === 'exam' && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const isMultiSelect = Object.keys(currentQuestion.options).length > 4;
    const userAnswer = answers[currentQuestionIndex];
    const answeredCount = Object.keys(answers).filter(key => {
      const ans = answers[key];
      return ans && (Array.isArray(ans) ? ans.length > 0 : true);
    }).length;

    return (
      <div className="min-h-screen p-4 py-8">
        <div className="absolute top-6 right-6">
          <img src={logo} alt="Cloudera Logo" className="h-12 w-auto" />
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Header with Timer */}
          <div className="flex items-center justify-between mb-6 bg-slate-800 border-2 border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500 rounded-lg px-4 py-2">
                <p className="text-white font-bold">
                  Question {currentQuestionIndex + 1} / {questions.length}
                </p>
              </div>
              <div className="bg-slate-700 rounded-lg px-4 py-2">
                <p className="text-slate-300 text-sm">
                  Category: <span className="text-white font-medium">{currentQuestion.category}</span>
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-3 px-6 py-3 rounded-xl ${
              timeRemaining < 300 ? 'bg-red-500/20 border-2 border-red-500' : 'bg-blue-500/20 border-2 border-blue-500'
            }`}>
              <Clock className={`w-6 h-6 ${timeRemaining < 300 ? 'text-red-400' : 'text-blue-400'}`} />
              <span className={`text-2xl font-mono font-bold ${timeRemaining < 300 ? 'text-red-400' : 'text-white'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Question Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Question */}
              <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-8">
                <div className="flex items-start gap-3 mb-6">
                  <div className="bg-orange-500 rounded-lg px-3 py-1 text-white font-bold text-sm">
                    Q{currentQuestionIndex + 1}
                  </div>
                  {isMultiSelect && (
                    <div className="bg-blue-500 rounded-lg px-3 py-1 text-white font-medium text-sm">
                      Multiple Answers
                    </div>
                  )}
                </div>
                <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
                  {currentQuestion.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {Object.entries(currentQuestion.options).map(([key, value]) => {
                  const isSelected = isMultiSelect
                    ? (userAnswer || []).includes(key)
                    : userAnswer === key;

                  return (
                    <button
                      key={key}
                      onClick={() => handleAnswer(key)}
                      className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/20'
                          : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                          isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {key}
                        </div>
                        <p className="text-white leading-relaxed flex-1">{value}</p>
                        {isSelected && (
                          <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex gap-4">
                <button
                  onClick={() => goToQuestion(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => goToQuestion(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all"
                >
                  Next
                </button>
                <button
                  onClick={handleFinishExam}
                  className="ml-auto px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-green-500/50"
                >
                  Finish Exam
                </button>
              </div>
            </div>

            {/* Question Navigator */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 sticky top-4">
                <h3 className="text-white font-semibold mb-4">Progress</h3>
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Answered</span>
                    <span className="text-white font-bold">{answeredCount}/{questions.length}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_, index) => {
                    const hasAnswer = answers[index] && (Array.isArray(answers[index]) ? answers[index].length > 0 : true);
                    const isCurrent = index === currentQuestionIndex;

                    return (
                      <button
                        key={index}
                        onClick={() => goToQuestion(index)}
                        className={`aspect-square rounded-lg font-bold text-sm transition-all ${
                          isCurrent
                            ? 'bg-orange-500 text-white ring-2 ring-orange-400'
                            : hasAnswer
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span className="text-slate-300">Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-slate-700"></div>
                    <span className="text-slate-300">Not Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-500"></div>
                    <span className="text-slate-300">Current</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (examState === 'results') {
    const results = calculateResults();

    return (
      <div className="min-h-screen p-4 py-8">
        <div className="absolute top-6 right-6">
          <img src={logo} alt="Cloudera Logo" className="h-12 w-auto" />
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Results Header */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-24 h-24 ${
              results.passed ? 'bg-green-500' : 'bg-red-500'
            } rounded-2xl mb-6`}>
              {results.passed ? (
                <CheckCircle className="w-12 h-12 text-white" />
              ) : (
                <XCircle className="w-12 h-12 text-white" />
              )}
            </div>
            <h1 className={`text-5xl font-bold mb-4 ${results.passed ? 'text-green-400' : 'text-red-400'}`}>
              {results.passed ? 'Congratulations!' : 'Keep Practicing!'}
            </h1>
            <p className="text-xl text-slate-300">
              {results.passed ? 'You passed the exam!' : 'You did not pass this time.'}
            </p>
          </div>

          {/* Score Summary */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 text-center">
              <p className="text-slate-400 text-sm mb-2">Your Score</p>
              <p className={`text-5xl font-bold ${results.passed ? 'text-green-400' : 'text-red-400'}`}>
                {results.score}%
              </p>
              <p className="text-slate-500 text-sm mt-2">Pass: {EXAM_CONFIG.passScore}%</p>
            </div>
            <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 text-center">
              <p className="text-slate-400 text-sm mb-2">Correct</p>
              <p className="text-5xl font-bold text-green-400">{results.correct}</p>
              <p className="text-slate-500 text-sm mt-2">out of {results.total}</p>
            </div>
            <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 text-center">
              <p className="text-slate-400 text-sm mb-2">Incorrect</p>
              <p className="text-5xl font-bold text-red-400">{results.incorrect}</p>
              <p className="text-slate-500 text-sm mt-2">questions</p>
            </div>
            <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 text-center">
              <p className="text-slate-400 text-sm mb-2">Unanswered</p>
              <p className="text-5xl font-bold text-yellow-400">{results.unanswered}</p>
              <p className="text-slate-500 text-sm mt-2">questions</p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Performance by Category</h2>
            <div className="space-y-4">
              {Object.entries(results.categoryResults).map(([category, stats]) => {
                const percentage = Math.round((stats.correct / stats.total) * 100);
                return (
                  <div key={category}>
                    <div className="flex justify-between mb-2">
                      <span className="text-white font-medium">{category}</span>
                      <span className="text-slate-400">
                        {stats.correct}/{stats.total} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          percentage >= 70 ? 'bg-green-500' :
                          percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Review */}
          <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Detailed Review</h2>
            <div className="space-y-6">
              {questions.map((question, index) => {
                const userAnswer = answers[index];
                const correctAnswer = question.correctAnswers;
                const isCorrect = Array.isArray(correctAnswer)
                  ? JSON.stringify([...correctAnswer].sort()) === JSON.stringify([...(Array.isArray(userAnswer) ? userAnswer : [userAnswer])].sort())
                  : correctAnswer[0] === userAnswer;
                const wasAnswered = userAnswer && (Array.isArray(userAnswer) ? userAnswer.length > 0 : true);

                // Only show incorrect and unanswered questions
                if (isCorrect) return null;

                return (
                  <div key={index} className="border-2 border-slate-700 rounded-xl p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="bg-slate-700 rounded-lg px-3 py-1 text-white font-bold text-sm">
                        Q{index + 1}
                      </div>
                      <div className="bg-slate-700 rounded-lg px-3 py-1 text-slate-300 text-sm">
                        {question.category}
                      </div>
                      {!wasAnswered ? (
                        <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg px-3 py-1 text-yellow-400 font-medium text-sm">
                          Not Answered
                        </div>
                      ) : (
                        <div className="bg-red-500/20 border border-red-500 rounded-lg px-3 py-1 text-red-400 font-medium text-sm">
                          Incorrect
                        </div>
                      )}
                    </div>

                    <p className="text-white mb-4 leading-relaxed">{question.question}</p>

                    <div className="space-y-2 mb-4">
                      {Object.entries(question.options).map(([key, value]) => {
                        const isUserAnswer = Array.isArray(userAnswer)
                          ? userAnswer.includes(key)
                          : userAnswer === key;
                        const isCorrectAnswer = correctAnswer.includes(key);

                        return (
                          <div
                            key={key}
                            className={`p-4 rounded-lg border-2 ${
                              isCorrectAnswer
                                ? 'bg-green-500/20 border-green-500'
                                : isUserAnswer
                                ? 'bg-red-500/20 border-red-500'
                                : 'bg-slate-700/50 border-slate-600'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="font-bold text-white">{key}.</span>
                              <span className="text-white flex-1">{value}</span>
                              {isCorrectAnswer && (
                                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                              )}
                              {isUserAnswer && !isCorrectAnswer && (
                                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                      <p className="text-blue-400 font-semibold mb-2">Explanation:</p>
                      <p className="text-slate-300 text-sm leading-relaxed">{question.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onExit}
              className="flex-1 px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all"
            >
              Back to Home
            </button>
            <button
              onClick={() => {
                setExamState('intro');
                setAnswers({});
                setCurrentQuestionIndex(0);
                setTimeRemaining(90 * 60);
              }}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/50"
            >
              Retake Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-white text-xl">Loading exam...</div>
    </div>
  );
}

export default ExamMode;
