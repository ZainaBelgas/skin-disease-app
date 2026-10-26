import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DISEASE_INFO = {
  "Eczema Photos": {
    description: "Eczema (Atopic Dermatitis) is a chronic inflammatory skin condition that causes dry, itchy, and inflamed skin. It is very common and can affect people of all ages.",
    symptoms:    ["Dry, sensitive skin", "Intense itching", "Red or brownish-gray patches", "Small raised bumps", "Thickened or cracked skin"],
    treatment:   ["Moisturize skin regularly", "Use mild soaps and detergents", "Apply prescribed corticosteroid creams", "Avoid known triggers"],
    urgency:     "Generally manageable at home. See a doctor if symptoms are severe or infected.",
    color:       "#3b82f6",
  },
  "Melanoma Skin Cancer Nevi And Moles": {
    description: "Melanoma is the most serious type of skin cancer. It develops from melanocytes. Early detection is critical for successful treatment.",
    symptoms:    ["Asymmetrical mole or lesion", "Irregular or ragged borders", "Multiple colors within the same lesion", "Diameter larger than 6mm", "Evolving size, shape or color"],
    treatment:   ["Surgical removal", "Immunotherapy", "Targeted therapy", "Radiation therapy if advanced"],
    urgency:     "URGENT — See a dermatologist or oncologist immediately. Early detection saves lives.",
    color:       "#dc2626",
  },
  "Nail Fungus And Other Nail Disease": {
    description: "Nail fungus (Onychomycosis) is a common fungal infection affecting fingernails or toenails causing discoloration and brittleness.",
    symptoms:    ["Thickened nails", "Yellow-brown discoloration", "Brittle or crumbly nails", "Distorted nail shape", "Slight foul odor"],
    treatment:   ["Antifungal oral medications", "Topical antifungal nail cream", "Keep nails clean and trimmed", "Wear moisture-wicking socks"],
    urgency:     "Not urgent. Treatable with over-the-counter antifungal products. See a doctor if severe.",
    color:       "#f59e0b",
  },
  "Exanthems And Drug Eruptions": {
    description: "Exanthems are widespread skin rashes often caused by viral infections or drug reactions that can appear suddenly.",
    symptoms:    ["Widespread red rash", "Fever", "Skin bumps or blisters", "Itching or burning sensation", "Rash spreading quickly"],
    treatment:   ["Stop suspected medication immediately", "Antihistamines for itching", "Corticosteroids for severe reactions", "Hydration and rest"],
    urgency:     "See a doctor promptly, especially if caused by medication or if fever is present.",
    color:       "#8b5cf6",
  },
};

const findDiseaseInfo = (name) => {
  for (const key of Object.keys(DISEASE_INFO)) {
    if (name?.includes(key.split(" ")[0]) || key.includes(name?.split(" ")[0]))
      return { ...DISEASE_INFO[key], name: key };
  }
  return null;
};

export default function Patient() {
  const [tab,             setTab]             = useState("home");
  const [image,           setImage]           = useState(null);
  const [preview,         setPreview]         = useState(null);
  const [results,         setResults]         = useState(null);
  const [heatmap,         setHeatmap]         = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [history,         setHistory]         = useState([]);
  const [hover,           setHover]           = useState({});
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [showNotif,       setShowNotif]       = useState(false);
  const [showProfile,     setShowProfile]     = useState(false);
  const [notifications,   setNotifications]   = useState([
    { id: 1, text: "Welcome! Upload your first image to get started.", type: "info", read: false },
    { id: 2, text: "Tip: Take photos in good lighting for better accuracy.",  type: "tip",  read: false },
  ]);
  const [profile, setProfile] = useState({
    age:   localStorage.getItem("age")   || "",
    sex:   localStorage.getItem("sex")   || "",
    photo: localStorage.getItem("photo") || "",
  });
  const [editProfile, setEditProfile] = useState(false);

  const navigate  = useNavigate();
  const username  = localStorage.getItem("username");
  const unreadCount = notifications.filter(n => !n.read).length;
  const diseaseInfo = findDiseaseInfo(results?.[0]?.disease || "");

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/analyses/${username}`);
      setHistory(res.data.reverse());
      const hasNewComment = res.data.some(a => a.comment && !a.commentRead);
      if (hasNewComment) {
        setNotifications(prev => {
          if (prev.find(n => n.id === 99)) return prev;
          return [...prev, {
            id: 99, read: false, type: "doctor",
            text: "New message from your doctor — check your history."
          }];
        });
      }
    } catch {}
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResults(null);
    setHeatmap(null);
  };

  const handleAnalyze = async () => {
    if (!image) return alert("Please upload an image first.");
    if (!profile.age || !profile.sex)
      return alert("Please complete your profile (age and sex) before analyzing.");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", image);
      const res = await axios.post(
        `http://127.0.0.1:8000/predict?username=${username}`, formData);
      setResults(res.data.predictions);
      setHeatmap(res.data.heatmap);
      await loadHistory();
      setNotifications(prev => [...prev, {
        id: Date.now(), read: false, type: "result",
        text: `Analysis complete — ${res.data.predictions[0]?.disease.split(" ")[0]} detected.`
      }]);
    } catch {
      alert("Error connecting to server. Make sure the backend is running.");
    }
    setLoading(false);
  };

  const handleRate = async (id, rating) => {
    const feedback = document.getElementById(`feedback-${id}`)?.value || "";
    await axios.post(`http://127.0.0.1:8000/rating/${id}`, { rating, feedback });
    await loadHistory();
  };

  const saveProfile = () => {
    localStorage.setItem("age",   profile.age);
    localStorage.setItem("sex",   profile.sex);
    localStorage.setItem("photo", profile.photo);
    setEditProfile(false);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      setProfile(p => ({ ...p, photo: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const getEvolution = (current, previous) => {
    if (!previous) return null;
    const curr = current.predictions[0]?.confidence  || 0;
    const prev = previous.predictions[0]?.confidence || 0;
    if (curr < prev - 5) return { text: "Improving",  color: "#16a34a" };
    if (curr > prev + 5) return { text: "Worsening",  color: "#dc2626" };
    return { text: "Stable", color: "#f59e0b" };
  };

  return (
    <div style={s.page}>

      {/* ── HEADER ── */}
      <header style={s.header}>
        <div style={s.headerInner}>

          {/* Logo */}
          <div style={s.logoWrap} onClick={() => setTab("home")}>
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
            {[
              { key: "home",    label: "Home"      },
              { key: "analyze", label: "Analysis"  },
              { key: "history", label: "History"   },
              { key: "profile", label: "Dashboard" },
            ].map(item => (
              <button key={item.key}
                style={{
                  ...s.navBtn,
                  color:      tab === item.key ? "#2563eb" : "#4b5563",
                  fontWeight: tab === item.key ? "600"     : "400",
                  background: tab === item.key ? "#eff6ff" : "transparent",
                }}
                onClick={() => setTab(item.key)}>
                {item.label}
                {tab === item.key && <span style={s.navDot} />}
              </button>
            ))}
          </nav>

          {/* Right */}
          <div style={s.headerActions}>
            <button style={s.newAnalysisBtn}
              onClick={() => setTab("analyze")}>
              New Analysis
            </button>

            {/* Notifications */}
            <div style={{ position: "relative" }}>
              <button style={s.iconBtn}
                onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
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
                        setNotifications(n => n.map(x => ({ ...x, read: true })));
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
                onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}>
                {profile.photo
                  ? <img src={profile.photo} alt="avatar" style={s.avatarImg} />
                  : <span style={s.avatarInitial}>
                      {username?.charAt(0).toUpperCase()}
                    </span>
                }
                <span style={s.avatarName}>{username}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="#6b7280" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {showProfile && (
                <div style={s.dropdown}>
                  <div style={s.profileDropTop}>
                    {profile.photo
                      ? <img src={profile.photo} alt="avatar"
                          style={s.profileDropImg} />
                      : <div style={s.profileDropAvatar}>
                          {username?.charAt(0).toUpperCase()}
                        </div>
                    }
                    <div>
                      <p style={s.profileDropName}>{username}</p>
                      <p style={s.profileDropRole}>Patient</p>
                    </div>
                  </div>
                  <div style={s.dropDivider} />
                  <button style={s.dropItem}
                    onClick={() => { setTab("profile"); setShowProfile(false); }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    My Profile
                  </button>
                  <div style={s.dropDivider} />
                  <button style={{ ...s.dropItem, color: "#dc2626" }}
                    onClick={() => { localStorage.clear(); navigate("/"); }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="#dc2626" strokeWidth="2"
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

      {/* ── CONTENT ── */}
      <main style={s.main}>

        {/* ══════════ HOME ══════════ */}
        {tab === "home" && (
          <div>
            {/* Hero */}
            <div style={s.hero}>
              <div style={s.heroText}>
                <div style={s.heroBadge}>AI-Powered Dermatology</div>
                <h1 style={s.heroTitle}>
                  Skin Disease Detection<br />Made Accessible
                </h1>
                <p style={s.heroDesc}>
                  Upload a photo of your skin condition and receive an
                  instant AI-powered analysis with a detailed medical
                  report. Fast, accurate, and easy to use.
                </p>
                <div style={s.heroButtons}>
                  <button style={s.heroPrimary}
                    onClick={() => setTab("analyze")}>
                    Start Analysis
                  </button>
                  <button style={s.heroSecondary}
                    onClick={() => setTab("history")}>
                    View History
                  </button>
                </div>
              </div>
              <div style={s.heroCards}>
                {[
                  { title: "AI Model",   sub: "EfficientNet-B0",     icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
                  { title: "Grad-CAM",   sub: "Visual Explanation",  icon: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0" },
                  { title: "4 Classes",  sub: "Skin Conditions",     icon: "M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
                ].map((c, i) => (
                  <div key={i} style={s.heroCard}>
                    <div style={s.heroCardIconWrap}>
                      <svg width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="#2563eb" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d={c.icon} />
                      </svg>
                    </div>
                    <p style={s.heroCardTitle}>{c.title}</p>
                    <p style={s.heroCardSub}>{c.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* How it works */}
            <section style={s.section}>
              <h2 style={s.sectionTitle}>How It Works</h2>
              <p style={s.sectionSub}>
                Four simple steps from photo to medical insight
              </p>
              <div style={s.steps}>
                {[
                  { num: "01", title: "Upload Photo",
                    desc: "Take a clear, well-lit photo of the affected skin area." },
                  { num: "02", title: "AI Analysis",
                    desc: "Our EfficientNet-B0 model analyzes the image instantly." },
                  { num: "03", title: "Get Results",
                    desc: "Receive a diagnosis with confidence scores and heatmap." },
                  { num: "04", title: "Doctor Review",
                    desc: "A doctor validates and adds personalized medical advice." },
                ].map((step, i) => (
                  <div key={i} style={s.stepCard}>
                    <span style={s.stepNum}>{step.num}</span>
                    <h4 style={s.stepTitle}>{step.title}</h4>
                    <p style={s.stepDesc}>{step.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Conditions */}
            <section style={s.section}>
              <h2 style={s.sectionTitle}>Detectable Conditions</h2>
              <p style={s.sectionSub}>
                Currently trained on four common skin conditions
              </p>
              <div style={s.conditionGrid}>
                {Object.entries(DISEASE_INFO).map(([key, val]) => (
                  <div key={key} style={{
                    ...s.conditionCard,
                    borderTop: `3px solid ${val.color}`
                  }}>
                    <div style={{
                      ...s.conditionDot,
                      background: val.color + "20",
                      color: val.color
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                      </svg>
                    </div>
                    <h4 style={s.conditionTitle}>
                      {key.split(" ").slice(0, 3).join(" ")}
                    </h4>
                    <p style={s.conditionDesc}>
                      {val.description.substring(0, 90)}...
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Stats */}
            <section style={s.statsSection}>
              {[
                { num: history.length,
                  label: "Total Analyses" },
                { num: history.filter(a => a.urgency).length,
                  label: "Reviewed by Doctor" },
                { num: history.filter(a => a.rating > 0).length,
                  label: "Rated" },
              ].map((st, i) => (
                <div key={i} style={s.statBox}>
                  <h2 style={s.statNum}>{st.num}</h2>
                  <p style={s.statLabel}>{st.label}</p>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* ══════════ ANALYZE ══════════ */}
        {tab === "analyze" && (
          <div>
            {(!profile.age || !profile.sex) && (
              <div style={s.alert}>
                Please complete your profile (age and sex) before analyzing.
                <button style={s.alertBtn}
                  onClick={() => setTab("profile")}>
                  Complete Profile
                </button>
              </div>
            )}

            <div style={s.analyzeGrid}>
              {/* Upload */}
              <div style={s.card}>
                <h3 style={s.cardTitle}>Upload Skin Image</h3>
                <p style={s.cardDesc}>
                  Take a clear, well-lit photo of the affected area.
                </p>
                {profile.age && profile.sex && (
                  <div style={s.patientBadge}>
                    {username} · {profile.age} years · {profile.sex}
                  </div>
                )}
                <label style={s.uploadArea}>
                  {preview
                    ? <img src={preview} alt="preview" style={s.previewImg} />
                    : (
                      <div style={s.uploadPlaceholder}>
                        <div style={s.uploadIconWrap}>
                          <svg width="24" height="24" viewBox="0 0 24 24"
                            fill="none" stroke="#9ca3af" strokeWidth="1.5"
                            strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18"
                              rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                        </div>
                        <p style={s.uploadText}>Click to upload image</p>
                        <p style={s.uploadSub}>JPG, PNG supported</p>
                      </div>
                    )
                  }
                  <input type="file" accept="image/*"
                    onChange={handleImage} style={{ display: "none" }} />
                </label>
                <button style={{
                  ...s.analyzeBtn,
                  background: loading ? "#93c5fd" : "#2563eb",
                  cursor: loading ? "not-allowed" : "pointer"
                }} onClick={handleAnalyze} disabled={loading}>
                  {loading ? "Analyzing..." : "Analyze with AI"}
                </button>
                {loading && <div style={s.progressBar}><div style={s.progressFill} /></div>}
              </div>

              {/* Results */}
              {results && (
                <div style={s.card}>
                  <h3 style={s.cardTitle}>AI Results</h3>
                  <p style={s.cardDesc}>Top predictions ranked by confidence</p>
                  {results.map((r, i) => (
                    <div key={i} style={s.resultRow}>
                      <div style={{
                        ...s.rankCircle,
                        background: i === 0 ? "#2563eb" : "#e0e7ff",
                        color:      i === 0 ? "#fff"    : "#2563eb",
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={s.resultDisease}>
                          {r.disease.split(" ").slice(0, 4).join(" ")}
                        </span>
                        <div style={s.barOuter}>
                          <div style={{
                            ...s.barInner,
                            width: `${r.confidence}%`,
                            background: i === 0 ? "#2563eb" : "#bfdbfe"
                          }} />
                        </div>
                      </div>
                      <span style={s.confText}>{r.confidence}%</span>
                    </div>
                  ))}
                  <p style={s.disclaimer}>
                    This is an AI suggestion only — not a certified medical diagnosis.
                  </p>
                </div>
              )}
            </div>

            {/* Medical Report */}
            {results && diseaseInfo && (
              <div style={s.reportCard}>
                <div style={{
                  ...s.reportHeader,
                  borderLeft: `4px solid ${diseaseInfo.color}`
                }}>
                  <div style={s.reportHeaderLeft}>
                    <div style={{
                      ...s.reportColorBar,
                      background: diseaseInfo.color
                    }} />
                    <div>
                      <h3 style={s.reportTitle}>Medical Report</h3>
                      <p style={s.reportSubtitle}>
                        {diseaseInfo.name?.split(" ").slice(0, 4).join(" ")}
                      </p>
                    </div>
                  </div>
                  <div style={s.reportMeta}>
                    <span style={{
                      ...s.confBadge,
                      background: diseaseInfo.color + "15",
                      color:      diseaseInfo.color
                    }}>
                      {results[0]?.confidence}% confidence
                    </span>
                    <p style={s.reportDate}>
                      {new Date().toLocaleDateString("en-GB")}
                    </p>
                  </div>
                </div>

                <div style={s.reportBody}>
                  <div style={s.reportSection}>
                    <h4 style={s.reportSectionTitle}>Overview</h4>
                    <p style={s.reportText}>{diseaseInfo.description}</p>
                  </div>

                  <div style={s.reportTwoCol}>
                    <div style={s.reportSection}>
                      <h4 style={s.reportSectionTitle}>Common Symptoms</h4>
                      {diseaseInfo.symptoms.map((sym, i) => (
                        <div key={i} style={s.listRow}>
                          <span style={{
                            ...s.listBullet,
                            background: diseaseInfo.color
                          }} />
                          <span style={s.listText}>{sym}</span>
                        </div>
                      ))}
                    </div>
                    <div style={s.reportSection}>
                      <h4 style={s.reportSectionTitle}>
                        Recommended Treatment
                      </h4>
                      {diseaseInfo.treatment.map((t, i) => (
                        <div key={i} style={s.listRow}>
                          <span style={{
                            ...s.listBullet, background: "#16a34a"
                          }} />
                          <span style={s.listText}>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    ...s.urgencyBox,
                    background: diseaseInfo.urgency.includes("URGENT")
                      ? "#fef2f2" : "#f0fdf4",
                    borderColor: diseaseInfo.urgency.includes("URGENT")
                      ? "#fecaca" : "#bbf7d0",
                  }}>
                    <h4 style={{
                      ...s.reportSectionTitle,
                      color: diseaseInfo.urgency.includes("URGENT")
                        ? "#dc2626" : "#16a34a"
                    }}>
                      Medical Advice
                    </h4>
                    <p style={s.reportText}>{diseaseInfo.urgency}</p>
                  </div>

                  {heatmap && (
                    <div style={s.reportSection}>
                      <h4 style={s.reportSectionTitle}>
                        Grad-CAM Heatmap — AI Focus Areas
                      </h4>
                      <p style={s.reportText}>
                        The highlighted zones indicate where the model
                        focused to make its prediction.
                      </p>
                      <img src={heatmap} alt="Grad-CAM heatmap"
                        style={s.heatmapImg} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════ HISTORY ══════════ */}
        {tab === "history" && !selectedHistory && (
          <div>
            <div style={s.pageHeader}>
              <div>
                <h2 style={s.pageTitle}>Analysis History</h2>
                <p style={s.pageSub}>
                  {history.length} total analyses
                </p>
              </div>
              <button style={s.refreshBtn} onClick={loadHistory}>
                Refresh
              </button>
            </div>

            {history.length === 0 && (
              <div style={s.emptyState}>
                <div style={s.emptyIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24"
                    fill="none" stroke="#d1d5db" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <h3 style={s.emptyTitle}>No analyses yet</h3>
                <p style={s.emptyDesc}>
                  Go to Analysis to upload your first image.
                </p>
                <button style={s.heroPrimary}
                  onClick={() => setTab("analyze")}>
                  Start First Analysis
                </button>
              </div>
            )}

            {history.map((a, i) => {
              const evolution = getEvolution(a, history[i + 1]);
              return (
                <div key={i} style={s.historyCard}>
                  <div style={s.historyTop}>
                    <div style={s.historyLeft}>
                      <div style={{
                        ...s.historyStatusDot,
                        background:
                          a.urgency === "urgent" ? "#dc2626" :
                          a.urgency === "normal"  ? "#16a34a" : "#d1d5db"
                      }} />
                      <div>
                        <p style={s.historyDate}>{a.date}</p>
                        <p style={s.historyDisease}>
                          {a.predictions[0]?.disease
                            .split(" ").slice(0, 4).join(" ")}
                        </p>
                        <p style={s.historyConf}>
                          Confidence: {a.predictions[0]?.confidence}%
                          {evolution && (
                            <span style={{
                              marginLeft: "10px",
                              color: evolution.color,
                              fontSize: "12px",
                              fontWeight: "500"
                            }}>
                              {evolution.text}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div style={s.historyRight}>
                      <span style={{
                        ...s.urgencyBadge,
                        background:
                          a.urgency === "urgent" ? "#fee2e2" :
                          a.urgency === "normal"  ? "#dcfce7" : "#f3f4f6",
                        color:
                          a.urgency === "urgent" ? "#dc2626" :
                          a.urgency === "normal"  ? "#16a34a" : "#6b7280"
                      }}>
                        {a.urgency === "urgent" ? "Urgent"  :
                         a.urgency === "normal"  ? "Normal"  : "Pending review"}
                      </span>
                      <button style={s.detailBtn}
                        onClick={() => setSelectedHistory(a)}>
                        View Details
                      </button>
                    </div>
                  </div>

                  {a.comment ? (
                    <div style={s.commentBox}>
                      <span style={s.commentLabel}>Doctor's Assessment</span>
                      <p style={s.commentText}>{a.comment}</p>
                    </div>
                  ) : (
                    <p style={s.pendingText}>
                      Awaiting doctor review...
                    </p>
                  )}

                  {!a.rating && a.urgency && (
                    <div style={s.ratingBox}>
                      <p style={s.ratingLabel}>Rate your experience</p>
                      <div style={s.stars}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} style={s.star}
                            onMouseEnter={() =>
                              setHover(h => ({ ...h, [a.id]: star }))}
                            onMouseLeave={() =>
                              setHover(h => ({ ...h, [a.id]: 0 }))}
                            onClick={() => handleRate(a.id, star)}>
                            {star <= (hover[a.id] || 0) ? "★" : "☆"}
                          </span>
                        ))}
                      </div>
                      <input style={s.feedbackInput}
                        placeholder="Leave a comment (optional)"
                        id={`feedback-${a.id}`} />
                      <button style={s.submitRating}
                        onClick={() => handleRate(a.id, hover[a.id] || 1)}>
                        Submit Rating
                      </button>
                    </div>
                  )}

                  {a.rating > 0 && (
                    <p style={s.ratedMsg}>
                      {"★".repeat(a.rating)}{"☆".repeat(5 - a.rating)}
                      {a.feedback ? ` — ${a.feedback}` : ""}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* HISTORY DETAIL */}
        {tab === "history" && selectedHistory && (
          <div>
            <button style={s.backBtn}
              onClick={() => setSelectedHistory(null)}>
              &larr; Back to History
            </button>
            <div style={s.reportCard}>
              <div style={s.reportHeader}>
                <div>
                  <h3 style={s.reportTitle}>Analysis Details</h3>
                  <p style={s.reportSubtitle}>{selectedHistory.date}</p>
                </div>
                <span style={{
                  ...s.urgencyBadge,
                  background:
                    selectedHistory.urgency === "urgent" ? "#fee2e2" :
                    selectedHistory.urgency === "normal"  ? "#dcfce7" : "#f3f4f6",
                  color:
                    selectedHistory.urgency === "urgent" ? "#dc2626" :
                    selectedHistory.urgency === "normal"  ? "#16a34a" : "#6b7280"
                }}>
                  {selectedHistory.urgency === "urgent" ? "Urgent" :
                   selectedHistory.urgency === "normal"  ? "Normal" : "Pending"}
                </span>
              </div>
              <div style={s.reportBody}>
                <img src={selectedHistory.heatmap} alt="heatmap"
                  style={s.heatmapImg} />
                <h4 style={s.reportSectionTitle}>AI Predictions</h4>
                {selectedHistory.predictions.map((p, i) => (
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
                {selectedHistory.comment && (
                  <div style={{ ...s.commentBox, marginTop: "16px" }}>
                    <span style={s.commentLabel}>Doctor's Assessment</span>
                    <p style={s.commentText}>{selectedHistory.comment}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ PROFILE / DASHBOARD ══════════ */}
        {tab === "profile" && (
          <div style={s.profilePage}>

            <div style={s.card}>
              <div style={s.profileTop}>
                <div style={s.profileAvatarWrap}>
                  {profile.photo
                    ? <img src={profile.photo} alt="profile"
                        style={s.profileAvatarImg} />
                    : <div style={s.profileAvatarDefault}>
                        {username?.charAt(0).toUpperCase()}
                      </div>
                  }
                  {editProfile && (
                    <label style={s.changePhotoBtn}>
                      <svg width="10" height="10" viewBox="0 0 24 24"
                        fill="none" stroke="#fff" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      <input type="file" accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ display: "none" }} />
                    </label>
                  )}
                </div>
                <div>
                  <h2 style={s.profileName}>{username}</h2>
                  <p style={s.profileRole}>Patient</p>
                  {!editProfile && (
                    <button style={s.editBtn}
                      onClick={() => setEditProfile(true)}>
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              {editProfile ? (
                <div>
                  <div style={s.formRow}>
                    <div style={s.formField}>
                      <label style={s.formLabel}>Age</label>
                      <input style={s.formInput} type="number"
                        placeholder="Your age" value={profile.age}
                        onChange={e =>
                          setProfile(p => ({ ...p, age: e.target.value }))} />
                    </div>
                    <div style={s.formField}>
                      <label style={s.formLabel}>Sex</label>
                      <select style={s.formInput} value={profile.sex}
                        onChange={e =>
                          setProfile(p => ({ ...p, sex: e.target.value }))}>
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div style={s.formActions}>
                    <button style={s.saveBtn} onClick={saveProfile}>
                      Save
                    </button>
                    <button style={s.cancelBtn}
                      onClick={() => setEditProfile(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {[
                    { label: "Username", value: username },
                    { label: "Age",      value: profile.age || "Not set" },
                    { label: "Sex",      value: profile.sex || "Not set" },
                    { label: "Role",     value: "Patient" },
                  ].map((row, i) => (
                    <div key={i} style={s.infoRow}>
                      <span style={s.infoLabel}>{row.label}</span>
                      <span style={s.infoValue}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Health Summary</h3>
              <div style={s.healthGrid}>
                {[
                  { num: history.length,
                    label: "Total Analyses",     color: "#2563eb" },
                  { num: history.filter(a => a.urgency === "urgent").length,
                    label: "Urgent Cases",        color: "#dc2626" },
                  { num: history.filter(a => a.urgency === "normal").length,
                    label: "Normal Cases",        color: "#16a34a" },
                  { num: history.filter(a => a.comment).length,
                    label: "Doctor Reviews",      color: "#f59e0b" },
                ].map((item, i) => (
                  <div key={i} style={s.healthItem}>
                    <span style={{ ...s.healthNum, color: item.color }}>
                      {item.num}
                    </span>
                    <span style={s.healthLabel}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
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
                {
                  title: "Platform",
                  items: ["Home", "Analysis", "History", "Dashboard"]
                },
                {
                  title: "About",
                  items: ["About DermAI", "How it works", "Medical disclaimer"]
                },
                {
                  title: "Support",
                  items: ["Help Center", "Contact Support", "FAQs"]
                },
                {
                  title: "Contact",
                  items: [
                    "contact@dermai.ma",
                    "+212 6 00 00 00 00",
                    "Casablanca, Maroc",
                    "Mon–Fri, 9:00–18:00"
                  ]
                },
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
              DermAI is an educational and research prototype only. It is not
              a certified medical device and does not provide medical diagnoses.
              Always consult a qualified dermatologist for medical advice.
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

  // ── Header ──
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
    gap: "10px", cursor: "pointer", flexShrink: 0 },
  logoIcon:           { width: "34px", height: "34px", borderRadius: "9px",
    background: "#eff6ff", border: "1px solid #bfdbfe",
    display: "flex", alignItems: "center", justifyContent: "center" },
  logoName:           { display: "block", fontSize: "15px",
    fontWeight: "700", color: "#111827", lineHeight: "1.2" },
  logoSub:            { display: "block", fontSize: "10px",
    color: "#9ca3af", lineHeight: "1.2" },
  centerNav:          { display: "flex", alignItems: "center", gap: "2px" },
  navBtn:             { position: "relative", padding: "7px 14px",
    border: "none", cursor: "pointer", fontSize: "13px",
    borderRadius: "8px", transition: "all 0.15s",
    fontFamily: "inherit" },
  navDot:             { position: "absolute", bottom: "3px", left: "50%",
    transform: "translateX(-50%)", width: "16px",
    height: "2px", background: "#2563eb", borderRadius: "2px" },
  headerActions:      { display: "flex", alignItems: "center",
    gap: "8px", flexShrink: 0 },
  newAnalysisBtn:     { padding: "8px 16px", background: "#2563eb",
    color: "#fff", border: "none", borderRadius: "8px",
    fontSize: "13px", fontWeight: "600", cursor: "pointer" },
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
    boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 200,
    overflow: "hidden" },
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
  profileDropImg:     { width: "38px", height: "38px", borderRadius: "50%",
    objectFit: "cover" },
  profileDropAvatar:  { width: "38px", height: "38px", borderRadius: "50%",
    background: "#2563eb", color: "#fff", fontSize: "15px",
    fontWeight: "700", display: "flex", alignItems: "center",
    justifyContent: "center" },
  profileDropName:    { fontSize: "14px", fontWeight: "600",
    color: "#111827", margin: "0 0 2px 0" },
  profileDropRole:    { fontSize: "12px", color: "#6b7280", margin: 0 },
  dropDivider:        { height: "1px", background: "#f3f4f6" },
  dropItem:           { width: "100%", padding: "10px 16px",
    display: "flex", alignItems: "center", gap: "10px",
    background: "none", border: "none", cursor: "pointer",
    fontSize: "13px", color: "#374151", textAlign: "left" },
  avatarBtn:          { display: "flex", alignItems: "center", gap: "8px",
    padding: "5px 10px", border: "1px solid #e5e7eb",
    borderRadius: "8px", background: "none", cursor: "pointer" },
  avatarImg:          { width: "26px", height: "26px",
    borderRadius: "50%", objectFit: "cover" },
  avatarInitial:      { width: "26px", height: "26px", borderRadius: "50%",
    background: "#2563eb", color: "#fff", fontSize: "11px",
    fontWeight: "700", display: "flex", alignItems: "center",
    justifyContent: "center" },
  avatarName:         { fontSize: "13px", color: "#374151",
    fontWeight: "500", maxWidth: "80px",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  logoutBtn:          { display: "flex", alignItems: "center", gap: "6px",
    padding: "7px 14px", background: "none",
    border: "1px solid #e5e7eb", borderRadius: "8px",
    cursor: "pointer", fontSize: "13px", color: "#4b5563" },

  // ── Main ──
  main:               { flex: 1, maxWidth: "1100px", margin: "32px auto",
    padding: "0 24px", width: "100%" },

  // ── Home ──
  hero:               { background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    borderRadius: "20px", padding: "52px 48px",
    display: "flex", gap: "40px", alignItems: "center",
    marginBottom: "40px" },
  heroText:           { flex: 1 },
  heroBadge:          { display: "inline-block", background: "rgba(255,255,255,0.15)",
    color: "#bfdbfe", fontSize: "12px", fontWeight: "600",
    padding: "4px 12px", borderRadius: "20px", marginBottom: "16px",
    letterSpacing: "0.5px" },
  heroTitle:          { fontSize: "30px", fontWeight: "700",
    color: "#fff", margin: "0 0 14px 0", lineHeight: "1.3" },
  heroDesc:           { color: "#bfdbfe", lineHeight: "1.7",
    margin: "0 0 24px 0", fontSize: "15px" },
  heroButtons:        { display: "flex", gap: "12px" },
  heroPrimary:        { padding: "11px 24px", background: "#fff",
    color: "#1d4ed8", border: "none", borderRadius: "9px",
    fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  heroSecondary:      { padding: "11px 24px",
    background: "rgba(255,255,255,0.15)",
    color: "#fff", border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: "9px", fontSize: "14px", cursor: "pointer" },
  heroCards:          { display: "flex", flexDirection: "column", gap: "10px" },
  heroCard:           { background: "rgba(255,255,255,0.12)",
    borderRadius: "12px", padding: "14px 20px",
    display: "flex", alignItems: "center", gap: "12px",
    minWidth: "180px" },
  heroCardIconWrap:   { width: "30px", height: "30px", borderRadius: "8px",
    background: "rgba(255,255,255,0.15)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0 },
  heroCardTitle:      { fontWeight: "600", color: "#fff",
    margin: "0 0 2px 0", fontSize: "13px" },
  heroCardSub:        { color: "#bfdbfe", margin: 0, fontSize: "11px" },
  section:            { marginBottom: "40px" },
  sectionTitle:       { fontSize: "20px", fontWeight: "700",
    color: "#111827", margin: "0 0 4px 0" },
  sectionSub:         { fontSize: "14px", color: "#6b7280",
    margin: "0 0 24px 0" },
  steps:              { display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" },
  stepCard:           { background: "#fff", borderRadius: "14px",
    padding: "20px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" },
  stepNum:            { display: "inline-block", fontSize: "11px",
    fontWeight: "700", color: "#2563eb",
    background: "#eff6ff", padding: "3px 8px",
    borderRadius: "6px", marginBottom: "10px", letterSpacing: "0.5px" },
  stepTitle:          { fontWeight: "600", color: "#111827",
    margin: "0 0 6px 0", fontSize: "14px" },
  stepDesc:           { color: "#6b7280", fontSize: "13px",
    margin: 0, lineHeight: "1.5" },
  conditionGrid:      { display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" },
  conditionCard:      { background: "#fff", borderRadius: "12px",
    padding: "18px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" },
  conditionDot:       { width: "30px", height: "30px", borderRadius: "8px",
    display: "flex", alignItems: "center",
    justifyContent: "center", marginBottom: "10px" },
  conditionTitle:     { fontWeight: "600", color: "#111827",
    margin: "0 0 6px 0", fontSize: "13px" },
  conditionDesc:      { color: "#6b7280", fontSize: "12px",
    margin: 0, lineHeight: "1.5" },
  statsSection:       { display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px", marginBottom: "40px" },
  statBox:            { background: "#fff", borderRadius: "12px",
    padding: "20px", textAlign: "center",
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)" },
  statNum:            { fontSize: "28px", fontWeight: "700",
    color: "#2563eb", margin: "0 0 4px 0" },
  statLabel:          { color: "#6b7280", fontSize: "13px", margin: 0 },

  // ── Analyze ──
  alert:              { background: "#fef3c7", border: "1px solid #fde68a",
    borderRadius: "10px", padding: "12px 16px",
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: "20px",
    fontSize: "14px", color: "#92400e" },
  alertBtn:           { padding: "6px 14px", background: "#f59e0b",
    color: "#fff", border: "none", borderRadius: "6px",
    cursor: "pointer", fontSize: "13px" },
  analyzeGrid:        { display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px", marginBottom: "20px" },
  card:               { background: "#fff", borderRadius: "16px",
    padding: "22px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
    marginBottom: "20px" },
  cardTitle:          { color: "#111827", margin: "0 0 4px 0",
    fontSize: "16px", fontWeight: "600" },
  cardDesc:           { color: "#9ca3af", fontSize: "13px",
    margin: "0 0 16px 0" },
  patientBadge:       { background: "#eff6ff", color: "#2563eb",
    borderRadius: "8px", padding: "7px 12px",
    fontSize: "13px", marginBottom: "12px" },
  uploadArea:         { display: "block", border: "2px dashed #e5e7eb",
    borderRadius: "12px", cursor: "pointer",
    marginBottom: "16px", overflow: "hidden",
    minHeight: "160px", transition: "border-color 0.2s" },
  previewImg:         { width: "100%", display: "block" },
  uploadPlaceholder:  { padding: "32px 20px", textAlign: "center" },
  uploadIconWrap:     { marginBottom: "10px" },
  uploadText:         { color: "#374151", fontSize: "14px",
    fontWeight: "500", margin: "0 0 4px 0" },
  uploadSub:          { color: "#9ca3af", fontSize: "12px", margin: 0 },
  analyzeBtn:         { width: "100%", padding: "13px", color: "#fff",
    border: "none", borderRadius: "10px",
    fontSize: "14px", fontWeight: "600",
    transition: "background 0.2s" },
  progressBar:        { marginTop: "10px", height: "3px",
    background: "#dbeafe", borderRadius: "2px", overflow: "hidden" },
  progressFill:       { height: "3px", width: "70%",
    background: "#2563eb", borderRadius: "2px" },
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
  disclaimer:         { fontSize: "11px", color: "#9ca3af",
    marginTop: "12px" },

  // ── Report ──
  reportCard:         { background: "#fff", borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    marginBottom: "24px" },
  reportHeader:       { padding: "20px 24px",
    display: "flex", justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #f3f4f6" },
  reportHeaderLeft:   { display: "flex", alignItems: "center", gap: "14px" },
  reportColorBar:     { width: "4px", height: "36px",
    borderRadius: "2px" },
  reportTitle:        { margin: "0 0 2px 0", color: "#111827",
    fontSize: "16px", fontWeight: "600" },
  reportSubtitle:     { margin: 0, color: "#9ca3af", fontSize: "13px" },
  reportMeta:         { textAlign: "right" },
  confBadge:          { display: "inline-block", padding: "5px 12px",
    borderRadius: "20px", fontSize: "13px",
    fontWeight: "600" },
  reportDate:         { fontSize: "12px", color: "#9ca3af",
    margin: "4px 0 0 0" },
  reportBody:         { padding: "24px" },
  reportSection:      { marginBottom: "20px" },
  reportTwoCol:       { display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px", marginBottom: "20px" },
  reportSectionTitle: { fontSize: "11px", fontWeight: "700",
    color: "#374151", margin: "0 0 10px 0",
    textTransform: "uppercase", letterSpacing: "0.6px" },
  reportText:         { fontSize: "14px", color: "#4b5563",
    lineHeight: "1.7", margin: 0 },
  listRow:            { display: "flex", alignItems: "flex-start",
    gap: "8px", marginBottom: "6px" },
  listBullet:         { width: "6px", height: "6px", borderRadius: "50%",
    flexShrink: 0, marginTop: "6px" },
  listText:           { fontSize: "13px", color: "#4b5563",
    lineHeight: "1.5" },
  urgencyBox:         { padding: "16px", borderRadius: "10px",
    border: "1px solid", marginBottom: "20px" },
  heatmapImg:         { width: "100%", borderRadius: "10px",
    marginTop: "10px" },

  // ── History ──
  pageHeader:         { display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: "20px" },
  pageTitle:          { fontSize: "20px", fontWeight: "700",
    color: "#111827", margin: "0 0 2px 0" },
  pageSub:            { fontSize: "14px", color: "#6b7280", margin: 0 },
  refreshBtn:         { padding: "8px 16px", background: "#fff",
    border: "1px solid #e5e7eb", borderRadius: "8px",
    cursor: "pointer", fontSize: "13px", color: "#4b5563" },
  emptyState:         { background: "#fff", borderRadius: "16px",
    padding: "60px", textAlign: "center",
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)" },
  emptyIcon:          { width: "56px", height: "56px", borderRadius: "16px",
    background: "#f3f4f6", display: "flex",
    alignItems: "center", justifyContent: "center",
    margin: "0 auto 16px" },
  emptyTitle:         { fontSize: "16px", fontWeight: "600",
    color: "#374151", margin: "0 0 6px 0" },
  emptyDesc:          { fontSize: "14px", color: "#9ca3af",
    margin: "0 0 20px 0" },
  historyCard:        { background: "#fff", borderRadius: "14px",
    padding: "20px", marginBottom: "14px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)" },
  historyTop:         { display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: "12px" },
  historyLeft:        { display: "flex", gap: "12px",
    alignItems: "flex-start" },
  historyStatusDot:   { width: "10px", height: "10px",
    borderRadius: "50%", marginTop: "5px", flexShrink: 0 },
  historyDate:        { fontSize: "12px", color: "#9ca3af",
    margin: "0 0 3px 0" },
  historyDisease:     { fontSize: "15px", fontWeight: "600",
    color: "#111827", margin: "0 0 2px 0" },
  historyConf:        { fontSize: "13px", color: "#6b7280", margin: 0 },
  historyRight:       { display: "flex", flexDirection: "column",
    alignItems: "flex-end", gap: "8px" },
  urgencyBadge:       { padding: "4px 10px", borderRadius: "20px",
    fontSize: "12px", fontWeight: "500" },
  detailBtn:          { padding: "6px 14px", background: "#eff6ff",
    color: "#2563eb", border: "none", borderRadius: "6px",
    cursor: "pointer", fontSize: "13px", fontWeight: "500" },
  commentBox:         { background: "#eff6ff", borderRadius: "10px",
    padding: "12px", borderLeft: "3px solid #2563eb",
    marginBottom: "10px" },
  commentLabel:       { fontSize: "11px", color: "#2563eb",
    fontWeight: "700", display: "block",
    marginBottom: "5px", textTransform: "uppercase",
    letterSpacing: "0.5px" },
  commentText:        { fontSize: "14px", color: "#374151",
    margin: 0, lineHeight: "1.6" },
  pendingText:        { fontSize: "13px", color: "#9ca3af",
    margin: "0 0 10px 0", fontStyle: "italic" },
  ratingBox:          { background: "#fafafa",
    border: "1px solid #f3f4f6",
    borderRadius: "10px", padding: "14px", marginTop: "10px" },
  ratingLabel:        { fontSize: "13px", color: "#374151",
    margin: "0 0 8px 0", fontWeight: "500" },
  stars:              { display: "flex", gap: "4px", marginBottom: "10px" },
  star:               { fontSize: "20px", cursor: "pointer",
    userSelect: "none", color: "#f59e0b" },
  feedbackInput:      { width: "100%", padding: "8px 10px",
    borderRadius: "6px", border: "1px solid #e5e7eb",
    fontSize: "13px", boxSizing: "border-box",
    marginBottom: "8px" },
  submitRating:       { padding: "7px 18px", background: "#2563eb",
    color: "#fff", border: "none", borderRadius: "6px",
    cursor: "pointer", fontSize: "13px" },
  ratedMsg:           { fontSize: "14px", color: "#f59e0b",
    margin: "8px 0 0 0" },
  backBtn:            { padding: "8px 16px", background: "#fff",
    border: "1px solid #e5e7eb", borderRadius: "8px",
    cursor: "pointer", fontSize: "13px", color: "#4b5563",
    marginBottom: "16px" },

  // ── Profile ──
  profilePage:        { maxWidth: "580px" },
  profileTop:         { display: "flex", gap: "20px",
    alignItems: "center", marginBottom: "24px" },
  profileAvatarWrap:  { position: "relative" },
  profileAvatarImg:   { width: "72px", height: "72px",
    borderRadius: "50%", objectFit: "cover",
    border: "3px solid #dbeafe" },
  profileAvatarDefault: { width: "72px", height: "72px",
    borderRadius: "50%", background: "#2563eb",
    color: "#fff", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: "28px", fontWeight: "700" },
  changePhotoBtn:     { position: "absolute", bottom: 0, right: 0,
    background: "#2563eb", color: "#fff",
    borderRadius: "50%", width: "22px", height: "22px",
    display: "flex", alignItems: "center",
    justifyContent: "center", cursor: "pointer" },
  profileName:        { margin: "0 0 3px 0", color: "#111827",
    fontSize: "18px", fontWeight: "700" },
  profileRole:        { margin: "0 0 10px 0", color: "#6b7280",
    fontSize: "13px" },
  editBtn:            { padding: "6px 14px", background: "#eff6ff",
    color: "#2563eb", border: "none", borderRadius: "7px",
    cursor: "pointer", fontSize: "13px" },
  formRow:            { display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px", marginBottom: "16px" },
  formField:          { },
  formLabel:          { display: "block", fontSize: "12px",
    fontWeight: "600", color: "#374151", marginBottom: "6px",
    textTransform: "uppercase", letterSpacing: "0.4px" },
  formInput:          { width: "100%", padding: "10px 12px",
    borderRadius: "8px", border: "1px solid #e5e7eb",
    fontSize: "14px", boxSizing: "border-box",
    fontFamily: "inherit" },
  formActions:        { display: "flex", gap: "10px" },
  saveBtn:            { padding: "9px 22px", background: "#2563eb",
    color: "#fff", border: "none", borderRadius: "8px",
    cursor: "pointer", fontSize: "14px", fontWeight: "500" },
  cancelBtn:          { padding: "9px 22px", background: "#f3f4f6",
    color: "#4b5563", border: "none", borderRadius: "8px",
    cursor: "pointer", fontSize: "14px" },
  infoRow:            { display: "flex", justifyContent: "space-between",
    padding: "12px 0", borderBottom: "1px solid #f3f4f6" },
  infoLabel:          { fontSize: "14px", color: "#6b7280" },
  infoValue:          { fontSize: "14px", fontWeight: "500",
    color: "#111827" },
  healthGrid:         { display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" },
  healthItem:         { textAlign: "center", padding: "14px",
    background: "#f8fafc", borderRadius: "10px",
    border: "1px solid #f3f4f6" },
  healthNum:          { display: "block", fontSize: "22px",
    fontWeight: "700", marginBottom: "4px" },
  healthLabel:        { display: "block", fontSize: "12px",
    color: "#6b7280" },

  // ── Footer ──
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
  footerCol:          { display: "flex", flexDirection: "column", gap: "8px" },
  footerColTitle:     { fontSize: "11px", fontWeight: "700",
    color: "#f9fafb", margin: "0 0 6px 0",
    textTransform: "uppercase", letterSpacing: "0.8px" },
  footerLink:         { fontSize: "13px", color: "#94a3b8",
    cursor: "pointer" },
  footerDivider:      { height: "1px", background: "#1e293b",
    margin: "0 0 20px 0" },
  footerDisclaimer:   { display: "flex", gap: "10px",
    alignItems: "flex-start",
    background: "#0a1628", borderRadius: "10px",
    padding: "14px 16px", marginBottom: "20px",
    border: "1px solid #1e3a5f" },
  footerDisclaimerText: { fontSize: "12px", color: "#64748b",
    lineHeight: "1.6", margin: 0 },
  footerBottom:       { display: "flex", justifyContent: "space-between",
    alignItems: "center", flexWrap: "wrap", gap: "8px" },
  footerCopy:         { fontSize: "12px", color: "#4b5563", margin: 0 },
  footerLegal:        { display: "flex",
    alignItems: "center", gap: "8px" },
  footerLegalLink:    { fontSize: "12px", color: "#4b5563",
    cursor: "pointer" },
  footerLegalDot:     { color: "#374151", fontSize: "12px" },
};