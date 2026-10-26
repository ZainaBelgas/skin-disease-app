import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Doctor() {
  const navigate                          = useNavigate();
  const username                          = localStorage.getItem("username");
  const [analyses,     setAnalyses]       = useState([]);
  const [filtered,     setFiltered]       = useState([]);
  const [selected,     setSelected]       = useState(null);
  const [comment,      setComment]        = useState("");
  const [urgency,      setUrgency]        = useState("normal");
  const [saved,        setSaved]          = useState(false);
  const [searchName,   setSearchName]     = useState("");
  const [searchDisease,setSearchDisease]  = useState("");
  const [showNotif,    setShowNotif]      = useState(false);
  const [showProfile,  setShowProfile]    = useState(false);
  const [notifications,setNotifications] = useState([
    { id: 1, text: "New patient analysis submitted.", read: false },
    { id: 2, text: "Review pending analyses.",        read: false },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => { loadAnalyses(); }, []);

  const loadAnalyses = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/analyses");
      const data = res.data.reverse();
      setAnalyses(data);
      setFiltered(data);
    } catch {}
  };

  const handleSearch = (name, disease) => {
    setSearchName(name);
    setSearchDisease(disease);
    let result = [...analyses];
    if (name.trim())
      result = result.filter(a =>
        a.username.toLowerCase().includes(name.toLowerCase()));
    if (disease.trim())
      result = result.filter(a =>
        a.predictions[0]?.disease.toLowerCase()
          .includes(disease.toLowerCase()));
    setFiltered(result);
  };

  const handleSelect = (a) => {
    setSelected(a);
    setComment(a.comment || "");
    setUrgency(a.urgency  || "normal");
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selected) return;
    await axios.post(
      `http://127.0.0.1:8000/comment/${selected.id}`,
      { comment, urgency }
    );
    setSaved(true);
    await loadAnalyses();
  };

  const urgentCount  = analyses.filter(a => a.urgency === "urgent").length;
  const normalCount  = analyses.filter(a => a.urgency === "normal").length;
  const pendingCount = analyses.filter(a => !a.urgency).length;

  return (
    <div style={s.page}>

      {/* ── HEADER ── */}
      <header style={s.header}>
        <div style={s.headerInner}>

          {/* Logo */}
          <div style={s.logoWrap}>
            <div style={s.logoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="#2563eb" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div>
              <span style={s.logoName}>DermAI</span>
              <span style={s.logoSub}>Medical Platform</span>
            </div>
          </div>

          {/* Center nav */}
          <nav style={s.centerNav}>
            <div style={{ ...s.navBtn, color: "#2563eb",
              fontWeight: "600", background: "#eff6ff" }}>
              Doctor Dashboard
              <span style={s.navDot} />
            </div>
          </nav>

          {/* Right */}
          <div style={s.headerActions}>

            {/* Notifications */}
            <div style={{ position: "relative" }}>
              <button style={s.iconBtn}
                onClick={() => {
                  setShowNotif(!showNotif);
                  setShowProfile(false);
                }}>
                <svg width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                  <span style={s.badge}>{unreadCount}</span>
                )}
              </button>

              {showNotif && (
                <div style={s.dropdown}>
                  <div style={s.dropdownHeader}>
                    <span style={s.dropdownTitle}>Notifications</span>
                    <button style={s.dropdownAction}
                      onClick={() => {
                        setNotifications(n =>
                          n.map(x => ({ ...x, read: true })));
                        setShowNotif(false);
                      }}>
                      Mark all read
                    </button>
                  </div>
                  {notifications.map(n => (
                    <div key={n.id} style={{
                      ...s.notifItem,
                      background: n.read ? "#fff" : "#eff6ff"
                    }}>
                      <div style={{
                        ...s.notifDot,
                        background: n.read ? "#d1d5db" : "#2563eb"
                      }} />
                      <p style={s.notifText}>{n.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div style={{ position: "relative" }}>
              <button style={s.avatarBtn}
                onClick={() => {
                  setShowProfile(!showProfile);
                  setShowNotif(false);
                }}>
                <span style={s.avatarInitial}>
                  {username?.charAt(0).toUpperCase()}
                </span>
                <span style={s.avatarName}>Dr. {username}</span>
                <svg width="12" height="12" viewBox="0 0 24 24"
                  fill="none" stroke="#6b7280" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {showProfile && (
                <div style={s.dropdown}>
                  <div style={s.profileDropTop}>
                    <div style={s.profileDropAvatar}>
                      {username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={s.profileDropName}>Dr. {username}</p>
                      <p style={s.profileDropRole}>Doctor</p>
                    </div>
                  </div>
                  <div style={s.dropDivider} />
                  <button style={{ ...s.dropItem, color: "#dc2626" }}
                    onClick={() => {
                      localStorage.clear();
                      navigate("/");
                    }}>
                    <svg width="13" height="13" viewBox="0 0 24 24"
                      fill="none" stroke="#dc2626" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── STATS BAR ── */}
      <div style={s.statsBar}>
        <div style={s.statsInner}>
          {[
            { label: "Total Analyses", num: analyses.length,   color: "#111827" },
            { label: "Urgent",         num: urgentCount,        color: "#dc2626" },
            { label: "Normal",         num: normalCount,        color: "#16a34a" },
            { label: "Pending Review", num: pendingCount,       color: "#f59e0b" },
          ].map((st, i) => (
            <React.Fragment key={i}>
              <div style={s.statItem}>
                <span style={{ ...s.statNum, color: st.color }}>
                  {st.num}
                </span>
                <span style={s.statLabel}>{st.label}</span>
              </div>
              {i < 3 && <div style={s.statDivider} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── MAIN ── */}
      <main style={s.main}>
        <div style={s.layout}>

          {/* ── LEFT PANEL ── */}
          <div style={s.leftPanel}>

            {/* Search */}
            <div style={s.searchCard}>
              <h4 style={s.searchTitle}>Search & Filter</h4>
              <input
                style={s.searchInput}
                placeholder="Search by patient name..."
                value={searchName}
                onChange={e => handleSearch(e.target.value, searchDisease)}
              />
              <select
                style={s.searchInput}
                value={searchDisease}
                onChange={e => handleSearch(searchName, e.target.value)}>
                <option value="">All conditions</option>
                <option value="Eczema">Eczema</option>
                <option value="Melanoma">Melanoma</option>
                <option value="Nail Fungus">Nail Fungus</option>
                <option value="Exanthems">Exanthems</option>
              </select>
              {(searchName || searchDisease) && (
                <button style={s.clearBtn}
                  onClick={() => handleSearch("", "")}>
                  Clear filters
                </button>
              )}
            </div>

            {/* List */}
            <div style={s.listHeader}>
              <span style={s.listTitle}>
                Patients ({filtered.length})
              </span>
            </div>

            {filtered.length === 0 && (
              <div style={s.emptyList}>
                <p style={s.emptyListText}>No results found.</p>
              </div>
            )}

            <div style={s.patientList}>
              {filtered.map((a) => (
                <div key={a.id}
                  style={{
                    ...s.patientCard,
                    borderLeft: selected?.id === a.id
                      ? "3px solid #2563eb"
                      : a.urgency === "urgent"
                      ? "3px solid #dc2626"
                      : a.urgency === "normal"
                      ? "3px solid #16a34a"
                      : "3px solid #e5e7eb",
                    background: selected?.id === a.id
                      ? "#f8faff" : "#fff",
                  }}
                  onClick={() => handleSelect(a)}>
                  <div style={s.patientCardRow}>
                    <div style={s.patientAvatar}>
                      {a.username.charAt(0).toUpperCase()}
                    </div>
                    <div style={s.patientInfo}>
                      <span style={s.patientName}>{a.username}</span>
                      <span style={s.patientDate}>{a.date}</span>
                      <span style={s.patientDisease}>
                        {a.predictions[0]?.disease
                          .split(" ").slice(0, 3).join(" ")}
                      </span>
                    </div>
                    <span style={{
                      ...s.miniStatus,
                      background:
                        a.urgency === "urgent" ? "#fee2e2" :
                        a.urgency === "normal"  ? "#dcfce7" : "#f3f4f6",
                      color:
                        a.urgency === "urgent" ? "#dc2626" :
                        a.urgency === "normal"  ? "#16a34a" : "#9ca3af",
                    }}>
                      {a.urgency === "urgent" ? "Urgent" :
                       a.urgency === "normal"  ? "Normal" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div style={s.rightPanel}>
            {!selected && (
              <div style={s.emptyState}>
                <div style={s.emptyStateIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24"
                    fill="none" stroke="#d1d5db" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <h3 style={s.emptyStateTitle}>No patient selected</h3>
                <p style={s.emptyStateDesc}>
                  Select a patient from the list to review their analysis.
                </p>
              </div>
            )}

            {selected && (
              <div>

                {/* Patient header */}
                <div style={s.patientHeader}>
                  <div style={s.patientAvatarLg}>
                    {selected.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={s.patientNameLg}>{selected.username}</h3>
                    <p style={s.patientDateLg}>{selected.date}</p>
                  </div>
                  <span style={{
                    ...s.urgencyBadge,
                    marginLeft: "auto",
                    background:
                      selected.urgency === "urgent" ? "#fee2e2" :
                      selected.urgency === "normal"  ? "#dcfce7" : "#f3f4f6",
                    color:
                      selected.urgency === "urgent" ? "#dc2626" :
                      selected.urgency === "normal"  ? "#16a34a" : "#6b7280",
                  }}>
                    {selected.urgency === "urgent" ? "Urgent" :
                     selected.urgency === "normal"  ? "Normal" : "Pending"}
                  </span>
                </div>

                {/* Heatmap */}
                <div style={s.card}>
                  <h4 style={s.cardTitle}>Grad-CAM Heatmap</h4>
                  <p style={s.cardDesc}>
                    Highlighted zones indicate where the AI focused
                    to make its prediction.
                  </p>
                  <img src={selected.heatmap} alt="heatmap"
                    style={s.heatmapImg} />
                </div>

                {/* AI Predictions */}
                <div style={s.card}>
                  <h4 style={s.cardTitle}>AI Predictions</h4>
                  {selected.predictions.map((p, i) => (
                    <div key={i} style={s.resultRow}>
                      <div style={{
                        ...s.rankCircle,
                        background: i === 0 ? "#2563eb" : "#e0e7ff",
                        color:      i === 0 ? "#fff"    : "#2563eb",
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={s.resultDisease}>{p.disease}</span>
                        <div style={s.barOuter}>
                          <div style={{
                            ...s.barInner,
                            width: `${p.confidence}%`,
                            background: i === 0 ? "#2563eb" : "#bfdbfe"
                          }} />
                        </div>
                      </div>
                      <span style={s.confText}>{p.confidence}%</span>
                    </div>
                  ))}
                </div>

                {/* Medical Assessment */}
                <div style={s.card}>
                  <h4 style={s.cardTitle}>Medical Assessment</h4>

                  <p style={s.fieldLabel}>Urgency Level</p>
                  <div style={s.urgencyRow}>
                    <button style={{
                      ...s.urgencyBtn,
                      background: urgency === "normal"
                        ? "#16a34a" : "#f0fdf4",
                      color: urgency === "normal"
                        ? "#fff" : "#16a34a",
                      border: "1.5px solid #16a34a",
                    }} onClick={() => setUrgency("normal")}>
                      Normal — Buy medicine
                    </button>
                    <button style={{
                      ...s.urgencyBtn,
                      background: urgency === "urgent"
                        ? "#dc2626" : "#fef2f2",
                      color: urgency === "urgent"
                        ? "#fff" : "#dc2626",
                      border: "1.5px solid #dc2626",
                    }} onClick={() => setUrgency("urgent")}>
                      Urgent — See doctor
                    </button>
                  </div>

                  <p style={s.fieldLabel}>Medical Comment</p>
                  <textarea
                    style={s.textarea}
                    rows={5}
                    placeholder="Describe your medical assessment, recommended treatment, or advice for the patient..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />

                  <button style={s.saveBtn} onClick={handleSave}>
                    Save Assessment
                  </button>

                  {saved && (
                    <div style={s.savedMsg}>
                      Assessment saved. The patient will see your comment.
                    </div>
                  )}
                </div>

                {/* Previous comment */}
                {selected.comment && (
                  <div style={s.card}>
                    <h4 style={s.cardTitle}>Previous Comment</h4>
                    <p style={s.prevComment}>{selected.comment}</p>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.footerTop}>
            <div style={s.footerBrand}>
              <div style={s.footerLogoWrap}>
                <div style={s.footerLogoIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="#2563eb" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <div>
                  <span style={s.footerLogoName}>DermAI</span>
                  <span style={s.footerLogoSub}>Medical Platform</span>
                </div>
              </div>
              <p style={s.footerDesc}>
                AI-powered skin disease detection for patients and
                medical professionals. Fast, accurate, and accessible.
              </p>
            </div>

            <div style={s.footerLinks}>
              {[
                { title: "Platform",
                  items: ["Home", "Analysis", "History", "Dashboard"] },
                { title: "About",
                  items: ["About DermAI", "How it works",
                    "Medical disclaimer"] },
                { title: "Support",
                  items: ["Help Center", "Contact Support", "FAQs"] },
                { title: "Contact",
                  items: ["contact@dermai.ma", "+212 6 00 00 00 00",
                    "Casablanca, Maroc", "Mon–Fri, 9:00–18:00"] },
              ].map((col, i) => (
                <div key={i} style={s.footerCol}>
                  <h4 style={s.footerColTitle}>{col.title}</h4>
                  {col.items.map((item, j) => (
                    <span key={j} style={s.footerLink}>{item}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div style={s.footerDivider} />

          <div style={s.footerDisclaimer}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#3b82f6" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={s.footerDisclaimerText}>
              DermAI is an educational and research prototype only.
              It is not a certified medical device. Always consult a
              qualified dermatologist for medical advice.
            </p>
          </div>

          <div style={s.footerBottom}>
            <p style={s.footerCopy}>
              {new Date().getFullYear()} DermAI — EMSI Moulay Youssef,
              Casablanca. Academic project — Data AI.
            </p>
            <div style={s.footerLegal}>
              <span style={s.footerLegalLink}>Privacy Policy</span>
              <span style={s.footerLegalDot}>·</span>
              <span style={s.footerLegalLink}>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

const s = {
  page:               { minHeight: "100vh", background: "#f8fafc",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: "flex", flexDirection: "column" },

  // Header
  header:             { position: "sticky", top: 0, zIndex: 1000,
    background: "rgba(255,255,255,0.97)",
    borderBottom: "1px solid #e5e7eb",
    boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    height: "64px", display: "flex", alignItems: "center" },
  headerInner:        { maxWidth: "1280px", margin: "0 auto",
    padding: "0 24px", display: "flex", alignItems: "center",
    justifyContent: "space-between", width: "100%", gap: "20px" },
  logoWrap:           { display: "flex", alignItems: "center",
    gap: "10px", flexShrink: 0 },
  logoIcon:           { width: "34px", height: "34px", borderRadius: "9px",
    background: "#eff6ff", border: "1px solid #bfdbfe",
    display: "flex", alignItems: "center", justifyContent: "center" },
  logoName:           { display: "block", fontSize: "15px",
    fontWeight: "700", color: "#111827", lineHeight: "1.2" },
  logoSub:            { display: "block", fontSize: "10px",
    color: "#9ca3af", lineHeight: "1.2" },
  centerNav:          { display: "flex", alignItems: "center" },
  navBtn:             { position: "relative", padding: "7px 14px",
    border: "none", cursor: "default", fontSize: "13px",
    borderRadius: "8px", fontFamily: "inherit" },
  navDot:             { position: "absolute", bottom: "3px", left: "50%",
    transform: "translateX(-50%)", width: "16px",
    height: "2px", background: "#2563eb", borderRadius: "2px" },
  headerActions:      { display: "flex", alignItems: "center",
    gap: "8px", flexShrink: 0 },
  iconBtn:            { position: "relative", width: "36px", height: "36px",
    borderRadius: "8px", background: "none",
    border: "1px solid #e5e7eb", cursor: "pointer",
    display: "flex", alignItems: "center",
    justifyContent: "center", color: "#4b5563" },
  badge:              { position: "absolute", top: "-5px", right: "-5px",
    background: "#ef4444", color: "#fff", borderRadius: "50%",
    width: "16px", height: "16px", fontSize: "9px", fontWeight: "700",
    display: "flex", alignItems: "center", justifyContent: "center" },
  dropdown:           { position: "absolute", top: "calc(100% + 8px)",
    right: 0, width: "260px", background: "#fff",
    borderRadius: "12px", border: "1px solid #e5e7eb",
    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
    zIndex: 200, overflow: "hidden" },
  dropdownHeader:     { padding: "12px 16px",
    borderBottom: "1px solid #f3f4f6",
    display: "flex", justifyContent: "space-between",
    alignItems: "center" },
  dropdownTitle:      { fontSize: "13px", fontWeight: "600",
    color: "#111827" },
  dropdownAction:     { fontSize: "12px", color: "#2563eb",
    background: "none", border: "none", cursor: "pointer" },
  notifItem:          { padding: "12px 16px",
    display: "flex", gap: "10px", alignItems: "flex-start",
    borderBottom: "1px solid #f9fafb" },
  notifDot:           { width: "7px", height: "7px", borderRadius: "50%",
    flexShrink: 0, marginTop: "5px" },
  notifText:          { fontSize: "13px", color: "#374151",
    margin: 0, lineHeight: "1.4" },
  profileDropTop:     { padding: "16px", display: "flex",
    alignItems: "center", gap: "12px",
    borderBottom: "1px solid #f3f4f6" },
  profileDropAvatar:  { width: "38px", height: "38px", borderRadius: "50%",
    background: "#0f766e", color: "#fff", fontSize: "15px",
    fontWeight: "700", display: "flex", alignItems: "center",
    justifyContent: "center" },
  profileDropName:    { fontSize: "14px", fontWeight: "600",
    color: "#111827", margin: "0 0 2px 0" },
  profileDropRole:    { fontSize: "12px", color: "#6b7280", margin: 0 },
  dropDivider:        { height: "1px", background: "#f3f4f6" },
  dropItem:           { width: "100%", padding: "10px 16px",
    display: "flex", alignItems: "center", gap: "10px",
    background: "none", border: "none", cursor: "pointer",
    fontSize: "13px", textAlign: "left" },
  avatarBtn:          { display: "flex", alignItems: "center", gap: "8px",
    padding: "5px 10px", border: "1px solid #e5e7eb",
    borderRadius: "8px", background: "none", cursor: "pointer" },
  avatarInitial:      { width: "26px", height: "26px", borderRadius: "50%",
    background: "#0f766e", color: "#fff", fontSize: "11px",
    fontWeight: "700", display: "flex", alignItems: "center",
    justifyContent: "center" },
  avatarName:         { fontSize: "13px", color: "#374151",
    fontWeight: "500", maxWidth: "100px",
    overflow: "hidden", textOverflow: "ellipsis",
    whiteSpace: "nowrap" },

  // Stats bar
  statsBar:           { background: "#fff",
    borderBottom: "1px solid #e5e7eb" },
  statsInner:         { maxWidth: "1280px", margin: "0 auto",
    padding: "0 24px", display: "flex",
    alignItems: "center", height: "56px" },
  statItem:           { flex: 1, display: "flex",
    alignItems: "center", gap: "10px" },
  statNum:            { fontSize: "20px", fontWeight: "700" },
  statLabel:          { fontSize: "13px", color: "#6b7280" },
  statDivider:        { width: "1px", height: "28px",
    background: "#e5e7eb", margin: "0 4px" },

  // Main layout
  main:               { flex: 1, maxWidth: "1280px", margin: "24px auto",
    padding: "0 24px", width: "100%" },
  layout:             { display: "flex", gap: "24px",
    alignItems: "flex-start" },
  leftPanel:          { width: "320px", flexShrink: 0 },
  rightPanel:         { flex: 1, minWidth: 0 },

  // Search
  searchCard:         { background: "#fff", borderRadius: "12px",
    padding: "16px", marginBottom: "16px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    border: "1px solid #f3f4f6" },
  searchTitle:        { margin: "0 0 10px 0", color: "#111827",
    fontSize: "13px", fontWeight: "600" },
  searchInput:        { width: "100%", padding: "8px 10px",
    borderRadius: "8px", border: "1px solid #e5e7eb",
    fontSize: "13px", boxSizing: "border-box",
    marginBottom: "8px", fontFamily: "inherit" },
  clearBtn:           { width: "100%", padding: "7px",
    background: "#f8fafc", border: "1px solid #e5e7eb",
    borderRadius: "7px", fontSize: "12px",
    cursor: "pointer", color: "#6b7280" },

  // Patient list
  listHeader:         { marginBottom: "8px", padding: "0 2px" },
  listTitle:          { fontSize: "12px", color: "#6b7280",
    fontWeight: "600", textTransform: "uppercase",
    letterSpacing: "0.5px" },
  emptyList:          { background: "#fff", borderRadius: "10px",
    padding: "20px", textAlign: "center",
    border: "1px solid #f3f4f6" },
  emptyListText:      { fontSize: "13px", color: "#9ca3af", margin: 0 },
  patientList:        { display: "flex", flexDirection: "column",
    gap: "6px" },
  patientCard:        { background: "#fff", borderRadius: "10px",
    padding: "12px", cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    transition: "box-shadow 0.15s",
    border: "1px solid #f3f4f6" },
  patientCardRow:     { display: "flex", alignItems: "center", gap: "10px" },
  patientAvatar:      { width: "34px", height: "34px", borderRadius: "50%",
    background: "#eff6ff", color: "#2563eb",
    display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: "14px",
    fontWeight: "700", flexShrink: 0 },
  patientInfo:        { flex: 1, minWidth: 0 },
  patientName:        { display: "block", fontWeight: "600",
    fontSize: "13px", color: "#111827" },
  patientDate:        { display: "block", fontSize: "11px",
    color: "#9ca3af" },
  patientDisease:     { display: "block", fontSize: "12px",
    color: "#6b7280",
    overflow: "hidden", textOverflow: "ellipsis",
    whiteSpace: "nowrap" },
  miniStatus:         { padding: "2px 8px", borderRadius: "20px",
    fontSize: "11px", fontWeight: "500", flexShrink: 0 },

  // Right panel empty state
  emptyState:         { background: "#fff", borderRadius: "16px",
    padding: "60px 32px", textAlign: "center",
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
    border: "1px solid #f3f4f6" },
  emptyStateIcon:     { width: "56px", height: "56px",
    borderRadius: "16px", background: "#f3f4f6",
    display: "flex", alignItems: "center",
    justifyContent: "center", margin: "0 auto 14px" },
  emptyStateTitle:    { fontSize: "16px", fontWeight: "600",
    color: "#374151", margin: "0 0 6px 0" },
  emptyStateDesc:     { fontSize: "14px", color: "#9ca3af", margin: 0 },

  // Patient detail header
  patientHeader:      { display: "flex", alignItems: "center",
    gap: "14px", marginBottom: "20px",
    background: "#fff", borderRadius: "12px",
    padding: "16px 20px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    border: "1px solid #f3f4f6" },
  patientAvatarLg:    { width: "48px", height: "48px", borderRadius: "50%",
    background: "#eff6ff", color: "#2563eb",
    display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: "20px",
    fontWeight: "700", flexShrink: 0 },
  patientNameLg:      { margin: "0 0 2px 0", color: "#111827",
    fontSize: "16px", fontWeight: "600" },
  patientDateLg:      { margin: 0, color: "#9ca3af", fontSize: "13px" },
  urgencyBadge:       { padding: "5px 12px", borderRadius: "20px",
    fontSize: "12px", fontWeight: "500" },

  // Cards
  card:               { background: "#fff", borderRadius: "14px",
    padding: "20px", marginBottom: "16px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
    border: "1px solid #f3f4f6" },
  cardTitle:          { color: "#111827", margin: "0 0 4px 0",
    fontSize: "15px", fontWeight: "600" },
  cardDesc:           { color: "#9ca3af", fontSize: "13px",
    margin: "0 0 14px 0" },
  heatmapImg:         { width: "100%", borderRadius: "8px" },

  // Predictions
  resultRow:          { display: "flex", alignItems: "center",
    gap: "10px", marginBottom: "12px" },
  rankCircle:         { width: "24px", height: "24px", borderRadius: "50%",
    display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: "11px",
    fontWeight: "700", flexShrink: 0 },
  resultDisease:      { display: "block", fontSize: "12px",
    color: "#374151", marginBottom: "4px" },
  barOuter:           { background: "#f3f4f6",
    borderRadius: "4px", height: "7px" },
  barInner:           { height: "7px", borderRadius: "4px",
    transition: "width 0.6s ease" },
  confText:           { fontSize: "13px", color: "#6b7280",
    fontWeight: "600", minWidth: "38px", textAlign: "right" },

  // Assessment
  fieldLabel:         { fontSize: "11px", fontWeight: "700",
    color: "#374151", margin: "0 0 8px 0",
    textTransform: "uppercase", letterSpacing: "0.5px" },
  urgencyRow:         { display: "flex", gap: "10px",
    marginBottom: "16px" },
  urgencyBtn:         { flex: 1, padding: "10px",
    borderRadius: "8px", cursor: "pointer",
    fontSize: "13px", fontWeight: "500",
    fontFamily: "inherit" },
  textarea:           { width: "100%", padding: "10px 12px",
    borderRadius: "8px", border: "1px solid #e5e7eb",
    fontSize: "14px", boxSizing: "border-box",
    marginBottom: "12px", resize: "vertical",
    lineHeight: "1.6", fontFamily: "inherit" },
  saveBtn:            { padding: "10px 24px", background: "#2563eb",
    color: "#fff", border: "none", borderRadius: "8px",
    cursor: "pointer", fontSize: "14px", fontWeight: "500" },
  savedMsg:           { marginTop: "12px", padding: "10px 14px",
    background: "#f0fdf4", color: "#16a34a",
    borderRadius: "8px", fontSize: "13px",
    border: "1px solid #bbf7d0" },
  prevComment:        { color: "#374151", fontSize: "14px",
    lineHeight: "1.6", margin: 0 },

  // Footer
  footer:             { background: "#0f172a", marginTop: "auto" },
  footerInner:        { maxWidth: "1280px", margin: "0 auto",
    padding: "48px 24px 24px" },
  footerTop:          { display: "grid",
    gridTemplateColumns: "260px 1fr",
    gap: "48px", marginBottom: "40px" },
  footerBrand:        { },
  footerLogoWrap:     { display: "flex", alignItems: "center",
    gap: "10px", marginBottom: "14px" },
  footerLogoIcon:     { width: "32px", height: "32px", borderRadius: "8px",
    background: "#1e3a5f", border: "1px solid #1e40af",
    display: "flex", alignItems: "center",
    justifyContent: "center" },
  footerLogoName:     { display: "block", fontSize: "14px",
    fontWeight: "700", color: "#f9fafb" },
  footerLogoSub:      { display: "block", fontSize: "10px",
    color: "#6b7280" },
  footerDesc:         { fontSize: "13px", color: "#94a3b8",
    lineHeight: "1.7", margin: 0 },
  footerLinks:        { display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" },
  footerCol:          { display: "flex", flexDirection: "column",
    gap: "8px" },
  footerColTitle:     { fontSize: "11px", fontWeight: "700",
    color: "#f9fafb", margin: "0 0 6px 0",
    textTransform: "uppercase", letterSpacing: "0.8px" },
  footerLink:         { fontSize: "13px", color: "#94a3b8",
    cursor: "pointer" },
  footerDivider:      { height: "1px", background: "#1e293b",
    margin: "0 0 20px 0" },
  footerDisclaimer:   { display: "flex", gap: "10px",
    alignItems: "flex-start", background: "#0a1628",
    borderRadius: "10px", padding: "14px 16px",
    marginBottom: "20px", border: "1px solid #1e3a5f" },
  footerDisclaimerText: { fontSize: "12px", color: "#64748b",
    lineHeight: "1.6", margin: 0 },
  footerBottom:       { display: "flex", justifyContent: "space-between",
    alignItems: "center", flexWrap: "wrap", gap: "8px" },
  footerCopy:         { fontSize: "12px", color: "#4b5563", margin: 0 },
  footerLegal:        { display: "flex", alignItems: "center",
    gap: "8px" },
  footerLegalLink:    { fontSize: "12px", color: "#4b5563",
    cursor: "pointer" },
  footerLegalDot:     { color: "#374151", fontSize: "12px" },
};