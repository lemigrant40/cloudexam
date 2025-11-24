import { useState, useEffect } from 'react';
import { CheckCircle, Users, Clock, Pause, Play, XCircle } from 'lucide-react';
import Timer from './Timer';
import { t } from '../i18n/translations';

function QuestionScreen({ question, roomData, voteCount, hasAnswered, onSubmitAnswer, socket, isHost, language }) {
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(180);

  useEffect(() => {
    // Reset selection when question changes
    setSelectedAnswers([]);
    setTimerPaused(false);
    setTimeRemaining(180);
  }, [question?.id]);

  // Listen for timer pause/resume events
  useEffect(() => {
    if (!socket) return;

    const handleTimerPaused = ({ timeRemaining: remaining }) => {
      setTimerPaused(true);
      setTimeRemaining(Math.ceil(remaining / 1000)); // Convert ms to seconds
    };

    const handleTimerResumed = ({ timeRemaining: remaining }) => {
      setTimerPaused(false);
      setTimeRemaining(Math.ceil(remaining / 1000)); // Convert ms to seconds
    };

    socket.on('timer:paused', handleTimerPaused);
    socket.on('timer:resumed', handleTimerResumed);

    return () => {
      socket.off('timer:paused', handleTimerPaused);
      socket.off('timer:resumed', handleTimerResumed);
    };
  }, [socket]);

  const handlePauseTimer = () => {
    if (!socket || !roomData) return;
    socket.emit('timer:pause', roomData.id, (response) => {
      if (response.success) {
        setTimerPaused(true);
        setTimeRemaining(Math.ceil(response.timeRemaining / 1000));
      } else {
        console.error('Failed to pause timer:', response.error);
      }
    });
  };

  const handleResumeTimer = () => {
    if (!socket || !roomData) return;
    socket.emit('timer:resume', roomData.id, (response) => {
      if (response.success) {
        setTimerPaused(false);
        setTimeRemaining(Math.ceil(response.timeRemaining / 1000));
      } else {
        console.error('Failed to resume timer:', response.error);
      }
    });
  };

  const handleEndRound = () => {
    if (!socket || !roomData) return;

    const confirmed = window.confirm(t('endRoundConfirm', language));
    if (!confirmed) return;

    socket.emit('game:endRound', roomData.id, (response) => {
      if (!response.success) {
        console.error('Failed to end round:', response.error);
      }
    });
  };

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading question...</div>
      </div>
    );
  }

  const isMultiSelect = Object.keys(question.options).length > 4;

  const handleOptionToggle = (optionKey) => {
    if (hasAnswered) return;

    if (isMultiSelect) {
      // Multiple selection
      setSelectedAnswers(prev =>
        prev.includes(optionKey)
          ? prev.filter(key => key !== optionKey)
          : [...prev, optionKey]
      );
    } else {
      // Single selection
      setSelectedAnswers([optionKey]);
    }
  };

  const handleSubmit = () => {
    if (selectedAnswers.length === 0 || hasAnswered) return;

    const answer = isMultiSelect ? selectedAnswers : selectedAnswers[0];
    onSubmitAnswer(answer);
  };

  const optionLetters = Object.keys(question.options).sort();

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 rounded-lg px-4 py-2">
              <p className="text-white font-bold">
                {t('question', language)} {question.questionNumber} / {question.totalQuestions}
              </p>
            </div>
            {question.originalQuestionNumber && question.originalQuestionNumber !== question.questionNumber && (
              <div className="bg-slate-700 rounded-lg px-3 py-2">
                <p className="text-slate-300 text-sm">
                  {t('original', language)}: #{question.originalQuestionNumber}
                </p>
              </div>
            )}
            {/* End Round button for host */}
            {isHost && (
              <button
                onClick={handleEndRound}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all font-medium"
                title={t('endRound', language)}
              >
                <XCircle className="w-5 h-5" />
                <span className="hidden md:inline">{t('endRound', language)}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Vote Counter */}
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2">
              <Users className="w-5 h-5 text-slate-400" />
              <span className="text-white font-medium">
                {voteCount.voted} / {voteCount.total}
              </span>
            </div>

            {/* Pause/Resume Button (Host only) */}
            {isHost && (
              <button
                onClick={timerPaused ? handleResumeTimer : handlePauseTimer}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all font-medium ${
                  timerPaused
                    ? 'bg-green-500/20 border-green-500 text-green-400 hover:bg-green-500/30'
                    : 'bg-amber-500/20 border-amber-500 text-amber-400 hover:bg-amber-500/30'
                }`}
              >
                {timerPaused ? (
                  <>
                    <Play className="w-5 h-5" />
                    {language === 'es' ? 'Reanudar' : 'Resume'}
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5" />
                    {language === 'es' ? 'Pausar' : 'Pause'}
                  </>
                )}
              </button>
            )}

            {/* Timer */}
            <Timer duration={timeRemaining} isPaused={timerPaused} />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">?</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white leading-relaxed whitespace-pre-wrap">
                {question.question}
              </h2>
              {isMultiSelect && (
                <p className="text-amber-400 text-sm mt-3 font-medium">
                  {t('multipleAnswers', language)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {optionLetters.map((optionKey) => {
            const isSelected = selectedAnswers.includes(optionKey);
            const optionColors = {
              A: 'border-blue-500 bg-blue-500/10',
              B: 'border-green-500 bg-green-500/10',
              C: 'border-amber-500 bg-amber-500/10',
              D: 'border-purple-500 bg-purple-500/10',
              E: 'border-pink-500 bg-pink-500/10',
            };

            return (
              <button
                key={optionKey}
                onClick={() => handleOptionToggle(optionKey)}
                disabled={hasAnswered}
                className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? `${optionColors[optionKey] || 'border-blue-500 bg-blue-500/10'} scale-[1.02]`
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600 hover:bg-slate-750'
                } ${hasAnswered ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold ${
                    isSelected
                      ? 'bg-white text-slate-900'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {optionKey}
                  </div>
                  <p className={`flex-1 text-lg ${
                    isSelected ? 'text-white font-medium' : 'text-slate-300'
                  }`}>
                    {question.options[optionKey]}
                  </p>
                  {isSelected && (
                    <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-4">
          {!hasAnswered ? (
            <button
              onClick={handleSubmit}
              disabled={selectedAnswers.length === 0}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/50 disabled:shadow-none"
            >
              {selectedAnswers.length === 0 ? t('selectAnswer', language) : t('submitAnswer', language)}
            </button>
          ) : (
            <div className="w-full py-4 bg-green-500/20 border-2 border-green-500 text-green-400 rounded-xl font-bold text-lg text-center">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-6 h-6" />
                {t('answerSubmitted', language)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuestionScreen;
