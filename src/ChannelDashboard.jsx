import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  Line, ComposedChart, ResponsiveContainer, Cell, LabelList
} from "recharts";
import {
  TrendingUp, DollarSign, BarChart3,
  Filter, ChevronDown, ChevronUp, Globe,
  Upload, FileSpreadsheet, X, Check, AlertCircle, File,
  LayoutDashboard, Users, Store
} from "lucide-react";

// ── Data ──────────────────────────────────────────────
const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

// ── Google Sheets CSV URLs ───────────────────────────
const GSHEET_TEAM_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSiHuxubXQn_N4x-K_D6Gj6cFqFnmzBK3RaXZskRnfZSRBmo0_yfSTwOh_k80saMwiK-UWkRWw3Mmdp/pub?gid=0&single=true&output=csv";
const GSHEET_CHANNEL_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSiHuxubXQn_N4x-K_D6Gj6cFqFnmzBK3RaXZskRnfZSRBmo0_yfSTwOh_k80saMwiK-UWkRWw3Mmdp/pub?gid=196016256&single=true&output=csv";

const EMPTY_COMPANY_MONTHLY = MONTHS.map(m => ({
  month: m, 매출: 0, 매출원가: 0, 변동비: 0, 고정비: 0, 영업이익: 0, 영업이익률: 0,
}));

const COST_COMPONENTS = ["매출원가", "운반비", "지급수수료", "광고선전비", "판매촉진비"];

const PALETTE = {
  primary: "#2d3e47",
  primaryLight: "#3d5461",
  primaryDark: "#1e2c33",
  accent1: "#4a90a4",
  accent2: "#6ab0a3",
  accent3: "#e8a838",
  accent4: "#d4605a",
  accent5: "#8b6bae",
  surface: "#f6f8fa",
  surfaceAlt: "#edf1f5",
  border: "#d8dee6",
  text: "#1a2730",
  textSec: "#5a6f7e",
  white: "#ffffff",
};

const COST_COLORS = {
  매출원가: "#1e3a5f",
  운반비: "#3d7ea6",
  지급수수료: "#5ba08f",
  광고선전비: "#e09b5c",
  판매촉진비: "#c07282",
};

const CHANNEL_COLORS_LIST = [
  "#2d3e47", "#4a90a4", "#6ab0a3", "#e8a838", "#d4605a",
  "#8b6bae", "#3b6978", "#c97b4b", "#5a8f6a", "#a45a7a",
];

const TEAM_COLORS = [
  "#2d6a8e", "#3a9e78", "#e8a838", "#d4605a", "#8b6bae",
  "#3b6978", "#c97b4b", "#5a8f6a", "#a45a7a", "#4a90a4",
];

// ── Helpers ───────────────────────────────────────────
const fmt = (v) => {
  if (v === 0 || v === null || v === undefined) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e8) return (v / 1e8).toFixed(1) + "억";
  if (abs >= 1e4) {
    const man = Math.round(v / 1e4);
    return man.toLocaleString() + "만";
  }
  return v.toLocaleString();
};

const fmtFull = (v) => {
  if (v === 0) return "—";
  return v.toLocaleString() + "원";
};

const fmtAxis = (v) => {
  if (v === 0) return "0";
  if (v >= 1e8) return (v / 1e8).toFixed(0) + "억";
  return (v / 1e4).toFixed(0) + "만";
};

const fmtFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

// ── CSV Parsers for new format ────────────────────────
const parseCSVNum = (s) => {
  if (!s || s.trim() === "" || s.trim() === "-") return 0;
  const cleaned = String(s).replace(/[,"﻿\s]/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
};

const splitCSVLine = (line) => {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { result.push(current); current = ""; }
    else { current += ch; }
  }
  result.push(current);
  return result.map(v => v.trim());
};

const parseTeamCSV = (text) => {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return null;
  // Header: 실적월,부서명,매출,매출원가,변동비,운반비,지급수수료,광고선전비,판매촉진비,한계이익
  const teamMap = {};
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    if (cols.length < 10) continue;
    const month = parseInt(cols[0]);
    const team = cols[1]?.trim();
    if (!month || !team) continue;
    if (!teamMap[team]) {
      teamMap[team] = { team, monthly: MONTHS.map(m => ({ month: m, 매출: 0, 매출원가: 0, 변동비: 0, 운반비: 0, 지급수수료: 0, 광고선전비: 0, 판매촉진비: 0, 한계이익: 0 })) };
    }
    const idx = month - 1;
    if (idx >= 0 && idx < 12) {
      teamMap[team].monthly[idx] = {
        month: MONTHS[idx],
        매출: parseCSVNum(cols[2]),
        매출원가: parseCSVNum(cols[3]),
        변동비: parseCSVNum(cols[4]),
        운반비: parseCSVNum(cols[5]),
        지급수수료: parseCSVNum(cols[6]),
        광고선전비: parseCSVNum(cols[7]),
        판매촉진비: parseCSVNum(cols[8]),
        한계이익: parseCSVNum(cols[9]),
      };
    }
  }
  return { teamData: teamMap, teamCount: Object.keys(teamMap).length };
};

const parseChannelCSV = (text) => {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return null;
  // Header: 실적월,부서명,채널명,매출,매출원가,변동비,운반비,지급수수료,광고선전비,판매촉진비,한계이익
  const channelMap = {};
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    if (cols.length < 11) continue;
    const month = parseInt(cols[0]);
    const team = cols[1]?.trim();
    const channel = cols[2]?.trim();
    if (!month || !team || !channel) continue;
    if (!channelMap[channel]) {
      channelMap[channel] = {
        team,
        type: team.includes("해외") ? "해외" : "국내",
        monthly: MONTHS.map(m => ({ month: m, 매출: 0, 매출원가: 0, 운반비: 0, 지급수수료: 0, 광고선전비: 0, 판매촉진비: 0, 한계이익: 0, 한계이익률: 0 })),
      };
    }
    const idx = month - 1;
    if (idx >= 0 && idx < 12) {
      const 매출 = parseCSVNum(cols[3]);
      const 한계이익 = parseCSVNum(cols[10]);
      channelMap[channel].monthly[idx] = {
        month: MONTHS[idx],
        매출,
        매출원가: parseCSVNum(cols[4]),
        운반비: parseCSVNum(cols[6]),
        지급수수료: parseCSVNum(cols[7]),
        광고선전비: parseCSVNum(cols[8]),
        판매촉진비: parseCSVNum(cols[9]),
        한계이익,
        한계이익률: 매출 > 0 ? (한계이익 / 매출) * 100 : 0,
      };
    }
  }
  return { channelData: channelMap, channelCount: Object.keys(channelMap).length };
};

// ── Components ────────────────────────────────────────

const KPICard = ({ icon: Icon, label, value, sub, accent = false, change }) => (
  <div
    className="relative overflow-hidden rounded-xl p-5"
    style={{
      background: accent
        ? `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.primaryLight})`
        : PALETTE.white,
      border: accent ? "none" : `1px solid ${PALETTE.border}`,
      color: accent ? "#fff" : PALETTE.text,
    }}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium tracking-wide uppercase opacity-60 mb-1">{label}</p>
        <p className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Pretendard', sans-serif" }}>{value}</p>
        <div className="flex items-center gap-2 mt-1">
          {sub && <p className="text-xs opacity-70">{sub}</p>}
          {change !== null && change !== undefined && (
            <span
              className="inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md"
              style={{
                background: accent
                  ? "rgba(255,255,255,0.15)"
                  : change > 0 ? "#fef0ef" : change < 0 ? "#eef3fb" : PALETTE.surfaceAlt,
                color: accent
                  ? (change > 0 ? "#ff9e9e" : change < 0 ? "#8ec5fc" : "rgba(255,255,255,0.7)")
                  : (change > 0 ? "#d4605a" : change < 0 ? "#3a7bd5" : PALETTE.textSec),
              }}
            >
              {change > 0 ? "▲" : change < 0 ? "▼" : "—"}
              {change !== 0 ? Math.abs(change).toFixed(1) + "%" : ""}
            </span>
          )}
        </div>
      </div>
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{
          background: accent ? "rgba(255,255,255,0.15)" : PALETTE.surfaceAlt,
        }}
      >
        <Icon size={18} strokeWidth={1.8} />
      </div>
    </div>
    {accent && (
      <div
        className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full"
        style={{ background: "rgba(255,255,255,0.04)" }}
      />
    )}
  </div>
);

const SectionHeader = ({ title, subtitle, children }) => (
  <div className="mb-4">
    <h2 className="text-lg font-bold tracking-tight" style={{ color: PALETTE.text }}>{title}</h2>
    {subtitle && <p className="text-xs mt-0.5 mb-2" style={{ color: PALETTE.textSec }}>{subtitle}</p>}
    {children && <div className="mt-2">{children}</div>}
  </div>
);

const FilterPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap"
    style={{
      background: active ? PALETTE.primary : PALETTE.surfaceAlt,
      color: active ? "#fff" : PALETTE.textSec,
      border: `1px solid ${active ? PALETTE.primary : PALETTE.border}`,
    }}
  >
    {label}
  </button>
);

const fmtBillion = (v) => {
  if (v === 0 || v === null || v === undefined) return "—";
  return (v / 1e8).toFixed(1) + "억원";
};

const fmtPct = (v) => {
  if (v === 0 || v === null || v === undefined) return "—";
  return Number(v).toFixed(1) + "%";
};

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload) return null;
  return (
    <div
      className="rounded-lg p-3 shadow-xl border"
      style={{
        background: "rgba(255,255,255,0.97)",
        borderColor: PALETTE.border,
        backdropFilter: "blur(8px)",
      }}
    >
      <p className="text-xs font-bold mb-2" style={{ color: PALETTE.primary }}>{label}</p>
      {payload.map((entry, i) => {
        let display = fmtFull(entry.value);
        if (formatter) {
          display = formatter(entry.name, entry.value);
        }
        return (
          <div key={i} className="flex items-center gap-2 text-xs py-0.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: entry.color }} />
            <span style={{ color: PALETTE.textSec }}>{entry.name}:</span>
            <span className="font-semibold" style={{ color: PALETTE.text }}>
              {display}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const CostTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0]?.payload;
  return (
    <div
      className="rounded-lg p-3 shadow-xl border"
      style={{
        background: "rgba(255,255,255,0.97)",
        borderColor: PALETTE.border,
        backdropFilter: "blur(8px)",
      }}
    >
      <p className="text-xs font-bold mb-2" style={{ color: PALETTE.primary }}>{label}</p>
      {payload.map((entry, i) => {
        const ratioKey = entry.name + "율";
        const ratio = row && row[ratioKey] != null ? row[ratioKey] : null;
        return (
          <div key={i} className="flex items-center gap-2 text-xs py-0.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: entry.color }} />
            <span style={{ color: PALETTE.textSec }}>{entry.name}:</span>
            <span className="font-semibold" style={{ color: PALETTE.text }}>
              {fmtBillion(entry.value)}
            </span>
            {ratio != null && ratio > 0 && (
              <span style={{ color: PALETTE.textSec }}>
                ({ratio.toFixed(1)}%)
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Upload Modal ──────────────────────────────────────
const UploadModal = ({ isOpen, onClose, onDataLoaded, uploadLogs }) => {
  const [teamFile, setTeamFile] = useState(null);
  const [channelFile, setChannelFile] = useState(null);
  const [teamResult, setTeamResult] = useState(null); // { status, message, data }
  const [channelResult, setChannelResult] = useState(null);
  const teamInputRef = useRef(null);
  const channelInputRef = useRef(null);

  const resetState = () => {
    setTeamFile(null); setChannelFile(null);
    setTeamResult(null); setChannelResult(null);
  };

  const handleFile = (file, type) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["csv", "tsv"].includes(ext)) {
      const setter = type === "team" ? setTeamResult : setChannelResult;
      setter({ status: "error", message: "CSV 파일만 업로드 가능합니다." });
      return;
    }
    if (type === "team") setTeamFile(file); else setChannelFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        if (type === "team") {
          const result = parseTeamCSV(text);
          if (!result || result.teamCount === 0) {
            setTeamResult({ status: "error", message: "팀별 실적 데이터를 인식할 수 없습니다." });
          } else {
            setTeamResult({ status: "success", message: `${result.teamCount}개 팀 인식`, data: result.teamData });
          }
        } else {
          const result = parseChannelCSV(text);
          if (!result || result.channelCount === 0) {
            setChannelResult({ status: "error", message: "채널별 실적 데이터를 인식할 수 없습니다." });
          } else {
            setChannelResult({ status: "success", message: `${result.channelCount}개 채널 인식`, data: result.channelData });
          }
        }
      } catch (err) {
        const setter = type === "team" ? setTeamResult : setChannelResult;
        setter({ status: "error", message: "파싱 오류: " + err.message });
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const canApply = (teamResult?.status === "success") || (channelResult?.status === "success");

  const handleApply = () => {
    if (teamResult?.status === "success") {
      onDataLoaded({ type: "team", data: teamResult.data, fileName: teamFile?.name });
    }
    if (channelResult?.status === "success") {
      onDataLoaded({ type: "channel", data: channelResult.data, fileName: channelFile?.name });
    }
    onClose();
    resetState();
  };

  if (!isOpen) return null;

  const FileSlot = ({ label, subtitle, file, result, inputRef, onFile, onClear }) => (
    <div
      className="rounded-xl p-4"
      style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.border}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs font-bold" style={{ color: PALETTE.primary }}>{label}</p>
          <p className="text-xs mt-0.5" style={{ color: PALETTE.textSec }}>{subtitle}</p>
        </div>
        {result?.status === "success" && <Check size={16} color="#16825d" />}
        {result?.status === "error" && <AlertCircle size={16} color={PALETTE.accent4} />}
      </div>
      {!file ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full py-3 rounded-lg text-xs font-medium transition-all"
          style={{ border: `2px dashed ${PALETTE.border}`, color: PALETTE.textSec, background: PALETTE.white }}
        >
          <FileSpreadsheet size={16} className="inline mr-2" style={{ verticalAlign: "middle" }} />
          CSV 파일 선택
          <input ref={inputRef} type="file" accept=".csv,.tsv" className="hidden" onChange={(e) => onFile(e.target.files[0])} />
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <File size={14} color={PALETTE.accent1} />
          <span className="text-xs font-medium flex-1 truncate" style={{ color: PALETTE.text }}>{file.name}</span>
          <span className="text-xs" style={{ color: PALETTE.textSec }}>{fmtFileSize(file.size)}</span>
          <button onClick={onClear} className="p-1 rounded" style={{ background: PALETTE.surfaceAlt }}>
            <X size={12} color={PALETTE.textSec} />
          </button>
        </div>
      )}
      {result && (
        <p className="text-xs mt-2" style={{ color: result.status === "success" ? "#16825d" : PALETTE.accent4 }}>
          {result.message}
        </p>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) { onClose(); resetState(); } }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: PALETTE.white, border: `1px solid ${PALETTE.border}`, animation: "modalIn 0.25s ease-out" }}
      >
        <style>{`
          @keyframes modalIn { from { opacity:0; transform:translateY(12px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.primaryLight})` }}>
              <Upload size={16} color="#fff" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: PALETTE.text }}>데이터 업로드</h3>
              <p className="text-xs" style={{ color: PALETTE.textSec }}>팀별·채널별 실적 CSV 파일을 각각 업로드합니다</p>
            </div>
          </div>
          <button onClick={() => { onClose(); resetState(); }} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: PALETTE.surfaceAlt }}>
            <X size={15} color={PALETTE.textSec} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3" style={{ maxHeight: 500, overflowY: "auto" }}>
          <FileSlot
            label="팀별 실적"
            subtitle="실적월, 부서명, 매출, 매출원가, 변동비, 운반비, 지급수수료, 광고선전비, 판매촉진비, 한계이익"
            file={teamFile} result={teamResult} inputRef={teamInputRef}
            onFile={(f) => handleFile(f, "team")}
            onClear={() => { setTeamFile(null); setTeamResult(null); }}
          />
          <FileSlot
            label="채널별 실적"
            subtitle="실적월, 부서명, 채널명, 매출, 매출원가, 변동비, 운반비, 지급수수료, 광고선전비, 판매촉진비, 한계이익"
            file={channelFile} result={channelResult} inputRef={channelInputRef}
            onFile={(f) => handleFile(f, "channel")}
            onClear={() => { setChannelFile(null); setChannelResult(null); }}
          />

          {/* Upload Logs */}
          {uploadLogs && uploadLogs.length > 0 && (
            <div className="rounded-xl p-3" style={{ background: PALETTE.surfaceAlt, border: `1px solid ${PALETTE.border}` }}>
              <p className="text-xs font-bold mb-2" style={{ color: PALETTE.textSec }}>업로드 이력</p>
              <div className="space-y-1" style={{ maxHeight: 120, overflowY: "auto" }}>
                {uploadLogs.slice().reverse().map((log, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs" style={{ color: PALETTE.textSec }}>
                    <span style={{ color: PALETTE.text, fontWeight: 600 }}>{log.type === "team" ? "팀별" : "채널별"}</span>
                    <span>{log.fileName}</span>
                    <span className="ml-auto" style={{ fontSize: 10 }}>{log.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${PALETTE.border}`, background: PALETTE.surface }}>
          <button onClick={() => { onClose(); resetState(); }} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ color: PALETTE.textSec, background: PALETTE.white, border: `1px solid ${PALETTE.border}` }}>취소</button>
          <button
            onClick={handleApply} disabled={!canApply}
            className="px-5 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: canApply ? `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.primaryLight})` : PALETTE.surfaceAlt,
              color: canApply ? "#fff" : PALETTE.border, cursor: canApply ? "pointer" : "not-allowed",
            }}
          >데이터 적용</button>
        </div>
      </div>
    </div>
  );
};

// ── Profit Pool Chart (custom SVG) ───────────────────
const ProfitPoolChart = ({ data }) => {
  const [hovered, setHovered] = useState(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0 });
  const containerRef = useRef(null);

  const margin = { top: 30, right: 20, bottom: 50, left: 65 };

  // Y-axis: 한계이익 (억원)
  const profitValues = data.map(d => d.한계이익 / 1e8);
  const maxProfit = Math.max(...profitValues.map(v => Math.abs(v)), 1);
  const minProfit = Math.min(...profitValues, 0);
  const yStep = maxProfit > 500 ? 200 : maxProfit > 200 ? 100 : maxProfit > 100 ? 50 : maxProfit > 50 ? 20 : maxProfit > 20 ? 10 : 5;
  const yMax = Math.ceil(Math.max(...profitValues, 1) / yStep) * yStep + yStep;
  const yMin = minProfit < 0 ? Math.floor(minProfit / yStep) * yStep - yStep : 0;

  // X-axis: cumulative revenue in 억원
  const totalRevenue = data.reduce((s, d) => s + d.매출, 0);
  const totalBillion = totalRevenue / 1e8;
  const xMaxRaw = totalBillion;
  const xStep = xMaxRaw > 2000 ? 500 : xMaxRaw > 1000 ? 200 : xMaxRaw > 500 ? 100 : xMaxRaw > 200 ? 50 : xMaxRaw > 100 ? 20 : 10;
  const xMax = Math.ceil(xMaxRaw / xStep) * xStep || 1;

  let cumRevenue = 0;
  const barsWithX = data.map(d => {
    const item = { ...d, xStart억: cumRevenue / 1e8, width억: d.매출 / 1e8, profit억: d.한계이익 / 1e8 };
    cumRevenue += d.매출;
    return item;
  });

  const handleMouse = (entry, e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setHovered(entry.team);
    setTooltip({ show: true, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const yTicks = [];
  for (let v = yMin; v <= yMax; v += yStep) yTicks.push(v);

  const chartW = 800 - margin.left - margin.right;
  const chartH = 400 - margin.top - margin.bottom;
  const toX = (억) => margin.left + (억 / xMax) * chartW;
  const toY = (억) => margin.top + ((yMax - 억) / (yMax - yMin)) * chartH;

  return (
    <div ref={containerRef} className="relative" style={{ width: "100%", height: 400 }}>
      <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
        {/* Y-axis grid lines and labels */}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={margin.left} y1={toY(v)} x2={800 - margin.right} y2={toY(v)} stroke={PALETTE.border} strokeDasharray="3 3" />
            <text x={margin.left - 8} y={toY(v) + 4} textAnchor="end" fontSize={10} fill={PALETTE.textSec}>{v.toLocaleString()}억</text>
          </g>
        ))}

        {/* Axis label */}
        <text x={14} y={200} textAnchor="middle" fontSize={11} fill={PALETTE.textSec} fontWeight={600} transform="rotate(-90,14,200)">한계이익 (억원)</text>

        {/* Zero line if needed */}
        {yMin < 0 && (
          <line x1={margin.left} y1={toY(0)} x2={800 - margin.right} y2={toY(0)} stroke={PALETTE.text} strokeWidth={1} strokeOpacity={0.3} />
        )}

        {/* Bars */}
        {barsWithX.map((entry) => {
          const barX = toX(entry.xStart억);
          const barW = (entry.width억 / xMax) * chartW;
          const profitVal = entry.profit억;
          const zeroY = toY(0);
          const isActive = hovered === entry.team;

          let barY, barH;
          if (profitVal >= 0) {
            barY = toY(profitVal);
            barH = zeroY - barY;
          } else {
            barY = zeroY;
            barH = toY(profitVal) - zeroY;
          }

          const marginPct = entry.영업이익률;
          const labelY = profitVal >= 0 ? barY - 6 : barY + barH + 14;
          const labelX = barX + barW / 2;

          return (
            <g
              key={entry.team}
              onMouseMove={(e) => handleMouse(entry, e)}
              onMouseLeave={() => { setHovered(null); setTooltip({ show: false, x: 0, y: 0 }); }}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={barX + 1}
                y={barY}
                width={Math.max(barW - 2, 2)}
                height={Math.max(barH, 1)}
                fill={entry.color}
                fillOpacity={isActive ? 0.9 : 0.7}
                rx={2}
                stroke={isActive ? entry.color : "none"}
                strokeWidth={isActive ? 2 : 0}
              />
              {/* Team name inside bar */}
              {barW > 30 && barH > 16 && (
                <text
                  x={labelX}
                  y={profitVal >= 0 ? barY + Math.min(barH / 2 + 4, barH - 4) : barY + Math.min(barH / 2 + 4, barH - 4)}
                  textAnchor="middle"
                  fontSize={barW > 80 ? 11 : 9}
                  fontWeight={600}
                  fill="#fff"
                  style={{ pointerEvents: "none" }}
                >
                  {entry.team.length > (barW > 80 ? 12 : 6) ? entry.team.slice(0, barW > 80 ? 12 : 6) + "…" : entry.team}
                </text>
              )}
              {/* Margin % label above/below */}
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fill={entry.color}
                style={{ pointerEvents: "none" }}
              >
                {marginPct.toFixed(1)}%
              </text>
            </g>
          );
        })}

        {/* Axes lines */}
        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={400 - margin.bottom} stroke={PALETTE.border} />
        <line x1={margin.left} y1={400 - margin.bottom} x2={800 - margin.right} y2={400 - margin.bottom} stroke={PALETTE.border} />
      </svg>

      {/* Tooltip */}
      {tooltip.show && hovered && (() => {
        const entry = data.find(d => d.team === hovered);
        if (!entry) return null;
        return (
          <div
            className="absolute rounded-lg p-3 shadow-xl border pointer-events-none"
            style={{
              left: Math.min(tooltip.x + 12, 600),
              top: tooltip.y - 10,
              background: "rgba(255,255,255,0.97)",
              borderColor: PALETTE.border,
              backdropFilter: "blur(8px)",
              zIndex: 10,
            }}
          >
            <p className="text-xs font-bold mb-2" style={{ color: entry.color }}>{entry.team}</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span style={{ color: PALETTE.textSec }}>매출:</span>
                <span className="font-semibold" style={{ color: PALETTE.text }}>{fmtBillion(entry.매출)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span style={{ color: PALETTE.textSec }}>한계이익:</span>
                <span className="font-semibold" style={{ color: entry.한계이익 >= 0 ? "#16825d" : PALETTE.accent4 }}>{fmtBillion(entry.한계이익)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span style={{ color: PALETTE.textSec }}>한계이익률:</span>
                <span className="font-semibold" style={{ color: PALETTE.text }}>{entry.영업이익률.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────
export default function ChannelDashboard() {
  const [globalMonth, setGlobalMonth] = useState("1월");
  const [showUpload, setShowUpload] = useState(false);
  const [storageLoading, setStorageLoading] = useState(true);
  const [navSection, setNavSection] = useState("overview");

  // Mutable data state
  const [teamData, setTeamData] = useState({});
  const [channelData, setChannelData] = useState({});
  const [uploadLogs, setUploadLogs] = useState([]);

  // Derive companyMonthly from teamData (sum of all teams)
  const companyMonthly = useMemo(() => {
    const teams = Object.values(teamData);
    if (teams.length === 0) return EMPTY_COMPANY_MONTHLY;
    return MONTHS.map((m, i) => {
      const sum = (key) => teams.reduce((s, t) => s + (t.monthly[i]?.[key] || 0), 0);
      const 매출 = sum("매출");
      const 한계이익 = sum("한계이익");
      return {
        month: m, 매출, 매출원가: sum("매출원가"), 변동비: sum("변동비"),
        고정비: 0, 영업이익: 한계이익,
        영업이익률: 매출 > 0 ? (한계이익 / 매출) * 100 : 0,
      };
    });
  }, [teamData]);

  // ── Load data: Google Sheets (primary) → Storage (fallback) ──
  useEffect(() => {
    const fetchGoogleSheets = async () => {
      try {
        const [teamRes, channelRes] = await Promise.all([
          fetch(GSHEET_TEAM_URL),
          fetch(GSHEET_CHANNEL_URL),
        ]);
        if (!teamRes.ok || !channelRes.ok) throw new Error("Fetch failed");
        const teamText = await teamRes.text();
        const channelText = await channelRes.text();

        const teamResult = parseTeamCSV(teamText);
        const channelResult = parseChannelCSV(channelText);

        if (teamResult && teamResult.teamCount > 0) setTeamData(teamResult.teamData);
        if (channelResult && channelResult.channelCount > 0) setChannelData(channelResult.channelData);
        return true;
      } catch (e) {
        return false;
      }
    };

    const loadFromStorage = async () => {
      try {
        const result = await window.storage?.get("dashboard-data-v2", true);
        if (result && result.value) {
          const parsed = JSON.parse(result.value);
          if (parsed.teamData) setTeamData(parsed.teamData);
          if (parsed.channelData) setChannelData(parsed.channelData);
          if (parsed.uploadLogs) setUploadLogs(parsed.uploadLogs);
        }
      } catch (e) {
        // No storage available
      }
    };

    const loadData = async () => {
      const sheetsOk = await fetchGoogleSheets();
      if (!sheetsOk) await loadFromStorage();
      setStorageLoading(false);
    };
    loadData();
  }, []);

  const saveToStorage = async (newTeamData, newChannelData, newLogs) => {
    try {
      if (window.storage?.set) {
        await window.storage.set(
          "dashboard-data-v2",
          JSON.stringify({ teamData: newTeamData, channelData: newChannelData, uploadLogs: newLogs, updatedAt: new Date().toISOString() }),
          true
        );
      }
    } catch (e) {
      // Storage not available (e.g. GitHub Pages)
    }
  };

  const teamDataRef = useRef(teamData);
  const channelDataRef = useRef(channelData);
  const uploadLogsRef = useRef(uploadLogs);
  teamDataRef.current = teamData;
  channelDataRef.current = channelData;
  uploadLogsRef.current = uploadLogs;

  const handleDataLoaded = ({ type, data, fileName }) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    const newLog = { type, fileName: fileName || "unknown", date: dateStr };
    const newLogs = [...uploadLogsRef.current, newLog];
    setUploadLogs(newLogs);
    uploadLogsRef.current = newLogs;

    if (type === "team") {
      setTeamData(data);
      teamDataRef.current = data;
      saveToStorage(data, channelDataRef.current, newLogs);
    } else {
      setChannelData(data);
      channelDataRef.current = data;
      saveToStorage(teamDataRef.current, data, newLogs);
    }
  };

  const ALL_CHANNELS = useMemo(() => Object.keys(channelData), [channelData]);

  const CHANNEL_COLORS = useMemo(() => {
    const map = {};
    ALL_CHANNELS.forEach((ch, i) => {
      map[ch] = CHANNEL_COLORS_LIST[i % CHANNEL_COLORS_LIST.length];
    });
    return map;
  }, [ALL_CHANNELS]);

  const [selectedChannels, setSelectedChannels] = useState(new Set(ALL_CHANNELS));
  const [selectedTeam, setSelectedTeam] = useState("전체");
  const [showChannelFilter, setShowChannelFilter] = useState(false);

  // Derive all teams (from both teamData and channelData)
  const ALL_TEAMS = useMemo(() => {
    const teams = new Set();
    Object.keys(teamData).forEach(t => teams.add(t));
    ALL_CHANNELS.forEach(ch => teams.add(channelData[ch].team));
    return ["전체", ...Array.from(teams)];
  }, [ALL_CHANNELS, channelData, teamData]);

  // Stable team → color mapping (order won't change across months)
  const TEAM_COLOR_MAP = useMemo(() => {
    const map = {};
    ALL_TEAMS.forEach((t, i) => {
      if (t !== "전체") map[t] = TEAM_COLORS[(i - 1) % TEAM_COLORS.length];
    });
    return map;
  }, [ALL_TEAMS]);

  // Channels filtered by selected team
  const filteredChannels = useMemo(() => {
    if (selectedTeam === "전체") return ALL_CHANNELS;
    return ALL_CHANNELS.filter(ch => channelData[ch].team === selectedTeam);
  }, [selectedTeam, ALL_CHANNELS, channelData]);

  // Keep selectedChannels in sync when channels change
  const prevChannelsRef = useRef(ALL_CHANNELS);
  if (prevChannelsRef.current !== ALL_CHANNELS && JSON.stringify(prevChannelsRef.current) !== JSON.stringify(ALL_CHANNELS)) {
    prevChannelsRef.current = ALL_CHANNELS;
    setSelectedChannels(new Set(ALL_CHANNELS));
  }

  // When team filter changes, auto-select all channels of that team
  const prevTeamRef = useRef(selectedTeam);
  if (prevTeamRef.current !== selectedTeam) {
    prevTeamRef.current = selectedTeam;
    setSelectedChannels(new Set(selectedTeam === "전체" ? ALL_CHANNELS : filteredChannels));
  }

  const toggleChannel = (ch) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(ch)) next.delete(ch);
      else next.add(ch);
      return next;
    });
  };

  const selectAllFiltered = () => setSelectedChannels(new Set(filteredChannels));
  const deselectAllFiltered = () => {
    setSelectedChannels(prev => {
      const next = new Set(prev);
      filteredChannels.forEach(ch => next.delete(ch));
      return next;
    });
  };

  // ─ Derived data ─
  // Global month → KPI only
  const isYearly = globalMonth === "전체";
  const monthIndex = isYearly ? -1 : MONTHS.indexOf(globalMonth);

  // Per-chart month states
  const [teamPoolMonth, setTeamPoolMonth] = useState("1월");
  const [teamCostMonth, setTeamCostMonth] = useState("1월");
  const [costMonth, setCostMonth] = useState("1월");
  const [tableMonth, setTableMonth] = useState("1월");
  const [tableTeam, setTableTeam] = useState("전체");
  const [channelPoolMonth, setChannelPoolMonth] = useState("1월");

  // Helper: get channel data for a specific month (or yearly)
  const getChannelMonthBy = (ch, m) => {
    if (m === "전체") {
      const all = channelData[ch].monthly;
      const sum매출 = all.reduce((s, d) => s + d.매출, 0);
      const sum매출원가 = all.reduce((s, d) => s + d.매출원가, 0);
      const sum운반비 = all.reduce((s, d) => s + d.운반비, 0);
      const sum지급수수료 = all.reduce((s, d) => s + d.지급수수료, 0);
      const sum광고선전비 = all.reduce((s, d) => s + d.광고선전비, 0);
      const sum판매촉진비 = all.reduce((s, d) => s + d.판매촉진비, 0);
      const sum한계이익 = all.reduce((s, d) => s + d.한계이익, 0);
      return {
        매출: sum매출, 매출원가: sum매출원가, 운반비: sum운반비,
        지급수수료: sum지급수수료, 광고선전비: sum광고선전비, 판매촉진비: sum판매촉진비,
        한계이익: sum한계이익, 한계이익률: sum매출 > 0 ? (sum한계이익 / sum매출) * 100 : 0,
      };
    }
    return channelData[ch].monthly[MONTHS.indexOf(m)];
  };

  // Helper: get team data for a specific month (or yearly)
  const getTeamMonthBy = (team, m) => {
    const t = teamData[team];
    if (!t) return { 매출: 0, 매출원가: 0, 변동비: 0, 운반비: 0, 지급수수료: 0, 광고선전비: 0, 판매촉진비: 0, 한계이익: 0 };
    if (m === "전체") {
      const all = t.monthly;
      const sum = (k) => all.reduce((s, d) => s + (d[k] || 0), 0);
      return {
        매출: sum("매출"), 매출원가: sum("매출원가"), 변동비: sum("변동비"),
        운반비: sum("운반비"), 지급수수료: sum("지급수수료"), 광고선전비: sum("광고선전비"),
        판매촉진비: sum("판매촉진비"), 한계이익: sum("한계이익"),
      };
    }
    return t.monthly[MONTHS.indexOf(m)] || { 매출: 0, 매출원가: 0, 변동비: 0, 운반비: 0, 지급수수료: 0, 광고선전비: 0, 판매촉진비: 0, 한계이익: 0 };
  };

  const ALL_TEAM_NAMES = useMemo(() => Object.keys(teamData), [teamData]);

  // Company row for KPI (uses globalMonth)
  const companyRow = useMemo(() => {
    if (isYearly) {
      const all = companyMonthly;
      const sum매출 = all.reduce((s, d) => s + d.매출, 0);
      const sum매출원가 = all.reduce((s, d) => s + d.매출원가, 0);
      const sum변동비 = all.reduce((s, d) => s + d.변동비, 0);
      const sum고정비 = all.reduce((s, d) => s + d.고정비, 0);
      const sum영업이익 = all.reduce((s, d) => s + d.영업이익, 0);
      return {
        매출: sum매출, 매출원가: sum매출원가, 변동비: sum변동비, 고정비: sum고정비,
        영업이익: sum영업이익, 영업이익률: sum매출 > 0 ? (sum영업이익 / sum매출) * 100 : 0,
      };
    }
    return companyMonthly[monthIndex] || companyMonthly[0];
  }, [isYearly, monthIndex, companyMonthly]);

  const prevCompanyRow = (!isYearly && monthIndex > 0) ? companyMonthly[monthIndex - 1] : null;

  const momChange = (curr, prev) => {
    if (!prev || prev === 0 || curr === 0) return null;
    return ((curr - prev) / Math.abs(prev)) * 100;
  };

  // Section 2: Cost comparison (uses costMonth), sorted by revenue desc
  const costComparisonData = useMemo(() => {
    return ALL_CHANNELS.filter((ch) => selectedChannels.has(ch)).map((ch) => {
      const d = getChannelMonthBy(ch, costMonth);
      const rev = d.매출 || 1;
      return {
        channel: ch.length > 10 ? ch.slice(0, 10) + "…" : ch,
        channelFull: ch,
        매출원가: d.매출원가,
        운반비: d.운반비,
        지급수수료: d.지급수수료,
        광고선전비: d.광고선전비,
        판매촉진비: d.판매촉진비,
        매출: d.매출,
        한계이익률: d.한계이익률,
        매출원가율: d.매출 > 0 ? ((d.매출원가 / rev) * 100) : 0,
        운반비율: d.매출 > 0 ? ((d.운반비 / rev) * 100) : 0,
        지급수수료율: d.매출 > 0 ? ((d.지급수수료 / rev) * 100) : 0,
        광고선전비율: d.매출 > 0 ? ((d.광고선전비 / rev) * 100) : 0,
        판매촉진비율: d.매출 > 0 ? ((d.판매촉진비 / rev) * 100) : 0,
      };
    }).sort((a, b) => b.매출 - a.매출);
  }, [selectedChannels, costMonth, channelData, ALL_CHANNELS]);

  // Section 1.75: Team cost comparison (uses teamCostMonth), sorted by revenue desc
  const teamCostData = useMemo(() => {
    return ALL_TEAM_NAMES.map(team => {
      const d = getTeamMonthBy(team, teamCostMonth);
      const rev = d.매출 || 1;
      return {
        channel: team.length > 10 ? team.slice(0, 10) + "…" : team,
        channelFull: team,
        매출원가: d.매출원가, 운반비: d.운반비, 지급수수료: d.지급수수료,
        광고선전비: d.광고선전비, 판매촉진비: d.판매촉진비, 매출: d.매출,
        매출원가율: d.매출 > 0 ? ((d.매출원가 / rev) * 100) : 0,
        운반비율: d.매출 > 0 ? ((d.운반비 / rev) * 100) : 0,
        지급수수료율: d.매출 > 0 ? ((d.지급수수료 / rev) * 100) : 0,
        광고선전비율: d.매출 > 0 ? ((d.광고선전비 / rev) * 100) : 0,
        판매촉진비율: d.매출 > 0 ? ((d.판매촉진비 / rev) * 100) : 0,
      };
    }).filter(t => t.매출 > 0).sort((a, b) => b.매출 - a.매출);
  }, [teamCostMonth, teamData, ALL_TEAM_NAMES]);

  // Section 1.5: Team Profit Pool (uses teamPoolMonth)
  const teamProfitPoolData = useMemo(() => {
    const teams = ALL_TEAM_NAMES.map(team => {
      const d = getTeamMonthBy(team, teamPoolMonth);
      return { team, 매출: d.매출, 한계이익: d.한계이익 };
    }).filter(t => t.매출 > 0).sort((a, b) => b.매출 - a.매출);

    const totalRevenue = teams.reduce((s, t) => s + t.매출, 0);
    if (totalRevenue === 0) return [];

    let cumX = 0;
    return teams.map((t, i) => {
      const shareWidth = (t.매출 / totalRevenue) * 100;
      const margin = t.매출 > 0 ? (t.한계이익 / t.매출) * 100 : 0;
      const item = {
        team: t.team, 매출: t.매출, 한계이익: t.한계이익,
        영업이익률: margin, shareWidth, x: cumX,
        color: TEAM_COLOR_MAP[t.team] || TEAM_COLORS[i % TEAM_COLORS.length],
      };
      cumX += shareWidth;
      return item;
    });
  }, [teamPoolMonth, teamData, ALL_TEAM_NAMES]);

  // Section 3: Table top 10 (uses tableMonth)
  const top10TableChannels = useMemo(() => {
    return ALL_CHANNELS
      .map(ch => ({ ch, 매출: getChannelMonthBy(ch, tableMonth).매출 }))
      .sort((a, b) => b.매출 - a.매출)
      .slice(0, 10)
      .map(item => item.ch);
  }, [tableMonth, channelData, ALL_CHANNELS]);

  // Section 3: Table channels filtered by team, sorted by revenue desc
  const tableChannels = useMemo(() => {
    const pool = tableTeam === "전체" ? ALL_CHANNELS : ALL_CHANNELS.filter(ch => channelData[ch].team === tableTeam);
    return pool
      .map(ch => ({ ch, 매출: getChannelMonthBy(ch, tableMonth).매출 }))
      .sort((a, b) => b.매출 - a.매출)
      .map(item => item.ch);
  }, [tableTeam, tableMonth, channelData, ALL_CHANNELS]);

  // Section 4: Channel Profit Pool (uses channelPoolMonth) — top 10 + 그 외
  const channelProfitPoolData = useMemo(() => {
    const allSorted = ALL_CHANNELS
      .map(ch => {
        const d = getChannelMonthBy(ch, channelPoolMonth);
        return { ch, 매출: d.매출, 한계이익: d.한계이익 };
      })
      .filter(t => t.매출 > 0)
      .sort((a, b) => b.매출 - a.매출);

    const top10 = allSorted.slice(0, 10);
    const rest = allSorted.slice(10);

    // Build entries: top10 as individual + "그 외" aggregated
    const entries = top10.map(t => ({ team: t.ch, 매출: t.매출, 한계이익: t.한계이익 }));
    if (rest.length > 0) {
      const rest매출 = rest.reduce((s, t) => s + t.매출, 0);
      const rest한계이익 = rest.reduce((s, t) => s + t.한계이익, 0);
      if (rest매출 > 0) {
        entries.push({ team: "그 외", 매출: rest매출, 한계이익: rest한계이익 });
      }
    }

    // Sort by revenue descending (biggest left)
    entries.sort((a, b) => b.매출 - a.매출);

    const totalRevenue = entries.reduce((s, t) => s + t.매출, 0);
    if (totalRevenue === 0) return [];

    let cumX = 0;
    return entries.map((t, i) => {
      const shareWidth = (t.매출 / totalRevenue) * 100;
      const margin = t.매출 > 0 ? (t.한계이익 / t.매출) * 100 : 0;
      const item = {
        team: t.team,
        매출: t.매출,
        한계이익: t.한계이익,
        영업이익률: margin,
        shareWidth,
        x: cumX,
        color: t.team === "그 외" ? "#8b95a1" : CHANNEL_COLORS_LIST[i % CHANNEL_COLORS_LIST.length],
      };
      cumX += shareWidth;
      return item;
    });
  }, [channelPoolMonth, channelData, ALL_CHANNELS]);

  const filterLabel = isYearly ? "연간 누계" : `${globalMonth} 기준`;

  if (storageLoading) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{
          background: `linear-gradient(180deg, ${PALETTE.surface} 0%, #fff 100%)`,
          fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div className="text-center">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
            style={{ background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.primaryLight})` }}
          >
            <BarChart3 size={20} color="#fff" />
          </div>
          <p className="text-sm font-semibold" style={{ color: PALETTE.text }}>대시보드 로딩 중...</p>
          <p className="text-xs mt-1" style={{ color: PALETTE.textSec }}>Google Sheets에서 데이터를 불러오고 있습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex"
      style={{
        background: `linear-gradient(180deg, ${PALETTE.surface} 0%, #fff 100%)`,
        fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        .recharts-cartesian-grid-horizontal line,
        .recharts-cartesian-grid-vertical line { stroke: ${PALETTE.border}; stroke-dasharray: 3 3; }
        .recharts-text { font-family: 'Pretendard', sans-serif !important; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: ${PALETTE.border}; border-radius: 4px; }
      `}</style>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onDataLoaded={handleDataLoaded}
        uploadLogs={uploadLogs}
      />

      {/* ── Sidebar ── */}
      <aside
        className="flex-shrink-0 sticky top-0 h-screen flex flex-col"
        style={{
          width: 220,
          background: PALETTE.white,
          borderRight: `1px solid ${PALETTE.border}`,
          zIndex: 20,
        }}
      >
        {/* Logo area */}
        <div className="px-5 py-5" style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.primaryLight})` }}
            >
              <BarChart3 size={16} color="#fff" />
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-tight" style={{ color: PALETTE.primary }}>2026</p>
              <p className="text-xs font-medium" style={{ color: PALETTE.textSec, marginTop: -2 }}>실적 대시보드</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {[
            { key: "overview", label: "Overview", icon: LayoutDashboard },
            { key: "team", label: "팀별 분석", icon: Users },
            { key: "channel", label: "채널별 분석", icon: Store },
          ].map(({ key, label, icon: Icon }) => {
            const active = navSection === key;
            return (
              <button
                key={key}
                onClick={() => setNavSection(key)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: active ? `${PALETTE.primary}0d` : "transparent",
                  color: active ? PALETTE.primary : PALETTE.textSec,
                  fontWeight: active ? 700 : 500,
                }}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                {label}
                {active && (
                  <div
                    className="ml-auto w-1.5 h-5 rounded-full"
                    style={{ background: `linear-gradient(180deg, ${PALETTE.accent3}, ${PALETTE.accent4})` }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Upload button at bottom */}
        <div className="px-3 py-4" style={{ borderTop: `1px solid ${PALETTE.border}` }}>
          <button
            onClick={() => setShowUpload(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
            style={{
              background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.primaryLight})`,
              color: "#fff",
              boxShadow: "0 2px 8px rgba(45,62,71,0.2)",
            }}
          >
            <Upload size={14} strokeWidth={2.2} />
            데이터 업로드
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ── Page Title ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: PALETTE.primary }}>
            {navSection === "overview" ? "Overview" : navSection === "team" ? "팀별 분석" : "채널별 분석"}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: PALETTE.textSec }}>
            {navSection === "overview" ? "전사 실적 현황" : navSection === "team" ? "팀별 손익 및 비용 구조" : "채널별 손익 및 비용 구조"}
          </p>
        </div>

        {/* ══════ OVERVIEW ══════ */}
        {navSection === "overview" && (<>

        {/* ── Global Month Filter ── */}
        <div
          className="mb-6 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
          style={{ background: PALETTE.white, border: `1px solid ${PALETTE.border}` }}
        >
          <div className="flex items-center gap-2 flex-shrink-0">
            <Filter size={14} color={PALETTE.primary} />
            <span className="text-xs font-bold" style={{ color: PALETTE.primary }}>기간 선택</span>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
            <FilterPill label="전체" active={globalMonth === "전체"} onClick={() => setGlobalMonth("전체")} />
            {MONTHS.map((m) => (
              <FilterPill key={m} label={m} active={globalMonth === m} onClick={() => setGlobalMonth(m)} />
            ))}
          </div>
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <KPICard icon={DollarSign} label="전사 매출" value={fmt(companyRow.매출)} sub={filterLabel} accent change={momChange(companyRow.매출, prevCompanyRow?.매출)} />
          <KPICard icon={TrendingUp} label="영업이익" value={fmt(companyRow.영업이익)} sub={`이익률 ${companyRow.영업이익률?.toFixed?.(1) ?? companyRow.영업이익률}%`} change={momChange(companyRow.영업이익, prevCompanyRow?.영업이익)} />
          <KPICard icon={BarChart3} label="매출원가" value={fmt(companyRow.매출원가)} sub={`원가율 ${companyRow.매출 > 0 ? ((companyRow.매출원가 / companyRow.매출) * 100).toFixed(1) : 0}%`} change={momChange(companyRow.매출원가, prevCompanyRow?.매출원가)} />
          <KPICard icon={Globe} label="변동비 합계" value={fmt(companyRow.변동비)} sub={`매출 대비 ${companyRow.매출 > 0 ? ((companyRow.변동비 / companyRow.매출) * 100).toFixed(1) : 0}%`} change={momChange(companyRow.변동비, prevCompanyRow?.변동비)} />
        </div>

        {/* ══ SECTION 1: Company Revenue + OPM ══ */}
        <div
          className="rounded-2xl p-5 sm:p-6 mb-6"
          style={{ background: PALETTE.white, border: `1px solid ${PALETTE.border}` }}
        >
          <SectionHeader
            title="전사 월별 매출 & 영업이익률"
            subtitle="막대: 매출(억원) · 선: 영업이익률(%)"
          />
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <ComposedChart data={companyMonthly} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: PALETTE.textSec }} axisLine={false} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: PALETTE.textSec }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={fmtAxis}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: PALETTE.textSec }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 50]}
                  tickFormatter={(v) => v + "%"}
                />
                <Tooltip content={<CustomTooltip formatter={(name, val) => name.includes("영업이익률") ? fmtPct(val) : fmtBillion(val)} />} />
                <Legend
                  iconType="square"
                  iconSize={10}
                  wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="매출"
                  fill="#4682B4"
                  radius={[4, 4, 0, 0]}
                  name="매출"
                  barSize={36}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="영업이익률"
                  stroke={PALETTE.accent3}
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: PALETTE.accent3, strokeWidth: 2, stroke: "#fff" }}
                  name="영업이익률(%)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        </>)}

        {/* ══════ TEAM ══════ */}
        {navSection === "team" && (<>

        {/* ── 팀별 분석 Divider ── */}
        <div className="flex items-center gap-3 mb-6 mt-2">
          <div
            className="w-1.5 h-7 rounded-full"
            style={{ background: `linear-gradient(180deg, ${PALETTE.accent3}, ${PALETTE.accent4})` }}
          />
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: PALETTE.primary }}>
            팀별 분석
          </h2>
          <div className="flex-1 h-px" style={{ background: PALETTE.border }} />
        </div>

        {/* ══ SECTION 1.5: Team Profit Pool ══ */}
        <div
          className="rounded-2xl p-5 sm:p-6 mb-6"
          style={{ background: PALETTE.white, border: `1px solid ${PALETTE.border}` }}
        >
          <SectionHeader
            title="팀별 Profit Pool"
            subtitle="Y축: 한계이익(억원) · 너비: 매출 규모 · 레이블: 한계이익률"
          >
            <div className="flex gap-1 overflow-x-auto pb-1">
              <FilterPill label="전체" active={teamPoolMonth === "전체"} onClick={() => setTeamPoolMonth("전체")} />
              {MONTHS.map((m) => (
                <FilterPill key={m} label={m} active={teamPoolMonth === m} onClick={() => setTeamPoolMonth(m)} />
              ))}
            </div>
          </SectionHeader>
          {teamProfitPoolData.length > 0 ? (
            <ProfitPoolChart data={teamProfitPoolData} />
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm" style={{ color: PALETTE.textSec }}>해당 기간에 매출 데이터가 없습니다.</p>
            </div>
          )}
        </div>

        {/* ══ SECTION 1.75: Team Cost Structure ══ */}
        <div
          className="rounded-2xl p-5 sm:p-6 mb-6"
          style={{ background: PALETTE.white, border: `1px solid ${PALETTE.border}` }}
        >
          <SectionHeader
            title="팀별 비용 구조 비교"
          >
            <div className="flex gap-1 overflow-x-auto pb-1">
              <FilterPill label="전체" active={teamCostMonth === "전체"} onClick={() => setTeamCostMonth("전체")} />
              {MONTHS.map((m) => (
                <FilterPill key={m} label={m} active={teamCostMonth === m} onClick={() => setTeamCostMonth(m)} />
              ))}
            </div>
          </SectionHeader>

          {/* Cost legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            {COST_COMPONENTS.map((c) => (
              <div key={c} className="flex items-center gap-1.5 text-xs" style={{ color: PALETTE.textSec }}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COST_COLORS[c] }} />
                {c}
              </div>
            ))}
          </div>

          <div style={{ width: "100%", height: 400 }}>
            <ResponsiveContainer>
              <BarChart
                data={teamCostData}
                margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="channel"
                  tick={{ fontSize: 10, fill: PALETTE.textSec }}
                  axisLine={false}
                  tickLine={false}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: PALETTE.textSec }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={fmtAxis}
                />
                <Tooltip content={<CostTooltip />} />
                {COST_COMPONENTS.map((c) => (
                  <Bar
                    key={c}
                    dataKey={c}
                    stackId="cost"
                    fill={COST_COLORS[c]}
                    name={c}
                    radius={c === "판매촉진비" ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        </>)}

        {/* ══════ CHANNEL ══════ */}
        {navSection === "channel" && (<>

        {/* ── 채널별 분석 Divider ── */}
        <div className="flex items-center gap-3 mb-6 mt-2">
          <div
            className="w-1.5 h-7 rounded-full"
            style={{ background: `linear-gradient(180deg, ${PALETTE.accent1}, ${PALETTE.accent2})` }}
          />
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: PALETTE.primary }}>
            채널별 분석
          </h2>
          <div className="flex-1 h-px" style={{ background: PALETTE.border }} />
        </div>

        {/* ══ SECTION 4: Top 10 Channel Profit Pool ══ */}
        <div
          className="rounded-2xl p-5 sm:p-6 mb-6"
          style={{ background: PALETTE.white, border: `1px solid ${PALETTE.border}` }}
        >
          <SectionHeader
            title="매출 Top 10 채널 Profit Pool"
            subtitle="Y축: 한계이익(억원) · 너비: 매출 규모 · 레이블: 한계이익률"
          >
            <div className="flex gap-1 overflow-x-auto pb-1">
              <FilterPill label="전체" active={channelPoolMonth === "전체"} onClick={() => setChannelPoolMonth("전체")} />
              {MONTHS.map((m) => (
                <FilterPill key={m} label={m} active={channelPoolMonth === m} onClick={() => setChannelPoolMonth(m)} />
              ))}
            </div>
          </SectionHeader>
          {channelProfitPoolData.length > 0 ? (
            <ProfitPoolChart data={channelProfitPoolData} />
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm" style={{ color: PALETTE.textSec }}>해당 기간에 매출 데이터가 없습니다.</p>
            </div>
          )}
        </div>

        {/* ══ SECTION 2: Channel Cost Structure ══ */}
        <div
          className="rounded-2xl p-5 sm:p-6 mb-6"
          style={{ background: PALETTE.white, border: `1px solid ${PALETTE.border}` }}
        >
          <SectionHeader
            title="채널별 비용 구조 비교"
          >
            <div className="flex gap-1 overflow-x-auto pb-1">
              <FilterPill label="전체" active={costMonth === "전체"} onClick={() => setCostMonth("전체")} />
              {MONTHS.map((m) => (
                <FilterPill key={m} label={m} active={costMonth === m} onClick={() => setCostMonth(m)} />
              ))}
            </div>
            {/* Team & Channel Filter */}
            <div className="mt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                    style={{
                      background: PALETTE.surfaceAlt,
                      color: selectedTeam === "전체" ? PALETTE.textSec : PALETTE.primary,
                      border: `1px solid ${PALETTE.border}`,
                      outline: "none",
                    }}
                  >
                    {ALL_TEAMS.map(t => (
                      <option key={t} value={t}>{t === "전체" ? "팀 전체" : t}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} color={PALETTE.textSec} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  onClick={() => setShowChannelFilter(!showChannelFilter)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: PALETTE.surfaceAlt, color: PALETTE.textSec, border: `1px solid ${PALETTE.border}` }}
                >
                  <Filter size={13} />
                  채널 선택 ({filteredChannels.filter(ch => selectedChannels.has(ch)).length}/{filteredChannels.length})
                  {showChannelFilter ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>
              {showChannelFilter && (
                <div
                  className="mt-2 rounded-xl p-3"
                  style={{ background: PALETTE.surfaceAlt, border: `1px solid ${PALETTE.border}` }}
                >
                  <div className="flex gap-2 mb-2 pb-2" style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
                    <button
                      onClick={selectAllFiltered}
                      className="px-2.5 py-1 rounded-md text-xs font-medium"
                      style={{ background: PALETTE.primary, color: "#fff" }}
                    >
                      전체 선택
                    </button>
                    <button
                      onClick={deselectAllFiltered}
                      className="px-2.5 py-1 rounded-md text-xs font-medium"
                      style={{ background: PALETTE.white, color: PALETTE.textSec, border: `1px solid ${PALETTE.border}` }}
                    >
                      전체 해제
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
                    {filteredChannels.map((ch) => (
                      <label
                        key={ch}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-xs"
                        style={{ background: selectedChannels.has(ch) ? `${CHANNEL_COLORS[ch]}12` : "transparent" }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedChannels.has(ch)}
                          onChange={() => toggleChannel(ch)}
                          className="rounded"
                          style={{ accentColor: CHANNEL_COLORS[ch] || PALETTE.accent1, width: 14, height: 14 }}
                        />
                        <span className="truncate font-medium" style={{ color: selectedChannels.has(ch) ? PALETTE.text : PALETTE.textSec }}>
                          {ch}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionHeader>

          {/* Cost legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            {COST_COMPONENTS.map((c) => (
              <div key={c} className="flex items-center gap-1.5 text-xs" style={{ color: PALETTE.textSec }}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COST_COLORS[c] }} />
                {c}
              </div>
            ))}
          </div>

          <div style={{ width: "100%", height: 400 }}>
            <ResponsiveContainer>
              <BarChart
                data={costComparisonData}
                margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="channel"
                  tick={{ fontSize: 10, fill: PALETTE.textSec }}
                  axisLine={false}
                  tickLine={false}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: PALETTE.textSec }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={fmtAxis}
                />
                <Tooltip content={<CostTooltip />} />
                {COST_COMPONENTS.map((c) => (
                  <Bar
                    key={c}
                    dataKey={c}
                    stackId="cost"
                    fill={COST_COLORS[c]}
                    name={c}
                    radius={c === "판매촉진비" ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ══ SECTION 3: Channel Summary Table ══ */}
        <div
          className="rounded-2xl p-5 sm:p-6 mb-6"
          style={{ background: PALETTE.white, border: `1px solid ${PALETTE.border}` }}
        >
          <SectionHeader
            title="채널별 실적 요약"
          >
            <div className="flex gap-1 overflow-x-auto pb-1">
              <FilterPill label="전체" active={tableMonth === "전체"} onClick={() => setTableMonth("전체")} />
              {MONTHS.map((m) => (
                <FilterPill key={m} label={m} active={tableMonth === m} onClick={() => setTableMonth(m)} />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="relative">
                <select
                  value={tableTeam}
                  onChange={(e) => setTableTeam(e.target.value)}
                  className="appearance-none pl-3 pr-7 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                  style={{
                    background: PALETTE.surfaceAlt,
                    color: tableTeam === "전체" ? PALETTE.textSec : PALETTE.primary,
                    border: `1px solid ${PALETTE.border}`,
                    outline: "none",
                  }}
                >
                  {ALL_TEAMS.map(t => (
                    <option key={t} value={t}>{t === "전체" ? "팀 전체" : t}</option>
                  ))}
                </select>
                <ChevronDown size={12} color={PALETTE.textSec} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </SectionHeader>
          <div className="overflow-x-auto" style={{ maxHeight: 480, overflowY: "auto" }}>
            <table className="w-full text-xs sm:text-sm">
              <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <tr style={{ borderBottom: `2px solid ${PALETTE.primary}`, background: PALETTE.white }}>
                  {["순위", "채널", "소속팀", "매출", "매출원가", "변동비 합계", "한계이익", "한계이익률"].map((h) => (
                    <th key={h} className="py-3 px-2 text-left font-semibold whitespace-nowrap" style={{ color: PALETTE.primary }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableChannels.map((ch, i) => {
                  const d = getChannelMonthBy(ch, tableMonth);
                  const totalCost = d.운반비 + d.지급수수료 + d.광고선전비 + d.판매촉진비;
                  return (
                    <tr
                      key={ch}
                      className="transition-colors"
                      style={{
                        borderBottom: `1px solid ${PALETTE.border}`,
                        background: i % 2 === 0 ? "transparent" : PALETTE.surface,
                      }}
                    >
                      <td className="py-3 px-2 font-bold whitespace-nowrap" style={{ color: PALETTE.textSec }}>{i + 1}</td>
                      <td className="py-3 px-2 font-semibold whitespace-nowrap" style={{ color: PALETTE.text }}>
                        <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: CHANNEL_COLORS[ch] || PALETTE.accent1 }} />
                        {ch}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap" style={{ color: PALETTE.textSec }}>{channelData[ch].team}</td>
                      <td className="py-3 px-2 font-medium whitespace-nowrap" style={{ color: PALETTE.text }}>{fmt(d.매출)}</td>
                      <td className="py-3 px-2 whitespace-nowrap" style={{ color: PALETTE.textSec }}>{fmt(d.매출원가)}</td>
                      <td className="py-3 px-2 whitespace-nowrap" style={{ color: PALETTE.textSec }}>{fmt(totalCost)}</td>
                      <td className="py-3 px-2 font-medium whitespace-nowrap" style={{ color: d.한계이익 > 0 ? "#16825d" : PALETTE.accent4 }}>
                        {fmt(d.한계이익)}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{
                            background: d.한계이익률 >= 40 ? "#e8f5ee" : d.한계이익률 >= 20 ? "#fef9ec" : "#fef0ef",
                            color: d.한계이익률 >= 40 ? "#16825d" : d.한계이익률 >= 20 ? "#b87b00" : PALETTE.accent4,
                          }}
                        >
                          {d.한계이익률 !== 0 ? Number(d.한계이익률).toFixed(1) + "%" : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        </>)}

        </div>
      </main>
    </div>
  );
}
