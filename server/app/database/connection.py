"""
BioGuardian Database Connection & Supabase Client Integration

Architecture Note:
Real-time telemetry is streamed directly over WebSocket to frontend clients.
Supabase is reserved for future non-blocking historical snapshots and experiment metadata.
Live per-millisecond sensor updates are NOT persisted here.
"""

import os
import logging
from typing import Optional, Any

logger = logging.getLogger("bioguardian.database")

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")


class SupabaseClientFactory:
    """
    Factory for initializing Supabase client when credentials are provided.
    Provides non-blocking access for future persistence.
    """

    _client: Optional[Any] = None

    @classmethod
    def get_client(cls) -> Optional[Any]:
        if cls._client is not None:
            return cls._client

        if not SUPABASE_URL or not SUPABASE_KEY:
            logger.info(
                "[Database] Supabase credentials not set or incomplete. "
                "Running in memory-only mode for real-time telemetry."
            )
            return None

        try:
            # Lazy import supabase when installed
            from supabase import create_client  # type: ignore
            cls._client = create_client(SUPABASE_URL, SUPABASE_KEY)
            logger.info("[Database] Supabase client initialized successfully.")
            return cls._client
        except ImportError:
            logger.info(
                "[Database] 'supabase' package not installed in environment. "
                "Deferred until future persistence phase."
            )
            return None
        except Exception as e:
            logger.warning(f"[Database] Failed to initialize Supabase client: {e}")
            return None


def get_database_status() -> dict:
    """Returns database connection readiness."""
    configured = bool(SUPABASE_URL and SUPABASE_KEY)
    return {
        "configured": configured,
        "provider": "supabase",
        "live_telemetry_persisted": False,
        "mode": "websocket_direct",
    }
