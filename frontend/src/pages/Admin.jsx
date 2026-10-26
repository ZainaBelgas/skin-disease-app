import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Admin() {
  const navigate = useNavigate();
  const [tab,       setTab]       = useState("stats");
  const [stats,     setStats]     = useState({});
  const [users,     setUsers]     = useState([]);
  const [analyses,  setAnalyses]  = useState([]);
  const [newUser,   setNewUser]   = useState({ username: "", password: "", role: "patient" });
  const [msg,       setMsg]       = useState("");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [s, u, a] = await Promise.all([
      axios.get("http://127.0.0.1:8000/stats"),
      axios.get("http://127.0.0.1:8000/users"),
      axios.get("http://127.0.0.1:8000/analyses"),
    ]);
    setStats(s.data);
    setUsers(u.data);
    setAnalyses(a.data.reverse());
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      setMsg("Fill all fields"); return;
    }
    const res = await axios.post("http://127.0.0.1:8000/users", newUser);
    if (res.data.error) { setMsg(res.data.error); return; }
    setMsg("User created!");
    setNewUser({ username: "", password: "", role: "patient" });
    loadAll();
  };

  const handleDeleteUser = async (username) => {
    if (!window.confirm(`Delete user ${username}?`)) return;
    await axios.delete(`http://127.0.0.1:8000/users/${username}`);
    loadAll();
  };

  const handleDeleteAnalysis = async (id) => {
    if (!window.confirm("Delete this analysis?")) return;
    await axios.delete(`http://127.0.0.1:8000/analyses/${id}`);
    loadAll();
  };

  const stars = (n) => "⭐".repeat(n) + "☆".repeat(5 - n);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>Admin Dashboard</h2>
        <button style={styles.logoutBtn}
          onClick={() => { localStorage.clear(); navigate("/"); }}>
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {["stats", "users", "analyses"].map(t => (
          <button key={t} style={{ ...styles.tab,
            background: tab === t ? "#1e293b" : "transparent",
            color:      tab === t ? "#fff"    : "#64748b" }}
            onClick={() => setTab(t)}>
            {t === "stats"    ? "📊 Statistics" :
             t === "users"    ? "👥 Users"      : "🔬 Analyses"}
          </button>
        ))}
      </div>

      <div style={styles.content}>

        {/* STATS TAB */}
        {tab === "stats" && (
          <div>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <h2 style={styles.statNum}>{stats.total_patients || 0}</h2>
                <p style={styles.statLabel}>Total Patients</p>
              </div>
              <div style={styles.statCard}>
                <h2 style={styles.statNum}>{stats.total_doctors || 0}</h2>
                <p style={styles.statLabel}>Total Doctors</p>
              </div>
              <div style={styles.statCard}>
                <h2 style={styles.statNum}>{stats.total_analyses || 0}</h2>
                <p style={styles.statLabel}>Total Analyses</p>
              </div>
              <div style={styles.statCard}>
                <h2 style={styles.statNum}>{stats.avg_rating || 0} ⭐</h2>
                <p style={styles.statLabel}>Avg Satisfaction</p>
              </div>
              <div style={{ ...styles.statCard, background: "#fee2e2" }}>
                <h2 style={{ ...styles.statNum, color: "#dc2626" }}>{stats.urgent_count || 0}</h2>
                <p style={styles.statLabel}>Urgent Cases</p>
              </div>
              <div style={{ ...styles.statCard, background: "#dcfce7" }}>
                <h2 style={{ ...styles.statNum, color: "#16a34a" }}>{stats.normal_count || 0}</h2>
                <p style={styles.statLabel}>Normal Cases</p>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <div>
            {/* Add user form */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Add New User</h3>
              {msg && <p style={styles.msg}>{msg}</p>}
              <div style={styles.formRow}>
                <input style={styles.input} placeholder="Username"
                  value={newUser.username}
                  onChange={e => setNewUser({...newUser, username: e.target.value})} />
                <input style={styles.input} placeholder="Password" type="password"
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})} />
                <select style={styles.input} value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
                <button style={styles.addBtn} onClick={handleAddUser}>Add</button>
              </div>
            </div>

            {/* Users list */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>All Users ({users.length})</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Username</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff" }}>
                      <td style={styles.td}>{u.username}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.roleBadge,
                          background: u.role === "doctor" ? "#dbeafe" :
                                      u.role === "admin"  ? "#fef3c7" : "#dcfce7",
                          color:      u.role === "doctor" ? "#1d4ed8" :
                                      u.role === "admin"  ? "#92400e" : "#15803d"
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {u.username !== "admin" && (
                          <button style={styles.deleteBtn}
                            onClick={() => handleDeleteUser(u.username)}>
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ANALYSES TAB */}
        {tab === "analyses" && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>All Analyses ({analyses.length})</h3>
            {analyses.map((a, i) => (
              <div key={i} style={styles.analysisCard}>
                <div style={styles.analysisHeader}>
                  <div>
                    <span style={styles.patientName}>👤 {a.username}</span>
                    <span style={styles.analysisDate}>{a.date}</span>
                  </div>
                  <div style={styles.analysisRight}>
                    <span style={{
                      ...styles.urgencyBadge,
                      background: a.urgency === "urgent" ? "#fee2e2" :
                                  a.urgency === "normal"  ? "#dcfce7" : "#f3f4f6",
                      color:      a.urgency === "urgent" ? "#dc2626" :
                                  a.urgency === "normal"  ? "#16a34a" : "#6b7280"
                    }}>
                      {a.urgency === "urgent" ? "⚠️ Urgent" :
                       a.urgency === "normal"  ? "✅ Normal" : "⏳ Pending"}
                    </span>
                    <button style={styles.deleteBtn}
                      onClick={() => handleDeleteAnalysis(a.id)}>
                      Delete
                    </button>
                  </div>
                </div>
                <p style={styles.disease}>{a.predictions[0]?.disease} — {a.predictions[0]?.confidence}%</p>
                {a.comment && <p style={styles.comment}>💬 {a.comment}</p>}
                {a.rating > 0 && (
                  <p style={styles.rating}>{stars(a.rating)} — {a.feedback}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container:      { minHeight: "100vh", background: "#f0f4f8" },
  header:         { background: "#1e293b", padding: "16px 32px",
    display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerTitle:    { color: "#fff", margin: 0 },
  logoutBtn:      { padding: "6px 14px", background: "transparent", color: "#fff",
    border: "1px solid #fff", borderRadius: "6px", cursor: "pointer" },
  tabs:           { background: "#fff", padding: "0 32px",
    borderBottom: "1px solid #e2e8f0", display: "flex", gap: "4px" },
  tab:            { padding: "14px 20px", border: "none", cursor: "pointer",
    fontSize: "14px", borderRadius: "8px 8px 0 0" },
  content:        { maxWidth: "900px", margin: "32px auto", padding: "0 16px" },
  statsGrid:      { display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px", marginBottom: "24px" },
  statCard:       { background: "#fff", borderRadius: "16px", padding: "24px",
    textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  statNum:        { margin: "0 0 4px 0", color: "#1e293b", fontSize: "32px" },
  statLabel:      { margin: 0, color: "#64748b", fontSize: "14px" },
  card:           { background: "#fff", borderRadius: "16px", padding: "24px",
    marginBottom: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  cardTitle:      { color: "#1a1a2e", marginTop: 0, marginBottom: "16px" },
  msg:            { padding: "8px 12px", background: "#dcfce7", color: "#16a34a",
    borderRadius: "6px", fontSize: "14px", marginBottom: "12px" },
  formRow:        { display: "flex", gap: "12px", flexWrap: "wrap" },
  input:          { flex: 1, minWidth: "140px", padding: "10px", borderRadius: "8px",
    border: "1px solid #ddd", fontSize: "14px" },
  addBtn:         { padding: "10px 24px", background: "#1e293b", color: "#fff",
    border: "none", borderRadius: "8px", cursor: "pointer" },
  table:          { width: "100%", borderCollapse: "collapse" },
  th:             { textAlign: "left", padding: "10px 12px",
    fontSize: "13px", color: "#64748b", borderBottom: "1px solid #e2e8f0" },
  td:             { padding: "10px 12px", fontSize: "14px" },
  roleBadge:      { padding: "3px 10px", borderRadius: "20px", fontSize: "12px" },
  deleteBtn:      { padding: "4px 12px", background: "#fee2e2", color: "#dc2626",
    border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  analysisCard:   { background: "#f8fafc", borderRadius: "12px", padding: "16px",
    marginBottom: "12px", border: "1px solid #e2e8f0" },
  analysisHeader: { display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: "8px" },
  analysisRight:  { display: "flex", alignItems: "center", gap: "10px" },
  patientName:    { fontWeight: "500", fontSize: "14px", marginRight: "10px" },
  analysisDate:   { fontSize: "12px", color: "#999" },
  urgencyBadge:   { fontSize: "12px", padding: "3px 10px", borderRadius: "20px" },
  disease:        { fontSize: "14px", color: "#333", margin: "4px 0" },
  comment:        { fontSize: "13px", color: "#4f46e5", margin: "4px 0" },
  rating:         { fontSize: "13px", color: "#f59e0b", margin: "4px 0" },
};