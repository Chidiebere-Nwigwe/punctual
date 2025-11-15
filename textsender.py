import os
import time
import json
import sqlite3
from datetime import datetime, timezone
from twilio.rest import Client
from dotenv import load_dotenv
load_dotenv()


DB_PATH = "punctual.db"

# ---- Twilio setup (use env vars) -----------------------------
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER")  # e.g. +14165550123

twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)


# ---- SQLite helpers -----------------------------------------
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    with conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sms_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone_e164 TEXT NOT NULL,
                body TEXT NOT NULL,
                send_at TEXT NOT NULL,   -- ISO datetime string
                sent INTEGER NOT NULL DEFAULT 0
            );
            """
        )
    conn.close()


# ---- Core logic: schedule two texts -------------------------
def schedule_two_texts_from_json(data: dict):
    """
    data = {
        "phone_number": "+14165550123",
        "first_message": "Time to start getting ready",
        "first_send_at": "2025-11-15T12:00:00-05:00",
        "second_message": "Time to leave now",
        "second_send_at": "2025-11-15T12:30:00-05:00"
    }
    """
    phone = data["phone_number"]
    first_msg = data["first_message"]
    first_at = data["first_send_at"]
    second_msg = data["second_message"]
    second_at = data["second_send_at"]

    # Validate/normalize datetimes
    def parse_iso(s: str) -> str:
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()

    first_at_iso = parse_iso(first_at)
    second_at_iso = parse_iso(second_at)

    conn = get_conn()
    with conn:
        conn.execute(
            """
            INSERT INTO sms_messages (phone_e164, body, send_at)
            VALUES (?, ?, ?)
            """,
            (phone, first_msg, first_at_iso),
        )
        conn.execute(
            """
            INSERT INTO sms_messages (phone_e164, body, send_at)
            VALUES (?, ?, ?)
            """,
            (phone, second_msg, second_at_iso),
        )
    conn.close()

    print("Scheduled two texts for:", phone)


# ---- Sending loop -------------------------------------------
def send_due_messages_once():
    now_iso = datetime.now(timezone.utc).isoformat()

    conn = get_conn()
    with conn:
        cur = conn.execute(
            """
            SELECT id, phone_e164, body, send_at
            FROM sms_messages
            WHERE sent = 0 AND send_at <= ?
            """,
            (now_iso,),
        )
        rows = cur.fetchall()

        for row in rows:
            msg_id = row["id"]
            to_ = row["phone_e164"]
            body = row["body"]

            print(f"Sending SMS #{msg_id} to {to_}: {body!r}")
            twilio_client.messages.create(
                to=to_,
                from_=TWILIO_FROM_NUMBER,
                body=body,
            )

            conn.execute(
                "UPDATE sms_messages SET sent = 1 WHERE id = ?",
                (msg_id,),
            )


def run_scheduler_loop():
    print("Starting scheduler loop…")
    while True:
        try:
            send_due_messages_once()
        except Exception as e:
            print("Error in scheduler loop:", e)
        time.sleep(10)  # check every 10 seconds (tune as you like)


# ---- Demo usage ---------------------------------------------
if __name__ == "__main__":
    init_db()

    # Example: schedule two texts (comment this out after testing)
    demo_json = {
        "phone_number": "+14039038675",
        "first_message": "Time to start getting ready for your event.",
        "first_send_at": "2025-11-15T12:00:00-05:00",
        "second_message": "Time to leave now to be on time.",
        "second_send_at": "2025-11-15T12:05:00-05:00",
    }
    # schedule_two_texts_from_json(demo_json)

    run_scheduler_loop()
