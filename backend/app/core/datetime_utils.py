"""
Datetime and Timezone Handling Utilities for AquaSense AI.

Ensures:
1. Strict UTC persistence in database.
2. Explicit timezone interpretation of user-entered local times (default: Asia/Kolkata).
3. Daylight Saving Time (DST) safety across timezones (America/New_York, Europe/London).
4. Unambiguous ISO-8601 UTC strings with 'Z' suffix for client serialization.
"""

from datetime import datetime, timezone
import zoneinfo
from typing import Optional, Tuple, Any

DEFAULT_TIMEZONE = "Asia/Kolkata"

COMMON_TIMEZONES = [
    {"id": "Asia/Kolkata", "label": "Asia/Kolkata (IST, UTC+5:30)", "offset": "+05:30"},
    {"id": "UTC", "label": "UTC (Coordinated Universal Time)", "offset": "+00:00"},
    {"id": "America/New_York", "label": "America/New_York (EST/EDT)", "offset": "-05:00/-04:00"},
    {"id": "Europe/London", "label": "Europe/London (GMT/BST)", "offset": "+00:00/+01:00"},
    {"id": "Asia/Dubai", "label": "Asia/Dubai (GST, UTC+4:00)", "offset": "+04:00"},
    {"id": "Asia/Singapore", "label": "Asia/Singapore (SGT, UTC+8:00)", "offset": "+08:00"},
    {"id": "Australia/Sydney", "label": "Australia/Sydney (AEST/AEDT)", "offset": "+10:00/+11:00"},
]

def get_valid_timezone(tz_name: Optional[str]) -> zoneinfo.ZoneInfo:
    """Returns a valid ZoneInfo instance, falling back to DEFAULT_TIMEZONE."""
    if not tz_name or not tz_name.strip():
        return zoneinfo.ZoneInfo(DEFAULT_TIMEZONE)
    try:
        return zoneinfo.ZoneInfo(tz_name.strip())
    except Exception:
        return zoneinfo.ZoneInfo(DEFAULT_TIMEZONE)

def parse_local_to_utc(dt_val: Any, tz_name: Optional[str] = DEFAULT_TIMEZONE) -> datetime:
    """
    Parses a date input (string or datetime) representing local time in tz_name,
    and returns an aware datetime in UTC.
    """
    if dt_val is None:
        return datetime.now(timezone.utc)

    tz = get_valid_timezone(tz_name)

    if isinstance(dt_val, datetime):
        if dt_val.tzinfo is None:
            # Naive datetime: assume it is in tz_name
            localized = dt_val.replace(tzinfo=tz)
            return localized.astimezone(timezone.utc)
        return dt_val.astimezone(timezone.utc)

    # String parsing
    val_str = str(dt_val).strip()
    # If ends with Z or explicit offset
    if val_str.endswith("Z") or ("+" in val_str[10:] or "-" in val_str[10:]):
        try:
            dt = datetime.fromisoformat(val_str.replace("Z", "+00:00"))
            return dt.astimezone(timezone.utc)
        except Exception:
            pass

    # Standard ISO formats like YYYY-MM-DDTHH:MM or YYYY-MM-DD HH:MM:SS
    cleaned = val_str.replace(" ", "T")
    try:
        dt = datetime.fromisoformat(cleaned)
        if dt.tzinfo is None:
            localized = dt.replace(tzinfo=tz)
            return localized.astimezone(timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        # Fallback to now
        return datetime.now(timezone.utc)

def format_utc_to_local_string(utc_dt: Optional[datetime], tz_name: Optional[str] = DEFAULT_TIMEZONE) -> str:
    """
    Formats a UTC datetime into an explicit localized human-readable string.
    Example output for Asia/Kolkata: '23 November 2026, 06:35 PM IST'
    """
    if utc_dt is None:
        return "N/A"

    tz = get_valid_timezone(tz_name)
    if utc_dt.tzinfo is None:
        utc_dt = utc_dt.replace(tzinfo=timezone.utc)
    else:
        utc_dt = utc_dt.astimezone(timezone.utc)

    localized = utc_dt.astimezone(tz)
    tz_abbr = localized.strftime("%Z")
    # For Asia/Kolkata, ensure standard IST abbreviation if strftime yields offset
    if "Kolkata" in (tz_name or "") or tz_abbr in ["+0530", "UTC+05:30"]:
        tz_abbr = "IST"

    # Exact format: 23 November 2026, 06:35 PM IST
    return localized.strftime("%d %B %Y, %I:%M %p") + f" {tz_abbr}"

def format_iso_utc_z(dt: Optional[datetime]) -> Optional[str]:
    """Ensures an ISO-8601 string ends explicitly with 'Z' so browsers parse it as UTC."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
