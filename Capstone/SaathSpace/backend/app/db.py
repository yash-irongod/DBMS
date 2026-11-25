import logging
from contextlib import contextmanager
from decimal import Decimal
from datetime import date, datetime
import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from .config import Config

logger = logging.getLogger(__name__)

_pool: ConnectionPool | None = None

def init_db_pool():
    global _pool
    if _pool is None:
        try:
            conninfo = Config.get_db_conninfo()
            _pool = ConnectionPool(
                conninfo=conninfo,
                min_size=Config.DB_POOL_MIN,
                max_size=Config.DB_POOL_MAX,
                timeout=10.0,
                open=True,
                kwargs={"row_factory": dict_row}
            )
            logger.info("PostgreSQL connection pool initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize PostgreSQL connection pool: {e}")
            raise e
    return _pool

def get_db_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        return init_db_pool()
    return _pool

def close_db_pool():
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None
        logger.info("PostgreSQL connection pool closed.")

@contextmanager
def get_db_connection():
    pool = get_db_pool()
    with pool.connection() as conn:
        yield conn

def query_one(sql: str, params: tuple | list | dict = None):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            row = cur.fetchone()
            return serialize_db_data(row) if row else None

def query_all(sql: str, params: tuple | list | dict = None):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            rows = cur.fetchall()
            return [serialize_db_data(row) for row in rows]

def execute_query(sql: str, params: tuple | list | dict = None) -> None:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
        conn.commit()

def execute_returning_one(sql: str, params: tuple | list | dict = None):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            row = cur.fetchone()
        conn.commit()
        return serialize_db_data(row) if row else None

def serialize_db_data(data):
    """Recursively converts Decimal, datetime, and date objects into JSON-friendly types."""
    if data is None:
        return None
    if isinstance(data, dict):
        return {k: serialize_db_data(v) for k, v in data.items()}
    if isinstance(data, list):
        return [serialize_db_data(item) for item in data]
    if isinstance(data, Decimal):
        # Convert numeric currency/coordinates cleanly
        return float(data)
    if isinstance(data, (datetime, date)):
        return data.isoformat()
    return data
