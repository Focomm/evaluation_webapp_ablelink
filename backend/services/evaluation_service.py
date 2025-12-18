from config.database import get_db

class EvaluationService:
    @staticmethod
    def calculate_weight_value(evaluator_role: int, target_role: int, evaluator_team: str, target_team: str) -> int:
        """Calculate weight value based on role and team conditions"""
        if evaluator_role > target_role:
            # Higher role: gets 40 only if same team or executive team
            if evaluator_team == target_team or evaluator_team == 'executive':
                return 40
            else:
                return 30
        else:
            # Same or lower role: gets 30
            return 30
    
    @staticmethod
    def calculate_final_score(avg_score: float, weight_value: int) -> float:
        """Calculate final score from average score and weight"""
        return (avg_score / 5) * weight_value
    
    @staticmethod
    def get_user_info(user_id: int):
        """Get user information including role and team"""
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT user_id, role_id, team_name FROM users WHERE user_id = %s", (user_id,))
                return cur.fetchone()
        finally:
            conn.close()