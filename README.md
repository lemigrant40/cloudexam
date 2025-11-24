# CloudExam Prep

Real-time collaborative exam preparation platform for Cloudera CDP certification.

## Features

- **Real-time Synchronization**: All participants see questions and results simultaneously using Socket.io
- **Host/Guest System**: One person creates the room, others join with a 6-digit code
- **Question Range Selection**: Choose which questions to practice (all, range, or specific count)
- **Live Voting**: Track who has voted in real-time
- **Results Visualization**: See group voting patterns with charts
- **Timed Questions**: 60-second countdown for each question
- **Multi-answer Support**: Handles questions with multiple correct answers
- **Mobile Responsive**: Works perfectly on all devices
- **AWS Ready**: Containerized and optimized for AWS App Runner

## Tech Stack

### Frontend
- **React 18** with Vite for blazing fast development
- **Tailwind CSS** for modern, responsive design
- **Socket.io Client** for real-time communication
- **Lucide React** for beautiful icons

### Backend
- **Node.js** with Express
- **Socket.io** for WebSocket connections
- **Compression** for optimized delivery

### Deployment
- **Docker** multi-stage builds
- **AWS App Runner** ready

## Project Structure

```
CDP_practice/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── HomeScreen.jsx
│   │   │   ├── Lobby.jsx
│   │   │   ├── QuestionScreen.jsx
│   │   │   ├── ResultsScreen.jsx
│   │   │   ├── FinishedScreen.jsx
│   │   │   └── Timer.jsx
│   │   ├── App.jsx           # Main app component
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── server/
│   └── index.js              # Express + Socket.io server
├── questions.json            # Exam questions data
├── parser.py                 # PDF to JSON converter
├── Dockerfile                # Production container
├── package.json              # Root package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Python 3.7+ (for parser)
- npm or yarn

### Step 1: Parse Your Exam Questions

First, convert your PDF exam text to JSON format:

```bash
# Interactive mode (paste text and press Ctrl+D)
python3 parser.py

# Or from a file
python3 parser.py input.txt questions.json
```

The parser expects this format:
```
Question: 1
Your question text here?
A. Option A text
B. Option B text
C. Option C text
D. Option D text
Answer: A,C
Explanation: The correct answer explanation...
```

### Step 2: Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..
```

### Step 3: Run Development Server

```bash
# Run both frontend and backend concurrently
npm run dev

# Or run separately:
npm run server:dev  # Backend on port 3000
npm run client:dev  # Frontend on port 5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Production Build

### Build Frontend

```bash
npm run build
```

This creates optimized production files in `client/dist/`.

### Run Production Server

```bash
NODE_ENV=production npm start
```

The server will serve both API and static frontend files on port 3000.

## Docker Deployment

### Build Docker Image

```bash
docker build -t cloudexam-prep .
```

### Run Container

```bash
docker run -p 3000:3000 cloudexam-prep
```

### Deploy to AWS App Runner

1. Push your image to Amazon ECR:

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Create repository
aws ecr create-repository --repository-name cloudexam-prep --region us-east-1

# Tag and push
docker tag cloudexam-prep:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/cloudexam-prep:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/cloudexam-prep:latest
```

2. Create App Runner service:
   - Go to AWS App Runner console
   - Create new service
   - Choose "Container registry" as source
   - Select your ECR image
   - Set port to 3000
   - Deploy!

## How to Use

### Creating a Room (Host)

1. Click "Create Room"
2. Enter your name
3. **Select question range:**
   - **All Questions**: Practice all available questions
   - **Range**: Choose start and end question numbers (e.g., 25-50)
   - **Count**: Choose start question and how many to practice (e.g., start at 25, practice 15)
4. Receive a 6-digit room code (e.g., "384729")
5. Share the code with participants
6. Wait for players to join in the lobby
7. Review the question range displayed in the lobby
8. Click "Start Exam" when ready

### Joining a Room (Guest)

1. Click "Join Room"
2. Enter the 6-digit room code provided by the host
3. Enter your name
4. View the selected question range in the lobby
5. Wait for the host to start

### During the Exam

1. **Question Phase**:
   - Read the question
   - Select your answer(s)
   - Submit before time runs out
   - See how many people have voted

2. **Results Phase**:
   - View group voting distribution
   - See correct answers highlighted in green
   - Read the explanation
   - Wait for host to advance to next question

3. **Completion**:
   - Review session summary
   - Return to home to start a new session

## Game Flow Architecture

```
┌─────────┐
│  HOME   │ Create Room / Join Room
└────┬────┘
     │
     ▼
┌─────────┐
│  LOBBY  │ Wait for players → Host clicks "Start"
└────┬────┘
     │
     ▼
┌─────────────┐
│  QUESTION   │ 60s timer → Everyone votes → Auto-advance when all vote
└────┬────────┘
     │
     ▼
┌─────────────┐
│  RESULTS    │ View group votes + correct answer → Host clicks "Next"
└────┬────────┘
     │
     ├──→ Back to QUESTION (if more questions)
     │
     ▼
┌─────────────┐
│  FINISHED   │ Show summary → Back to HOME
└─────────────┘
```

## API Endpoints

### Socket.io Events

**Client → Server:**
- `room:create` - Create a new room
- `room:join` - Join existing room
- `game:start` - Start the game (host only)
- `answer:submit` - Submit an answer
- `question:next` - Advance to next question (host only)

**Server → Client:**
- `room:playerJoined` - Player joined notification
- `room:playerLeft` - Player left notification
- `room:hostLeft` - Host disconnected
- `game:started` - Game has started
- `answer:voteUpdate` - Vote count updated
- `question:results` - Results for current question
- `question:next` - Next question data
- `game:finished` - All questions completed

### HTTP Endpoints

- `GET /health` - Health check endpoint
- `GET /api/rooms` - List active rooms (debugging)

## Configuration

### Environment Variables

Create `client/.env`:

```env
VITE_SOCKET_URL=http://localhost:3000
```

For production:

```env
VITE_SOCKET_URL=https://your-app-runner-url.amazonaws.com
```

### Server Configuration

The server uses these environment variables:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `CLIENT_URL` - Frontend URL for CORS (default: http://localhost:5173)

## Security Features

- Non-root user in Docker container
- CORS protection
- Input validation
- Room code generation with collision detection
- Automatic room cleanup on disconnect
- Host-only permissions for game control

## Performance Optimizations

- Multi-stage Docker builds for smaller images
- Frontend asset compression
- Socket.io binary transport
- React.StrictMode for development
- Vite's lightning-fast HMR
- Production minification

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm start
```

### Socket Connection Failed

Check that:
1. Backend is running on port 3000
2. `VITE_SOCKET_URL` in client/.env matches backend URL
3. CORS is properly configured

### Questions Not Loading

Ensure `questions.json` exists in the root directory and is valid JSON.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this for your exam prep needs!

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation
- Review the code comments

---

Built with ❤️ for collaborative learning
