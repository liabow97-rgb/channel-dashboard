import { useState, useMemo, useRef, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ComposedChart, ResponsiveContainer, Cell,
  Area, Scatter, LabelList
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, BarChart3,
  Filter, ChevronDown, ChevronUp, Building2, Globe,
  Upload, FileSpreadsheet, X, Check, AlertCircle, File, Trash2
} from "lucide-react";

// ── Data ──────────────────────────────────────────────
const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

const defaultCompanyMonthly = [
  { month: "1월", 매출: 21877166965, 매출원가: 6995028423, 변동비: 7752646959, 고정비: 1812144354, 영업이익: 5317347229, 영업이익률: 24.3 },
  { month: "2월", 매출: 0, 매출원가: 0, 변동비: 0, 고정비: 0, 영업이익: 0, 영업이익률: 0 },
  { month: "3월", 매출: 0, 매출원가: 0, 변동비: 0, 고정비: 0, 영업이익: 0, 영업이익률: 0 },
  { month: "4월", 매출: 0, 매출원가: 0, 변동비: 0, 고정비: 0, 영업이익: 0, 영업이익률: 0 },
  { month: "5월", 매출: 0, 매출원가: 0, 변동비: 0, 고정비: 0, 영업이익: 0, 영업이익률: 0 },
  { month: "6월", 매출: 0, 매출원가: 0, 변동비: 0, 고정비: 0, 영업이익: 0, 영업이익률: 0 },
  { month: "7월", 매출: 0, 매출원가: 0, 변동비: 0, 고정비: 0, 영업이익: 0, 영업이익률: 0 },
  { month: "8월", 매출: 0, 매출원가: 0, 변동비: 0, 고정비: 0, 영업이익: 0, 영업이익률: 0 },
  { month: "9월", 매출: 0, 매출원가: 0, 변동비: 0, 고정비: 0, 영업이익: 0, 영업이익률: 0 },
  { month: "10월", 매출: 0, 매출원가: 0, 변동비: 0, 고정비: 0, 영업이익: 0, 영업이익률: 0 },
  { month: "11월", 매출: 0, 매출원가: 0, 변동비: 0, 고정비: 0, 영업이익: 0, 영업이익률: 0 },
  { month: "12월", 매출: 0, 매출원가: 0, 변동비: 0, 고정비: 0, 영업이익: 0, 영업이익률: 0 },
];

const defaultChannelData = {
  "올리브영": {
    team: "브랜드영업1팀", type: "국내",
    monthly: MONTHS.map((m, i) => ({
      month: m,
      매출: i === 0 ? 6086784035 : 0,
      매출원가: i === 0 ? 2288647549 : 0,
      운반비: i === 0 ? 413030212 : 0,
      지급수수료: i === 0 ? 520854045 : 0,
      광고선전비: i === 0 ? 85842510 : 0,
      판매촉진비: i === 0 ? 85784459 : 0,
      한계이익: i === 0 ? 2692625260 : 0,
      한계이익률: i === 0 ? 44.2 : 0,
    }))
  },
  "중화권_티몰/도우인콰징": {
    team: "해외사업3팀", type: "해외",
    monthly: MONTHS.map((m, i) => ({
      month: m,
      매출: i === 0 ? 1879266617 : 0,
      매출원가: i === 0 ? 290195571 : 0,
      운반비: i === 0 ? 30636587 : 0,
      지급수수료: i === 0 ? 881596589 : 0,
      광고선전비: i === 0 ? 462210773 : 0,
      판매촉진비: i === 0 ? 91000 : 0,
      한계이익: i === 0 ? 214536097 : 0,
      한계이익률: i === 0 ? 11.4 : 0,
    }))
  },
  "[B2B] 코스트코_미주": {
    team: "해외사업2팀", type: "해외",
    monthly: MONTHS.map((m, i) => ({
      month: m,
      매출: i === 0 ? 1788292800 : 0,
      매출원가: i === 0 ? 624265132 : 0,
      운반비: i === 0 ? 0 : 0,
      지급수수료: i === 0 ? 2200000 : 0,
      광고선전비: i === 0 ? 0 : 0,
      판매촉진비: i === 0 ? 53792424 : 0,
      한계이익: i === 0 ? 1108035244 : 0,
      한계이익률: i === 0 ? 62.0 : 0,
    }))
  },
  "일본_마루망(4팀)": {
    team: "해외사업4팀", type: "해외",
    monthly: MONTHS.map((m, i) => ({
      month: m,
      매출: i === 0 ? 1330998500 : 0,
      매출원가: i === 0 ? 678006693 : 0,
      운반비: i === 0 ? 13246540 : 0,
      지급수수료: i === 0 ? 575000 : 0,
      광고선전비: i === 0 ? 0 : 0,
      판매촉진비: i === 0 ? 1468526 : 0,
      한계이익: i === 0 ? 637701741 : 0,
      한계이익률: i === 0 ? 47.9 : 0,
    }))
  },
  "아마존": {
    team: "해외사업2팀", type: "해외",
    monthly: MONTHS.map((m, i) => ({
      month: m,
      매출: i === 0 ? 1138213701 : 0,
      매출원가: i === 0 ? 89247616 : 0,
      운반비: i === 0 ? 21461534 : 0,
      지급수수료: i === 0 ? 463696893 : 0,
      광고선전비: i === 0 ? 52232545 : 0,
      판매촉진비: i === 0 ? 28389303 : 0,
      한계이익: i === 0 ? 483185810 : 0,
      한계이익률: i === 0 ? 42.5 : 0,
    }))
  },
};

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

// ── Helpers ───────────────────────────────────────────
const fmt = (v) => {
  if (v === 0 || v === null || v === undefined) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e8) return (v / 1e8).toFixed(1) + "억";
  if (abs >= 1e4) return (v / 1e4).toFixed(0) + "만";
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

// ── CSV Parser for 팀별_채널_실적 format ─────────────
const parseNum = (s) => {
  if (!s || s === "0" || s.trim() === "") return 0;
  const str = String(s).trim();
  const isNeg = str.startsWith("(") && str.endsWith(")");
  const cleaned = str.replace(/[(),"%﻿]/g, "").replace(/,/g, "").trim();
  const n = parseFloat(cleaned);
  if (isNaN(n)) return 0;
  return isNeg ? -n : n;
};

const parsePctVal = (s) => {
  if (!s || s.trim() === "" || s === "0") return 0;
  const str = String(s).trim();
  const isNeg = str.startsWith("(") && str.endsWith(")");
  const cleaned = str.replace(/[(),"%﻿]/g, "").replace(/,/g, "").trim();
  const n = parseFloat(cleaned);
  if (isNaN(n)) return 0;
  return isNeg ? -n : n;
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

const parseUploadCSV = (text) => {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  // Find header row (팀,채널,항목,...)
  let headerIdx = -1;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    if (lines[i].includes("팀") && lines[i].includes("채널") && lines[i].includes("항목")) {
      headerIdx = i; break;
    }
  }
  if (headerIdx < 0) return null;

  const dataLines = lines.slice(headerIdx + 1);

  // Parse all rows
  const rows = [];
  for (const line of dataLines) {
    if (!line.trim()) continue;
    const cols = splitCSVLine(line);
    if (cols.length < 16) continue;
    rows.push({
      팀: cols[0] || "",
      채널: cols[1] || "",
      항목: cols[2] || "",
      누계: cols[3] || "",
      months: cols.slice(4, 16), // 1월~12월
    });
  }

  // ── Extract 전사 합계 (company data) ──
  const companyItems = {};
  const COMPANY_MAP = {
    "전사매출합계": "매출",
    "매출원가": "매출원가",
    "전사변동비합계": "변동비",
    "전사고정비합계": "고정비",
    "전사영업이익": "영업이익",
    "영업이익률": "영업이익률",
  };
  let inCompany = false;
  for (const r of rows) {
    if (r.팀 === "전사 합계") { inCompany = true; }
    if (inCompany) {
      if (COMPANY_MAP[r.항목]) {
        companyItems[COMPANY_MAP[r.항목]] = r.months;
      }
      // Company section ends when we hit 영업이익률
      if (r.항목 === "영업이익률") { inCompany = false; }
    }
  }

  // ── Extract channel data ──
  // A channel block starts with row where 팀 is non-empty AND 채널 is non-empty
  // AND 채널 is NOT "공통"/"전사 공통"/"해외 공통"/"국내 공통"
  // AND 항목 is "매출"
  // Subsequent rows with empty 팀 and empty 채널 belong to that channel
  const SKIP_CHANNELS = new Set(["공통", "전사 공통", "해외 공통", "국내 공통"]);
  const SKIP_TEAMS = new Set(["전사 합계", "해외 전체", "국내 전체"]);
  const CHANNEL_ITEMS = new Set(["매출", "매출원가", "운반비", "지급수수료", "광고선전비", "판매촉진비", "한계이익", "한계이익률"]);

  const channels = {};
  let curTeam = "";
  let curChannel = "";

  for (const r of rows) {
    // Detect new channel block
    if (r.팀 && r.채널 && !SKIP_CHANNELS.has(r.채널) && r.항목 === "매출") {
      // Skip team subtotals (e.g. "해외사업1팀 소계")
      if (r.팀.includes("소계") || SKIP_TEAMS.has(r.팀)) {
        curChannel = "";
        continue;
      }
      curTeam = r.팀;
      curChannel = r.채널;
      if (!channels[curChannel]) {
        channels[curChannel] = { team: curTeam, items: {} };
      }
      channels[curChannel].items["매출"] = r.months;
      continue;
    }

    // Continuation rows (empty 팀 and 채널)
    if (curChannel && r.팀 === "" && r.채널 === "" && CHANNEL_ITEMS.has(r.항목)) {
      channels[curChannel].items[r.항목] = r.months;
      // End of block after 한계이익률
      if (r.항목 === "한계이익률") { curChannel = ""; }
      continue;
    }

    // If we hit a row with non-empty 팀 but no 채널, it's a subtotal/section header — reset
    if (r.팀 && !r.채널) {
      curChannel = "";
    }
    // If we hit a "공통" row, reset channel
    if (SKIP_CHANNELS.has(r.채널)) {
      curChannel = "";
    }
  }

  // Build result
  const companyMonthly = MONTHS.map((m, i) => ({
    month: m,
    매출: parseNum(companyItems["매출"]?.[i]),
    매출원가: parseNum(companyItems["매출원가"]?.[i]),
    변동비: parseNum(companyItems["변동비"]?.[i]),
    고정비: parseNum(companyItems["고정비"]?.[i]),
    영업이익: parseNum(companyItems["영업이익"]?.[i]),
    영업이익률: parsePctVal(companyItems["영업이익률"]?.[i]),
  }));

  const channelData = {};
  for (const [chName, chInfo] of Object.entries(channels)) {
    if (!chInfo.items["매출"]) continue;
    channelData[chName] = {
      team: chInfo.team,
      type: chInfo.team.includes("해외") ? "해외" : "국내",
      monthly: MONTHS.map((m, i) => ({
        month: m,
        매출: parseNum(chInfo.items["매출"]?.[i]),
        매출원가: parseNum(chInfo.items["매출원가"]?.[i]),
        운반비: parseNum(chInfo.items["운반비"]?.[i]),
        지급수수료: parseNum(chInfo.items["지급수수료"]?.[i]),
        광고선전비: parseNum(chInfo.items["광고선전비"]?.[i]),
        판매촉진비: parseNum(chInfo.items["판매촉진비"]?.[i]),
        한계이익: parseNum(chInfo.items["한계이익"]?.[i]),
        한계이익률: parsePctVal(chInfo.items["한계이익률"]?.[i]),
      })),
    };
  }

  const channelCount = Object.keys(channelData).length;
  return { companyMonthly, channelData, channelCount };
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
  <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 gap-2">
    <div>
      <h2 className="text-lg font-bold tracking-tight" style={{ color: PALETTE.text }}>{title}</h2>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: PALETTE.textSec }}>{subtitle}</p>}
    </div>
    {children}
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
const UploadModal = ({ isOpen, onClose, onDataLoaded }) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [parseStatus, setParseStatus] = useState(null); // null | 'parsing' | 'success' | 'error'
  const [parseMessage, setParseMessage] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const fileInputRef = useRef(null);

  const resetState = () => {
    setUploadedFiles([]);
    setParseStatus(null);
    setParseMessage("");
    setPreviewData(null);
  };

  const handleFiles = useCallback((files) => {
    const file = files[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["csv", "tsv"].includes(ext)) {
      setParseStatus("error");
      setParseMessage("CSV 또는 TSV 파일만 업로드할 수 있습니다.");
      return;
    }

    setUploadedFiles([{ name: file.name, size: file.size, type: ext.toUpperCase() }]);
    setParseStatus("parsing");
    setParseMessage("파일을 분석하고 있습니다...");

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const result = parseUploadCSV(text);

        if (!result) {
          setParseStatus("error");
          setParseMessage("팀별 채널별 손익 실적 형식의 CSV가 아닙니다.\n헤더 행에 '팀, 채널, 항목' 컬럼이 필요합니다.");
          return;
        }

        const { companyMonthly: cm, channelData: cd, channelCount } = result;
        const hasCompany = cm.some(r => r.매출 !== 0);
        const hasChannel = channelCount > 0;

        if (!hasCompany && !hasChannel) {
          setParseStatus("error");
          setParseMessage("파일에서 유효한 데이터를 찾을 수 없습니다.");
          return;
        }

        // Build preview summary
        const previewChannels = Object.entries(cd).slice(0, 5).map(([name, info]) => {
          const janData = info.monthly[0];
          return { 채널: name, 팀: info.team, "1월 매출": janData.매출 };
        });

        setPreviewData({
          companyMonthly: cm,
          channelData: cd,
          channelCount,
          hasCompany,
          previewChannels,
        });
        setParseStatus("success");
        setParseMessage(
          `전사 데이터 ${hasCompany ? "✓" : "✗"} · 채널 ${channelCount}개 인식 완료`
        );
      } catch (err) {
        setParseStatus("error");
        setParseMessage("파일 파싱 중 오류가 발생했습니다: " + err.message);
      }
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleApply = () => {
    if (!previewData) return;
    if (previewData.hasCompany) {
      onDataLoaded({ type: "company", data: previewData.companyMonthly });
    }
    if (previewData.channelCount > 0) {
      onDataLoaded({ type: "channel", data: previewData.channelData });
    }
    onClose();
    resetState();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) { onClose(); resetState(); } }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: PALETTE.white,
          border: `1px solid ${PALETTE.border}`,
          animation: "modalIn 0.25s ease-out",
        }}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: translateY(12px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${PALETTE.border}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.primaryLight})` }}
            >
              <Upload size={16} color="#fff" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: PALETTE.text }}>데이터 업로드</h3>
              <p className="text-xs" style={{ color: PALETTE.textSec }}>CSV 파일로 대시보드 데이터를 갱신합니다</p>
            </div>
          </div>
          <button
            onClick={() => { onClose(); resetState(); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: PALETTE.surfaceAlt }}
          >
            <X size={15} color={PALETTE.textSec} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl p-8 text-center cursor-pointer transition-all duration-200"
            style={{
              border: `2px dashed ${dragOver ? PALETTE.accent1 : PALETTE.border}`,
              background: dragOver ? `${PALETTE.accent1}08` : PALETTE.surface,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: dragOver
                  ? `linear-gradient(135deg, ${PALETTE.accent1}, ${PALETTE.accent2})`
                  : PALETTE.surfaceAlt,
                transition: "all 0.2s",
              }}
            >
              <FileSpreadsheet
                size={24}
                color={dragOver ? "#fff" : PALETTE.textSec}
                strokeWidth={1.5}
              />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: PALETTE.text }}>
              파일을 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-xs" style={{ color: PALETTE.textSec }}>
              CSV, TSV 파일 지원 · UTF-8 인코딩
            </p>
          </div>

          {/* Uploaded File Info */}
          {uploadedFiles.length > 0 && (
            <div
              className="mt-4 rounded-xl p-4 flex items-center gap-3"
              style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.border}` }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: PALETTE.accent1 + "18" }}
              >
                <File size={18} color={PALETTE.accent1} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: PALETTE.text }}>
                  {uploadedFiles[0].name}
                </p>
                <p className="text-xs" style={{ color: PALETTE.textSec }}>
                  {uploadedFiles[0].type} · {fmtFileSize(uploadedFiles[0].size)}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); resetState(); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                style={{ background: PALETTE.surfaceAlt }}
              >
                <Trash2 size={14} color={PALETTE.accent4} />
              </button>
            </div>
          )}

          {/* Status Message */}
          {parseStatus && (
            <div
              className="mt-4 rounded-xl p-4 flex items-start gap-3"
              style={{
                background: parseStatus === "success" ? "#e8f5ee" : parseStatus === "error" ? "#fef0ef" : PALETTE.surface,
                border: `1px solid ${parseStatus === "success" ? "#b8dfc8" : parseStatus === "error" ? "#f5c6c2" : PALETTE.border}`,
              }}
            >
              {parseStatus === "parsing" && (
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5"
                  style={{
                    background: `linear-gradient(90deg, ${PALETTE.border} 25%, ${PALETTE.surfaceAlt} 50%, ${PALETTE.border} 75%)`,
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                  }}
                />
              )}
              {parseStatus === "success" && <Check size={18} color="#16825d" className="flex-shrink-0 mt-0.5" />}
              {parseStatus === "error" && <AlertCircle size={18} color={PALETTE.accent4} className="flex-shrink-0 mt-0.5" />}
              <p
                className="text-xs leading-relaxed whitespace-pre-wrap"
                style={{
                  color: parseStatus === "success" ? "#16825d" : parseStatus === "error" ? PALETTE.accent4 : PALETTE.textSec,
                }}
              >
                {parseMessage}
              </p>
            </div>
          )}

          {/* Preview Table */}
          {previewData && (
            <div className="mt-4">
              <p className="text-xs font-semibold mb-2" style={{ color: PALETTE.textSec }}>
                인식된 채널 미리보기 (상위 5개)
              </p>
              <div
                className="rounded-lg overflow-hidden"
                style={{ border: `1px solid ${PALETTE.border}` }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: PALETTE.surface }}>
                        {["채널", "소속팀", "1월 매출"].map(h => (
                          <th
                            key={h}
                            className="px-3 py-2 text-left font-semibold whitespace-nowrap"
                            style={{ color: PALETTE.primary, borderBottom: `1px solid ${PALETTE.border}` }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.previewChannels.map((row, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? PALETTE.white : PALETTE.surface }}>
                          <td className="px-3 py-2 whitespace-nowrap font-medium" style={{ color: PALETTE.text, borderBottom: `1px solid ${PALETTE.border}` }}>{row["채널"]}</td>
                          <td className="px-3 py-2 whitespace-nowrap" style={{ color: PALETTE.textSec, borderBottom: `1px solid ${PALETTE.border}` }}>{row["팀"]}</td>
                          <td className="px-3 py-2 whitespace-nowrap" style={{ color: PALETTE.text, borderBottom: `1px solid ${PALETTE.border}` }}>{fmt(row["1월 매출"])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {previewData.channelCount > 5 && (
                <p className="text-xs mt-1 text-right" style={{ color: PALETTE.textSec }}>
                  외 {previewData.channelCount - 5}개 채널 더...
                </p>
              )}
            </div>
          )}

          {/* Template Info */}
          <div
            className="mt-4 rounded-xl p-4"
            style={{ background: `${PALETTE.accent3}0a`, border: `1px solid ${PALETTE.accent3}30` }}
          >
            <p className="text-xs font-bold mb-2" style={{ color: PALETTE.accent3 }}>
              📋 파일 형식 안내
            </p>
            <div className="space-y-1.5">
              <p className="text-xs" style={{ color: PALETTE.text }}>
                <span className="font-semibold">팀별 채널별 손익 실적</span> 양식의 CSV 파일
              </p>
              <p className="text-xs font-mono px-2 py-1 rounded" style={{ background: PALETTE.surface, color: PALETTE.textSec }}>
                헤더: 팀, 채널, 항목, 누계, 1월, 2월, ..., 12월
              </p>
              <p className="text-xs" style={{ color: PALETTE.textSec }}>
                전사 합계 및 개별 채널의 매출·매출원가·운반비·지급수수료·광고선전비·판매촉진비·한계이익·한계이익률 항목을 자동 인식합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: `1px solid ${PALETTE.border}`, background: PALETTE.surface }}
        >
          <button
            onClick={() => { onClose(); resetState(); }}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={{ color: PALETTE.textSec, background: PALETTE.white, border: `1px solid ${PALETTE.border}` }}
          >
            취소
          </button>
          <button
            onClick={handleApply}
            disabled={parseStatus !== "success"}
            className="px-5 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: parseStatus === "success"
                ? `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.primaryLight})`
                : PALETTE.surfaceAlt,
              color: parseStatus === "success" ? "#fff" : PALETTE.border,
              cursor: parseStatus === "success" ? "pointer" : "not-allowed",
            }}
          >
            데이터 적용
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────
export default function ChannelDashboard() {
  const [globalMonth, setGlobalMonth] = useState("1월");
  const [showChannelFilter, setShowChannelFilter] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  // Mutable data state
  const [companyMonthly, setCompanyMonthly] = useState(defaultCompanyMonthly);
  const [channelData, setChannelData] = useState(defaultChannelData);

  const ALL_CHANNELS = useMemo(() => Object.keys(channelData), [channelData]);

  const CHANNEL_COLORS = useMemo(() => {
    const map = {};
    ALL_CHANNELS.forEach((ch, i) => {
      map[ch] = CHANNEL_COLORS_LIST[i % CHANNEL_COLORS_LIST.length];
    });
    return map;
  }, [ALL_CHANNELS]);

  const [selectedChannels, setSelectedChannels] = useState(new Set(ALL_CHANNELS));

  // Keep selectedChannels in sync when channels change
  const prevChannelsRef = useRef(ALL_CHANNELS);
  if (prevChannelsRef.current !== ALL_CHANNELS && JSON.stringify(prevChannelsRef.current) !== JSON.stringify(ALL_CHANNELS)) {
    prevChannelsRef.current = ALL_CHANNELS;
    setSelectedChannels(new Set(ALL_CHANNELS));
  }

  const toggleChannel = (ch) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(ch)) { if (next.size > 1) next.delete(ch); }
      else next.add(ch);
      return next;
    });
  };

  const selectAll = () => setSelectedChannels(new Set(ALL_CHANNELS));

  const handleDataLoaded = ({ type, data }) => {
    if (type === "company") {
      setCompanyMonthly(data);
    } else {
      setChannelData(data);
    }
  };

  // ─ Derived data ─
  const isYearly = globalMonth === "전체";
  const monthIndex = isYearly ? -1 : MONTHS.indexOf(globalMonth);

  // Helper: get channel monthly data for selected month or sum all months
  const getChannelMonth = (ch) => {
    if (isYearly) {
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
    return channelData[ch].monthly[monthIndex];
  };

  // Company row for KPI
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

  const costComparisonData = useMemo(() => {
    return ALL_CHANNELS.filter((ch) => selectedChannels.has(ch)).map((ch) => {
      const d = getChannelMonth(ch);
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
    });
  }, [selectedChannels, globalMonth, channelData, ALL_CHANNELS]);

  // Top 10 channels by revenue
  const top10TableChannels = useMemo(() => {
    return ALL_CHANNELS
      .map(ch => ({ ch, 매출: getChannelMonth(ch).매출 }))
      .sort((a, b) => b.매출 - a.매출)
      .slice(0, 10)
      .map(item => item.ch);
  }, [globalMonth, channelData, ALL_CHANNELS]);

  const channelSalesData = useMemo(() => {
    return top10TableChannels.map((ch) => {
      const d = getChannelMonth(ch);
      return {
        channel: ch.length > 8 ? ch.slice(0, 8) + "…" : ch,
        channelFull: ch,
        매출: d.매출,
        한계이익: d.한계이익,
        한계이익률: d.한계이익률,
      };
    });
  }, [globalMonth, channelData, top10TableChannels]);

  const filterLabel = isYearly ? "연간 누계" : `${globalMonth} 기준`;

  return (
    <div
      className="min-h-screen w-full"
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
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ── Header ── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-1.5 h-8 rounded-full"
                style={{ background: `linear-gradient(180deg, ${PALETTE.accent3}, ${PALETTE.accent4})` }}
              />
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: PALETTE.primary }}>
                채널별 월간 실적 대시보드
              </h1>
            </div>
            <p className="text-sm ml-5" style={{ color: PALETTE.textSec }}>
              팀별 채널별 손익 실적 현황 · 2026년도
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 self-start"
            style={{
              background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.primaryLight})`,
              color: "#fff",
              boxShadow: "0 2px 8px rgba(45,62,71,0.25)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(45,62,71,0.35)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(45,62,71,0.25)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <Upload size={16} strokeWidth={2.2} />
            데이터 업로드
          </button>
        </div>

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
                  fill={PALETTE.primary}
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

        {/* ══ SECTION 2: Channel Cost Structure ══ */}
        <div
          className="rounded-2xl p-5 sm:p-6 mb-6"
          style={{ background: PALETTE.white, border: `1px solid ${PALETTE.border}` }}
        >
          <SectionHeader
            title="채널별 비용 구조 비교"
            subtitle={filterLabel}
          />

          {/* Channel Filter */}
          <div className="mb-4">
            <button
              onClick={() => setShowChannelFilter(!showChannelFilter)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: PALETTE.surfaceAlt, color: PALETTE.textSec, border: `1px solid ${PALETTE.border}` }}
            >
              <Filter size={13} />
              채널 필터 ({selectedChannels.size}/{ALL_CHANNELS.length})
              {showChannelFilter ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {showChannelFilter && (
              <div
                className="mt-2 flex flex-wrap gap-2 p-3 rounded-xl"
                style={{ background: PALETTE.surfaceAlt, border: `1px solid ${PALETTE.border}` }}
              >
                <button
                  onClick={selectAll}
                  className="px-2.5 py-1 rounded-md text-xs font-medium"
                  style={{ background: PALETTE.primary, color: "#fff" }}
                >
                  전체 선택
                </button>
                {ALL_CHANNELS.map((ch) => (
                  <button
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                    style={{
                      background: selectedChannels.has(ch) ? CHANNEL_COLORS[ch] : "transparent",
                      color: selectedChannels.has(ch) ? "#fff" : PALETTE.textSec,
                      border: `1px solid ${selectedChannels.has(ch) ? CHANNEL_COLORS[ch] : PALETTE.border}`,
                    }}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            )}
          </div>

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
            subtitle={`${filterLabel} · 매출 Top 10 채널`}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr style={{ borderBottom: `2px solid ${PALETTE.primary}` }}>
                  {["순위", "채널", "소속팀", "매출", "매출원가", "변동비 합계", "한계이익", "한계이익률"].map((h) => (
                    <th key={h} className="py-3 px-2 text-left font-semibold whitespace-nowrap" style={{ color: PALETTE.primary }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {top10TableChannels.map((ch, i) => {
                  const d = getChannelMonth(ch);
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
                          {d.한계이익률 > 0 ? d.한계이익률 + "%" : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ══ SECTION 4: Channel Margin Bar ══ */}
        <div
          className="rounded-2xl p-5 sm:p-6 mb-6"
          style={{ background: PALETTE.white, border: `1px solid ${PALETTE.border}` }}
        >
          <SectionHeader
            title="채널별 매출 및 한계이익률(%)"
            subtitle={filterLabel}
          />
          <div style={{ width: "100%", height: 340 }}>
            <ResponsiveContainer>
              <ComposedChart
                data={channelSalesData}
                margin={{ top: 24, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="channel"
                  tick={{ fontSize: 10, fill: PALETTE.textSec }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: PALETTE.textSec }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={fmtAxis}
                />
                <Tooltip content={<CustomTooltip formatter={(name, val) => name.includes("한계이익률") ? fmtPct(val) : fmtBillion(val)} />} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                <Bar yAxisId="left" dataKey="매출" fill={PALETTE.primary} name="매출" radius={[3, 3, 0, 0]} barSize={28} />
                <Bar yAxisId="left" dataKey="한계이익" fill={PALETTE.accent2} name="한계이익" radius={[3, 3, 0, 0]} barSize={28}>
                  <LabelList
                    dataKey="한계이익률"
                    position="top"
                    formatter={(v) => v > 0 ? v.toFixed(1) + "%" : ""}
                    style={{ fontSize: 10, fontWeight: 700, fill: PALETTE.accent4 }}
                  />
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="text-center py-4">
          <p className="text-xs" style={{ color: PALETTE.textSec }}>
            데이터 기준: 2026년 1월 실적 (2~12월 데이터 미입력) · 팀별 채널별 손익 실적
          </p>
        </div>
      </div>
    </div>
  );
}
