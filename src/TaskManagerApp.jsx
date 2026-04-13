import { useState, useEffect, useCallback, useMemo } from "react";

// STYLES
const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0d0d0d;
    --surface: #161616;
    --surface2: #1f1f1f;
    --border: #2a2a2a;
    --accent: #e8ff47;
    --accent2: #ff6b35;
    --text: #f0f0f0;
    --muted: #666;
    --danger: #ff4444;
    --success: #44ff88;
    --mono: 'Space Mono', monospace;
    --sans: 'Syne', sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--sans); }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  input, select, textarea {
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text);
    font-family: var(--mono);
    font-size: 13px;
    padding: 10px 14px;
    border-radius: 4px;
    outline: none;
    transition: border-color 0.2s;
    width: 100%;
  }
  input:focus, select:focus, textarea:focus { border-color: var(--accent); }
  input::placeholder, textarea::placeholder { color: var(--muted); }

  button { cursor: pointer; font-family: var(--sans); border: none; }
`;

// HELPERS
const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const STATUSES = ["Todo", "In Progress", "Review", "Done"];
const PRIORITY_COLOR = { Low: "#44ff88", Medium: "#e8ff47", High: "#ff6b35", Critical: "#ff4444" };
const STATUS_COLOR = { Todo: "#666", "In Progress": "#4488ff", Review: "#e8ff47", Done: "#44ff88" };

const generateId = () => Math.random().toString(36).slice(2, 10).toUpperCase();
const today = () => new Date().toISOString().split("T")[0];

const SEED_TASKS = [
  { id: "T001", title: "Design system audit", description: "Review all components for consistency", priority: "High", status: "In Progress", dueDate: "2026-04-20", createdAt: "2026-04-01" },
  { id: "T002", title: "API integration", description: "Connect backend endpoints to frontend", priority: "Critical", status: "Todo", dueDate: "2026-04-18", createdAt: "2026-04-02" },
  { id: "T003", title: "Unit tests for auth module", description: "Achieve 90% coverage", priority: "Medium", status: "Review", dueDate: "2026-04-25", createdAt: "2026-04-03" },
  { id: "T004", title: "Documentation update", description: "Update README and API docs", priority: "Low", status: "Done", dueDate: "2026-04-10", createdAt: "2026-04-04" },
  { id: "T005", title: "Performance profiling", description: "Identify and fix bottlenecks", priority: "High", status: "Todo", dueDate: "2026-04-30", createdAt: "2026-04-05" },
  { id: "T006", title: "Mobile responsiveness", description: "Fix layouts on small screens", priority: "Medium", status: "In Progress", dueDate: "2026-04-22", createdAt: "2026-04-06" },
  { id: "T007", title: "Security review", description: "Audit for XSS and CSRF vulnerabilities", priority: "Critical", status: "Todo", dueDate: "2026-04-15", createdAt: "2026-04-07" },
  { id: "T008", title: "Onboarding flow", description: "Build step-by-step user onboarding", priority: "Medium", status: "Todo", dueDate: "2026-05-01", createdAt: "2026-04-08" },
  { id: "T009", title: "Dark mode polish", description: "Fine-tune colors and contrast", priority: "Low", status: "Done", dueDate: "2026-04-12", createdAt: "2026-04-09" },
  { id: "T010", title: "CI/CD pipeline setup", description: "Automate build and deploy", priority: "High", status: "Review", dueDate: "2026-04-19", createdAt: "2026-04-10" },
  { id: "T011", title: "Localization", description: "Add i18n support for 5 languages", priority: "Low", status: "Todo", dueDate: "2026-05-10", createdAt: "2026-04-11" },
  { id: "T012", title: "Error tracking setup", description: "Integrate Sentry for runtime errors", priority: "High", status: "In Progress", dueDate: "2026-04-21", createdAt: "2026-04-12" },
];

//CUSTOM HOOKS
function useTaskStore() {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("tasks_v2");
      return saved ? JSON.parse(saved) : SEED_TASKS;
    } catch { return SEED_TASKS; }
  });

  useEffect(() => {
    localStorage.setItem("tasks_v2", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = useCallback((task) => {
    setTasks(prev => [{ ...task, id: generateId(), createdAt: today() }, ...prev]);
  }, []);

  const updateTask = useCallback((id, updates) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  return { tasks, addTask, updateTask, deleteTask };
}

function useForm(initial, validate) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(v => ({ ...v, [name]: value }));
    if (touched[name]) {
      const errs = validate({ ...values, [name]: value });
      setErrors(prev => ({ ...prev, [name]: errs[name] }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
    const errs = validate(values);
    setErrors(prev => ({ ...prev, [name]: errs[name] }));
  };

  const handleSubmit = (onSuccess) => (e) => {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    setTouched(Object.keys(initial).reduce((a, k) => ({ ...a, [k]: true }), {}));
    if (Object.keys(errs).length === 0) onSuccess(values);
  };

  const reset = (newValues = initial) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
  };

  return { values, errors, touched, handleChange, handleBlur, handleSubmit, reset, setValues };
}

// VALIDATION 
const validateTask = (v) => {
  const e = {};
  if (!v.title?.trim()) e.title = "Title is required";
  else if (v.title.trim().length < 3) e.title = "Min 3 characters";
  if (!v.dueDate) e.dueDate = "Due date is required";
  if (!v.priority) e.priority = "Priority is required";
  if (!v.status) e.status = "Status is required";
  return e;
};

const FORM_INITIAL = { title: "", description: "", priority: "Medium", status: "Todo", dueDate: "" };

// SHARED UI 
const Badge = ({ label, colorMap }) => (
  <span style={{
    display: "inline-block", padding: "2px 10px", borderRadius: 2,
    fontSize: 11, fontFamily: "var(--mono)", fontWeight: 700, letterSpacing: 1,
    background: (colorMap[label] || "#444") + "22",
    color: colorMap[label] || "#aaa",
    border: `1px solid ${colorMap[label] || "#444"}44`
  }}>{label}</span>
);

const Field = ({ label, error, children }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: "block", fontSize: 11, fontFamily: "var(--mono)", color: "var(--muted)", marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>
      {label}
    </label>
    {children}
    {error && <div style={{ color: "var(--danger)", fontSize: 11, fontFamily: "var(--mono)", marginTop: 4 }}>⚠ {error}</div>}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", style: s = {}, type = "button", disabled }) => {
  const variants = {
    primary: { background: "var(--accent)", color: "#000", fontWeight: 700 },
    ghost: { background: "transparent", color: "var(--text)", border: "1px solid var(--border)" },
    danger: { background: "var(--danger)", color: "#fff", fontWeight: 700 },
    muted: { background: "var(--surface2)", color: "var(--muted)", border: "1px solid var(--border)" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      padding: "9px 18px", borderRadius: 4, fontSize: 13, fontFamily: "var(--sans)",
      letterSpacing: 0.5, transition: "opacity 0.15s, transform 0.1s",
      opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer",
      ...variants[variant], ...s
    }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = "0.85"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
    >{children}</button>
  );
};

// TASK FORM 
function TaskForm({ initial = FORM_INITIAL, onSubmit, onCancel, title }) {
  const { values, errors, touched, handleChange, handleBlur, handleSubmit } = useForm(initial, validateTask);

  return (
    <div style={{ maxWidth: 580, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <button onClick={onCancel} style={{ background: "none", color: "var(--muted)", fontSize: 13, fontFamily: "var(--mono)", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: 4 }}>← Back</button>
        <h2 style={{ fontFamily: "var(--sans)", fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>{title}</h2>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 28 }}>
        <Field label="Task Title *" error={touched.title && errors.title}>
          <input name="title" value={values.title} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. Refactor authentication module" />
        </Field>
        <Field label="Description">
          <textarea name="description" value={values.description} onChange={handleChange} rows={3} placeholder="What needs to be done?" style={{ resize: "vertical" }} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Priority *" error={touched.priority && errors.priority}>
            <select name="priority" value={values.priority} onChange={handleChange} onBlur={handleBlur}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Status *" error={touched.status && errors.status}>
            <select name="status" value={values.status} onChange={handleChange} onBlur={handleBlur}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Due Date *" error={touched.dueDate && errors.dueDate}>
          <input type="date" name="dueDate" value={values.dueDate} onChange={handleChange} onBlur={handleBlur} />
        </Field>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Btn type="submit" variant="primary">Save Task</Btn>
          <Btn onClick={onCancel} variant="ghost">Cancel</Btn>
        </div>
      </form>
    </div>
  );
}

// TABLE 
const PAGE_SIZE = 6;

function TaskTable({ tasks, onEdit, onDelete, onView }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [sort, setSort] = useState({ col: "createdAt", dir: "desc" });
  const [page, setPage] = useState(1);

  const toggleSort = (col) => {
    setSort(s => s.col === col ? { col, dir: s.dir === "asc" ? "desc" : "asc" } : { col, dir: "asc" });
    setPage(1);
  };

  const filtered = useMemo(() => {
    let result = tasks;
    if (search) result = result.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()));
    if (filterStatus !== "All") result = result.filter(t => t.status === filterStatus);
    if (filterPriority !== "All") result = result.filter(t => t.priority === filterPriority);
    result = [...result].sort((a, b) => {
      let va = a[sort.col] ?? "", vb = b[sort.col] ?? "";
      if (sort.col === "priority") { va = PRIORITIES.indexOf(a.priority); vb = PRIORITIES.indexOf(b.priority); }
      if (sort.col === "status") { va = STATUSES.indexOf(a.status); vb = STATUSES.indexOf(b.status); }
      return sort.dir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return result;
  }, [tasks, search, filterStatus, filterPriority, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, filterStatus, filterPriority]);

  const SortIcon = ({ col }) => {
    if (sort.col !== col) return <span style={{ color: "var(--border)", marginLeft: 4 }}>⇅</span>;
    return <span style={{ color: "var(--accent)", marginLeft: 4 }}>{sort.dir === "asc" ? "↑" : "↓"}</span>;
  };

  const thStyle = (col) => ({
    padding: "10px 14px", textAlign: "left", fontSize: 11, fontFamily: "var(--mono)",
    color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase",
    borderBottom: "1px solid var(--border)", cursor: "pointer", whiteSpace: "nowrap",
    userSelect: "none", background: "var(--surface)",
  });

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: 13 }}>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…" style={{ paddingLeft: 30 }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex: "0 0 140px" }}>
          <option>All</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ flex: "0 0 140px" }}>
          <option>All</option>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>
          {filtered.length} task{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr>
              {[["title","Title"],["priority","Priority"],["status","Status"],["dueDate","Due Date"],["createdAt","Created"]].map(([col, label]) => (
                <th key={col} style={thStyle(col)} onClick={() => toggleSort(col)}>
                  {label}<SortIcon col={col} />
                </th>
              ))}
              <th style={{ ...thStyle(""), cursor: "default" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 13 }}>
                No tasks found. Try adjusting your filters.
              </td></tr>
            ) : paginated.map((task, i) => (
              <tr key={task.id} style={{
                background: i % 2 === 0 ? "var(--surface)" : "var(--surface2)",
                transition: "background 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "#252525"}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "var(--surface)" : "var(--surface2)"}
              >
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, cursor: "pointer", color: "var(--text)" }} onClick={() => onView(task)}>
                    {task.title}
                  </div>
                  {task.description && <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)", marginTop: 2 }}>
                    {task.description.length > 50 ? task.description.slice(0, 50) + "…" : task.description}
                  </div>}
                </td>
                <td style={{ padding: "12px 14px" }}><Badge label={task.priority} colorMap={PRIORITY_COLOR} /></td>
                <td style={{ padding: "12px 14px" }}><Badge label={task.status} colorMap={STATUS_COLOR} /></td>
                <td style={{ padding: "12px 14px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>{task.dueDate}</td>
                <td style={{ padding: "12px 14px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>{task.createdAt}</td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => onEdit(task)} title="Edit" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--accent)", padding: "5px 10px", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>✎</button>
                    <button onClick={() => onDelete(task.id)} title="Delete" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--danger)", padding: "5px 10px", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16 }}>
          <Btn variant="muted" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 14px", fontSize: 12 }}>← Prev</Btn>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              width: 32, height: 32, borderRadius: 4, border: "1px solid",
              borderColor: p === page ? "var(--accent)" : "var(--border)",
              background: p === page ? "var(--accent)" : "var(--surface2)",
              color: p === page ? "#000" : "var(--muted)",
              fontFamily: "var(--mono)", fontSize: 12, cursor: "pointer", fontWeight: p === page ? 700 : 400
            }}>{p}</button>
          ))}
          <Btn variant="muted" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "6px 14px", fontSize: 12 }}>Next →</Btn>
        </div>
      )}
    </div>
  );
}

// TASK DETAIL 
function TaskDetail({ task, onBack, onEdit }) {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <button onClick={onBack} style={{ background: "none", color: "var(--muted)", fontSize: 13, fontFamily: "var(--mono)", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: 4 }}>← Back</button>
        <h2 style={{ fontFamily: "var(--sans)", fontSize: 22, fontWeight: 800 }}>Task Detail</h2>
      </div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, flex: 1, marginRight: 16 }}>{task.title}</h3>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", border: "1px solid var(--border)", padding: "3px 8px", borderRadius: 2 }}>#{task.id}</span>
        </div>
        {task.description && (
          <p style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>{task.description}</p>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {[
            ["Priority", <Badge label={task.priority} colorMap={PRIORITY_COLOR} />],
            ["Status", <Badge label={task.status} colorMap={STATUS_COLOR} />],
            ["Due Date", <span style={{ fontFamily: "var(--mono)", fontSize: 13 }}>{task.dueDate}</span>],
            ["Created", <span style={{ fontFamily: "var(--mono)", fontSize: 13 }}>{task.createdAt}</span>],
          ].map(([label, value]) => (
            <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
              {value}
            </div>
          ))}
        </div>
        <Btn onClick={() => onEdit(task)} variant="primary">Edit Task</Btn>
      </div>
    </div>
  );
}

// STATS BAR 
function StatsBar({ tasks }) {
  const stats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter(t => t.status === "Done").length,
    critical: tasks.filter(t => t.priority === "Critical" && t.status !== "Done").length,
    inProgress: tasks.filter(t => t.status === "In Progress").length,
  }), [tasks]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
      {[
        ["Total Tasks", stats.total, "var(--text)"],
        ["Completed", stats.done, "var(--success)"],
        ["In Progress", stats.inProgress, "#4488ff"],
        ["Critical", stats.critical, "var(--danger)"],
      ].map(([label, val, color]) => (
        <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "16px 18px" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "var(--mono)", lineHeight: 1 }}>{val}</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, fontFamily: "var(--mono)", letterSpacing: 0.5 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// DELETE CONFIRM MODAL 
function DeleteModal({ onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000bb", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 28, maxWidth: 360, width: "90%" }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Delete Task?</h3>
        <p style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>This action cannot be undone. The task will be permanently removed.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={onConfirm} variant="danger">Delete</Btn>
          <Btn onClick={onCancel} variant="ghost">Cancel</Btn>
        </div>
      </div>
    </div>
  );
}

// NAV
function Nav({ page, onNavigate }) {
  return (
    <nav style={{ borderBottom: "1px solid var(--border)", padding: "0 28px", background: "var(--surface)", display: "flex", alignItems: "center", gap: 0, height: 52, position: "sticky", top: 0, zIndex: 100 }}>
      <div onClick={() => onNavigate("home")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, marginRight: 32 }}>
        <span style={{ width: 24, height: 24, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, fontSize: 13 }}>⊞</span>
        <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.3, fontFamily: "var(--sans)" }}>TaskForge</span>
      </div>
      {["home", "create"].map(p => (
        <button key={p} onClick={() => onNavigate(p)} style={{
          background: "none", border: "none", padding: "0 16px", height: "100%",
          fontFamily: "var(--mono)", fontSize: 12, letterSpacing: 1, textTransform: "uppercase",
          color: page === p ? "var(--accent)" : "var(--muted)",
          borderBottom: `2px solid ${page === p ? "var(--accent)" : "transparent"}`,
          cursor: "pointer", transition: "color 0.15s"
        }}>
          {p === "home" ? "All Tasks" : "New Task"}
        </button>
      ))}
    </nav>
  );
}

// APP
export default function App() {
  const { tasks, addTask, updateTask, deleteTask } = useTaskStore();
  const [page, setPage] = useState("home"); // home | create | edit | detail
  const [selectedTask, setSelectedTask] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);

  const navigate = (p, task = null) => {
    setPage(p);
    setSelectedTask(task);
  };

  const showToast = (msg, color = "var(--success)") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2800);
  };

  const handleCreate = (values) => {
    addTask(values);
    navigate("home");
    showToast("Task created successfully");
  };

  const handleUpdate = (values) => {
    updateTask(selectedTask.id, values);
    navigate("home");
    showToast("Task updated", "var(--accent)");
  };

  const handleDelete = (id) => setDeleteId(id);
  const confirmDelete = () => {
    deleteTask(deleteId);
    setDeleteId(null);
    if (page !== "home") navigate("home");
    showToast("Task deleted", "var(--danger)");
  };

  return (
    <>
      <style>{globalStyle}</style>
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <Nav page={page} onNavigate={navigate} />
        <main style={{ maxWidth: 1060, margin: "0 auto", padding: "32px 20px" }}>
          {page === "home" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>Task Board</h1>
                  <p style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 12, marginTop: 4 }}>Manage, track, and organize your work</p>
                </div>
                <Btn onClick={() => navigate("create")} variant="primary">+ New Task</Btn>
              </div>
              <StatsBar tasks={tasks} />
              <TaskTable tasks={tasks} onEdit={t => navigate("edit", t)} onDelete={handleDelete} onView={t => navigate("detail", t)} />
            </>
          )}
          {page === "create" && (
            <TaskForm title="Create New Task" onSubmit={handleCreate} onCancel={() => navigate("home")} />
          )}
          {page === "edit" && selectedTask && (
            <TaskForm
              title="Edit Task"
              initial={{ title: selectedTask.title, description: selectedTask.description || "", priority: selectedTask.priority, status: selectedTask.status, dueDate: selectedTask.dueDate }}
              onSubmit={handleUpdate}
              onCancel={() => navigate("home")}
            />
          )}
          {page === "detail" && selectedTask && (
            <TaskDetail task={selectedTask} onBack={() => navigate("home")} onEdit={t => navigate("edit", t)} />
          )}
        </main>

        {/* Toast */}
        {toast && (
          <div style={{
            position: "fixed", bottom: 24, right: 24, background: "var(--surface)", border: `1px solid ${toast.color}`,
            color: toast.color, padding: "12px 20px", borderRadius: 6, fontFamily: "var(--mono)", fontSize: 13,
            boxShadow: "0 8px 32px #00000088", zIndex: 9999, animation: "fadeIn 0.2s ease"
          }}>
            {toast.msg}
          </div>
        )}
        {deleteId && <DeleteModal onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />}
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    </>
  );
}
