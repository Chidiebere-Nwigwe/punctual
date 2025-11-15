import { useState } from "react";

export default function App() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [startAddress, setStartAddress] = useState("");
  const [eventAddress, setEventAddress] = useState("");
  const [transportMode, setTransportMode] = useState("transit");
  const [prepMinutes, setPrepMinutes] = useState(30);
  const [prepChecklist, setPrepChecklist] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [travelMinutes, setTravelMinutes] = useState(30);
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const eventDate = new Date(eventTime);
    if (isNaN(eventDate.getTime())) {
      setStatus("❌ Please enter a valid event time.");
      return;
    }

    const leaveHomeTime = new Date(eventDate.getTime() - travelMinutes * 60000);
    const wakeTime = new Date(leaveHomeTime.getTime() - prepMinutes * 60000);

    try {
      const res = await fetch("http://localhost:8000/schedule-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: phoneNumber,
          start_address: startAddress,
          event_address: eventAddress,
          transport_mode: transportMode,
          prep_minutes: prepMinutes,
          prep_checklist: prepChecklist,
          event_time: eventDate.toISOString(),
          travel_minutes: travelMinutes,
          wake_time: wakeTime.toISOString(),
          leave_time: leaveHomeTime.toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      setStatus(`📲 ${data.scheduled} text messages scheduled successfully!`);
    } catch (err) {
      console.error(err);
      setStatus("❌ Server or Twilio error occurred.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>⏰ Punctual - Never Be Late</h1>
        <p style={styles.subtitle}>
          Get text reminders when it's time to leave!
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Phone Number */}
          <label style={styles.label}>
            📱 Phone Number (to receive text notifications)
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              style={styles.input}
              placeholder="+14031234567"
            />
          </label>

          {/* Event Time */}
          <label style={styles.label}>
            🕐 What time is your event?
            <input
              type="datetime-local"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              required
              style={styles.input}
            />
          </label>

          {/* Event Address */}
          <label style={styles.label}>
            📍 Where is the event? (address)
            <input
              type="text"
              value={eventAddress}
              onChange={(e) => setEventAddress(e.target.value)}
              required
              style={styles.input}
              placeholder="123 Main St, Calgary, AB"
            />
          </label>

          {/* Starting Address */}
          <label style={styles.label}>
            🏠 Where are you leaving from? (home or departing point)
            <input
              type="text"
              value={startAddress}
              onChange={(e) => setStartAddress(e.target.value)}
              required
              style={styles.input}
              placeholder="456 Your St, Calgary, AB"
            />
          </label>

          {/* Mode of Transportation */}
          <label style={styles.label}>
            🚇 Mode of transportation
            <select
              value={transportMode}
              onChange={(e) => setTransportMode(e.target.value)}
              required
              style={styles.select}
            >
              <option value="transit">🚇 Public Transit</option>
              <option value="driving">🚗 Driving</option>
              <option value="walking">🚶 Walking</option>
              <option value="bicycling">🚴 Bicycling</option>
            </select>
          </label>

          {/* Manual Travel Time Override */}
          <label style={styles.label}>
            ⏱️ Travel Time (minutes)
            <input
              type="number"
              value={travelMinutes}
              onChange={(e) => setTravelMinutes(e.target.value)}
              required
              style={styles.input}
              min="1"
            />
            <span style={styles.hint}>Estimated time to get to the event</span>
          </label>

          {/* Prep Time */}
          <label style={styles.label}>
            ⏲️ How long will it take you to prep before you leave? (minutes)
            <input
              type="number"
              value={prepMinutes}
              onChange={(e) => setPrepMinutes(e.target.value)}
              required
              style={styles.input}
              min="0"
            />
          </label>

          {/* Prep Checklist */}
          <label style={styles.label}>
            ✅ What's in your prep checklist?
            <textarea
              value={prepChecklist}
              onChange={(e) => setPrepChecklist(e.target.value)}
              style={styles.textarea}
              placeholder="Example:&#10;- Shower&#10;- Get dressed&#10;- Pack bag&#10;- Eat breakfast"
              rows="4"
            />
          </label>

          <button type="submit" style={styles.button}>
            📲 Schedule SMS Reminders
          </button>
        </form>

        {status && <p style={styles.status}>{status}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "500px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
  },
  title: {
    textAlign: "center",
    marginBottom: "8px",
    fontSize: "28px",
    fontWeight: "700",
    color: "#333",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: "24px",
    fontSize: "14px",
    color: "#666",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    fontWeight: "600",
    fontSize: "14px",
    color: "#333",
  },
  input: {
    padding: "12px",
    marginTop: "6px",
    borderRadius: "8px",
    border: "1.5px solid #ddd",
    fontSize: "14px",
    transition: "border-color 0.2s",
    outline: "none",
  },
  select: {
    padding: "12px",
    marginTop: "6px",
    borderRadius: "8px",
    border: "1.5px solid #ddd",
    fontSize: "14px",
    backgroundColor: "white",
    cursor: "pointer",
    outline: "none",
  },
  textarea: {
    padding: "12px",
    marginTop: "6px",
    borderRadius: "8px",
    border: "1.5px solid #ddd",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    outline: "none",
  },
  hint: {
    marginTop: "4px",
    fontSize: "12px",
    color: "#888",
    fontWeight: "400",
  },
  button: {
    marginTop: "12px",
    padding: "14px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  status: {
    marginTop: "18px",
    textAlign: "center",
    fontWeight: "600",
    color: "#22c55e",
    fontSize: "14px",
  },
};
