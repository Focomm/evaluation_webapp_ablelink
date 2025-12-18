from fastapi import APIRouter, Form, HTTPException
from config.database import get_db
from services.evaluation_service import EvaluationService
import json

router = APIRouter()

@router.get("/evaluation/{assign_id}/questions")
async def get_evaluation_questions(assign_id: int):
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT evaluator_id, is_completed 
                    FROM evaluation_assign 
                    WHERE assign_id = %s
                """, (assign_id,))
                assignment = cur.fetchone()
                
                if not assignment:
                    raise HTTPException(status_code=404, detail="Assignment not found")
                
                if assignment['is_completed']:
                    raise HTTPException(status_code=400, detail="Assignment already completed")
                
                cur.execute("""
                    SELECT q.question_id, q.question_text, q.sort_order
                    FROM questions q
                    WHERE q.is_active = true
                    ORDER BY q.sort_order, q.question_id
                """)
                questions = cur.fetchall()
                return [dict(q) for q in questions]
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error: {e}")
        return []

@router.post("/evaluation/{assign_id}/submit")
async def submit_evaluation(assign_id: int, answers: str = Form(...)):
    try:
        answers_data = json.loads(answers)
        
        conn = get_db()
        try:
            with conn.cursor() as cur:
                # Get assignment info
                cur.execute("""
                    SELECT a.evaluator_id, a.target_id, a.round_id, a.is_completed
                    FROM evaluation_assign a
                    WHERE a.assign_id = %s
                """, (assign_id,))
                assignment = cur.fetchone()
                
                if not assignment:
                    raise HTTPException(status_code=404, detail="Assignment not found")
                if assignment['is_completed']:
                    raise HTTPException(status_code=400, detail="Assignment already completed")
                
                # Validate scores
                for answer in answers_data:
                    if not (1 <= answer['score'] <= 5):
                        raise HTTPException(status_code=400, detail="Score must be between 1-5")
                
                # Calculate average score
                total_score = sum(answer['score'] for answer in answers_data)
                avg_score = total_score / len(answers_data)
                
                # Get user information
                evaluator_info = EvaluationService.get_user_info(assignment['evaluator_id'])
                target_info = EvaluationService.get_user_info(assignment['target_id'])
                
                # Calculate weight and final score
                weight_value = EvaluationService.calculate_weight_value(
                    evaluator_info['role_id'], target_info['role_id'],
                    evaluator_info['team_name'], target_info['team_name']
                )
                final_score = EvaluationService.calculate_final_score(avg_score, weight_value)
                
                # Insert evaluation master
                cur.execute("SELECT COALESCE(MAX(eval_id), 0) + 1 as next_id FROM evaluation_master")
                result = cur.fetchone()
                eval_id = result['next_id'] if result else 1
                
                cur.execute("""
                    INSERT INTO evaluation_master 
                    (eval_id, assign_id, evaluator_id, target_id, round_id, avg_score, final_score, submitted_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                """, (eval_id, assign_id, assignment['evaluator_id'], assignment['target_id'], 
                      assignment['round_id'], avg_score, final_score))
                
                # Insert answers
                for answer in answers_data:
                    cur.execute("SELECT COALESCE(MAX(answer_id), 0) + 1 as next_id FROM evaluation_answer")
                    answer_result = cur.fetchone()
                    answer_id = answer_result['next_id'] if answer_result else 1
                    
                    cur.execute("""
                        INSERT INTO evaluation_answer (answer_id, eval_id, question_id, score)
                        VALUES (%s, %s, %s, %s)
                    """, (answer_id, eval_id, answer['question_id'], answer['score']))
                
                # Update assignment as completed
                cur.execute(
                    "UPDATE evaluation_assign SET is_completed = true WHERE assign_id = %s",
                    (assign_id,)
                )
                
                conn.commit()
                return {"message": "Evaluation submitted successfully", "eval_id": eval_id}
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        print(f"Submit evaluation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to submit evaluation: {str(e)}")