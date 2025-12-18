from fastapi import APIRouter, Form, HTTPException
from config.database import get_db

router = APIRouter()

@router.get("/questions")
async def get_questions():
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT question_id, question_text, is_active, sort_order FROM questions ORDER BY sort_order, question_id")
                questions = cur.fetchall()
                return [dict(q) for q in questions]
        finally:
            conn.close()
    except Exception as e:
        print(f"Database error: {e}")
        return []

@router.post("/questions")
async def create_question(question_text: str = Form(...), is_active: bool = Form(True), sort_order: int = Form(...)):
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT COALESCE(MAX(question_id), 0) + 1 as next_id FROM questions")
                result = cur.fetchone()
                next_id = result['next_id']
                
                cur.execute(
                    "INSERT INTO questions (question_id, question_text, is_active, sort_order) VALUES (%s, %s, %s, %s)",
                    (next_id, question_text, is_active, sort_order)
                )
                conn.commit()
                return {"question_id": next_id, "message": "Question created successfully"}
        finally:
            conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create question: {str(e)}")

@router.put("/questions/{question_id}")
async def update_question(question_id: int, question_text: str = Form(...), is_active: bool = Form(...), sort_order: int = Form(...)):
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE questions SET question_text = %s, is_active = %s, sort_order = %s WHERE question_id = %s",
                    (question_text, is_active, sort_order, question_id)
                )
                conn.commit()
                return {"message": "Question updated successfully"}
        finally:
            conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update question: {str(e)}")