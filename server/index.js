/**
 * CloudExam Prep - Backend Server
 * Real-time collaborative exam platform using Socket.io
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import compression from 'compression';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: '/socket.io',
  cors: {
    origin: "*",
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../client/dist')));
}

// Load questions
let questions = [];
try {
  const questionsPath = join(__dirname, '../questions.json');
  const questionsData = fs.readFileSync(questionsPath, 'utf-8');
  questions = JSON.parse(questionsData);
  console.log(`✅ Loaded ${questions.length} questions`);
} catch (error) {
  console.error('❌ Error loading questions.json:', error.message);
  process.exit(1);
}

// Game state management
const rooms = new Map();

/**
 * Room structure:
 * {
 *   id: string (6-digit code),
 *   host: string (socket id),
 *   players: Map<socketId, {name, socketId, currentAnswer, hasAnswered}>,
 *   state: 'lobby' | 'question' | 'results' | 'finished',
 *   currentQuestionIndex: number,
 *   questionStartTime: timestamp,
 *   timer: timeout reference,
 *   timerPaused: boolean,
 *   timeRemaining: number (in milliseconds),
 *   pausedAt: timestamp,
 *   answers: Map<socketId, answer>,
 *   questionRange: { start: number, end: number, total: number },
 *   filteredQuestions: Array<Question>
 * }
 */

// Utility functions
function generateRoomCode() {
  // Generate 6-digit code (100000-999999)
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getUniqueRoomCode() {
  let code;
  let attempts = 0;
  do {
    code = generateRoomCode();
    attempts++;
  } while (rooms.has(code) && attempts < 100);

  if (attempts >= 100) {
    throw new Error('Unable to generate unique room code');
  }
  return code;
}

function getRoomData(room) {
  return {
    id: room.id,
    host: room.host,
    players: Array.from(room.players.values()).map(p => ({
      name: p.name,
      socketId: p.socketId
    })),
    state: room.state,
    currentQuestionIndex: room.currentQuestionIndex,
    totalQuestions: room.filteredQuestions.length,
    questionRange: room.questionRange
  };
}

function getCurrentQuestion(room) {
  const question = room.filteredQuestions[room.currentQuestionIndex];
  if (!question) return null;

  // Don't send correct answers to clients during question phase
  return {
    id: question.id,
    question: question.question,
    options: question.options,
    questionNumber: room.currentQuestionIndex + 1,
    totalQuestions: room.filteredQuestions.length,
    originalQuestionNumber: question.id
  };
}

function getQuestionResults(room) {
  const question = room.filteredQuestions[room.currentQuestionIndex];
  if (!question) return null;

  // Calculate voting statistics
  const voteCounts = {};
  Object.keys(question.options).forEach(key => {
    voteCounts[key] = 0;
  });

  // Count votes
  room.answers.forEach((answer) => {
    if (Array.isArray(answer)) {
      answer.forEach(opt => {
        if (voteCounts[opt] !== undefined) {
          voteCounts[opt]++;
        }
      });
    } else if (voteCounts[answer] !== undefined) {
      voteCounts[answer]++;
    }
  });

  return {
    id: question.id,
    question: question.question,
    options: question.options,
    correctAnswers: question.correctAnswers,
    explanation: question.explanation,
    voteCounts,
    totalVotes: room.answers.size,
    totalPlayers: room.players.size
  };
}

function startQuestionTimer(roomCode, timeRemaining = 180000) {
  const room = rooms.get(roomCode);
  if (!room) return;

  // Clear existing timer
  if (room.timer) {
    clearTimeout(room.timer);
  }

  room.questionStartTime = Date.now();
  room.timeRemaining = timeRemaining;
  room.timerPaused = false;
  room.pausedAt = null;

  // 180 second timer (3 minutes)
  room.timer = setTimeout(() => {
    // Time's up - move to results
    if (room.state === 'question' && !room.timerPaused) {
      room.state = 'results';
      const results = getQuestionResults(room);
      io.to(roomCode).emit('question:results', results);
    }
  }, timeRemaining);
}

function pauseQuestionTimer(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.timerPaused) return;

  // Clear the timer
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }

  // Calculate remaining time
  const elapsed = Date.now() - room.questionStartTime;
  room.timeRemaining = Math.max(0, room.timeRemaining - elapsed);
  room.timerPaused = true;
  room.pausedAt = Date.now();

  console.log(`⏸️  Timer paused in room ${roomCode}, ${Math.round(room.timeRemaining / 1000)}s remaining`);

  // Notify all players
  io.to(roomCode).emit('timer:paused', {
    timeRemaining: room.timeRemaining
  });
}

function resumeQuestionTimer(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || !room.timerPaused) return;

  console.log(`▶️  Timer resumed in room ${roomCode}, ${Math.round(room.timeRemaining / 1000)}s remaining`);

  // Restart timer with remaining time
  room.questionStartTime = Date.now();
  room.timerPaused = false;
  room.pausedAt = null;

  room.timer = setTimeout(() => {
    // Time's up - move to results
    if (room.state === 'question' && !room.timerPaused) {
      room.state = 'results';
      const results = getQuestionResults(room);
      io.to(roomCode).emit('question:results', results);
    }
  }, room.timeRemaining);

  // Notify all players
  io.to(roomCode).emit('timer:resumed', {
    timeRemaining: room.timeRemaining
  });
}

function cleanupRoom(roomCode) {
  const room = rooms.get(roomCode);
  if (room) {
    if (room.timer) {
      clearTimeout(room.timer);
    }
    rooms.delete(roomCode);
    console.log(`🧹 Room ${roomCode} cleaned up`);
  }
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  console.log(`   Transport: ${socket.conn.transport.name}`);

  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });

  // Create room (Host)
  socket.on('room:create', ({ playerName, questionRange }, callback) => {
    try {
      const roomCode = getUniqueRoomCode();

      // Filter questions based on range
      let filteredQuestions = [];
      let range = { start: 1, end: questions.length, total: questions.length };

      if (questionRange.mode === 'all') {
        filteredQuestions = [...questions];
        range = { start: 1, end: questions.length, total: questions.length };
      } else if (questionRange.mode === 'range') {
        // Start and end question numbers
        const start = Math.max(1, Math.min(questionRange.start, questions.length));
        const end = Math.max(start, Math.min(questionRange.end, questions.length));
        filteredQuestions = questions.slice(start - 1, end);
        range = { start, end, total: end - start + 1 };
      } else if (questionRange.mode === 'count') {
        // Start question and count
        const start = Math.max(1, Math.min(questionRange.start, questions.length));
        const count = Math.max(1, questionRange.count);
        const end = Math.min(start + count - 1, questions.length);
        filteredQuestions = questions.slice(start - 1, end);
        range = { start, end, total: filteredQuestions.length };
      }

      // Apply shuffle if requested
      if (questionRange.shuffle) {
        filteredQuestions = shuffleArray(filteredQuestions);
        console.log(`🔀 Questions shuffled for room ${roomCode}`);
      }

      const room = {
        id: roomCode,
        host: socket.id,
        players: new Map(),
        state: 'lobby',
        currentQuestionIndex: 0,
        questionStartTime: null,
        timer: null,
        answers: new Map(),
        questionRange: range,
        filteredQuestions: filteredQuestions,
        isShuffled: questionRange.shuffle || false
      };

      // Add host as first player
      room.players.set(socket.id, {
        name: playerName,
        socketId: socket.id,
        currentAnswer: null,
        hasAnswered: false
      });

      rooms.set(roomCode, room);
      socket.join(roomCode);

      console.log(`🏠 Room created: ${roomCode} by ${playerName} (Questions: ${range.start}-${range.end})`);

      callback({
        success: true,
        roomCode,
        roomData: getRoomData(room),
        isHost: true
      });
    } catch (error) {
      console.error('Error creating room:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Join room (Guest)
  socket.on('room:join', ({ roomCode, playerName }, callback) => {
    const room = rooms.get(roomCode.toUpperCase());

    if (!room) {
      return callback({ success: false, error: 'Room not found' });
    }

    if (room.state !== 'lobby') {
      return callback({ success: false, error: 'Game already in progress' });
    }

    // Add player
    room.players.set(socket.id, {
      name: playerName,
      socketId: socket.id,
      currentAnswer: null,
      hasAnswered: false
    });

    socket.join(roomCode.toUpperCase());

    console.log(`👋 ${playerName} joined room ${roomCode}`);

    // Notify all players
    io.to(roomCode.toUpperCase()).emit('room:playerJoined', {
      player: { name: playerName, socketId: socket.id },
      roomData: getRoomData(room)
    });

    callback({
      success: true,
      roomCode: roomCode.toUpperCase(),
      roomData: getRoomData(room),
      isHost: false
    });
  });

  // Start game (Host only)
  socket.on('game:start', (roomCode, callback) => {
    const room = rooms.get(roomCode);

    if (!room) {
      return callback?.({ success: false, error: 'Room not found' });
    }

    if (room.host !== socket.id) {
      return callback?.({ success: false, error: 'Only host can start game' });
    }

    if (room.players.size < 1) {
      return callback?.({ success: false, error: 'Need at least 1 player' });
    }

    // Start game
    room.state = 'question';
    room.currentQuestionIndex = 0;
    room.answers.clear();

    // Reset all players' answer state
    room.players.forEach(player => {
      player.hasAnswered = false;
      player.currentAnswer = null;
    });

    const question = getCurrentQuestion(room);

    console.log(`🎮 Game started in room ${roomCode}`);

    // Start timer
    startQuestionTimer(roomCode);

    // Send question to all players
    io.to(roomCode).emit('game:started', {
      question,
      timeLimit: 180,
      timerPaused: false
    });

    callback?.({ success: true });
  });

  // Submit answer
  socket.on('answer:submit', ({ roomCode, answer }, callback) => {
    const room = rooms.get(roomCode);

    if (!room) {
      return callback?.({ success: false, error: 'Room not found' });
    }

    if (room.state !== 'question') {
      return callback?.({ success: false, error: 'Not in question phase' });
    }

    const player = room.players.get(socket.id);
    if (!player) {
      return callback?.({ success: false, error: 'Player not found' });
    }

    // Store answer
    room.answers.set(socket.id, answer);
    player.hasAnswered = true;
    player.currentAnswer = answer;

    console.log(`📝 ${player.name} answered in room ${roomCode}`);

    // Notify all players about vote count
    const votedCount = Array.from(room.players.values()).filter(p => p.hasAnswered).length;
    io.to(roomCode).emit('answer:voteUpdate', {
      votedCount,
      totalPlayers: room.players.size
    });

    callback?.({ success: true });

    // Check if everyone has answered
    if (votedCount === room.players.size) {
      // Everyone answered - move to results immediately
      clearTimeout(room.timer);
      room.state = 'results';
      const results = getQuestionResults(room);
      io.to(roomCode).emit('question:results', results);
    }
  });

  // Pause timer (Host only)
  socket.on('timer:pause', (roomCode, callback) => {
    const room = rooms.get(roomCode);

    if (!room) {
      return callback?.({ success: false, error: 'Room not found' });
    }

    if (room.host !== socket.id) {
      return callback?.({ success: false, error: 'Only host can pause timer' });
    }

    if (room.state !== 'question') {
      return callback?.({ success: false, error: 'Not in question phase' });
    }

    if (room.timerPaused) {
      return callback?.({ success: false, error: 'Timer already paused' });
    }

    pauseQuestionTimer(roomCode);
    callback?.({ success: true, timeRemaining: room.timeRemaining });
  });

  // Resume timer (Host only)
  socket.on('timer:resume', (roomCode, callback) => {
    const room = rooms.get(roomCode);

    if (!room) {
      return callback?.({ success: false, error: 'Room not found' });
    }

    if (room.host !== socket.id) {
      return callback?.({ success: false, error: 'Only host can resume timer' });
    }

    if (room.state !== 'question') {
      return callback?.({ success: false, error: 'Not in question phase' });
    }

    if (!room.timerPaused) {
      return callback?.({ success: false, error: 'Timer is not paused' });
    }

    resumeQuestionTimer(roomCode);
    callback?.({ success: true, timeRemaining: room.timeRemaining });
  });

  // End round (Host only) - Return to lobby
  socket.on('game:endRound', (roomCode, callback) => {
    const room = rooms.get(roomCode);

    if (!room) {
      return callback?.({ success: false, error: 'Room not found' });
    }

    if (room.host !== socket.id) {
      return callback?.({ success: false, error: 'Only host can end round' });
    }

    console.log(`🛑 Round ended in room ${roomCode} by host`);

    // Clear timer if exists
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }

    // Clean up room completely and notify all players to return to home
    io.to(roomCode).emit('game:roundEnded');

    // Clean up room after a short delay
    setTimeout(() => cleanupRoom(roomCode), 2000);

    callback?.({ success: true });
  });

  // Next question (Host only)
  socket.on('question:next', (roomCode, callback) => {
    const room = rooms.get(roomCode);

    if (!room) {
      return callback?.({ success: false, error: 'Room not found' });
    }

    if (room.host !== socket.id) {
      return callback?.({ success: false, error: 'Only host can advance' });
    }

    if (room.state !== 'results') {
      return callback?.({ success: false, error: 'Not in results phase' });
    }

    // Move to next question
    room.currentQuestionIndex++;

    if (room.currentQuestionIndex >= room.filteredQuestions.length) {
      // Game finished
      room.state = 'finished';
      io.to(roomCode).emit('game:finished', {
        totalQuestions: room.filteredQuestions.length,
        questionRange: room.questionRange
      });

      // Clean up room after 60 seconds
      setTimeout(() => cleanupRoom(roomCode), 60000);

      return callback?.({ success: true, finished: true });
    }

    // Start next question
    room.state = 'question';
    room.answers.clear();

    // Reset all players' answer state
    room.players.forEach(player => {
      player.hasAnswered = false;
      player.currentAnswer = null;
    });

    const question = getCurrentQuestion(room);

    startQuestionTimer(roomCode);

    io.to(roomCode).emit('question:next', {
      question,
      timeLimit: 180,
      timerPaused: false
    });

    callback?.({ success: true, finished: false });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);

    // Find rooms this socket is in
    rooms.forEach((room, roomCode) => {
      if (room.players.has(socket.id)) {
        const player = room.players.get(socket.id);
        room.players.delete(socket.id);
        room.answers.delete(socket.id);

        console.log(`👋 ${player.name} left room ${roomCode}`);

        // If host left, clean up room
        if (room.host === socket.id) {
          io.to(roomCode).emit('room:hostLeft');
          cleanupRoom(roomCode);
        } else {
          // Notify remaining players
          io.to(roomCode).emit('room:playerLeft', {
            player: { name: player.name, socketId: socket.id },
            roomData: getRoomData(room)
          });

          // If everyone left, clean up
          if (room.players.size === 0) {
            cleanupRoom(roomCode);
          }
        }
      }
    });
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    rooms: rooms.size,
    questions: questions.length,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Root API endpoint for debugging
app.get('/api', (req, res) => {
  res.json({
    name: 'CloudExam Prep API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      rooms: '/api/rooms',
      questionCount: '/api/questions/count'
    }
  });
});

// API endpoint to get room info (for debugging)
app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(rooms.values()).map(room => getRoomData(room));
  res.json({ rooms: roomList });
});

// API endpoint to get total questions
app.get('/api/questions/count', (req, res) => {
  res.json({
    total: questions.length,
    timestamp: new Date().toISOString()
  });
});

// API endpoint to get exam questions (80 questions distributed by category)
app.get('/api/questions/exam', (req, res) => {
  try {
    const EXAM_CONFIG = {
      totalQuestions: 80,
      categories: {
        "Architecture": 11,              // 14% of 80 = 11.2
        "High Availability": 10,         // 12.5% of 80 = 10
        "Installation": 10,              // 12.5% of 80 = 10
        "Governance": 8,                 // 10% of 80 = 8
        "Capacity Management": 8,        // 10% of 80 = 8
        "Cluster Maintenance": 5,        // 6% of 80 = 4.8
        "HDFS Administration": 8,        // 10% of 80 = 8
        "YARN Administration": 8         // 10% of 80 = 8
      }
    };

    // Group questions by category
    const questionsByCategory = {};
    questions.forEach(q => {
      const category = q.category || 'Architecture';
      if (!questionsByCategory[category]) {
        questionsByCategory[category] = [];
      }
      questionsByCategory[category].push(q);
    });

    // Select questions for each category
    const examQuestions = [];
    Object.entries(EXAM_CONFIG.categories).forEach(([category, count]) => {
      const availableQuestions = questionsByCategory[category] || [];

      // Shuffle and select required number of questions
      const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(count, shuffled.length));
      examQuestions.push(...selected);
    });

    // If we don't have enough questions, fill with random ones
    if (examQuestions.length < EXAM_CONFIG.totalQuestions) {
      const remaining = EXAM_CONFIG.totalQuestions - examQuestions.length;
      const usedIds = new Set(examQuestions.map(q => q.id));
      const unusedQuestions = questions.filter(q => !usedIds.has(q.id));
      const shuffled = [...unusedQuestions].sort(() => Math.random() - 0.5);
      examQuestions.push(...shuffled.slice(0, remaining));
    }

    // Final shuffle to mix categories
    const finalExamQuestions = examQuestions.sort(() => Math.random() - 0.5);

    console.log(`📝 Generated exam with ${finalExamQuestions.length} questions`);

    res.json({
      questions: finalExamQuestions,
      config: EXAM_CONFIG,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating exam questions:', error);
    res.status(500).json({ error: 'Failed to generate exam questions' });
  }
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../client/dist/index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for AWS

httpServer.listen(PORT, HOST, () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log(`🚀 CloudExam Prep Server running on ${HOST}:${PORT}`);
  console.log(`📚 ${questions.length} questions loaded`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.io path: /socket.io`);
  console.log(`🌐 CORS: Enabled for all origins`);
  console.log('═══════════════════════════════════════════════════════');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
