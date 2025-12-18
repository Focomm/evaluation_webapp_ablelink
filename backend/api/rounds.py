from fastapi import APIRouter, Form, HTTPException
from config.database import get_db

router = APIRouter()

@router.get("/rounds")
async def get_rounds():
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT round_id, round_name, start_date, end_date, is_active FROM evaluation_round ORDER BY round_id DESC")
                rounds = cur.fetchall()
                return [dict(r) for r in rounds]
        finally:
            conn.close()
    except Exception as e:
        print(f"Database error: {e}")
        return []

@router.post("/rounds")
async def create_round(round_name: str = Form(...), start_date: str = Form(...), end_date: str = Form(...), is_active: bool = Form(True)):
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT COALESCE(MAX(round_id), 0) + 1 as next_id FROM evaluation_round")
                result = cur.fetchone()
                next_id = result['next_id']
                
                cur.execute(
                    "INSERT INTO evaluation_round (round_id, round_name, start_date, end_date, is_active) VALUES (%s, %s, %s, %s, %s)",
                    (next_id, round_name, start_date, end_date, is_active)
                )
                conn.commit()
                return {"round_id": next_id, "message": "Round created successfully"}
        finally:
            conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create round: {str(e)}")

@router.put("/rounds/{round_id}")
async def update_round(round_id: int, round_name: str = Form(...), start_date: str = Form(...), end_date: str = Form(...), is_active: bool = Form(...)):
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE evaluation_round SET round_name = %s, start_date = %s, end_date = %s, is_active = %s WHERE round_id = %s",
                    (round_name, start_date, end_date, is_active, round_id)
                )
                conn.commit()
                return {"message": "Round updated successfully"}
        finally:
            conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update round: {str(e)}")

@router.delete("/rounds/{round_id}")
async def delete_round(round_id: int):
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    DELETE FROM evaluation_answer WHERE eval_id IN (
                        SELECT eval_id FROM evaluation_master WHERE round_id = %s
                    )
                """, (round_id,))
                
                cur.execute("DELETE FROM evaluation_master WHERE round_id = %s", (round_id,))
                cur.execute("DELETE FROM evaluation_assign WHERE round_id = %s", (round_id,))
                cur.execute("DELETE FROM evaluation_round WHERE round_id = %s", (round_id,))
                
                conn.commit()
                return {"message": "Round and related records deleted successfully"}
        finally:
            conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete round: {str(e)}")