import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import HomeScreen from './components/HomeScreen';
import Lobby from './components/Lobby';
import QuestionScreen from './components/QuestionScreen';
import ResultsScreen from './components/ResultsScreen';
import FinishedScreen from './components/FinishedScreen';

//const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
// Si estamos en producción (AWS), usa la misma dirección de la web. Si es local, usa el puerto 3000.
const SOCKET_URL = import.meta.env.PROD ? window.location.origin : 'http://localhost:3000';

function App() {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState('home'); // home, lobby, question, results, finished
  const [roomData, setRoomData] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentResults, setCurrentResults] = useState(null);
  const [voteCount, setVoteCount] = useState({ voted: 0, total: 0 });
  const [hasAnswered, setHasAnswered] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');
  const [totalQuestions, setTotalQuestions] = useState(349);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError('Unable to connect to server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Fetch total questions from backend
  useEffect(() => {
    fetch(`${SOCKET_URL}/api/questions/count`)
      .then(res => res.json())
      .then(data => {
        if (data.total) {
          setTotalQuestions(data.total);
        }
      })
      .catch(err => console.error('Error fetching question count:', err));
  }, []);

  // Save language preference
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Player joined
    socket.on('room:playerJoined', ({ player, roomData }) => {
      console.log('Player joined:', player.name);
      setRoomData(roomData);
    });

    // Player left
    socket.on('room:playerLeft', ({ player, roomData }) => {
      console.log('Player left:', player.name);
      setRoomData(roomData);
    });

    // Host left - return to home
    socket.on('room:hostLeft', () => {
      setError('Host left the room');
      setTimeout(() => {
        resetToHome();
      }, 3000);
    });

    // Game started
    socket.on('game:started', ({ question, timeLimit }) => {
      console.log('Game started!');
      setGameState('question');
      setCurrentQuestion(question);
      setHasAnswered(false);
      setVoteCount({ voted: 0, total: roomData?.players?.length || 0 });
    });

    // Vote update
    socket.on('answer:voteUpdate', ({ votedCount, totalPlayers }) => {
      setVoteCount({ voted: votedCount, total: totalPlayers });
    });

    // Results
    socket.on('question:results', (results) => {
      console.log('Results received');
      setGameState('results');
      setCurrentResults(results);
    });

    // Next question
    socket.on('question:next', ({ question, timeLimit }) => {
      console.log('Next question');
      setGameState('question');
      setCurrentQuestion(question);
      setCurrentResults(null);
      setHasAnswered(false);
      setVoteCount({ voted: 0, total: roomData?.players?.length || 0 });
    });

    // Game finished
    socket.on('game:finished', ({ totalQuestions }) => {
      console.log('Game finished!');
      setGameState('finished');
    });

    // Round ended by host
    socket.on('game:roundEnded', () => {
      console.log('Round ended by host');
      setError('Host ended the round');
      setTimeout(() => {
        resetToHome();
      }, 2000);
    });

    return () => {
      socket.off('room:playerJoined');
      socket.off('room:playerLeft');
      socket.off('room:hostLeft');
      socket.off('game:started');
      socket.off('answer:voteUpdate');
      socket.off('question:results');
      socket.off('question:next');
      socket.off('game:finished');
      socket.off('game:roundEnded');
    };
  }, [socket, roomData]);

  const resetToHome = () => {
    setGameState('home');
    setRoomData(null);
    setIsHost(false);
    setPlayerName('');
    setCurrentQuestion(null);
    setCurrentResults(null);
    setVoteCount({ voted: 0, total: 0 });
    setHasAnswered(false);
    setError('');
  };

  const handleCreateRoom = (name, questionRange) => {
    if (!socket) {
      setError('Not connected to server');
      return;
    }

    setPlayerName(name);
    socket.emit('room:create', { playerName: name, questionRange }, (response) => {
      if (response.success) {
        setRoomData(response.roomData);
        setIsHost(true);
        setGameState('lobby');
        setError('');
      } else {
        setError(response.error || 'Failed to create room');
      }
    });
  };

  const handleJoinRoom = (roomCode, name) => {
    if (!socket) {
      setError('Not connected to server');
      return;
    }

    setPlayerName(name);
    socket.emit('room:join', { roomCode: roomCode.toUpperCase(), playerName: name }, (response) => {
      if (response.success) {
        setRoomData(response.roomData);
        setIsHost(false);
        setGameState('lobby');
        setError('');
      } else {
        setError(response.error || 'Failed to join room');
      }
    });
  };

  const handleStartGame = () => {
    if (!socket || !roomData) return;

    socket.emit('game:start', roomData.id, (response) => {
      if (!response.success) {
        setError(response.error || 'Failed to start game');
      }
    });
  };

  const handleSubmitAnswer = (answer) => {
    if (!socket || !roomData || hasAnswered) return;

    socket.emit('answer:submit', { roomCode: roomData.id, answer }, (response) => {
      if (response.success) {
        setHasAnswered(true);
      } else {
        setError(response.error || 'Failed to submit answer');
      }
    });
  };

  const handleNextQuestion = () => {
    if (!socket || !roomData) return;

    socket.emit('question:next', roomData.id, (response) => {
      if (response?.success && response?.finished) {
        console.log('All questions completed');
      } else if (!response?.success) {
        setError(response.error || 'Failed to load next question');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in">
          <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-start gap-3">
            <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold">Error</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-white hover:text-red-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {gameState === 'home' && (
        <HomeScreen
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          totalQuestions={totalQuestions}
          language={language}
          setLanguage={setLanguage}
        />
      )}

      {gameState === 'lobby' && (
        <Lobby
          roomData={roomData}
          isHost={isHost}
          onStartGame={handleStartGame}
          onLeave={resetToHome}
        />
      )}

      {gameState === 'question' && (
        <QuestionScreen
          question={currentQuestion}
          roomData={roomData}
          voteCount={voteCount}
          hasAnswered={hasAnswered}
          onSubmitAnswer={handleSubmitAnswer}
          socket={socket}
          isHost={isHost}
          language={language}
        />
      )}

      {gameState === 'results' && (
        <ResultsScreen
          results={currentResults}
          isHost={isHost}
          onNextQuestion={handleNextQuestion}
        />
      )}

      {gameState === 'finished' && (
        <FinishedScreen
          roomData={roomData}
          onBackToHome={resetToHome}
        />
      )}
    </div>
  );
}

export default App;
