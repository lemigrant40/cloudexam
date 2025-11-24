import { CheckCircle, XCircle, Users, ArrowRight, BarChart3 } from 'lucide-react';

function ResultsScreen({ results, isHost, onNextQuestion }) {
  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading results...</div>
      </div>
    );
  }

  const optionLetters = Object.keys(results.options).sort();
  const maxVotes = Math.max(...Object.values(results.voteCounts), 1);

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-xl mb-4">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Results</h1>
          <p className="text-slate-400">
            {results.totalVotes} / {results.totalPlayers} players voted
          </p>
        </div>

        {/* Question */}
        <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-8 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 whitespace-pre-wrap">
            {results.question}
          </h2>
        </div>

        {/* Voting Results */}
        <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Group Voting Results
          </h3>

          <div className="space-y-3">
            {optionLetters.map((optionKey) => {
              const votes = results.voteCounts[optionKey] || 0;
              const percentage = results.totalVotes > 0 ? (votes / results.totalVotes) * 100 : 0;
              const isCorrect = results.correctAnswers.includes(optionKey);
              const barWidth = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;

              return (
                <div
                  key={optionKey}
                  className={`relative p-4 rounded-xl border-2 ${
                    isCorrect
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-slate-600 bg-slate-700/50'
                  }`}
                >
                  {/* Background bar */}
                  <div
                    className={`absolute inset-0 rounded-xl transition-all duration-500 ${
                      isCorrect ? 'bg-green-500/20' : 'bg-slate-600/20'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />

                  {/* Content */}
                  <div className="relative flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold ${
                      isCorrect
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-600 text-slate-300'
                    }`}>
                      {optionKey}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm mb-1 truncate ${
                        isCorrect ? 'text-white font-medium' : 'text-slate-300'
                      }`}>
                        {results.options[optionKey]}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                          {votes} vote{votes !== 1 ? 's' : ''}
                        </span>
                        {percentage > 0 && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="text-xs text-slate-400">
                              {percentage.toFixed(0)}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {isCorrect && (
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Correct Answer */}
        <div className="bg-green-500/10 border-2 border-green-500 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Correct Answer{results.correctAnswers.length > 1 ? 's' : ''}
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {results.correctAnswers.map((answer) => (
              <div
                key={answer}
                className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg"
              >
                {answer}
              </div>
            ))}
          </div>
          {results.explanation && (
            <div>
              <p className="text-sm font-medium text-green-400 mb-2">Explanation:</p>
              <p className="text-slate-300 leading-relaxed">
                {results.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Next Button */}
        <div className="sticky bottom-4">
          {isHost ? (
            <button
              onClick={onNextQuestion}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-purple-500/50 flex items-center justify-center gap-3"
            >
              Next Question
              <ArrowRight className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-full py-4 bg-slate-700/50 border-2 border-slate-600 text-slate-400 rounded-xl font-medium text-center">
              Waiting for host to continue...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultsScreen;
