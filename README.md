# Employee Evaluation System

A comprehensive web-based employee evaluation system built with FastAPI and vanilla JavaScript.

## Project Structure

```
.Evaluation/
├── backend/                 # Backend API server
│   ├── api/                # API route handlers
│   │   ├── auth.py         # Authentication endpoints
│   │   ├── questions.py    # Question management
│   │   ├── rounds.py       # Evaluation rounds
│   │   ├── users.py        # User management
│   │   ├── assignments.py  # Assignment management
│   │   ├── evaluations.py  # Evaluation submission
│   │   └── results.py      # Results and scoring
│   ├── config/             # Configuration files
│   │   ├── database.py     # Database connection
│   │   └── settings.py     # Application settings
│   ├── services/           # Business logic
│   │   └── evaluation_service.py
│   └── main.py            # FastAPI application entry point
├── frontend/              # Frontend static files
│   ├── js/               # JavaScript modules
│   ├── css/              # Stylesheets
│   └── components/       # Reusable components
├── templates/            # HTML templates
│   ├── index.html        # Login page
│   ├── admin.html        # Admin dashboard
│   └── user.html         # User evaluation page
└── static/              # Static assets
```

## Features

- **User Authentication**: Employee code-based login
- **Admin Dashboard**: Manage users, questions, rounds, and assignments
- **Evaluation System**: Submit and track evaluations
- **Scoring System**: Three-tier scoring (Manager 40%, Same Team 30%, Different Team 30%)
- **Results Display**: Visual score circles and detailed breakdowns

## Installation

1. Install dependencies:
```bash
pip install fastapi uvicorn psycopg2-binary
```

2. Configure database in `backend/config/settings.py`

3. Run the application:
```bash
cd backend
python main.py
```

4. Access the application at `http://localhost:8001`

## API Endpoints

- `POST /api/login` - User authentication
- `GET /api/questions` - Get questions
- `GET /api/rounds` - Get evaluation rounds
- `GET /api/users` - Get users
- `GET /api/assignments` - Get assignments
- `POST /api/evaluation/{assign_id}/submit` - Submit evaluation
- `GET /api/rounds/{round_id}/targets/{target_id}/manager-score` - Get manager scores
- `GET /api/rounds/{round_id}/targets/{target_id}/same-team-score` - Get same team scores
- `GET /api/rounds/{round_id}/targets/{target_id}/different-team-score` - Get different team scores

## Scoring Logic

### Weight Calculation
- **Higher Role + (Same Team OR Executive)**: 40 points
- **All Other Cases**: 30 points

### Final Score Categories
1. **Manager (40%)**: Higher role evaluators from same team or executive
2. **Same Team (30%)**: Same team members with equal/lower role
3. **Different Team (30%)**: Different team members (all roles)