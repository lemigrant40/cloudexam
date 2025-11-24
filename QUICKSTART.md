# Quick Start Guide - CloudExam Prep

Get up and running in 5 minutes!

## Step 1: Parse Your Questions (2 minutes)

```bash
# Run the parser
python3 parser.py

# Paste your exam text (format below), then press Ctrl+D when done
```

**Expected Format:**
```
Question: 6
Your Cloudera Data Platform (CDP) on-premises cluster is experiencing...
A. Install and configure a single ZooKeeper server.
B. Configure two NameNode hosts...
C. Install and configure a quorum of JournalNodes...
D. Configure the 'dfs.nameservices'...
Answer: C,D
Explanation:
QJM requires a quorum of JournalNodes...
```

**Result:** `questions.json` file created ✅

## Step 2: Install Dependencies (2 minutes)

```bash
# Install everything
npm run install:all
```

This installs both backend and frontend dependencies.

## Step 3: Run the App (1 minute)

```bash
# Start both frontend and backend
npm run dev
```

**What happens:**
- Backend starts on `http://localhost:3000`
- Frontend starts on `http://localhost:5173`
- Browser opens automatically

## Step 4: Use the App

### As Host:

1. Open `http://localhost:5173`
2. Click **"Create Room"**
3. Enter your name → Get a room code (e.g., "XKPQ")
4. Share the code with your team
5. Click **"Start Exam"** when everyone joins

### As Guest:

1. Open `http://localhost:5173`
2. Click **"Join Room"**
3. Enter the room code
4. Enter your name
5. Wait for host to start

## Step 5: Take the Exam Together!

- Answer questions within 60 seconds
- See who has voted in real-time
- View group results and correct answers
- Learn from explanations
- Host advances to next question

---

## Common Commands

```bash
# Development (hot reload)
npm run dev

# Backend only
npm run server:dev

# Frontend only
npm run client:dev

# Production build
npm run build

# Run production
NODE_ENV=production npm start

# Parse more questions
python3 parser.py new_questions.txt questions.json
```

## Docker Quick Start

```bash
# Build
docker build -t cloudexam-prep .

# Run
docker run -p 3000:3000 cloudexam-prep

# Access at http://localhost:3000
```

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                     Browser                          │
│  ┌──────────────┐         ┌──────────────┐         │
│  │   Host       │         │   Guest 1    │         │
│  │   Device     │         │   Device     │  ...    │
│  └──────┬───────┘         └──────┬───────┘         │
└─────────┼────────────────────────┼──────────────────┘
          │                        │
          │    WebSocket (Socket.io)
          │                        │
     ┌────┴────────────────────────┴────┐
     │      Node.js + Express            │
     │      Socket.io Server             │
     │    (Port 3000)                    │
     └───────────────┬───────────────────┘
                     │
              ┌──────┴──────┐
              │ questions.json
              └─────────────┘
```

## What Each File Does

| File | Purpose |
|------|---------|
| `parser.py` | Converts PDF text → `questions.json` |
| `questions.json` | Stores all exam questions |
| `server/index.js` | Backend (Socket.io + Express) |
| `client/src/App.jsx` | Main React app |
| `client/src/components/*` | UI components |
| `Dockerfile` | Container for deployment |

## Troubleshooting

### "Port 3000 already in use"
```bash
lsof -ti:3000 | xargs kill -9
```

### "Cannot find questions.json"
```bash
# Run parser first
python3 parser.py
```

### "Socket connection failed"
Make sure backend is running:
```bash
npm run server:dev
```

### Questions not appearing
Check `questions.json` format:
```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('questions.json')))"
```

---

## Next Steps

✅ Everything working? Great!

**For Production:**
1. Read [README.md](README.md) for deployment guide
2. Build Docker image
3. Deploy to AWS App Runner

**Customize:**
- Edit colors in `client/tailwind.config.js`
- Change timer duration in `client/src/components/QuestionScreen.jsx`
- Modify room code length in `server/index.js`

---

🎉 **You're ready to start collaborative exam prep!**
