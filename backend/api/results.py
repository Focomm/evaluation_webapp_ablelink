from fastapi import APIRouter
from config.database import get_db

router = APIRouter()

@router.get("/rounds/{round_id}/targets/{target_id}/manager-score")
async def get_manager_score(round_id: int, target_id: int):
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT AVG(em.final_score) as avg_score, COUNT(em.final_score) as count_scores
                    FROM evaluation_master em
                    JOIN users evaluator ON em.evaluator_id = evaluator.user_id
                    JOIN users target ON em.target_id = target.user_id
                    WHERE em.round_id = %s 
                      AND em.target_id = %s
                      AND evaluator.role_id > target.role_id
                      AND (evaluator.team_name = target.team_name OR evaluator.team_name = 'executive')
                      AND evaluator.user_id != target.user_id
                      AND em.final_score IS NOT NULL
                """, (round_id, target_id))
                
                result = cur.fetchone()
                
                if result and result['count_scores'] > 0:
                    return {
                        "score": round(float(result['avg_score']), 2),
                        "count": result['count_scores']
                    }
                else:
                    return {"score": None, "count": 0}
        finally:
            conn.close()
    except Exception as e:
        print(f"Database error: {e}")
        return {"score": None, "count": 0}

@router.get("/rounds/{round_id}/targets/{target_id}/same-team-score")
async def get_same_team_score(round_id: int, target_id: int):
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT AVG(em.final_score) as avg_score, COUNT(em.final_score) as count_scores
                    FROM evaluation_master em
                    JOIN users evaluator ON em.evaluator_id = evaluator.user_id
                    JOIN users target ON em.target_id = target.user_id
                    WHERE em.round_id = %s 
                      AND em.target_id = %s
                      AND evaluator.team_name = target.team_name
                      AND evaluator.user_id != target.user_id
                      AND evaluator.role_id <= target.role_id
                      AND em.final_score IS NOT NULL
                """, (round_id, target_id))
                
                result = cur.fetchone()
                
                if result and result['count_scores'] > 0:
                    return {
                        "score": round(float(result['avg_score']), 2),
                        "count": result['count_scores']
                    }
                else:
                    return {"score": None, "count": 0}
        finally:
            conn.close()
    except Exception as e:
        print(f"Database error: {e}")
        return {"score": None, "count": 0}

@router.get("/rounds/{round_id}/targets/{target_id}/different-team-score")
async def get_different_team_score(round_id: int, target_id: int):
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT AVG(em.final_score) as avg_score, COUNT(em.final_score) as count_scores
                    FROM evaluation_master em
                    JOIN users evaluator ON em.evaluator_id = evaluator.user_id
                    JOIN users target ON em.target_id = target.user_id
                    WHERE em.round_id = %s 
                      AND em.target_id = %s
                      AND evaluator.team_name != target.team_name
                      AND evaluator.team_name != 'executive'
                      AND evaluator.user_id != target.user_id
                      AND em.final_score IS NOT NULL
                """, (round_id, target_id))
                
                result = cur.fetchone()
                
                if result and result['count_scores'] > 0:
                    return {
                        "score": round(float(result['avg_score']), 2),
                        "count": result['count_scores']
                    }
                else:
                    return {"score": None, "count": 0}
        finally:
            conn.close()
    except Exception as e:
        print(f"Database error: {e}")
        return {"score": None, "count": 0}

@router.get("/rounds/{round_id}/targets/{target_id}/question-scores")
async def get_question_scores(round_id: int, target_id: int):
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT q.question_id, q.question_text, q.sort_order,
                           AVG(ea.score::float) as avg_score,
                           COUNT(ea.score) as response_count
                    FROM questions q
                    LEFT JOIN evaluation_answer ea ON q.question_id = ea.question_id
                    LEFT JOIN evaluation_master em ON ea.eval_id = em.eval_id
                    WHERE q.is_active = true
                      AND (em.round_id = %s AND em.target_id = %s OR em.round_id IS NULL)
                    GROUP BY q.question_id, q.question_text, q.sort_order
                    ORDER BY q.sort_order, q.question_id
                """, (round_id, target_id))
                
                questions = cur.fetchall()
                return [dict(q) for q in questions]
        finally:
            conn.close()
    except Exception as e:
        print(f"Database error: {e}")
        return []

@router.get("/rounds/{round_id}/targets")
async def get_evaluation_targets(round_id: int):
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT DISTINCT t.user_id, t.full_name,
                           COUNT(CASE WHEN ea.is_completed = true THEN 1 END) as completed_evaluations,
                           COUNT(ea.assign_id) as total_evaluations
                    FROM evaluation_assign ea
                    JOIN users t ON ea.target_id = t.user_id
                    WHERE ea.round_id = %s
                    GROUP BY t.user_id, t.full_name
                    ORDER BY t.full_name
                """, (round_id,))
                targets = cur.fetchall()
                return [dict(target) for target in targets]
        finally:
            conn.close()
    except Exception as e:
        print(f"Database error: {e}")
        return []