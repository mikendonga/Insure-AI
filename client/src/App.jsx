import { useState, useEffect, useRef } from "react";

// ════════════════════════════════════════════════════════════════
//  API HELPERS
// ════════════════════════════════════════════════════════════════
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function apiFetch(path, opts = {}) {
  const res = await fetch("/api" + path, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const api = {
  fetchDashboard: () => apiFetch("/dashboard"),
  fetchClaims:    () => apiFetch("/claims"),
  lookupPolicy:   (id) => apiFetch(`/policies/${id}`).catch(() => null),
  submitClaim:    (data) => apiFetch("/claims", { method: "POST", body: JSON.stringify(data) }),
};

async function askAI(system, user) {
  try {
    const res = await apiFetch("/ai", {
      method: "POST",
      body: JSON.stringify({ system, user }),
    });
    return res.text || "Unable to process.";
  } catch (e) {
    return `AI Error: ${e.message}. Make sure Ollama is running with llama3.2 model.`;
  }
}

// ════════════════════════════════════════════════════════════════
//  RESPONSIVE HOOK
// ════════════════════════════════════════════════════════════════
function useBreakpoint() {
  const get = w => w < 640 ? "xs" : w < 768 ? "sm" : w < 1024 ? "md" : w < 1280 ? "lg" : "xl";
  const [bp, setBp] = useState(() => get(window.innerWidth));
  useEffect(() => {
    const fn = () => setBp(get(window.innerWidth));
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return bp;
}
const isMobile = bp => bp === "xs" || bp === "sm";

// ════════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════════
const ROLES = {
  admin:       { label: "Admin",           color: "#f59e0b", agents: ["dashboard", "fnol", "fraud", "underwriting", "broker", "chat", "settings"] },
  adjuster:    { label: "Claims Adjuster", color: "#38bdf8", agents: ["dashboard", "fnol", "fraud", "chat"] },
  underwriter: { label: "Underwriter",     color: "#10d98a", agents: ["dashboard", "underwriting", "fraud"] },
  broker:      { label: "Broker",          color: "#8b5cf6", agents: ["dashboard", "broker", "chat"] },
  customer:    { label: "Customer",        color: "#fb4b6e", agents: ["chat"] },
};

const SEED_USERS = [
  { id: 1, name: "Amara Nkosi",     email: "admin@insureai.co.ke",    password: "admin123",  role: "admin",       avatar: "AN" },
  { id: 2, name: "James Mwangi",    email: "adjuster@insureai.co.ke", password: "adj123",    role: "adjuster",    avatar: "JM" },
  { id: 3, name: "Grace Odhiambo",  email: "uw@insureai.co.ke",       password: "uw123",     role: "underwriter", avatar: "GO" },
  { id: 4, name: "Patrick Njoroge", email: "broker@insureai.co.ke",   password: "broker123", role: "broker",      avatar: "PN" },
  { id: 5, name: "Fatuma Said",     email: "customer@insureai.co.ke", password: "cust123",   role: "customer",    avatar: "FS" },
];

function useAuth() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState(SEED_USERS);
  const [error, setError] = useState("");
  const login = (e, p) => {
    const u = users.find(x => x.email.toLowerCase() === e.toLowerCase() && x.password === p);
    if (u) { setUser(u); setError(""); return true; }
    setError("Invalid email or password."); return false;
  };
  const register = (n, e, p, r) => {
    if (users.find(x => x.email.toLowerCase() === e.toLowerCase())) { setError("Email already exists."); return false; }
    const u = { id: Date.now(), name: n, email: e, password: p, role: r, avatar: n.split(" ").map(x => x[0]).join("").toUpperCase().slice(0, 2) };
    setUsers(a => [...a, u]); setUser(u); setError(""); return true;
  };
  const logout = () => setUser(null);
  const clearErr = () => setError("");
  return { user, login, register, logout, error, clearErr };
}

// ════════════════════════════════════════════════════════════════
//  DESIGN TOKENS & GLOBAL CSS
// ════════════════════════════════════════════════════════════════
const C = {
  bg: "#07090f", surface: "#0d1117", card: "#111827", raised: "#161f2e",
  border: "#1a2535", accent: "#38bdf8", accentDeep: "#0284c7",
  emerald: "#10d98a", rose: "#fb4b6e", amber: "#f59e0b", violet: "#8b5cf6",
  text: "#e2e8f0", muted: "#4b6278", white: "#f8fafc",
};

const AGENTS = [
  { id: "dashboard",    label: "Dashboard",       icon: "◈", color: C.accent  },
  { id: "fnol",         label: "FNOL & Claims",   icon: "⬡", color: C.accent  },
  { id: "fraud",        label: "Fraud Detection", icon: "◎", color: C.rose    },
  { id: "underwriting", label: "Underwriting",    icon: "▣", color: C.emerald },
  { id: "broker",       label: "Broker Copilot",  icon: "◆", color: C.violet  },
  { id: "chat",         label: "Customer Chat",   icon: "◉", color: C.amber   },
  { id: "settings",     label: "Settings",        icon: "⚙", color: C.muted   },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html{font-size:14px}
  body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:#07090f}
  input,textarea,select,button{font-family:inherit;outline:none}
  input:focus,textarea:focus,select:focus{border-color:rgba(56,189,248,.55)!important;box-shadow:0 0 0 3px rgba(56,189,248,.07)!important}
  select option{background:#111827}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-thumb{background:#1a2535;border-radius:2px}
  .bg{font-family:'Bricolage Grotesque',system-ui,sans-serif}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  @keyframes gridMove{from{transform:translateY(0)}to{transform:translateY(60px)}}
  @media(max-width:640px){.hm{display:none!important}}
`;

// ════════════════════════════════════════════════════════════════
//  PRIMITIVES
// ════════════════════════════════════════════════════════════════
const iSt = (x = {}) => ({
  width: "100%", background: C.surface, border: `1px solid ${C.border}`,
  borderRadius: 9, padding: "10px 13px", color: C.text, fontSize: 13,
  transition: "border-color .2s,box-shadow .2s", ...x,
});

function Tag({ color, children }) {
  return <span style={{ background: color + "18", color, border: `1px solid ${color}30`, borderRadius: 6, padding: "2px 9px", fontSize: 10, fontWeight: 700, letterSpacing: .8, textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</span>;
}

function Card({ children, style, glow, onClick }) {
  return <div onClick={onClick} style={{ background: C.card, border: `1px solid ${glow ? glow + "40" : C.border}`, borderRadius: 14, padding: 20, boxShadow: glow ? `0 0 28px ${glow}12` : "none", transition: "all .2s", cursor: onClick ? "pointer" : undefined, ...style }}>{children}</div>;
}

function Spin({ color = C.accent, size = 18 }) {
  return <span style={{ display: "inline-block", width: size, height: size, border: `2px solid ${color}25`, borderTopColor: color, borderRadius: "50%", animation: "spin .7s linear infinite", flexShrink: 0 }} />;
}

function Dot({ color = C.emerald }) {
  return <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}`, animation: "blink 2s ease infinite", marginRight: 6, flexShrink: 0 }} />;
}

function Bar({ value, max = 100, color, h = 5 }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW((value / max) * 100), 80); return () => clearTimeout(t); }, [value, max]);
  return <div style={{ height: h, background: C.border, borderRadius: 4, overflow: "hidden" }}><div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: 4, transition: "width 1.1s cubic-bezier(.4,0,.2,1)", boxShadow: `0 0 8px ${color}55` }} /></div>;
}

function Empty({ icon, title, sub }) {
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 260, color: C.muted, textAlign: "center", gap: 10 }}><div style={{ fontSize: 38, opacity: .28 }}>{icon}</div><div style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>{title}</div>{sub && <div style={{ fontSize: 12 }}>{sub}</div>}</div>;
}

// ════════════════════════════════════════════════════════════════
//  AUTH SCREEN
// ════════════════════════════════════════════════════════════════
function AuthScreen({ login, register, error, clearErr }) {
  const bp = useBreakpoint(), mob = isMobile(bp);
  const [mode, setMode] = useState("login"), [email, setEmail] = useState(""), [pass, setPass] = useState(""),
    [name, setName] = useState(""), [role, setRole] = useState("adjuster"),
    [loading, setLoading] = useState(false), [showP, setShowP] = useState(false);

  const DEMOS = [
    { l: "Admin",       e: "admin@insureai.co.ke",    p: "admin123"  },
    { l: "Adjuster",    e: "adjuster@insureai.co.ke", p: "adj123"    },
    { l: "Underwriter", e: "uw@insureai.co.ke",       p: "uw123"     },
    { l: "Broker",      e: "broker@insureai.co.ke",   p: "broker123" },
    { l: "Customer",    e: "customer@insureai.co.ke", p: "cust123"   },
  ];

  const sw = m => { setMode(m); clearErr(); setEmail(""); setPass(""); setName(""); };
  const sub = async () => {
    setLoading(true); await delay(500);
    if (mode === "login") login(email, pass);
    else register(name, email, pass, role);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: mob ? "column" : "row", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <style>{CSS}</style>
      {!mob && (
        <div style={{ width: "40%", minWidth: 320, background: "linear-gradient(160deg,#0d1117 0%,#07090f 60%,#0a0f1e 100%)", borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 52px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, opacity: .06, backgroundImage: "linear-gradient(#38bdf820 1px,transparent 1px),linear-gradient(90deg,#38bdf820 1px,transparent 1px)", backgroundSize: "40px 40px", animation: "gridMove 8s linear infinite alternate" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 56 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#38bdf8,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 0 24px rgba(56,189,248,.4)" }}>🛡</div>
              <div><div className="bg" style={{ fontSize: 17, fontWeight: 800, color: C.white, letterSpacing: -.3 }}>InsureAI</div><div style={{ fontSize: 9, color: C.muted, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 600 }}>Platform</div></div>
            </div>
            <div style={{ marginBottom: 44 }}>
              <div className="bg" style={{ fontSize: 38, fontWeight: 800, color: C.white, letterSpacing: -1.5, lineHeight: 1.08, marginBottom: 14 }}>Insurance<br /><span style={{ color: C.accent }}>reimagined</span><br />with AI.</div>
              <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, maxWidth: 300 }}>Four intelligent agents. One unified platform. Powered by Llama 3.2.</div>
            </div>
            {[{ i: "⬡", l: "FNOL & Claims Processing", c: C.accent }, { i: "◎", l: "Real-time Fraud Detection", c: C.rose }, { i: "▣", l: "AI Underwriting Copilot", c: C.emerald }, { i: "◆", l: "Broker Market Intelligence", c: C.violet }].map((f, idx) => (
              <div key={f.l} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 13, animation: `fadeUp .5s ${idx * .1}s both` }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: f.c + "15", border: `1px solid ${f.c}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: f.c, flexShrink: 0 }}>{f.i}</div>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>{f.l}</span>
              </div>
            ))}
          </div>
          <div style={{ position: "relative", fontSize: 11, color: "#2a3f52" }}>© 2026 InsureAI · Auto Insurance · Kenya</div>
        </div>
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: mob ? "24px 20px" : "48px 64px", overflowY: "auto" }}>
        {mob && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}><div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#38bdf8,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🛡</div><div className="bg" style={{ fontSize: 17, fontWeight: 800, color: C.white }}>InsureAI</div></div>}
        <div style={{ width: "100%", maxWidth: 420, animation: "fadeUp .4s ease" }}>
          <div style={{ display: "flex", background: C.surface, borderRadius: 11, border: `1px solid ${C.border}`, padding: 4, marginBottom: 28 }}>
            {["login", "register"].map(m => <button key={m} onClick={() => sw(m)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer", background: mode === m ? "#1a2535" : "transparent", color: mode === m ? C.white : C.muted, fontWeight: mode === m ? 700 : 500, fontSize: 13, transition: "all .2s" }}>{m === "login" ? "Sign In" : "Create Account"}</button>)}
          </div>
          <div style={{ marginBottom: 22 }}>
            <div className="bg" style={{ fontSize: 25, fontWeight: 800, color: C.white, letterSpacing: -.8, marginBottom: 5 }}>{mode === "login" ? "Welcome back" : "Join InsureAI"}</div>
            <div style={{ fontSize: 13, color: C.muted }}>{mode === "login" ? "Sign in to access your AI agents." : "Create your account to get started."}</div>
          </div>
          {error && <div style={{ background: C.rose + "14", border: `1px solid ${C.rose}28`, borderRadius: 9, padding: "10px 13px", marginBottom: 14, fontSize: 13, color: C.rose, animation: "fadeUp .2s ease" }}>⚠ {error}</div>}
          {mode === "register" && <>
            <div style={{ marginBottom: 12 }}><label style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: .8, display: "block", marginBottom: 4 }}>Full Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Amara Nkosi" style={iSt()} /></div>
            <div style={{ marginBottom: 12 }}><label style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: .8, display: "block", marginBottom: 4 }}>Role</label><select value={role} onChange={e => setRole(e.target.value)} style={iSt({ cursor: "pointer" })}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
          </>}
          <div style={{ marginBottom: 12 }}><label style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: .8, display: "block", marginBottom: 4 }}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@insureai.co.ke" style={iSt()} onKeyDown={e => e.key === "Enter" && sub()} /></div>
          <div style={{ marginBottom: 22 }}>
            <label style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: .8, display: "block", marginBottom: 4 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showP ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" style={iSt({ paddingRight: 44 })} onKeyDown={e => e.key === "Enter" && sub()} />
              <button onClick={() => setShowP(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 13 }}>{showP ? "🙈" : "👁"}</button>
            </div>
          </div>
          <button onClick={sub} disabled={loading || !email || !pass} style={{ width: "100%", padding: "13px 0", background: email && pass ? `linear-gradient(135deg,${C.accent},${C.accentDeep})` : C.border, border: "none", borderRadius: 10, cursor: email && pass ? "pointer" : "default", color: email && pass ? C.bg : C.muted, fontWeight: 800, fontSize: 14, boxShadow: email && pass ? "0 0 24px rgba(56,189,248,.25)" : "none", transition: "all .2s", marginBottom: 22, letterSpacing: .3 }}>{loading ? "Authenticating…" : mode === "login" ? "Sign In →" : "Create Account →"}</button>
          {mode === "login" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}><div style={{ flex: 1, height: 1, background: C.border }} /><span style={{ fontSize: 10, color: "#2a3f52", textTransform: "uppercase", letterSpacing: 1 }}>Demo Accounts</span><div style={{ flex: 1, height: 1, background: C.border }} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginBottom: 7 }}>
                {DEMOS.map(d => <button key={d.l} onClick={() => { setEmail(d.e); setPass(d.p); clearErr(); }} style={{ padding: "8px 0", borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .15s" }} onMouseEnter={e => { e.target.style.borderColor = C.accent + "40"; e.target.style.color = C.accent; }} onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.color = "#64748b"; }}>{d.l}</button>)}
              </div>
              <div style={{ fontSize: 11, color: "#2a3f52", textAlign: "center" }}>Click any role to auto-fill</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  PROFILE DROPDOWN
// ════════════════════════════════════════════════════════════════
function ProfileMenu({ user, logout }) {
  const [open, setOpen] = useState(false); const ref = useRef(null); const role = ROLES[user.role];
  useEffect(() => { const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }; document.addEventListener("mousedown", fn); return () => document.removeEventListener("mousedown", fn); }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 8, background: open ? "#1a2535" : "transparent", border: `1px solid ${open ? "#243348" : "transparent"}`, borderRadius: 10, padding: "5px 10px 5px 5px", cursor: "pointer", transition: "all .15s" }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: role.color + "20", border: `1px solid ${role.color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: role.color }}>{user.avatar}</div>
        <div className="hm" style={{ textAlign: "left" }}><div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{user.name.split(" ")[0]}</div><div style={{ fontSize: 10, color: role.color }}>{role.label}</div></div>
        <span className="hm" style={{ fontSize: 10, color: C.muted, marginLeft: 2 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#111827", border: `1px solid ${C.border}`, borderRadius: 12, minWidth: 220, boxShadow: "0 16px 48px rgba(0,0,0,.6)", animation: "fadeUp .15s ease", zIndex: 200, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: role.color + "16", border: `1px solid ${role.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: role.color }}>{user.avatar}</div>
              <div><div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{user.name}</div><div style={{ fontSize: 11, color: C.muted }}>{user.email}</div></div>
            </div>
            <div style={{ marginTop: 10 }}><Tag color={role.color}>{role.label}</Tag></div>
          </div>
          {[{ i: "◈", l: "My Profile" }, { i: "⚙", l: "Settings" }, { i: "🔔", l: "Notifications" }].map(x => <button key={x.l} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", border: "none", background: "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer", textAlign: "left" }} onMouseEnter={e => e.currentTarget.style.background = "#1a2535"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}><span style={{ fontSize: 12, width: 18 }}>{x.i}</span>{x.l}</button>)}
          <div style={{ borderTop: `1px solid ${C.border}`, margin: "4px 0" }} />
          <button onClick={() => { logout(); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", border: "none", background: "transparent", color: C.rose, fontSize: 13, cursor: "pointer", textAlign: "left" }} onMouseEnter={e => e.currentTarget.style.background = C.rose + "10"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}><span style={{ fontSize: 12, width: 18 }}>→</span>Sign Out</button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  SIDEBAR
// ════════════════════════════════════════════════════════════════
function Sidebar({ user, active, setActive, logout, open, setOpen, bp }) {
  const mob = isMobile(bp);
  const allowed = ROLES[user.role]?.agents || [];
  const role = ROLES[user.role];

  const inner = (
    <div style={{ width: 220, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", height: "100vh", position: mob ? "fixed" : "sticky", top: 0, left: 0, zIndex: 300, transition: "transform .25s ease", transform: mob && !open ? "translateX(-100%)" : "translateX(0)" }}>
      <div style={{ padding: "18px 18px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#38bdf8,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, boxShadow: "0 0 16px rgba(56,189,248,.35)", flexShrink: 0 }}>🛡</div>
        <div><div className="bg" style={{ fontSize: 14, fontWeight: 800, color: C.white, letterSpacing: -.2 }}>InsureAI</div><div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>Platform</div></div>
        {mob && <button onClick={() => setOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 18 }}>✕</button>}
      </div>
      <nav style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
        <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, marginLeft: 8, fontWeight: 600 }}>Navigation</div>
        {AGENTS.map(a => {
          if (!allowed.includes(a.id)) return null;
          const sel = active === a.id;
          return (
            <button key={a.id} onClick={() => { setActive(a.id); if (mob) setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px", borderRadius: 9, border: "none", cursor: "pointer", marginBottom: 3, background: sel ? a.color + "14" : "transparent", color: sel ? a.color : C.muted, fontWeight: sel ? 700 : 500, fontSize: 13, textAlign: "left", transition: "all .15s" }}>
              <span style={{ fontSize: 14, flexShrink: 0, color: sel ? a.color : C.muted }}>{a.icon}</span>
              {a.label}
              {sel && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: a.color, boxShadow: `0 0 6px ${a.color}` }} />}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: role.color + "20", border: `1px solid ${role.color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: role.color, flexShrink: 0 }}>{user.avatar}</div>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 700, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div><div style={{ fontSize: 10, color: role.color }}>{role.label}</div></div>
        </div>
        <div style={{ marginTop: 8, fontSize: 9, color: "#1a2f40", display: "flex", alignItems: "center", gap: 4 }}><Dot color={C.emerald} />Llama 3.2 via Ollama</div>
      </div>
    </div>
  );

  return (
    <>
      {mob && open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 299 }} />}
      {inner}
    </>
  );
}

// ════════════════════════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════════════════════════
function Dashboard({ setActive }) {
  const bp = useBreakpoint(); const mob = isMobile(bp);
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.fetchDashboard().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spin size={32} /></div>;
  if (!data) return <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Failed to load dashboard data.</div>;

  const STATS = [
    { label: "Claims Today",    value: data.claimsToday,    delta: data.claimsDelta,    color: C.accent  },
    { label: "Fraud Blocked",   value: data.fraudBlocked,   delta: data.fraudDelta,     color: C.rose    },
    { label: "Avg Quote Time",  value: data.avgQuoteTime,   delta: data.quoteDelta,     color: C.emerald },
    { label: "Combined Ratio",  value: data.combinedRatio,  delta: data.ratioDelta,     color: C.amber   },
  ];

  const statusColor = s => s === "Approved" ? C.emerald : s === "Processing" ? C.accent : s === "Flagged" ? C.rose : C.amber;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="bg" style={{ fontSize: 26, fontWeight: 800, color: C.white, letterSpacing: -.5, marginBottom: 4 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: C.muted }}>InsureAI Platform · Auto Insurance · Kenya</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        {STATS.map(s => (
          <Card key={s.label} glow={s.color} style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{s.label}</div>
            <div className="bg" style={{ fontSize: mob ? 20 : 26, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 5 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: C.muted }}>{s.delta}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 320px", gap: 14 }}>
        <Card>
          <div className="bg" style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 14, letterSpacing: -.2 }}>Recent Claims</div>
          {data.recentClaims.map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{c.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{c.id} · {c.type}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>KES {c.amount?.toLocaleString()}</div>
                <Tag color={statusColor(c.status)}>{c.status}</Tag>
              </div>
            </div>
          ))}
        </Card>
        <div>
          <Card style={{ marginBottom: 12 }}>
            <div className="bg" style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 14, letterSpacing: -.2 }}>Agent Health</div>
            {data.agentHealth.map(a => (
              <div key={a.name} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: C.text }}>{a.name}</span>
                  <span style={{ color: C.emerald }}>{a.uptime}%</span>
                </div>
                <Bar value={a.uptime} max={100} color={C.emerald} h={4} />
                <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{a.calls.toLocaleString()} calls today</div>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 14 }}>Quick Actions</div>
            {[{ l: "New FNOL Claim", id: "fnol", c: C.accent }, { l: "Fraud Check", id: "fraud", c: C.rose }, { l: "Get Quote", id: "broker", c: C.violet }].map(a => (
              <button key={a.l} onClick={() => setActive(a.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", marginBottom: 7, borderRadius: 8, background: a.c + "11", border: `1px solid ${a.c}20`, color: a.c, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{a.l} →</button>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  FNOL AGENT
// ════════════════════════════════════════════════════════════════
function FNOLAgent() {
  const bp = useBreakpoint(); const mob = isMobile(bp);
  const [form, setForm] = useState({ policyNumber: "AU-449821", name: "", phone: "", plate: "", incident: "2026-02-25", location: "", description: "", injuries: "None", damage: "" });
  const [pd, setPd] = useState(null); const [lu, setLu] = useState(false);
  const [stage, setStage] = useState("idle"); const [aiA, setAiA] = useState(""); const [steps, setSteps] = useState([]);
  const [cid] = useState("CLM-2026-" + Math.floor(8000 + Math.random() * 1999));

  const PIPE = ["Validating policy number…", "Confirming active coverage…", "Geocoding incident location…", "Checking duplicate claims…", "Assigning adjuster…", "Arranging courtesy vehicle…", "Notifying repair network…"];

  const lookup = async () => {
    if (!form.policyNumber.trim()) return;
    setLu(true);
    const p = await api.lookupPolicy(form.policyNumber);
    setPd(p);
    if (p) setForm(f => ({ ...f, name: p.holder || f.name }));
    setLu(false);
  };

  const sub = async () => {
    setStage("processing"); setSteps([]); setAiA("");
    for (let i = 0; i < PIPE.length; i++) { await delay(460); setSteps(s => [...s, PIPE[i]]); }
    await api.submitClaim(form).catch(() => {});
    const ai = await askAI(
      "You are an expert auto insurance claims AI. Analyze this FNOL and provide: 1) Risk assessment 2) Next actions 3) Estimated KES range 4) Priority: LOW/MEDIUM/HIGH. Be concise.",
      `Policy:${form.policyNumber} Claimant:${form.name} Vehicle:${form.plate} Date:${form.incident} Location:${form.location} Description:${form.description} Injuries:${form.injuries} Damage:${form.damage}`
    );
    setAiA(ai); setStage("done");
  };

  const F = ({ k, l, type = "text", multi = false }) => (
    <div style={{ marginBottom: 11 }}>
      <label style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: .8, display: "block", marginBottom: 4 }}>{l}</label>
      {multi
        ? <textarea value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} rows={3} style={iSt({ resize: "none" })} />
        : <input type={type} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} style={iSt()} />}
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 15 }}>
      <div>
        <Card style={{ marginBottom: 13 }}>
          <div className="bg" style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 13, letterSpacing: -.2 }}>Policy Lookup</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={form.policyNumber} onChange={e => setForm({ ...form, policyNumber: e.target.value })} placeholder="e.g. AU-449821" style={iSt({ flex: 1 })} onKeyDown={e => e.key === "Enter" && lookup()} />
            <button onClick={lookup} disabled={lu} style={{ padding: "10px 15px", borderRadius: 9, background: C.accent + "16", border: `1px solid ${C.accent}28`, color: C.accent, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>{lu ? <Spin size={13} color={C.accent} /> : "Look up"}</button>
          </div>
          {pd && <div style={{ marginTop: 11, background: C.emerald + "0c", border: `1px solid ${C.emerald}22`, borderRadius: 9, padding: "10px 13px", animation: "fadeUp .3s ease" }}>
            <div style={{ fontSize: 12, color: C.emerald, fontWeight: 700, marginBottom: 5 }}>✓ Policy Found</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 14px", fontSize: 12 }}>
              {[["Holder", pd.holder], ["Vehicle", pd.vehicle], ["Status", pd.status], ["Premium", "KES " + pd.premium?.toLocaleString() + "/mo"]].map(([k, v]) => <div key={k}><span style={{ color: C.muted }}>{k}: </span><span style={{ color: C.white, fontWeight: 600 }}>{v}</span></div>)}
            </div>
          </div>}
        </Card>
        <Card>
          <div className="bg" style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 4, letterSpacing: -.2 }}>Report Incident</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>First Notice of Loss · Auto Insurance</div>
          {[{ k: "name", l: "Claimant Name" }, { k: "phone", l: "Phone" }, { k: "plate", l: "Vehicle Plate" }, { k: "incident", l: "Incident Date", type: "date" }, { k: "location", l: "Location" }, { k: "description", l: "Description", multi: true }, { k: "injuries", l: "Injuries" }, { k: "damage", l: "Damage", multi: true }].map(f => <F key={f.k} {...f} />)}
          <button onClick={sub} disabled={stage === "processing" || stage === "done"} style={{ width: "100%", padding: "13px 0", marginTop: 6, background: stage === "done" ? C.emerald : `linear-gradient(135deg,${C.accent},${C.accentDeep})`, border: "none", borderRadius: 10, color: C.bg, fontWeight: 800, fontSize: 13, cursor: stage === "idle" ? "pointer" : "default", letterSpacing: .3 }}>
            {stage === "processing" ? "Processing…" : stage === "done" ? `✓ Filed · ${cid}` : "Submit FNOL Report"}
          </button>
        </Card>
      </div>
      <div>
        <Card style={{ marginBottom: 13 }}>
          <div className="bg" style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 14, letterSpacing: -.2 }}>AI Processing Pipeline</div>
          {PIPE.map((s, i) => {
            const done = steps.length > i, act = steps.length === i && stage === "processing";
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9, opacity: done || act ? 1 : .2, transition: "opacity .4s" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: done ? C.emerald + "16" : C.border, border: `1px solid ${done ? C.emerald : C.border}`, fontSize: 10, color: done ? C.emerald : C.muted, fontWeight: 700 }}>
                  {act ? <Spin size={12} color={C.accent} /> : done ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 12, color: done ? C.text : C.muted }}>{s}</span>
              </div>
            );
          })}
        </Card>
        {((stage === "processing" && steps.length === PIPE.length) || stage === "done") && (
          <Card glow={C.accent}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11 }}><Tag color={C.accent}>AI Analysis</Tag>{stage === "processing" && <Spin size={14} />}</div>
            {aiA ? <div style={{ fontSize: 13, color: C.text, lineHeight: 1.75, whiteSpace: "pre-wrap", fontWeight: 400 }}>{aiA}</div> : <div style={{ fontSize: 12, color: C.muted }}>AI is analysing your claim…</div>}
          </Card>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  FRAUD DETECTION
// ════════════════════════════════════════════════════════════════
function FraudAgent() {
  const bp = useBreakpoint(); const mob = isMobile(bp);
  const [claims, setClaims] = useState([]); const [ll, setLl] = useState(true);
  const [sel, setSel] = useState(null); const [an, setAn] = useState(null); const [load, setLoad] = useState(false);

  useEffect(() => { api.fetchClaims().then(d => { setClaims(d); setLl(false); }).catch(() => setLl(false)); }, []);

  const analyze = async c => {
    setSel(c); setAn(null); setLoad(true);
    const r = await askAI(
      'You are an expert insurance fraud AI. Respond ONLY with valid JSON (no markdown): {"score":<0-100>,"verdict":"<LOW RISK|MEDIUM RISK|HIGH RISK>","confidence":<0-100>,"flags":["str"],"recommendation":"str","reasoning":"2-3 sentences"}',
      `Claim:${c.id} Name:${c.name} Amount:KES ${c.amount?.toLocaleString()} Type:${c.type} PolicyAge:${c.daysOld}days PriorClaims:${c.claimsHistory} Time:${c.time} Workshop:${c.workshop}`
    );
    try { setAn(JSON.parse(r.replace(/```json|```/g, "").trim())); }
    catch { setAn({ score: 50, verdict: "MEDIUM RISK", confidence: 60, flags: ["Analysis error"], recommendation: "Manual review required", reasoning: r }); }
    setLoad(false);
  };

  const vc = v => v?.includes("HIGH") ? C.rose : v?.includes("MEDIUM") ? C.amber : C.emerald;

  return (
    <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "320px 1fr", gap: 15 }}>
      <div>
        <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 2, marginBottom: 11, fontWeight: 600 }}>{ll ? "Loading…" : `Claims Queue · ${claims.length} items`}</div>
        {ll ? <div style={{ display: "flex", justifyContent: "center", padding: 36 }}><Spin size={26} /></div> :
          claims.map(c => (
            <Card key={c.id} style={{ marginBottom: 9, cursor: "pointer", border: `1px solid ${sel?.id === c.id ? C.rose + "40" : C.border}`, boxShadow: sel?.id === c.id ? `0 0 14px ${C.rose}10` : "none" }} onClick={() => analyze(c)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
                <div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{c.name}</div><div style={{ fontSize: 11, color: C.muted }}>{c.id}</div></div>
                <Tag color={C.amber}>{c.type}</Tag>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: C.accent, fontWeight: 700 }}>KES {c.amount?.toLocaleString()}</span><span style={{ color: C.muted }}>{c.daysOld}d · {c.claimsHistory} prior</span></div>
            </Card>
          ))}
      </div>
      <Card style={{ minHeight: mob ? 280 : 380 }}>
        {!sel && <Empty icon="◎" title="Select a claim" sub="AI fraud analysis powered by Llama 3.2" />}
        {sel && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
              <div><div style={{ fontSize: 15, fontWeight: 800, color: C.white }}>{sel.name}</div><div style={{ fontSize: 12, color: C.muted }}>{sel.id} · KES {sel.amount?.toLocaleString()}</div></div>
              {load ? <Spin color={C.rose} size={24} /> : an && <div style={{ textAlign: "right" }}><div className="bg" style={{ fontSize: 40, fontWeight: 800, color: vc(an.verdict), lineHeight: 1, textShadow: `0 0 20px ${vc(an.verdict)}65` }}>{an.score}</div><div style={{ fontSize: 10, color: C.muted }}>risk score</div></div>}
            </div>
            {load && <div style={{ color: C.muted, fontSize: 12 }}>{["Cross-referencing claim history", "Scanning social & public records", "Checking workshop network", "Running anomaly model", "Generating verdict…"].map((t, i) => <div key={t} style={{ marginBottom: 7, animation: `fadeUp .4s ${i * .22}s both` }}><span style={{ color: C.rose, marginRight: 7 }}>→</span>{t}</div>)}</div>}
            {an && !load && (
              <div>
                <div style={{ marginBottom: 15 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 5 }}><span>Fraud Risk</span><span style={{ color: vc(an.verdict) }}>{an.score}%</span></div>
                  <Bar value={an.score} color={vc(an.verdict)} h={6} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 5, marginTop: 10 }}><span>Model Confidence</span><span style={{ color: C.accent }}>{an.confidence}%</span></div>
                  <Bar value={an.confidence} color={C.accent} h={6} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: .8, marginBottom: 7, fontWeight: 600 }}>Signal Flags</div>
                  {(an.flags || []).map(f => <div key={f} style={{ fontSize: 12, color: C.text, padding: "7px 10px", background: C.surface, borderRadius: 7, marginBottom: 5, display: "flex", gap: 8 }}><span style={{ color: vc(an.verdict), flexShrink: 0 }}>⚑</span>{f}</div>)}
                </div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.75, marginBottom: 13, fontWeight: 400 }}>{an.reasoning}</div>
                <div style={{ background: vc(an.verdict) + "0e", border: `1px solid ${vc(an.verdict)}26`, borderRadius: 10, padding: 13 }}>
                  <Tag color={vc(an.verdict)}>{an.verdict}</Tag>
                  <div style={{ fontSize: 12, color: C.text, marginTop: 7 }}>{an.recommendation}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  UNDERWRITING
// ════════════════════════════════════════════════════════════════
function UnderwritingAgent() {
  const bp = useBreakpoint(); const mob = isMobile(bp);
  const [form, setForm] = useState({ name: "Grace Odhiambo", age: 32, gender: "Female", vehicle: "2021 Honda CR-V", value: 3800000, usage: "Private", garage: "Yes", years: 4, claims: 0 });
  const [result, setResult] = useState(null); const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true); setResult(null);
    const r = await askAI(
      'You are a senior auto insurance underwriter AI. Respond ONLY with valid JSON (no markdown): {"riskScore":<0-100>,"tier":"<Preferred|Standard|Sub-Standard>","monthlyPremium":<int KES>,"annualPremium":<int KES>,"factors":[{"factor":"str","impact":"positive|negative|neutral","detail":"str"}],"decision":"<Approve|Approve with conditions|Decline>","conditions":"str or null","recommendation":"2-3 sentences"}',
      `Applicant:${form.name} Age:${form.age} ${form.gender}\nVehicle:${form.vehicle} ValueKES:${form.value}\nUsage:${form.usage} Garaged:${form.garage}\nYearsInsured:${form.years} Claims3yr:${form.claims}`
    );
    try { setResult(JSON.parse(r.replace(/```json|```/g, "").trim())); }
    catch { setResult({ riskScore: 40, tier: "Standard", monthlyPremium: 12500, annualPremium: 143000, factors: [], decision: "Approve", conditions: null, recommendation: r }); }
    setLoading(false);
  };

  const tc = t => t === "Preferred" ? C.emerald : t === "Standard" ? C.accent : C.amber;
  const F = ({ k, l, t = "text" }) => (
    <div style={{ marginBottom: 11 }}>
      <label style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: .8, display: "block", marginBottom: 4 }}>{l}</label>
      <input type={t} value={form[k]} onChange={e => setForm({ ...form, [k]: t === "number" ? +e.target.value : e.target.value })} style={iSt()} />
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 15 }}>
      <Card>
        <div className="bg" style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 15, letterSpacing: -.2 }}>Applicant Profile</div>
        {[{ k: "name", l: "Full Name" }, { k: "age", l: "Age", t: "number" }, { k: "gender", l: "Gender" }, { k: "vehicle", l: "Vehicle" }, { k: "value", l: "Vehicle Value (KES)", t: "number" }, { k: "usage", l: "Usage Type" }, { k: "garage", l: "Garaged Overnight" }, { k: "years", l: "Years with Insurer", t: "number" }, { k: "claims", l: "Prior Claims (3yr)", t: "number" }].map(f => <F key={f.k} {...f} />)}
        <button onClick={run} disabled={loading} style={{ width: "100%", padding: "13px 0", marginTop: 6, background: `linear-gradient(135deg,${C.emerald},#059669)`, border: "none", borderRadius: 10, color: C.bg, fontWeight: 800, fontSize: 13, cursor: loading ? "default" : "pointer", letterSpacing: .3 }}>{loading ? "Underwriting…" : "Run Underwriting AI"}</button>
      </Card>
      <Card>
        {!result && !loading && <Empty icon="▣" title="Awaiting applicant data" sub="Fill in the profile and run the AI underwriting model." />}
        {loading && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 340, gap: 12 }}><Spin color={C.emerald} size={30} /><div style={{ fontSize: 13, color: C.emerald }}>Running underwriting model…</div></div>}
        {result && !loading && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
              <div>
                <Tag color={tc(result.tier)}>{result.tier} Client</Tag>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 9, marginBottom: 5 }}>Risk Score</div>
                <Bar value={result.riskScore} color={tc(result.tier)} h={5} />
                <div style={{ fontSize: 11, color: tc(result.tier), marginTop: 4 }}>{result.riskScore}/100</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: C.muted }}>Monthly Premium</div>
                <div className="bg" style={{ fontSize: 28, fontWeight: 800, color: tc(result.tier), lineHeight: 1 }}>KES {result.monthlyPremium?.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: C.muted }}>KES {result.annualPremium?.toLocaleString()} / yr</div>
              </div>
            </div>
            <div style={{ marginBottom: 15 }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: .8, marginBottom: 9, fontWeight: 600 }}>Risk Factors</div>
              {(result.factors || []).map(f => (
                <div key={f.factor} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                  <span style={{ color: C.text }}>{f.factor}<span style={{ color: C.muted, marginLeft: 5 }}>— {f.detail}</span></span>
                  <span style={{ color: f.impact === "positive" ? C.emerald : f.impact === "negative" ? C.rose : C.muted, fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>{f.impact === "positive" ? "▼ Risk" : f.impact === "negative" ? "▲ Risk" : "—"}</span>
                </div>
              ))}
            </div>
            <div style={{ background: tc(result.tier) + "0e", border: `1px solid ${tc(result.tier)}24`, borderRadius: 10, padding: 13 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: tc(result.tier), marginBottom: 5 }}>Decision: {result.decision}</div>
              {result.conditions && <div style={{ fontSize: 11, color: C.amber, marginBottom: 5 }}>Conditions: {result.conditions}</div>}
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.75, fontWeight: 400 }}>{result.recommendation}</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  BROKER COPILOT
// ════════════════════════════════════════════════════════════════
function BrokerAgent() {
  const bp = useBreakpoint(); const mob = isMobile(bp);
  const [client] = useState({ name: "Patrick Njoroge", vehicle: "2022 Mitsubishi Outlander", value: 4900000, cover: "Comprehensive", dob: "1988-03-12", history: "Clean — no claims" });
  const [quotes, setQuotes] = useState([]); const [rec, setRec] = useState(null); const [loading, setLoading] = useState(false);

  const gen = async () => {
    setLoading(true); setQuotes([]); setRec(null);
    const r = await askAI(
      'You are an expert insurance broker AI for Kenya. Respond ONLY with valid JSON (no markdown): {"quotes":[{"insurer":"str","code":"str(2ch)","monthlyPremium":<int>,"annualPremium":<int>,"excess":<int>,"rating":"str","features":["str"],"bestFor":"str"}],"recommendation":{"insurer":"str","reason":"2-3 sentences"}} Include 4 insurers: Jubilee, AAR, CIC, UAP Old Mutual.',
      `Client:${client.name} Vehicle:${client.vehicle} ValueKES:${client.value} Cover:${client.cover} DOB:${client.dob} Claims:${client.history}`
    );
    try {
      const d = JSON.parse(r.replace(/```json|```/g, "").trim());
      for (const q of d.quotes) { await delay(360); setQuotes(p => [...p, q]); }
      setRec(d.recommendation);
    } catch { setRec({ insurer: "Error", reason: r }); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "280px 1fr", gap: 15, marginBottom: 15 }}>
        <Card>
          <div className="bg" style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 14, letterSpacing: -.2 }}>Client Brief</div>
          {Object.entries(client).map(([k, v]) => <div key={k} style={{ marginBottom: 10 }}><div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: .8 }}>{k}</div><div style={{ fontSize: 13, color: C.white, fontWeight: 600 }}>{v}</div></div>)}
          <button onClick={gen} disabled={loading} style={{ width: "100%", padding: "13px 0", marginTop: 7, background: `linear-gradient(135deg,${C.violet},#6d28d9)`, border: "none", borderRadius: 10, color: C.white, fontWeight: 800, fontSize: 13, cursor: loading ? "default" : "pointer", letterSpacing: .3 }}>{loading ? "Fetching Quotes…" : "Generate AI Quotes"}</button>
        </Card>
        <div>
          {!quotes.length && !loading && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 260, color: C.muted, background: C.card, borderRadius: 14, border: `1px solid ${C.border}` }}><div style={{ fontSize: 34, marginBottom: 11, opacity: .27 }}>◆</div><div style={{ fontSize: 13 }}>Generate AI quotes from all Kenyan insurers</div></div>}
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 11 }}>
            {quotes.map(q => (
              <Card key={q.insurer} style={{ animation: "fadeUp .4s ease both", position: "relative", border: rec?.insurer === q.insurer ? `1px solid ${C.violet}40` : undefined }}>
                {rec?.insurer === q.insurer && <div style={{ position: "absolute", top: -10, right: 14, background: C.violet, color: C.white, fontSize: 9, fontWeight: 800, padding: "2px 10px", borderRadius: 20, letterSpacing: 1 }}>AI PICK</div>}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: C.violet + "12", border: `1px solid ${C.violet}25`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: C.violet, fontSize: 12 }}>{q.code}</div>
                  <div><div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{q.insurer}</div><div style={{ fontSize: 11, color: C.muted }}>Rating: <span style={{ color: C.emerald }}>{q.rating}</span></div></div>
                </div>
                <div className="bg" style={{ fontSize: 22, fontWeight: 800, color: rec?.insurer === q.insurer ? C.violet : C.white }}>KES {q.monthlyPremium?.toLocaleString()}<span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>/mo</span></div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 9 }}>Excess: KES {q.excess?.toLocaleString()}</div>
                {(q.features || []).slice(0, 3).map(f => <div key={f} style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}><span style={{ color: C.emerald, marginRight: 5 }}>✓</span>{f}</div>)}
                <div style={{ marginTop: 7, fontSize: 11, color: C.violet }}>{q.bestFor}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>
      {rec?.reason && (
        <Card glow={C.violet}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Tag color={C.violet}>AI Broker Recommendation</Tag>
              <div style={{ fontSize: 13, color: C.text, marginTop: 9, lineHeight: 1.75, fontWeight: 400 }}><strong style={{ color: C.violet }}>{rec.insurer}:</strong> {rec.reason}</div>
            </div>
            <button style={{ padding: "11px 20px", background: C.violet, border: "none", borderRadius: 10, color: C.white, fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>Send to Client →</button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  CUSTOMER CHAT
// ════════════════════════════════════════════════════════════════
function CustomerChat() {
  const bp = useBreakpoint(); const mob = isMobile(bp);
  const [msgs, setMsgs] = useState([{ role: "assistant", text: "Hi! I'm your InsureAI assistant powered by Llama 3.2. I can help with claims, policies, renewals, and more. How can I help you today?" }]);
  const [input, setInput] = useState(""); const [loading, setLoading] = useState(false); const [stream, setStream] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, stream]);

  const QUICK = ["What's my claim status?", "I want to renew my policy", "Report an accident", "Get a new quote"];

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input; setInput("");
    setMsgs(m => [...m, { role: "user", text: msg }]);
    setLoading(true); setStream("");
    const hist = msgs.map(m => `${m.role === "assistant" ? "assistant" : "user"}: ${m.text}`).join("\n");
    const r = await askAI(
      "You are InsureAI, a friendly auto insurance assistant for Kenya. Help with claims, coverage, renewals, billing. Use KES for currency. Be warm and concise (under 150 words). If asked about claim status, simulate a plausible response.",
      hist + `\nuser: ${msg}`
    );
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setStream(r.slice(0, i));
      if (i >= r.length) { clearInterval(iv); setMsgs(m => [...m, { role: "assistant", text: r }]); setStream(""); setLoading(false); }
    }, 10);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 280px", gap: 15 }}>
      <Card style={{ padding: 0, display: "flex", flexDirection: "column", height: mob ? "80vh" : "560px" }}>
        <div style={{ padding: "13px 17px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg,${C.amber},${C.rose})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>◉</div>
          <div><div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>InsureAI Assistant</div><div style={{ fontSize: 11, color: C.muted }}><Dot color={C.emerald} />Online · Llama 3.2</div></div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "13px 17px" }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 11 }}>
              {m.role === "assistant" && <div style={{ width: 25, height: 25, borderRadius: 7, background: C.amber + "16", border: `1px solid ${C.amber}26`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.amber, marginRight: 7, flexShrink: 0, alignSelf: "flex-end" }}>◉</div>}
              <div style={{ maxWidth: "74%", padding: "9px 13px", borderRadius: m.role === "user" ? "13px 13px 4px 13px" : "13px 13px 13px 4px", background: m.role === "user" ? `linear-gradient(135deg,${C.amber},${C.amber}cc)` : C.raised, color: m.role === "user" ? C.bg : C.text, fontSize: 13, lineHeight: 1.65, fontWeight: m.role === "user" ? 600 : 400, letterSpacing: -.1 }}>{m.text}</div>
            </div>
          ))}
          {loading && stream && (
            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 11 }}>
              <div style={{ width: 25, height: 25, borderRadius: 7, background: C.amber + "16", border: `1px solid ${C.amber}26`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.amber, marginRight: 7, flexShrink: 0, alignSelf: "flex-end" }}>◉</div>
              <div style={{ maxWidth: "74%", padding: "9px 13px", borderRadius: "13px 13px 13px 4px", background: C.raised, color: C.text, fontSize: 13, lineHeight: 1.65 }}>{stream}<span style={{ animation: "blink 1s infinite", color: C.amber }}>▌</span></div>
            </div>
          )}
          {loading && !stream && <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11, paddingLeft: 32 }}><Spin color={C.amber} size={14} /><span style={{ fontSize: 12, color: C.muted }}>Thinking…</span></div>}
          <div ref={bottomRef} />
        </div>
        <div style={{ padding: "10px 13px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type your message…" style={iSt({ flex: 1 })} />
            <button onClick={send} disabled={loading || !input.trim()} style={{ width: 40, height: 40, borderRadius: 9, background: input.trim() ? C.amber : C.border, border: "none", cursor: input.trim() ? "pointer" : "default", color: C.bg, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>↑</button>
          </div>
        </div>
      </Card>
      {!mob && (
        <div>
          <Card style={{ marginBottom: 11 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.white, marginBottom: 11 }}>Quick Replies</div>
            {QUICK.map(q => <button key={q} onClick={() => setInput(q)} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 11px", marginBottom: 6, borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontSize: 12, cursor: "pointer" }}>{q}</button>)}
          </Card>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.white, marginBottom: 11 }}>Capabilities</div>
            {[{ i: "⬡", l: "Claims Filing", c: C.accent }, { i: "◈", l: "Coverage Queries", c: C.emerald }, { i: "▣", l: "Renewal & Billing", c: C.violet }, { i: "◉", l: "Emergency Assist", c: C.rose }].map(x => <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}><span style={{ color: x.c, fontSize: 13 }}>{x.i}</span><span style={{ fontSize: 12, color: C.text }}>{x.l}</span></div>)}
          </Card>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  SETTINGS
// ════════════════════════════════════════════════════════════════
function Settings() {
  const [health, setHealth] = useState(null);
  useEffect(() => {
    apiFetch("/health").then(setHealth).catch(() => setHealth({ status: "error", ollama: false }));
  }, []);

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 22 }}>
        <h2 className="bg" style={{ fontSize: 22, fontWeight: 800, color: C.white, letterSpacing: -.5 }}>Settings</h2>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>System configuration and health status.</p>
      </div>
      <Card style={{ marginBottom: 14 }}>
        <div className="bg" style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 14 }}>System Health</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <div><div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>Backend API</div><div style={{ fontSize: 11, color: C.muted }}>Node.js Express server on port 3001</div></div>
            <Tag color={health?.status === "ok" ? C.emerald : C.rose}>{health?.status === "ok" ? "Online" : "Checking…"}</Tag>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <div><div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>Ollama (Llama 3.2)</div><div style={{ fontSize: 11, color: C.muted }}>Local LLM on port 11434</div></div>
            <Tag color={health?.ollama ? C.emerald : C.rose}>{health?.ollama ? "Online" : "Offline"}</Tag>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <div><div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>Data Source</div><div style={{ fontSize: 11, color: C.muted }}>In-memory demo data (seed data active)</div></div>
            <Tag color={C.emerald}>Active</Tag>
          </div>
        </div>
      </Card>
      <Card style={{ marginBottom: 14 }}>
        <div className="bg" style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 14 }}>Demo Accounts</div>
        {[
          { role: "Admin",       email: "admin@insureai.co.ke",    pass: "admin123",  color: C.amber   },
          { role: "Adjuster",    email: "adjuster@insureai.co.ke", pass: "adj123",    color: C.accent  },
          { role: "Underwriter", email: "uw@insureai.co.ke",       pass: "uw123",     color: C.emerald },
          { role: "Broker",      email: "broker@insureai.co.ke",   pass: "broker123", color: C.violet  },
          { role: "Customer",    email: "customer@insureai.co.ke", pass: "cust123",   color: C.rose    },
        ].map(u => (
          <div key={u.role} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
            <Tag color={u.color}>{u.role}</Tag>
            <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: C.text }}>{u.email}</div></div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>{u.pass}</div>
          </div>
        ))}
      </Card>
      <Card>
        <div className="bg" style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 14 }}>Setup Guide</div>
        {[
          { t: "1. Start Ollama", b: "Run: ollama serve (should already be running if you pulled llama3.2)" },
          { t: "2. Pull the model", b: "Run: ollama pull llama3.2" },
          { t: "3. Start the backend", b: "Run: cd server && npm install && npm start" },
          { t: "4. Start the frontend", b: "Run: cd client && npm install && npm start" },
          { t: "5. Login", b: "Use any demo account above or create your own via Sign Up" },
        ].map(s => <div key={s.t} style={{ marginBottom: 11, padding: "11px 13px", background: C.surface, borderRadius: 9, border: `1px solid ${C.border}` }}><div style={{ fontSize: 12, fontWeight: 700, color: C.white, marginBottom: 3 }}>{s.t}</div><div style={{ fontSize: 12, color: C.muted }}>{s.b}</div></div>)}
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  ROOT APP
// ════════════════════════════════════════════════════════════════
export default function App() {
  const { user, login, register, logout, error, clearErr } = useAuth();
  const bp = useBreakpoint(); const mob = isMobile(bp);
  const [active, setActive] = useState("dashboard"); const [sbOpen, setSbOpen] = useState(false);

  useEffect(() => {
    if (user) { const a = ROLES[user.role]?.agents || []; if (!a.includes(active)) setActive(a[0] || "dashboard"); }
  }, [user]);

  if (!user) return <AuthScreen login={login} register={register} error={error} clearErr={clearErr} />;

  const allowed = ROLES[user.role]?.agents || [];
  const cur = AGENTS.find(a => a.id === active);
  const ok = allowed.includes(active);

  const VIEWS = {
    dashboard:    <Dashboard setActive={setActive} />,
    fnol:         <FNOLAgent />,
    fraud:        <FraudAgent />,
    underwriting: <UnderwritingAgent />,
    broker:       <BrokerAgent />,
    chat:         <CustomerChat />,
    settings:     <Settings />,
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", display: "flex" }}>
      <style>{CSS}</style>
      <Sidebar user={user} active={active} setActive={setActive} logout={logout} open={sbOpen} setOpen={setSbOpen} bp={bp} />
      <div style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
        <div style={{ padding: mob ? "0 15px" : "0 26px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, background: C.surface, position: "sticky", top: 0, zIndex: 100, gap: 11 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
            {mob && <button onClick={() => setSbOpen(true)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 20, padding: "0 4px", display: "flex", alignItems: "center", flexShrink: 0 }}>☰</button>}
            <span style={{ color: cur?.color, fontSize: 15, flexShrink: 0 }}>{cur?.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cur?.label}</span>
            {!mob && <span style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>· Auto Insurance · Kenya</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
            {!mob && <span style={{ fontSize: 11, color: C.muted, padding: "4px 10px", background: C.card, borderRadius: 6, border: `1px solid ${C.border}` }}>Llama 3.2</span>}
            <ProfileMenu user={user} logout={logout} />
          </div>
        </div>
        <div style={{ padding: mob ? "15px" : "26px", animation: "fadeUp .3s ease" }} key={active}>
          {ok
            ? VIEWS[active]
            : <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 360, color: C.muted, textAlign: "center" }}>
                <div style={{ fontSize: 44, marginBottom: 14, opacity: .22 }}>⊘</div>
                <div className="bg" style={{ fontSize: 19, fontWeight: 700, color: "#94a3b8", marginBottom: 7 }}>Access Restricted</div>
                <div style={{ fontSize: 13, maxWidth: 280, lineHeight: 1.7 }}>Your <span style={{ color: ROLES[user.role]?.color }}>{ROLES[user.role]?.label}</span> role doesn't have access to <strong style={{ color: C.white }}>{cur?.label}</strong>.</div>
              </div>}
        </div>
      </div>
    </div>
  );
}
