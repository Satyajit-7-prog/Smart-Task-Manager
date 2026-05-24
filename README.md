# Smart Task Manager with AI-Powered Productivity Assistance

The **Smart Task Manager** is a modern, premium full-stack task organization and productivity coaching web application. It integrates heuristic AI features including:
1. **Natural Language Processing (NLP) Task Input**: Type task instructions in normal English (e.g. *"Schedule coding milestone for Monday at 3 PM"*), and the system automatically extracts title, due date, priority, and category!
2. **AI Priority Prediction Engine**: Evaluates proximity to deadlines, task titles, and historical category delay counts to recommend standard or urgent priority tags.
3. **Behavioral Analytics Companion**: Visualizes completion trends, categorizes performance weights, plots hourly productivity peak zones, and warns about reschedule habits with smart advice tips.

---

## 🛠️ Technology Stack

* **Frontend**: React (Vite), Tailwind CSS v3, Recharts, Framer Motion, Lucide React
* **Backend**: FastAPI, SQLAlchemy, Pydantic, Python-Jose (JWT), Passlib & Bcrypt, Pytest
* **Database**: SQLAlchemy SQLite Engine (switchable to cloud Supabase/PostgreSQL using `DATABASE_URL` environment variable)

---

## 📂 Codebase Directory Structure

```
smart_task_manager/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── auth_routes.py        # Registration, login, /me profile
│   │   │   ├── task_routes.py        # Eager joined loading task CRUD & NLP quick add
│   │   │   ├── category_routes.py    # Colorized category CRUD
│   │   │   └── analytics_routes.py   # Daily completion rates, hourly distribution, tips
│   │   ├── config.py                 # JWT, local DB, & optional OpenAI settings
│   │   ├── database.py               # Sessionmaker & SQLAlchemy engine injection
│   │   ├── models.py                 # DB models (User, Task, Category, ActivityLog)
│   │   ├── schemas.py                # Pydantic validation schemas
│   │   ├── auth.py                   # Bcrypt password hashing & JWT helpers
│   │   ├── ai_engine.py              # Heuristic regex NLP parser & delay metrics engine
│   │   └── main.py                   # FastAPI app core and CORS configurations
│   ├── tests/
│   │   └── test_ai.py                # Unit tests verifying NLP extraction & priority scoring
│   ├── requirements.txt              # Standard Python packages
│   └── run.py                        # Backend bootstrap runner
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx           # Sidebar with tabs, dark mode toggle, profile
    │   │   ├── TaskCard.jsx          # Glassmorphism cards with AI badges and delay warnings
    │   │   └── TaskModal.jsx         # Creation and inline Category setup portal
    │   ├── context/
    │   │   ├── AuthContext.jsx       # Global Auth state and JWT session manager
    │   │   └── ThemeContext.jsx      # Premium Light/Dark style provider
    │   ├── pages/
    │   │   ├── Login.jsx             # Neon glass authentication screen
    │   │   ├── Register.jsx          # Secure registration view
    │   │   ├── Dashboard.jsx         # Metric counters, NLP parser, and task grid
    │   │   └── Analytics.jsx         # Recharts charts and AI behavioral alerts
    │   ├── utils/
    │   │   └── api.js                # Fetch API client with automatic JWT injection
    │   ├── index.css                 # Custom glassmorphism, scrollbars, and pulse frames
    │   └── main.jsx                  # React entry point wrapped in providers
    ├── tailwind.config.js            // Custom branding palette customization
    ├── postcss.config.js
    └── vite.config.js
```

---

## ⚡ Setup & Run Guidelines

### Prerequisite Checklist
* **Node.js**: v18+ or v22+
* **Python**: v3.10+ or v3.13+

---

### Step 1: Run the Backend Service
1. Open a terminal session in the `/backend` folder:
   ```bash
   cd backend
   ```
2. Activate the pre-created Python virtual environment:
   * **Windows Powershell**:
     ```powershell
     .venv\Scripts\activate
     ```
   * **macOS / Linux**:
     ```bash
     source .venv/bin/activate
     ```
3. Boot the API server using uvicorn:
   ```bash
   python run.py
   ```
4. *Success check*: The API will launch on **`http://127.0.0.1:8000`**. You can view the interactive **Swagger API Docs** directly at **`http://127.0.0.1:8000/docs`** to test routes manually!

---

### Step 2: Run the Frontend Application
1. Open a separate terminal session in the `/frontend` folder:
   ```bash
   cd frontend
   ```
2. Launch the Vite development server:
   ```bash
   npm run dev
   ```
3. *Success check*: The Vite environment will boot, usually on **`http://localhost:5173`**. Click the link to open the app!

---

## 🧪 Testing and Quality Control

### 1. Run Automated Backend Tests
Our test suite validates NLP date parsing, category detection, and urgent priority scoring:
```bash
cd backend
.venv\Scripts\python -m pytest
```
*Verification status*: **`3 passed, 1 warning in 0.53s`** (SQLAlchemy 2.0 warning is benign and expected).

### 2. Verify Production Frontend Bundling
We validated that the React modules and custom Tailwind systems compile flawlessly:
```bash
cd frontend
npm run build
```
*Verification status*: **`built in 1.24s successfully`**, yielding a fully compiled modular bundle.

---

## 💎 Custom Features Highlight

* **Automatic Seeding**: Registering a new account instantly seeds gorgeous default categories (*Coding, Work, Studies, Health, Finance, Personal*) with customized pastel theme colors.
* **Delayed Task Warnings**: If a user reschedules a task (resets due date forward), the system increments a `delay_count`. The frontend immediately displays an icon alert (`History`) on the task card saying `Rescheduled X times` and flags a warning suggestion in the AI Analytics board!
* **Weighted Performance score**: Standard to-do charts count tasks trivially. The Smart Task Manager computes a **Productivity Score** weighting tasks by priority (High = 3 pts, Medium = 2 pts, Low = 1 pt) to reward deep work!
