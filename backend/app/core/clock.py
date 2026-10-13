"""Injectable clock so tests (and demos) can control "now"."""
from datetime import datetime, timezone

_override: datetime | None = None


def now() -> datetime:
    if _override is not None:
        return _override
    return datetime.now(timezone.utc).replace(tzinfo=None)


def set_now(dt: datetime) -> None:
    global _override
    _override = dt


def reset_clock() -> None:
    global _override
    _override = None
