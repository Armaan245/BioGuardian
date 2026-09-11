"""
BioGuardian Telemetry Repository Abstraction

Enables clean separation of concerns:
- Real-time telemetry is buffered in-memory for instant WebSocket streaming.
- Supabase persistence can be plugged in later without changing API routers or WebSocket handlers.
"""

from abc import ABC, abstractmethod
from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger("bioguardian.repository")


class TelemetryModel(BaseModel):
    """Canonical BioGuardian Telemetry Data Contract."""
    device_id: str = Field(default="BG-ESP32-001")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    ph: float = Field(default=7.38, ge=0.0, le=14.0)
    glucose: float = Field(default=92.4, ge=0.0)
    oxygen: float = Field(default=6.8, ge=0.0)
    pressure: float = Field(default=1012.4, ge=0.0)
    flow_rate: float = Field(default=450.0, ge=0.0)
    temperature: float = Field(default=37.0)
    bubble_detected: bool = Field(default=False)
    bubble_probability: float = Field(default=0.02, ge=0.0, le=1.0)
    source: str = Field(default="device")


class TelemetryRepository(ABC):
    """Abstract interface for telemetry caching and persistence."""

    @abstractmethod
    def get_latest(self, device_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve most recent telemetry frame for a given device."""
        pass

    @abstractmethod
    def update_latest(self, device_id: str, telemetry: Dict[str, Any]) -> None:
        """Cache the latest real-time frame."""
        pass

    @abstractmethod
    def list_devices(self) -> List[str]:
        """List active device identifiers."""
        pass

    @abstractmethod
    def persist_historical_snapshot(self, record: Dict[str, Any]) -> bool:
        """
        Persist a single snapshot to permanent storage.
        Intended for periodic snapshots / alarm states, NOT for every ms live frame.
        """
        pass


class InMemoryTelemetryRepository(TelemetryRepository):
    """
    Default high-performance in-memory repository.
    Handles instantaneous lookups with zero DB query latency.
    """

    def __init__(self):
        self._latest_cache: Dict[str, Dict[str, Any]] = {}

    def get_latest(self, device_id: str) -> Optional[Dict[str, Any]]:
        return self._latest_cache.get(device_id)

    def update_latest(self, device_id: str, telemetry: Dict[str, Any]) -> None:
        self._latest_cache[device_id] = telemetry

    def list_devices(self) -> List[str]:
        return list(self._latest_cache.keys())

    def persist_historical_snapshot(self, record: Dict[str, Any]) -> bool:
        # In-memory mode does not write to disk/DB
        return True


class SupabaseTelemetryRepository(InMemoryTelemetryRepository):
    """
    Supabase-backed implementation of TelemetryRepository.
    Extends InMemoryTelemetryRepository to maintain live in-memory streaming
    while enabling batch / snapshot persistence to Supabase when activated.
    """

    def __init__(self, supabase_client: Optional[Any] = None):
        super().__init__()
        self.supabase = supabase_client

    def persist_historical_snapshot(self, record: Dict[str, Any]) -> bool:
        if not self.supabase:
            logger.debug("[SupabaseRepo] Client not available. Skipped persistence.")
            return False

        try:
            # Future Supabase table insertion:
            # response = self.supabase.table("telemetry_history").insert(record).execute()
            logger.info(f"[SupabaseRepo] Historical record staged for device {record.get('device_id')}")
            return True
        except Exception as e:
            logger.error(f"[SupabaseRepo] Failed to persist snapshot: {e}")
            return False


# Global singleton instance (default to InMemory)
telemetry_repo: TelemetryRepository = InMemoryTelemetryRepository()


def get_telemetry_repository() -> TelemetryRepository:
    """Dependency injector for telemetry repository."""
    return telemetry_repo
