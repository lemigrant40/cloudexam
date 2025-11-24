# CloudExam Prep - Architecture Documentation

## System Overview

CloudExam Prep is a real-time collaborative exam preparation platform built with a modern web stack, designed for horizontal scalability and cloud deployment.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │   Browser    │  │   Browser    │          │
│  │   (Host)     │  │  (Guest 1)   │  │  (Guest 2)   │  ...    │
│  │              │  │              │  │              │          │
│  │  React + Vite│  │  React + Vite│  │  React + Vite│          │
│  │  Tailwind    │  │  Tailwind    │  │  Tailwind    │          │
│  │  Socket.io   │  │  Socket.io   │  │  Socket.io   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          │     WebSocket (Socket.io) over HTTPS/WSS
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼─────────────────┐
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                  │
│                            │                                     │
│                    ┌───────▼────────┐                           │
│                    │   Socket.io    │                           │
│                    │    Server      │                           │
│                    │  (Event Loop)  │                           │
│                    └───────┬────────┘                           │
│                            │                                     │
│              ┌─────────────┴─────────────┐                      │
│              │                           │                      │
│      ┌───────▼────────┐        ┌────────▼────────┐            │
│      │  Room Manager  │        │  Game Engine    │            │
│      │  (In-Memory)   │        │  (State Machine)│            │
│      └───────┬────────┘        └────────┬────────┘            │
│              │                           │                      │
│              └─────────────┬─────────────┘                      │
│                            │                                     │
│                    ┌───────▼────────┐                           │
│                    │  Express API   │                           │
│                    │   /health      │                           │
│                    │   /api/*       │                           │
│                    └───────┬────────┘                           │
│                            │                                     │
│                  ┌─────────▼──────────┐                         │
│                  │   Static Server    │                         │
│                  │  (Prod only)       │                         │
│                  └─────────┬──────────┘                         │
└────────────────────────────┼────────────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  questions.json  │
                    │  (File System)   │
                    └──────────────────┘
```

## Component Architecture

### Frontend (React)

```
client/src/
├── App.jsx                 # Root component, WebSocket manager
│   ├── State Management
│   ├── Socket.io Client
│   └── Route Logic
│
├── components/
│   ├── HomeScreen.jsx     # Landing page
│   │   ├── Create Room UI
│   │   └── Join Room UI
│   │
│   ├── Lobby.jsx          # Waiting room
│   │   ├── Player List
│   │   ├── Room Code Display
│   │   └── Start Button (Host only)
│   │
│   ├── QuestionScreen.jsx # Active question
│   │   ├── Question Display
│   │   ├── Options Grid
│   │   ├── Timer Component
│   │   ├── Vote Counter
│   │   └── Submit Logic
│   │
│   ├── ResultsScreen.jsx  # Answer reveal
│   │   ├── Voting Chart
│   │   ├── Correct Answer Highlight
│   │   ├── Explanation Display
│   │   └── Next Button (Host only)
│   │
│   ├── FinishedScreen.jsx # Completion screen
│   │   └── Session Summary
│   │
│   └── Timer.jsx          # Countdown timer
│       ├── Visual Progress Bar
│       └── Time Formatting
│
└── index.css              # Tailwind imports
```

### Backend (Node.js)

```
server/index.js
│
├── Express Setup
│   ├── CORS middleware
│   ├── Compression
│   └── Static file serving (production)
│
├── Socket.io Server
│   ├── Connection handling
│   ├── Room namespaces
│   └── Event routing
│
├── Room Manager
│   ├── Room creation/deletion
│   ├── Player management
│   ├── Code generation
│   └── State persistence (in-memory)
│
├── Game Engine
│   ├── Question progression
│   ├── Timer management
│   ├── Answer collection
│   ├── Result calculation
│   └── State machine
│
├── API Routes
│   ├── GET /health         # Health check
│   └── GET /api/rooms      # Debug endpoint
│
└── Data Layer
    └── questions.json loader
```

## State Machine

```
┌─────────┐
│  HOME   │ ◄─────────────────────────────┐
└────┬────┘                                │
     │ create/join                         │
     ▼                                     │
┌─────────┐                                │
│  LOBBY  │                                │
└────┬────┘                                │
     │ host.startGame()                    │
     ▼                                     │
┌──────────────┐                           │
│   QUESTION   │ ◄────────┐                │
└──────┬───────┘          │                │
       │                  │                │
       │ timeout OR       │                │
       │ allAnswered()    │                │
       ▼                  │                │
┌──────────────┐          │                │
│   RESULTS    │          │                │
└──────┬───────┘          │                │
       │                  │                │
       │ host.next()      │                │
       ├──────────────────┘                │
       │ moreQuestions()                   │
       │                                   │
       ▼ !moreQuestions()                  │
┌──────────────┐                           │
│   FINISHED   │                           │
└──────┬───────┘                           │
       │ backToHome()                      │
       └───────────────────────────────────┘
```

## Data Models

### Room Object

```javascript
{
  id: "XKPQ",                    // 4-letter code
  host: "socket_abc123",          // Socket ID of host
  players: Map {
    "socket_abc123": {
      name: "Alice",
      socketId: "socket_abc123",
      currentAnswer: ["A", "B"],
      hasAnswered: true
    },
    "socket_def456": { ... }
  },
  state: "question",              // lobby | question | results | finished
  currentQuestionIndex: 5,        // 0-based index
  questionStartTime: 1234567890,  // Unix timestamp
  timer: <TimeoutObject>,         // setTimeout reference
  answers: Map {
    "socket_abc123": ["A", "B"],
    "socket_def456": ["C"]
  }
}
```

### Question Object

```javascript
{
  id: 1,
  question: "What is...?",
  options: {
    "A": "Option A text",
    "B": "Option B text",
    "C": "Option C text",
    "D": "Option D text"
  },
  correctAnswers: ["A", "C"],
  explanation: "The correct answer is..."
}
```

## Socket.io Events

### Client → Server

| Event | Payload | Description | Auth |
|-------|---------|-------------|------|
| `room:create` | `playerName: string` | Create new room | None |
| `room:join` | `{roomCode, playerName}` | Join existing room | None |
| `game:start` | `roomCode: string` | Start game | Host only |
| `answer:submit` | `{roomCode, answer}` | Submit answer | Any player |
| `question:next` | `roomCode: string` | Next question | Host only |

### Server → Client

| Event | Payload | Description | Recipients |
|-------|---------|-------------|------------|
| `room:playerJoined` | `{player, roomData}` | Player joined | All in room |
| `room:playerLeft` | `{player, roomData}` | Player left | All in room |
| `room:hostLeft` | `{}` | Host disconnected | All in room |
| `game:started` | `{question, timeLimit}` | Game started | All in room |
| `answer:voteUpdate` | `{votedCount, totalPlayers}` | Vote count changed | All in room |
| `question:results` | `{...results}` | Show results | All in room |
| `question:next` | `{question, timeLimit}` | Next question | All in room |
| `game:finished` | `{totalQuestions}` | Game completed | All in room |

## Security Architecture

### Authentication & Authorization

```
┌────────────────────────────────────────────────┐
│  Authorization Layer                           │
├────────────────────────────────────────────────┤
│  Host-Only Actions:                            │
│    - game:start                                │
│    - question:next                             │
│                                                │
│  Verified by:                                  │
│    if (room.host !== socket.id) reject()       │
└────────────────────────────────────────────────┘
```

### Data Validation

- Room codes: 4 uppercase letters (A-Z)
- Player names: Max 20 characters
- Answers: Must match question options
- Room state: Validated on every action

### Security Features

1. **No Authentication Required**: Intentional for quick access
2. **Server-Side State**: All game logic on server
3. **Input Validation**: All user input sanitized
4. **CORS Protection**: Configured for specific origins
5. **Rate Limiting**: Socket.io built-in backpressure
6. **Non-Root Container**: Docker runs as `nodejs` user

## Scalability Considerations

### Current Architecture (v1.0)

**Strengths:**
- Simple deployment
- Fast development
- Low latency
- Cost-effective

**Limitations:**
- In-memory state (no persistence)
- Single-server (no horizontal scaling)
- No load balancing
- Rooms lost on restart

**Best For:**
- 1-50 concurrent users
- Low-traffic scenarios
- Internal team use

### Scaling to v2.0 (Future)

For production scale (100+ concurrent users):

```
┌─────────────────────────────────────────────────┐
│           Application Load Balancer             │
│         (with Sticky Sessions)                  │
└─────────┬──────────────────┬────────────────────┘
          │                  │
    ┌─────▼─────┐      ┌─────▼─────┐
    │  App      │      │  App      │
    │  Runner 1 │      │  Runner 2 │
    └─────┬─────┘      └─────┬─────┘
          │                  │
          └────────┬─────────┘
                   │
          ┌────────▼─────────┐
          │   Redis Cluster  │
          │  (Session Store) │
          └──────────────────┘
```

**Changes Needed:**
1. Redis for shared state
2. Socket.io Redis adapter
3. Sticky sessions on ALB
4. Session persistence
5. Graceful shutdowns

## Performance Optimization

### Frontend

- **Code Splitting**: Vite automatic chunking
- **Lazy Loading**: React.lazy() for components
- **Asset Optimization**: Vite build compression
- **CDN Ready**: Static assets can be CDN'd

### Backend

- **Compression**: gzip for HTTP responses
- **WebSocket**: Binary transport for Socket.io
- **Event Debouncing**: Vote updates batched
- **Memory Management**: Room cleanup on disconnect

### Network

- **WebSocket**: Persistent connections
- **Binary Protocol**: Socket.io binary transport
- **Keep-Alive**: HTTP keep-alive enabled
- **Ping/Pong**: Socket.io heartbeat

## Monitoring & Observability

### Health Checks

```javascript
GET /health
Response: {
  status: "healthy",
  rooms: 3,
  questions: 50,
  timestamp: "2025-01-01T00:00:00Z"
}
```

### Key Metrics

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| Active connections | Socket.io | > 100 |
| Room count | In-memory | > 50 |
| Memory usage | Node.js | > 80% |
| CPU usage | Container | > 70% |
| Response time | Express | > 500ms |

### Logging Strategy

```javascript
// Structured logging
console.log('[ROOM]', 'Created:', roomCode);
console.log('[PLAYER]', 'Joined:', playerName);
console.log('[GAME]', 'Started:', roomCode);
console.log('[ERROR]', error.message);
```

## Deployment Architecture (AWS)

```
┌──────────────────────────────────────────────┐
│           Amazon CloudFront (CDN)            │
│              (Optional)                       │
└─────────────────┬────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────┐
│          AWS App Runner                      │
│  ┌────────────────────────────────────┐     │
│  │  Container Instance                 │     │
│  │  ┌──────────────────────────────┐  │     │
│  │  │  Node.js App                 │  │     │
│  │  │  - Express                   │  │     │
│  │  │  - Socket.io                 │  │     │
│  │  │  - Static Files              │  │     │
│  │  └──────────────────────────────┘  │     │
│  └────────────────────────────────────┘     │
│                                              │
│  Auto-scaling: 1-5 instances                │
│  Health check: /health                      │
└──────────────────┬───────────────────────────┘
                   │
      ┌────────────┴────────────┐
      │                         │
┌─────▼──────┐         ┌────────▼─────┐
│ CloudWatch │         │  ECR         │
│  Logs      │         │  (Container) │
└────────────┘         └──────────────┘
```

## Cost Analysis

### Development

- **Cost**: $0/month
- **Local Docker**: Free
- **Local Node.js**: Free

### Production (AWS App Runner)

**Scenario: 10 users, 8 hours/day**

| Resource | Spec | Hours | Cost/Month |
|----------|------|-------|------------|
| Compute | 1 vCPU | 240 active | $1.68 |
| Compute | 1 vCPU | 480 idle | $0.34 |
| Memory | 2 GB | 240 active | $0.44 |
| Memory | 2 GB | 480 idle | $0.09 |
| **Total** | | | **~$2.55** |

**Scenario: 50 users, 24/7**

| Resource | Spec | Hours | Cost/Month |
|----------|------|-------|------------|
| Compute | 2 vCPU | 720 active | $10.08 |
| Memory | 4 GB | 720 active | $5.33 |
| Data transfer | ~10 GB | - | $0.90 |
| **Total** | | | **~$16.31** |

## Technology Decisions

### Why React?

- Component reusability
- Large ecosystem
- Fast rendering
- Excellent dev tools

### Why Socket.io?

- WebSocket with fallbacks
- Room management built-in
- Automatic reconnection
- Battle-tested in production

### Why In-Memory State?

- Simplicity (v1.0)
- Low latency
- No database costs
- Sufficient for small teams

### Why AWS App Runner?

- Auto-scaling
- Managed infrastructure
- Docker support
- Cost-effective
- Simple deployment

## Future Roadmap

### v1.1 (Short-term)
- [ ] Question bookmarking
- [ ] Answer history per player
- [ ] Export results to PDF
- [ ] Dark mode toggle

### v2.0 (Mid-term)
- [ ] Redis for persistence
- [ ] User accounts (optional)
- [ ] Custom question sets
- [ ] Performance analytics

### v3.0 (Long-term)
- [ ] AI-powered explanations
- [ ] Video chat integration
- [ ] Spaced repetition algorithm
- [ ] Mobile apps (React Native)

---

This architecture balances simplicity, performance, and scalability for collaborative exam preparation.
