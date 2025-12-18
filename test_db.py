import psycopg2
from psycopg2.extras import RealDictCursor
from config import DATABASE_CONFIG

def test_connection():
    config = DATABASE_CONFIG["app"]
    
    print("Testing database connection...")
    print(f"Host: {config['host']}")
    print(f"Port: {config['port']}")
    print(f"Database: {config['database']}")
    print(f"Username: {config['username']}")
    print(f"Schema: {config['schema']}")
    
    try:
        conn = psycopg2.connect(
            host=config["host"],
            database=config["database"],
            user=config["username"],
            password=config["password"],
            port=config["port"],
            cursor_factory=RealDictCursor
        )
        
        print("✅ Database connection successful!")
        
        # Test schema
        with conn.cursor() as cur:
            cur.execute(f"SET search_path TO {config['schema']}")
            print(f"✅ Schema '{config['schema']}' set successfully!")
            
            # Test if users table exists
            cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')")
            table_exists = cur.fetchone()[0]
            
            if table_exists:
                print("✅ Users table exists!")
                
                # Count users
                cur.execute("SELECT COUNT(*) FROM users")
                count = cur.fetchone()[0]
                print(f"📊 Total users in table: {count}")
                
                # Show sample users
                cur.execute("SELECT emp_code, full_name, role_id FROM users LIMIT 5")
                users = cur.fetchall()
                print("👥 Sample users:")
                for user in users:
                    print(f"  - {user['emp_code']}: {user['full_name']} (role_id: {user['role_id']})")
                    
            else:
                print("❌ Users table does not exist!")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")

if __name__ == "__main__":
    test_connection()