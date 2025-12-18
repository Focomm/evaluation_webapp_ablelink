from fastapi import APIRouter, Form, HTTPException
from config.database import get_db

router = APIRouter()

@router.get("/assignments")
async def get_assignments():
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT a.assign_id, a.round_id, a.evaluator_id, a.target_id, a.is_completed as status,
                           e.full_name as evaluator_name, e.emp_code as evaluator_code,
                           t.full_name as target_name, t.emp_code as target_code,
                           r.round_name
                    FROM evaluation_assign a
                    JOIN users e ON a.evaluator_id = e.user_id
                    JOIN users t ON a.target_id = t.user_id
                    JOIN evaluation_round r ON a.round_id = r.round_id
                    ORDER BY a.assign_id DESC
                """)
                assignments = cur.fetchall()
                return [dict(a) for a in assignments]
        finally:
            conn.close()
    except Exception as e:
        print(f"Database error: {e}")
        return []

@router.post("/assignments")
async def create_assignment(round_id: int = Form(...), evaluator_id: int = Form(...), target_id: int = Form(...)):
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT COALESCE(MAX(assign_id), 0) + 1 as next_id FROM evaluation_assign")
                result = cur.fetchone()
                next_id = result['next_id']
                
                cur.execute(
                    "INSERT INTO evaluation_assign (assign_id, round_id, evaluator_id, target_id, is_completed) VALUES (%s, %s, %s, %s, false)",
                    (next_id, round_id, evaluator_id, target_id)
                )
                conn.commit()
                return {"assign_id": next_id, "message": "Assignment created successfully"}
        finally:
            conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create assignment: {str(e)}")

@router.delete("/assignments/{assign_id}")
async def delete_assignment(assign_id: int):
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM evaluation_assign WHERE assign_id = %s", (assign_id,))
                conn.commit()
                return {"message": "Assignment deleted successfully"}
        finally:
            conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete assignment: {str(e)}")