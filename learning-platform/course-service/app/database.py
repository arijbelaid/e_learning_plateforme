import os
import asyncio
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase

logger = logging.getLogger(__name__)

POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "learning_platform")
POSTGRES_USER = os.getenv("POSTGRES_USER", "admin")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "admin_secure_password")

DATABASE_URL = f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"


class Base(DeclarativeBase):
    pass


engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db(max_retries: int = 15, retry_delay: float = 5.0):
    """Initialise la base de données avec retry automatique."""
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"[DB] Connection attempt {attempt}/{max_retries} to PostgreSQL...")
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("[DB] Connected and tables created successfully.")
            return
        except Exception as e:
            logger.error(f"[DB] Connection failed (attempt {attempt}): {e}")
            if attempt >= max_retries:
                logger.critical("[DB] Max retries reached. Starting in degraded mode.")
                return
            logger.info(f"[DB] Retrying in {retry_delay}s...")
            await asyncio.sleep(retry_delay)


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
