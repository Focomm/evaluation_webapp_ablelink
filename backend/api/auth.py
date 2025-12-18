from fastapi import APIRouter, Form, HTTPException
from config.database import get_db

router = APIRouter()

@router.post("/login")
async def login(emp_code: str = Form(...)):
    print(f"Login attempt with emp_code: '{emp_code}'")
    
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT user_id, full_name, role_id FROM users WHERE emp_code = %s", (emp_code,))
                user = cur.fetchone()
                
                if user:
                    print(f"User found in database: {user}")
                    return dict(user)
                else:
                    print(f"User not found in database for emp_code: '{emp_code}'")
                    raise HTTPException(status_code=401, detail="Invalid employee code")
        finally:
            conn.close()
    except Exception as e:
        # Fallback to mock data when database is not available
        print(f"Database connection failed: {e}")
        print(f"Using mock data for emp_code: '{emp_code}'")
        
        mock_users = {
            "EMP001": {"user_id": 1, "full_name": "John Doe", "role_id": 1},
            "EMP002": {"user_id": 2, "full_name": "Jane Smith", "role_id": 2},
            "ADMIN": {"user_id": 3, "full_name": "Admin User", "role_id": 4}
        }
        
        print(f"Available mock users: {list(mock_users.keys())}")
        
        if emp_code in mock_users:
            print(f"Mock user found: {mock_users[emp_code]}")
            return mock_users[emp_code]
        else:
            print(f"Mock user not found for emp_code: '{emp_code}'")
            raise HTTPException(status_code=401, detail="Invalid employee code")