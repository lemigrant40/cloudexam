import { useState } from 'react';
import { Users, LogIn, BookOpen, ListOrdered, Hash, Globe } from 'lucide-react';
import { t } from '../i18n/translations';

function HomeScreen({ onCreateRoom, onJoinRoom, totalQuestions = 349, language, setLanguage }) {
  const [mode, setMode] = useState(null); // null, 'create', 'join'
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  // Question range settings
  const [rangeMode, setRangeMode] = useState('all'); // 'all', 'range', 'count'
  const [startQuestion, setStartQuestion] = useState(1);
  const [endQuestion, setEndQuestion] = useState(totalQuestions);
  const [questionCount, setQuestionCount] = useState(10);
  const [shuffle, setShuffle] = useState(false); // true = random, false = sequential

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (mode === 'create') {
      // Prepare question range object
      const questionRange = {
        mode: rangeMode,
        start: parseInt(startQuestion) || 1,
        end: parseInt(endQuestion) || totalQuestions,
        count: parseInt(questionCount) || 10,
        shuffle: shuffle
      };

      onCreateRoom(name.trim(), questionRange);
    } else if (mode === 'join') {
      if (!roomCode.trim()) return;
      onJoinRoom(roomCode.trim(), name.trim());
    }
  };

  const resetMode = () => {
    setMode(null);
    setName('');
    setRoomCode('');
    setRangeMode('all');
    setStartQuestion(1);
    setEndQuestion(totalQuestions);
    setQuestionCount(10);
    setShuffle(false);
  };

  if (mode === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Language Selector */}
          <div className="flex justify-end mb-6">
            <div className="bg-slate-800 border-2 border-slate-700 rounded-xl p-2 flex gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  language === 'en'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span className="font-medium">English</span>
              </button>
              <button
                onClick={() => setLanguage('es')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  language === 'es'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span className="font-medium">Español</span>
              </button>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-2xl mb-6">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              {t('appTitle', language)}
            </h1>
            <p className="text-xl text-slate-300">
              {t('appDescription', language)}
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Create Room */}
            <button
              onClick={() => setMode('create')}
              className="group bg-slate-800 hover:bg-slate-750 border-2 border-slate-700 hover:border-blue-500 rounded-2xl p-8 transition-all duration-200 hover:scale-105"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-500 group-hover:bg-blue-600 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{t('createRoom', language)}</h2>
                <p className="text-slate-400">
                  {t('createRoomDesc', language)}
                </p>
              </div>
            </button>

            {/* Join Room */}
            <button
              onClick={() => setMode('join')}
              className="group bg-slate-800 hover:bg-slate-750 border-2 border-slate-700 hover:border-green-500 rounded-2xl p-8 transition-all duration-200 hover:scale-105"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-500 group-hover:bg-green-600 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <LogIn className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{t('joinRoom', language)}</h2>
                <p className="text-slate-400">
                  {t('joinRoomDesc', language)}
                </p>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-slate-500 text-sm">
              {t('practiceWith', language)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 ${mode === 'create' ? 'bg-blue-500' : 'bg-green-500'} rounded-xl mb-4`}>
              {mode === 'create' ? (
                <Users className="w-8 h-8 text-white" />
              ) : (
                <LogIn className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {mode === 'create' ? t('createRoomTitle', language) : t('joinRoomTitle', language)}
            </h2>
            <p className="text-slate-400">
              {mode === 'create'
                ? t('configureSession', language)
                : t('enterCodeAndName', language)}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'join' && (
              <div>
                <label htmlFor="roomCode" className="block text-sm font-medium text-slate-300 mb-2">
                  {t('roomCode6Digits', language)}
                </label>
                <input
                  type="text"
                  id="roomCode"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-center text-2xl font-mono tracking-widest"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                {t('yourName', language)}
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('enterName', language)}
                maxLength={20}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              />
            </div>

            {/* Question Range Selection (Only for Create mode) */}
            {mode === 'create' && (
              <div className="space-y-4 p-4 bg-slate-900/50 border border-slate-600 rounded-lg">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ListOrdered className="w-5 h-5" />
                  {t('questionRange', language)}
                </h3>

                {/* Range Mode Selector */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRangeMode('all')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      rangeMode === 'all'
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-sm font-medium">{t('allQuestions', language)}</div>
                    <div className="text-xs opacity-75 mt-1">{totalQuestions} {t('allQuestionsDesc', language)}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRangeMode('range')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      rangeMode === 'range'
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-sm font-medium">{t('range', language)}</div>
                    <div className="text-xs opacity-75 mt-1">{t('rangeDesc', language)}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRangeMode('count')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      rangeMode === 'count'
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-sm font-medium">{t('count', language)}</div>
                    <div className="text-xs opacity-75 mt-1">{t('countDesc', language)}</div>
                  </button>
                </div>

                {/* Range Mode: Start and End */}
                {rangeMode === 'range' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {t('startQuestion', language)}
                      </label>
                      <input
                        type="number"
                        value={startQuestion}
                        onChange={(e) => setStartQuestion(Math.max(1, Math.min(totalQuestions, parseInt(e.target.value) || 1)))}
                        min="1"
                        max={totalQuestions}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {t('endQuestion', language)}
                      </label>
                      <input
                        type="number"
                        value={endQuestion}
                        onChange={(e) => setEndQuestion(Math.max(startQuestion, Math.min(totalQuestions, parseInt(e.target.value) || totalQuestions)))}
                        min={startQuestion}
                        max={totalQuestions}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                )}

                {/* Count Mode: Start and Count */}
                {rangeMode === 'count' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {t('startQuestion', language)}
                      </label>
                      <input
                        type="number"
                        value={startQuestion}
                        onChange={(e) => setStartQuestion(Math.max(1, Math.min(totalQuestions, parseInt(e.target.value) || 1)))}
                        min="1"
                        max={totalQuestions}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                        <Hash className="w-4 h-4" />
                        {t('questionCount', language)}
                      </label>
                      <input
                        type="number"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 10))}
                        min="1"
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                )}

                {/* Question Order Selector */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">{t('questionOrder', language)}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setShuffle(false)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        !shuffle
                          ? 'border-blue-500 bg-blue-500/20 text-white'
                          : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-sm font-medium">{t('sequential', language)}</div>
                      <div className="text-xs opacity-75 mt-1">{t('sequentialDesc', language)}</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShuffle(true)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        shuffle
                          ? 'border-purple-500 bg-purple-500/20 text-white'
                          : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-sm font-medium">{t('randomOrder', language)}</div>
                      <div className="text-xs opacity-75 mt-1">{t('randomDesc', language)}</div>
                    </button>
                  </div>
                </div>

                {/* Preview */}
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-400">
                    {rangeMode === 'all' && t('previewAll', language, { total: totalQuestions })}
                    {rangeMode === 'range' && t('previewRange', language, { start: startQuestion, end: endQuestion, total: Math.max(0, endQuestion - startQuestion + 1) })}
                    {rangeMode === 'count' && t('previewCount', language, { count: questionCount, start: startQuestion })}
                    {shuffle && ' 🔀'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={resetMode}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                {t('back', language)}
              </button>
              <button
                type="submit"
                className={`flex-1 px-6 py-3 ${mode === 'create' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={!name.trim() || (mode === 'join' && roomCode.length !== 6)}
              >
                {mode === 'create' ? t('create', language) : t('join', language)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default HomeScreen;
