@app.get("/api/rounds/{round_id}/targets/{target_id}/different-team-score")
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
                    return {
                        "score": None,
                        "count": 0
                    }
        finally:
            conn.close()
    except Exception as e:
        print(f"Database error: {e}")
        return {"score": None, "count": 0}