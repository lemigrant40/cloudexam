# CloudExam Prep - Usage Examples

Real-world scenarios and use cases for CloudExam Prep.

## Scenario 1: Study Group Session

**Context:** 5 friends preparing for Cloudera CDP certification, meeting weekly.

### Setup (First Time)

**Team Lead (Alice):**

```bash
# Parse the exam questions from PDF
python3 parser.py cloudera_questions.txt questions.json

# Start the app
npm run dev
```

**Output:**
```
✅ Successfully saved 150 questions to questions.json
🚀 Server running on http://localhost:3000
➜ Local: http://localhost:5173
```

### Weekly Session Workflow

**Alice (Host):**
1. Opens [http://localhost:5173](http://localhost:5173)
2. Clicks "Create Room"
3. Enters name: "Alice"
4. Gets room code: **"HDFS"**
5. Shares code in group chat: "Room code is HDFS!"

**Bob, Carol, Dave, Eve (Guests):**
1. Open [http://localhost:5173](http://localhost:5173)
2. Click "Join Room"
3. Enter code: "HDFS"
4. Enter their names
5. Wait in lobby

**Alice:**
- Sees all 5 names in lobby
- Clicks "Start Exam"

### During Practice

**Question 1: HDFS NameNode HA**
- Everyone reads for 20 seconds
- Carol votes: C, D
- Bob votes: C
- Dave votes: A, C, D
- Eve votes: C, D
- Alice votes: C, D

**Results appear automatically:**
```
A: 1 vote  (12.5%)  ❌
B: 0 votes (0%)     ❌
C: 5 votes (100%)   ✅
D: 4 votes (80%)    ✅
```

**Group Discussion:**
- "Why did Dave pick A?"
- Review explanation together
- Alice clicks "Next Question"

### End of Session

After 25 questions (1 hour):
- View completion summary
- Discuss difficult questions
- Schedule next week
- Click "Back to Home"

---

## Scenario 2: Remote Team Training

**Context:** Company onboarding new team members to Cloudera platform.

### Trainer Setup

**Trainer deploys to AWS:**

```bash
# Build Docker image
docker build -t cloudexam-prep .

# Deploy to AWS (see AWS_DEPLOYMENT.md)
# Result: https://abc123.us-east-1.awsapprunner.com
```

### Training Session

**Trainer shares link:** "Everyone open https://abc123.us-east-1.awsapprunner.com"

**10 trainees join room:** "TRNG"

**Trainer (Host) workflow:**
1. Controls pace: Pauses after each question
2. Opens screenshare to discuss results
3. Explains concepts using the built-in explanations
4. Tracks who needs help (vote patterns)

**Benefits:**
- No installation needed
- Everyone participates actively
- Real-time engagement
- Instant feedback

---

## Scenario 3: Certification Bootcamp

**Context:** 3-day intensive bootcamp, 20 students.

### Day 1: Setup

**Instructor:**
```bash
# Organize questions by topic
python3 parser.py hdfs_questions.txt hdfs.json
python3 parser.py yarn_questions.txt yarn.json
python3 parser.py hive_questions.txt hive.json
```

### Day 1 Schedule

**Morning (HDFS):**
```bash
# Use HDFS questions
cp hdfs.json questions.json
npm run dev
# Room: "DAY1"
```

**Afternoon (YARN):**
```bash
# Switch to YARN questions
cp yarn.json questions.json
# Restart server
# Room: "YARN"
```

### Student Experience

**Morning session:**
- Join room "DAY1"
- 50 HDFS questions
- Immediate feedback
- Peer learning from voting patterns

**Afternoon session:**
- Join new room "YARN"
- 40 YARN questions
- See improvement from morning

**End of day:**
- Review missed questions
- Study explanations
- Prepare for Day 2

---

## Scenario 4: Self-Paced Learning (Solo)

**Context:** Individual studying alone.

### Setup

```bash
python3 parser.py my_questions.txt questions.json
npm run dev
```

### Solo Practice Mode

Even alone, the app is useful:

1. **Create room** (you're the host)
2. **Start exam** immediately
3. **Answer questions** with timer pressure
4. **Review results** and explanations
5. **Track progress** through all questions

**Why use it solo?**
- Timed practice builds exam readiness
- Structured review with explanations
- No manual question tracking
- Simulates exam conditions

---

## Scenario 5: Multi-Session Marathon

**Context:** Team wants to complete 200 questions over multiple sessions.

### Session Tracking

**Create a tracking spreadsheet:**

| Session | Date | Questions | Attendees | Avg Score |
|---------|------|-----------|-----------|-----------|
| 1 | 2025-01-15 | 1-25 | 5 | Visual only |
| 2 | 2025-01-22 | 26-50 | 4 | Visual only |
| 3 | 2025-01-29 | 51-75 | 5 | Visual only |

### Split Questions by Session

**Create question subsets:**

```bash
# Session 1: Questions 1-25
node -e "
const fs = require('fs');
const all = JSON.parse(fs.readFileSync('all_questions.json'));
const subset = all.slice(0, 25);
fs.writeFileSync('session1.json', JSON.stringify(subset, null, 2));
"

# Session 2: Questions 26-50
node -e "
const fs = require('fs');
const all = JSON.parse(fs.readFileSync('all_questions.json'));
const subset = all.slice(25, 50);
fs.writeFileSync('session2.json', JSON.stringify(subset, null, 2));
"
```

### Each Session

```bash
# Before session
cp session1.json questions.json
npm run dev

# After session: Note difficult questions
# Review during the week
```

---

## Scenario 6: Mock Exam Day

**Context:** Final practice before certification exam.

### Setup Exam Conditions

**Host setup:**
```bash
# Use full question bank (150 questions)
cp full_exam.json questions.json

# Production mode for realism
NODE_ENV=production npm start
```

**Rules:**
- 60 seconds per question (enforced)
- No pausing
- No external resources
- Answer all questions

### Exam Simulation

1. **Start:** 10:00 AM sharp
2. **Duration:** ~2.5 hours (150 questions × 60s)
3. **Review:** Immediate after completion

**Debrief:**
- Review all wrong answers
- Identify weak topics
- Focus study for real exam

---

## Scenario 7: Continuous Integration Testing

**Context:** Company maintains internal question bank, wants to test updates.

### CI Pipeline

**GitHub Actions example:**

```yaml
name: Test Questions
on: [push]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate JSON
        run: |
          python3 parser.py raw_questions.txt questions.json
          node -e "JSON.parse(require('fs').readFileSync('questions.json'))"
      - name: Test app
        run: |
          npm install
          npm run build
          npm test
```

---

## Scenario 8: Competitive Team Challenge

**Context:** Two teams competing for best score awareness.

### Setup

**Team A:**
- Room code: "TEAM"
- 10 members

**Team B:**
- Different device/location
- Room code: "TEAMB"
- 10 members

**Same questions:**
```bash
# Both teams use same questions.json
# Start at same time
```

### Competition Rules

1. Both teams answer same questions
2. Host screenshots results after each question
3. Compare voting accuracy
4. Team with more correct majority votes wins

**Scoring Example:**

| Question | Team A Majority | Team B Majority | Correct | Winner |
|----------|-----------------|-----------------|---------|--------|
| 1 | C, D | C, D | C, D | Tie |
| 2 | A | C | C | Team B |
| 3 | B | B | B | Tie |

---

## Scenario 9: Instructor-Led Workshop

**Context:** Instructor wants to teach, not just test.

### Teaching Mode

**After each question result:**

1. **Host pauses** (doesn't click next immediately)
2. **Screenshare results** to class
3. **Explain concepts:**
   - Why is C correct?
   - Common misconception in option A
   - Real-world example
4. **Answer questions** from students
5. **Click next** when ready

**Best Practices:**
- Spend 5-10 minutes per question
- Encourage discussion
- Connect to real scenarios
- Use explanations as starting point

---

## Scenario 10: Question Bank Maintenance

**Context:** Maintaining and updating question database.

### Add New Questions

```bash
# Parse new questions from updated PDF
python3 parser.py new_chapter.txt new_questions.json

# Merge with existing
node -e "
const fs = require('fs');
const old = JSON.parse(fs.readFileSync('questions.json'));
const newQ = JSON.parse(fs.readFileSync('new_questions.json'));
const merged = [...old, ...newQ];
// Re-index IDs
merged.forEach((q, i) => q.id = i + 1);
fs.writeFileSync('questions.json', JSON.stringify(merged, null, 2));
console.log(\`Total questions: \${merged.length}\`);
"
```

### Remove Outdated Questions

```javascript
// remove_outdated.js
const fs = require('fs');
const questions = JSON.parse(fs.readFileSync('questions.json'));

// Remove questions containing deprecated topics
const filtered = questions.filter(q =>
  !q.question.includes('Hadoop 2.x') &&
  !q.question.includes('CDH 5')
);

// Re-index
filtered.forEach((q, i) => q.id = i + 1);

fs.writeFileSync('questions.json', JSON.stringify(filtered, null, 2));
console.log(`Removed ${questions.length - filtered.length} outdated questions`);
```

```bash
node remove_outdated.js
```

---

## Tips for All Scenarios

### For Hosts

1. **Prepare questions in advance** - Run parser before session
2. **Test connection** - Start app 5 minutes early
3. **Share code clearly** - Use uppercase, spell out if needed
4. **Control pace** - Don't rush through results
5. **Encourage discussion** - Use results as teaching moments

### For Participants

1. **Join early** - Don't make others wait
2. **Stay focused** - Close other tabs during session
3. **Read carefully** - Use full 60 seconds
4. **Learn from results** - Not just about being right
5. **Ask questions** - Use results to drive discussion

### For Solo Practice

1. **Set a schedule** - Consistent practice times
2. **Simulate exam conditions** - No interruptions
3. **Review explanations** - Even for correct answers
4. **Track progress** - Note difficult topics
5. **Repeat missed questions** - Create custom sets

---

## Common Patterns

### Pattern: Topic-Based Sessions

```bash
# Day 1: Storage
cp hdfs_questions.json questions.json

# Day 2: Processing
cp yarn_spark_questions.json questions.json

# Day 3: Data Access
cp hive_impala_questions.json questions.json
```

### Pattern: Difficulty Progression

```bash
# Week 1: Easy questions
python3 parser.py easy.txt questions.json

# Week 2: Medium questions
python3 parser.py medium.txt questions.json

# Week 3: Hard questions
python3 parser.py hard.txt questions.json

# Week 4: Mixed exam
cat easy.txt medium.txt hard.txt > full.txt
python3 parser.py full.txt questions.json
```

### Pattern: Adaptive Learning

```bash
# After first attempt, create "missed questions" set
# Review only those questions
# Repeat until mastery
```

---

These examples demonstrate the flexibility of CloudExam Prep for various learning scenarios. Adapt these patterns to your specific needs!
