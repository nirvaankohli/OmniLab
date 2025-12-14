import os
import sqlite3

def clear_database(db_path="instance/database.db"):
    if not os.path.exists(db_path):
        print(f"Database file '{db_path}' does not exist. Nothing to clear.")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()


        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()


        for table_name in tables:
            table_name = table_name[0]
            if table_name != 'sqlite_sequence':
                cursor.execute(f"DELETE FROM {table_name};")
                print(f"Cleared all data from table '{table_name}'.")

        conn.commit()
        conn.close()
        print(f"Database '{db_path}' cleared successfully (all data deleted, schema retained).")

    except sqlite3.Error as e:
        print(f"Error clearing database '{db_path}': {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    clear_database("instance/database.db")
