import { useEffect, useRef } from "react";
import { ChevronDown, X } from "lucide-react";
import { YES, NO } from "../lib/defaultData";
import { parseISODate, weekdayBangla, formatDateShort, formatDateFull, todayISO, relativeDayLabel } from "../lib/dateUtils";

export function PageHeader({ icon: Icon, title, subtitle, actions }) {
  return (
    <div className="page-head">
      <div className="page-head-row">
        <div className="row" style={{ alignItems: "flex-start", minWidth: 0 }}>
          {Icon ? (
            <span className="page-head-icon">
              <Icon size={22} strokeWidth={1.8} />
            </span>
          ) : null}
          <div className="page-head-text" style={{ minWidth: 0 }}>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="page-head-actions">{actions}</div> : null}
      </div>
    </div>
  );
}

export function Card({ children, className = "", style, ...rest }) {
  return (
    <div className={`card ${className}`} style={style} {...rest}>
      {children}
    </div>
  );
}

export function SectionCard({ icon: Icon, title, subtitle, right, children, flush }) {
  return (
    <section className="card section-card">
      <div className="section-head">
        <div className="section-head-main">
          {Icon ? (
            <span className="section-head-icon">
              <Icon size={17} strokeWidth={1.9} />
            </span>
          ) : null}
          <div style={{ minWidth: 0 }}>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </div>
        {right ? <div className="row" style={{ flex: "0 0 auto" }}>{right}</div> : null}
      </div>
      <div className={`section-body ${flush ? "flush" : ""}`}>{children}</div>
    </section>
  );
}

export function KpiCard({ icon: Icon, label, value, unit, tone = "#34d399", hint }) {
  return (
    <div className="kpi-card" style={{ "--kpi-tone": tone }}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        {Icon ? (
          <span className="kpi-icon">
            <Icon size={15} strokeWidth={2} />
          </span>
        ) : null}
      </div>
      <div className="kpi-value">
        {value}
        {unit ? <span className="kpi-unit">{unit}</span> : null}
      </div>
      {hint ? (
        <div className="tiny muted" style={{ marginTop: 4 }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export function Badge({ tone = "mute", children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function StatusBanner({ children, tone }) {
  return <div className={`status-banner ${tone || ""}`}>{children}</div>;
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      {label ? <span className="field-label">{label}</span> : null}
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function TextInput({ className = "", ...props }) {
  return <input type="text" className={`input ${className}`} {...props} />;
}

export function NumberInput({ className = "", ...props }) {
  return <input type="number" inputMode="decimal" className={`input ${className}`} {...props} />;
}

export function DateInput({ className = "", ...props }) {
  return <input type="date" className={`input ${className}`} {...props} />;
}

export function TimeInput({ className = "", ...props }) {
  return <input type="time" className={`input ${className}`} {...props} />;
}

export function TextArea({ className = "", ...props }) {
  return <textarea className={`textarea ${className}`} {...props} />;
}

function normalizeOptions(options) {
  return (options || []).map((o) =>
    typeof o === "string" ? { value: o, label: o } : { value: o.value, label: o.label ?? o.value }
  );
}

export function Select({ options = [], placeholder = "", className = "", ...props }) {
  const opts = normalizeOptions(options);
  return (
    <select className={`select ${className}`} {...props}>
      <option value="">{placeholder}</option>
      {opts.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function YesNo({ value, onChange, disabled, labels }) {
  const yes = labels ? labels[0] : YES;
  const no = labels ? labels[1] : NO;
  return (
    <div className="seg" role="group" aria-label="হ্যাঁ অথবা না">
      <button
        type="button"
        disabled={disabled}
        className={value === YES ? "on-yes" : ""}
        onClick={() => onChange(value === YES ? "" : YES)}
      >
        {yes}
      </button>
      <button
        type="button"
        disabled={disabled}
        className={value === NO ? "on-no" : ""}
        onClick={() => onChange(value === NO ? "" : NO)}
      >
        {no}
      </button>
    </div>
  );
}

export function Rating({ value, onChange, max = 5, ariaLabel = "রেটিং" }) {
  return (
    <div className="seg" role="group" aria-label={ariaLabel}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          className={String(value) === String(n) ? "on-yes" : ""}
          onClick={() => onChange(String(value) === String(n) ? "" : String(n))}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export function Segmented({ value, onChange, options = [], allowClear = true }) {
  return (
    <div className="seg" role="group">
      {options.map((o) => {
        const active = String(value) === String(o.value);
        return (
          <button
            key={o.value}
            type="button"
            className={active ? "on-yes" : ""}
            onClick={() => onChange(active && allowClear ? "" : o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Calc({ value, tone, label }) {
  return (
    <div className={`calc-box ${tone || ""}`} title={label}>
      {value === null || value === undefined || value === "" ? "—" : value}
    </div>
  );
}

export function Progress({ value, tone = "" }) {
  const pct = Math.max(0, Math.min(100, Math.round((Number(value) || 0) * 100)));
  return (
    <div className={`progress ${tone}`}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ProgressMeta({ label, value, right, tone = "", hint }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div className="progress-meta">
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
          {hint ? <span className="muted"> · {hint}</span> : null}
        </span>
        <span className="numeric" style={{ flex: "0 0 auto", color: "var(--text-2)" }}>
          {right}
        </span>
      </div>
      <Progress value={value} tone={tone} />
    </div>
  );
}

export function Accordion({ icon: Icon, title, meta, open, onToggle, children }) {
  return (
    <div className={`acc ${open ? "open" : ""}`}>
      <button type="button" className="acc-head" onClick={onToggle} aria-expanded={open}>
        {Icon ? (
          <span className="acc-head-icon">
            <Icon size={15} strokeWidth={2} />
          </span>
        ) : null}
        <span className="acc-head-title">{title}</span>
        {meta ? <span className="acc-head-meta">{meta}</span> : null}
        <ChevronDown size={16} className="acc-chevron" />
      </button>
      {open ? <div className="acc-body">{children}</div> : null}
    </div>
  );
}

export function DateStrip({ dates, value, onChange, hasData }) {
  const activeRef = useRef(null);
  const today = todayISO();

  useEffect(() => {
    const el = activeRef.current;
    const strip = el && el.parentElement;
    if (!el || !strip) return;
    const target = el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2;
    strip.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [value]);

  return (
    <div className="day-strip" role="tablist" aria-label="তারিখ নির্বাচন">
      {dates.map((d) => {
        const dt = parseISODate(d);
        const active = d === value;
        return (
          <button
            key={d}
            ref={active ? activeRef : null}
            type="button"
            role="tab"
            aria-selected={active}
            className={`day-chip ${active ? "active" : ""} ${d === today ? "today" : ""} ${
              hasData && hasData(d) ? "has-data" : ""
            }`}
            onClick={() => onChange(d)}
            title={formatDateFull(d)}
          >
            <b>{dt ? dt.getDate() : ""}</b>
            <small>{weekdayBangla(d)}</small>
            <span className="dot" />
          </button>
        );
      })}
    </div>
  );
}

export function DayNav({ date, onChange, min, max, showLabel = true, dates, hasData }) {
  return (
    <div>
      <div className="row" style={{ marginBottom: dates ? 10 : 0 }}>
        {showLabel ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="small strong">{relativeDayLabel(date)}</div>
            <div className="tiny muted">{formatDateFull(date)}</div>
          </div>
        ) : null}
        <DateInput value={date} min={min} max={max} onChange={(e) => e.target.value && onChange(e.target.value)} style={{ flex: 1 }} />
      </div>
      {dates ? <DateStrip dates={dates} value={date} onChange={onChange} hasData={hasData} /> : null}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="empty">
      {Icon ? (
        <span className="empty-icon">
          <Icon size={24} strokeWidth={1.7} />
        </span>
      ) : null}
      <strong>{title}</strong>
      {hint ? <p>{hint}</p> : null}
      {action ? <div style={{ marginTop: 8 }}>{action}</div> : null}
    </div>
  );
}

export function ChartCard({ icon: Icon, title, children, height = 210, right }) {
  return (
    <div className="card chart-card">
      <div className="chart-card-title">
        {Icon ? <Icon size={15} /> : null}
        <span style={{ flex: 1 }}>{title}</span>
        {right}
      </div>
      <div style={{ width: "100%", height }}>{children}</div>
    </div>
  );
}

export function Sheet({ open, title, subtitle, onClose, children, footer, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sheet-backdrop no-print" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`sheet ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>{title}</h2>
            {subtitle ? <div className="tiny muted">{subtitle}</div> : null}
          </div>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="বন্ধ করুন" style={{ width: 34, height: 34, minHeight: 34 }}>
            <X size={17} />
          </button>
        </div>
        {children}
        {footer ? <div style={{ marginTop: 14 }}>{footer}</div> : null}
      </div>
    </div>
  );
}

export function Tabs({ tabs = [], value, onChange }) {
  return (
    <div className="tabbar" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={t.value === value}
          className={`tab ${t.value === value ? "active" : ""}`}
          onClick={() => onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function EventRow({ icon: Icon, tone = "#34d399", title, subtitle, right, actions, onClick }) {
  return (
    <div className="list-row">
      {Icon ? (
        <span className="event-icon" style={{ "--tone": tone }}>
          <Icon size={17} strokeWidth={1.9} />
        </span>
      ) : null}
      <div
        className="list-row-main"
        onClick={onClick}
        style={onClick ? { cursor: "pointer" } : undefined}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={(e) => onClick && (e.key === "Enter" || e.key === " ") && onClick()}
      >
        <div className="list-row-title">{title}</div>
        {subtitle ? <div className="list-row-sub">{subtitle}</div> : null}
      </div>
      {right ? <div style={{ flex: "0 0 auto", textAlign: "right" }}>{right}</div> : null}
      {actions ? <div className="row" style={{ flex: "0 0 auto", gap: 4 }}>{actions}</div> : null}
    </div>
  );
}

export { YES, NO };