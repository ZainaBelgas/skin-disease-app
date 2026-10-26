import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const navigate                = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please fill all fields");
      return;
    }
    try {
      const res = await axios.post("http://127.0.0.1:8000/login", { username, password });
      if (res.data.success) {
        localStorage.setItem("role",     res.data.role);
        localStorage.setItem("username", res.data.username);
        if (res.data.role === "patient") navigate("/patient");
        if (res.data.role === "doctor")  navigate("/doctor");
        if (res.data.role === "admin")   navigate("/admin");
      } else {
        setError("Invalid username or password");
      }
    } catch {
      setError("Cannot connect to server. Make sure backend is running.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Skin Disease Detection</h1>
        <p style={styles.subtitle}>AI-powered diagnosis assistant</p>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.field}>
          <label style={styles.label}>Username</label>
          <input style={styles.input} value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Enter username" />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="Enter password" />
        </div>

        <button style={styles.button} onClick={handleLogin}>Login</button>

        

        <p style={styles.warning}>
          ⚠️ Educational purposes only — not a medical diagnosis.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container:     { minHeight: "100vh", background: "#f0f4f8",
    display: "flex", alignItems: "center", justifyContent: "center" },
  card:          { background: "#fff", padding: "40px", borderRadius: "16px",
    width: "100%", maxWidth: "400px", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" },
  title:         { textAlign: "center", color: "#1a1a2e", marginBottom: "4px" },
  subtitle:      { textAlign: "center", color: "#666", marginBottom: "24px", fontSize: "14px" },
  error:         { background: "#fee2e2", color: "#dc2626", padding: "10px",
    borderRadius: "8px", fontSize: "14px", marginBottom: "16px" },
  field:         { marginBottom: "16px" },
  label:         { display: "block", marginBottom: "6px", color: "#444", fontSize: "14px" },
  input:         { width: "100%", padding: "10px", borderRadius: "8px",
    border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box" },
  button:        { width: "100%", padding: "12px", background: "#4f46e5",
    color: "#fff", border: "none", borderRadius: "8px",
    fontSize: "16px", cursor: "pointer" },
  accounts:      { marginTop: "20px", background: "#f8fafc",
    borderRadius: "8px", padding: "12px" },
  accountsTitle: { fontSize: "12px", color: "#999", margin: "0 0 6px 0" },
  account:       { fontSize: "13px", color: "#444", margin: "2px 0" },
  warning:       { marginTop: "16px", fontSize: "12px",
    color: "#999", textAlign: "center" },
};