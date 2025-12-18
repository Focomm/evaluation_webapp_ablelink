from fastapi import APIRouter, Form, HTTPException
from config.database import get_db

router = APIRouter()

@router.get("/users")
async def get_users():
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT user_id, emp_code, full_name, role_id, team_name FROM users ORDER BY user_id")
                users = cur.fetchall()
                return [dict(u) for u in users]
        finally:
            conn.close()
    except Exception as e:
        print(f"Database error: {e}")
        return []

@router.post("/users")
async def create_user(emp_code: str = Form(...), full_name: str = Form(...), role_id: int = Form(...), team_name: str = Form(...)):
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT COALESCE(MAX(user_id), 0) + 1 as next_id FROM users")
                result = cur.fetchone()
                next_id = result['next_id']
                
                cur.execute(
                    "INSERT INTO users (user_id, emp_code, full_name, role_id, team_name) VALUES (%s, %s, %s, %s, %s)",
                    (next_id, emp_code, full_name, role_id, team_name)
                )
                conn.commit()
                return {"user_id": next_id, "message": "User created successfully"}
        finally:
            conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

@router.put("/users/{user_id}")
async def update_user(user_id: int, emp_code: str = Form(...), full_name: str = Form(...), role_id: int = Form(...), team_name: str = Form(...)):
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE users SET emp_code = %s, full_name = %s, role_id = %s, team_name = %s WHERE user_id = %s",
                    (emp_code, full_name, role_id, team_name, user_id)
                )
                conn.commit()
                return {"message": "User updated successfully"}
        finally:
            conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")

@router.delete("/users/{user_id}")
async def delete_user(user_id: int):
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    DELETE FROM evaluation_answer WHERE eval_id IN (
                        SELECT eval_id FROM evaluation_master 
                        WHERE evaluator_id = %s OR target_id = %s
                    )
                """, (user_id, user_id))
                
                cur.execute(
                    "DELETE FROM evaluation_master WHERE evaluator_id = %s OR target_id = %s",
                    (user_id, user_id)
                )
                
                cur.execute(
                    "DELETE FROM evaluation_assign WHERE evaluator_id = %s OR target_id = %s",
                    (user_id, user_id)
                )
                
                cur.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
                
                conn.commit()
                return {"message": "User and related records deleted successfully"}
        finally:
            conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

@router.get("/user/{user_id}/assignments")
async def get_user_assignments(user_id: int):
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT a.assign_id, a.round_id, a.target_id, a.is_completed,
                           t.full_name as target_name, t.emp_code as target_code,
                           r.round_name, r.start_date, r.end_date
                    FROM evaluation_assign a
                    JOIN users t ON a.target_id = t.user_id
                    JOIN evaluation_round r ON a.round_id = r.round_id
                    WHERE a.evaluator_id = %s
                    ORDER BY a.is_completed, r.end_date DESC
                """, (user_id,))
                assignments = cur.fetchall()
                return [dict(a) for a in assignments]
        finally:
            conn.close()
    except Exception as e:
        print(f"Database error: {e}")
        return []