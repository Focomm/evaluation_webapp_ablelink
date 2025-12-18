import psycopg2
from psycopg2.extras import RealDictCursor
from .settings import DATABASE_CONFIG

def get_db():
    config = DATABASE_CONFIG["app"]
    conn = psycopg2.connect(
        host=config["host"],
        database=config["database"],
        user=config["username"],
        password=config["password"],
        port=config["port"],
        cursor_factory=RealDictCursor
    )
    # Set schema
    with conn.cursor() as cur:
        cur.execute(f"SET search_path TO {config['schema']}")
    conn.commit()
    return conn