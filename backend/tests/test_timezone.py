"""
Automated Unit Tests for Timezone Conversion and Timestamp Formatting.

Verifies:
1. Input: Asia/Kolkata 23 November 2026, 18:35 is parsed to UTC 2026-11-23 13:05:00 UTC.
2. Output formatting: 13:05:00 UTC converted back to Asia/Kolkata outputs:
   '23 November 2026, 06:35 PM IST'.
3. Output formatting: Analysis UTC timestamp 13:11:00 UTC converted back to Asia/Kolkata outputs:
   '23 November 2026, 06:41 PM IST'.
4. Separate collection vs analysis timestamps.
5. Daylight Saving Time safety for America/New_York (EDT vs EST) and Europe/London (BST vs GMT).
"""

from datetime import datetime, timezone
import zoneinfo
import pytest

from app.core.datetime_utils import (
    parse_local_to_utc,
    format_utc_to_local_string,
    format_iso_utc_z,
    get_valid_timezone
)

def test_kolkata_collection_time_to_utc():
    # User input: 2026-11-23 18:35 in Asia/Kolkata (UTC+5:30)
    # Expected UTC: 2026-11-23 13:05:00 UTC
    dt_str = "2026-11-23T18:35:00"
    parsed_utc = parse_local_to_utc(dt_str, "Asia/Kolkata")
    
    assert parsed_utc.tzinfo == timezone.utc
    assert parsed_utc.year == 2026
    assert parsed_utc.month == 11
    assert parsed_utc.day == 23
    assert parsed_utc.hour == 13
    assert parsed_utc.minute == 5
    assert parsed_utc.second == 0

def test_kolkata_formatting_collection_time():
    # UTC: 2026-11-23 13:05:00 UTC
    # Expected format: '23 November 2026, 06:35 PM IST'
    utc_dt = datetime(2026, 11, 23, 13, 5, 0, tzinfo=timezone.utc)
    formatted = format_utc_to_local_string(utc_dt, "Asia/Kolkata")
    assert formatted == "23 November 2026, 06:35 PM IST"

def test_kolkata_formatting_analysis_time():
    # Analysis UTC: 2026-11-23 13:11:00 UTC
    # Expected format: '23 November 2026, 06:41 PM IST'
    utc_dt = datetime(2026, 11, 23, 13, 11, 0, tzinfo=timezone.utc)
    formatted = format_utc_to_local_string(utc_dt, "Asia/Kolkata")
    assert formatted == "23 November 2026, 06:41 PM IST"

def test_iso_utc_z_formatting():
    utc_dt = datetime(2026, 11, 23, 13, 5, 0)
    iso_z = format_iso_utc_z(utc_dt)
    assert iso_z == "2026-11-23T13:05:00Z"

def test_daylight_saving_new_york():
    # Summer (EDT, UTC-4:00): July 15, 2026, 14:00 NY -> 18:00 UTC
    summer_local = "2026-07-15T14:00:00"
    summer_utc = parse_local_to_utc(summer_local, "America/New_York")
    assert summer_utc.hour == 18

    # Winter (EST, UTC-5:00): January 15, 2026, 14:00 NY -> 19:00 UTC
    winter_local = "2026-01-15T14:00:00"
    winter_utc = parse_local_to_utc(winter_local, "America/New_York")
    assert winter_utc.hour == 19

def test_daylight_saving_london():
    # Summer (BST, UTC+1:00): July 15, 2026, 14:00 London -> 13:00 UTC
    summer_local = "2026-07-15T14:00:00"
    summer_utc = parse_local_to_utc(summer_local, "Europe/London")
    assert summer_utc.hour == 13

    # Winter (GMT, UTC+0:00): January 15, 2026, 14:00 London -> 14:00 UTC
    winter_local = "2026-01-15T14:00:00"
    winter_utc = parse_local_to_utc(winter_local, "Europe/London")
    assert winter_utc.hour == 14
