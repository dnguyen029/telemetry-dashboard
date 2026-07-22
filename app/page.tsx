"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Phone, 
  Clock, 
  Users, 
  RefreshCw, 
  BarChart2, 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  X, 
  Database,
  Percent,
  Menu,
  Moon,
  Sun,
  LayoutDashboard,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// RingCentral Subcomponents
import PerformanceTable from "@/components/ringcentral/PerformanceTable";
import CallsByHourChart from "@/components/ringcentral/CallsByHourChart";
import HotspotsHeatmap from "@/components/ringcentral/HotspotsHeatmap";
import BusinessHoursChart from "@/components/ringcentral/BusinessHoursChart";
import DailyTrendChart from "@/components/ringcentral/DailyTrendChart";

// Competitor Data
import { CORE_PRODUCTS, CompetitorProduct } from "@/lib/competitorData";
import CompetitorDashboard from "@/components/competitor/CompetitorDashboard";

interface DailyTrend {
  day: string;
  inbound: number;
  answered: number;
  missed: number;
}

interface SparklineData {
  inbound: number[];
  answered: number[];
  missed: number[];
  abandoned: number[];
  answerRate: number[];
  missedRate: number[];
  abandonRate: number[];
  [key: string]: number[];
}

interface ActiveQueue {
  name: string;
  count: number;
}

interface RingCentralTelemetryData {
  status: string;
  integrationSource: string;
  comparison_status: "live" | "insufficient_data";
  info?: string;
  error?: string;
  missedCallsList: {
    id: string;
    startTime: string;
    fromName: string;
    fromNumber: string;
    toName: string;
    toNumber: string;
    duration: number;
    result: string;
  }[];
  metrics: {
    totalCallsToday: number;
    answeredCalls: number;
    missedCalls: number;
    abandonedCalls: number;
    avgWaitSeconds: number;
    avgHandleTimeSeconds?: number;
    serviceLevelSLA?: number;
    activeQueueCount: number;
    agentsOnline: number;
    agentsOnCall?: number;
    agentOccupancy: number;
  };
  activeQueues: ActiveQueue[];
  comparisonData: Record<
    string,
    Record<
      string,
      {
        current: number;
        previous: number;
        change: number;
        pct: number;
      }
    >
  >;
  hourlyTrends: { hour: string; inbound: number; answered: number; missed: number }[];
  hotspotData: number[][];
  businessHoursData: {
    businessHours: { inbound: number; answered: number; missed: number };
    afterHours: { inbound: number; answered: number; missed: number };
  };
  dailyTrends: DailyTrend[];
  sparklines: SparklineData;
  queue8Allocations: {
    productSpecs: number;
    damagesDefects: number;
    wismo: number;
    unassigned: number;
  };
  extensions: { id: string; extensionNumber: string; name: string; type: string; status: string; occupancy: number }[];
  lastUpdated: string;
}

const RETAILERS = ['homedepot', 'lowes', 'wayfair', 'amazon', 'walmart', 'ebay', 'target', 'bestbuy'];

// SLA operational thresholds — adjust per business requirements
const SLA_THRESHOLDS = {
  avgWaitSeconds: { warn: 45, critical: 90 },   // seconds in queue
  activeQueue:    { warn: 3,  critical: 6  },   // simultaneous callers waiting
  agentOccupancy: { warn: 80, critical: 95 },   // percent talk time / capacity
  missedRate:     { warn: 15, critical: 25 },   // percent of total inbound
  abandonRate:    { warn: 10, critical: 20 },   // percent of total inbound
};

type SLAStatus = "ok" | "warn" | "critical";

function getSLAStatus(
  value: number,
  thresholds: { warn: number; critical: number }
): SLAStatus {
  if (value >= thresholds.critical) return "critical";
  if (value >= thresholds.warn) return "warn";
  return "ok";
}

function getSLAColor(status: SLAStatus): string {
  return {
    ok:       "text-emerald-500 dark:text-emerald-400",
    warn:     "text-amber-500  dark:text-amber-400",
    critical: "text-red-500    dark:text-red-400",
  }[status];
}

const normalizeProductPrices = (prod: CompetitorProduct): CompetitorProduct => {
  const prices = { ...prod.prices };
  RETAILERS.forEach((key) => {
    if (!prices[key]) {
      prices[key] = {
        price: 0,
        inStock: true,
        url: "",
        shipping: 0,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      };
    }
  });
  return { ...prod, prices };
};

export default function DashboardSuite() {
  // Global Tab state
  const [activeSuiteTab, setActiveSuiteTab] = useState<string>("telemetry");
  
  // Theme and Responsive Menu states
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Read persisted theme or system setting on mount asynchronously
    setTimeout(() => {
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
      if (savedTheme) {
        setTheme(savedTheme);
      } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
        setTheme("light");
      }

      const savedCollapsed = localStorage.getItem("sidebar_collapsed");
      if (savedCollapsed !== null) {
        setIsSidebarCollapsed(savedCollapsed === "true");
      }

      setMounted(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const handleToggleSidebar = () => {
    const nextState = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextState);
    localStorage.setItem("sidebar_collapsed", String(nextState));
  };

  // ==========================================
  // RINGCENTRAL TELEMETRY STATE & LOGIC
  // ==========================================
  const [rcData, setRcData] = useState<RingCentralTelemetryData | null>(null);
  const [rcLoading, setRcLoading] = useState(false);
  const [rcError, setRcError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"DoD" | "WoW" | "MoM" | "QoQ">("DoD");
  const [isMissedModalOpen, setIsMissedModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  });

  const fetchRcMetrics = useCallback(async (dateVal?: string) => {
    setRcLoading(true);
    setRcError(null);
    try {
      const dateToFetch = dateVal !== undefined ? dateVal : selectedDate;
      const res = await fetch(`/api/ringcentral?date=${dateToFetch}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Connection error: ${res.status} ${res.statusText}`);
      }
      const payload = await res.json();
      setRcData(payload);
    } catch (err: unknown) {
      console.error(err);
      setRcError(err instanceof Error ? err.message : "Unknown error occurred.");
    } finally {
      setRcLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => fetchRcMetrics(selectedDate), 30000);
    };

    const stop = () => {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchRcMetrics(selectedDate); // Immediate refresh on tab focus
        start();
      } else {
        stop();
      }
    };

    // Only auto-refresh for today's date, not historical views
    const todayLA = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
    setTimeout(() => {
      fetchRcMetrics(selectedDate);
    }, 0);

    if (selectedDate === todayLA) {
      document.addEventListener("visibilitychange", handleVisibility);
      start();
    }

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [selectedDate, fetchRcMetrics]);


  // ==========================================
  // COMPETITOR DASHBOARD STATE & LOGIC
  // ==========================================
  const [products, setProducts] = useState<CompetitorProduct[]>([]);
  const [isPricingLoading, setIsPricingLoading] = useState(true);
  const [pricingCacheError, setPricingCacheError] = useState<string | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  const seedInitialCatalog = useCallback(async () => {
    const seedProducts = CORE_PRODUCTS.map(normalizeProductPrices);
    try {
      await fetch("/api/competitor-scan/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: seedProducts }),
      });
      setProducts(seedProducts);
    } catch (err) {
      console.error("Failed to seed initial competitor catalog:", err);
    }
  }, []);

  const fetchCachedPrices = useCallback(async () => {
    setIsPricingLoading(true);
    setPricingCacheError(null);
    try {
      const response = await fetch("/api/competitor-scan/cache");
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Cache unavailable (${response.status})`);
      }
      const resBody = await response.json();
      const productList = resBody?.products ?? (Array.isArray(resBody) ? resBody : []);
      if (productList.length > 0) {
        setProducts(productList.map(normalizeProductPrices));
      } else {
        await seedInitialCatalog();
      }
      if (resBody.updated_at) {
        setLastSyncedTime(resBody.updated_at);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to load pricing data.";
      setPricingCacheError(errMsg);
      console.error("Failed to load cached pricing data:", err);
    } finally {
      setIsPricingLoading(false);
    }
  }, [seedInitialCatalog]);

  useEffect(() => {
    setTimeout(() => {
      fetchCachedPrices();
    }, 0);
  }, [fetchCachedPrices]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* DESKTOP LEFT SIDEBAR */}
      <aside className={`border-r border-slate-200 dark:border-slate-900 bg-slate-100/50 dark:bg-slate-950/80 backdrop-blur shrink-0 hidden md:flex flex-col justify-between sticky top-0 h-screen transition-all duration-300 z-40 ${
        isSidebarCollapsed ? "w-16 p-3" : "w-64 p-5"
      }`}>
        <div className="space-y-7">
          {/* Header logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            {!isSidebarCollapsed && (
              <div className="transition-all duration-200 opacity-100">
                <h1 className="text-sm font-bold tracking-tight text-slate-800 dark:text-white">Ariel Bath Ops</h1>
                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">DEC-2026 Telemetry</p>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { id: "telemetry", label: "Call & Email Volume", icon: Phone },
              { id: "staffing", label: "Staffing", icon: Users },
              { id: "performance", label: "Performance", icon: TrendingUp },
              { id: "quality", label: "Quality", icon: Shield },
              { id: "reports", label: "Reports", icon: FileText },
              { id: "competitor", label: "Data", icon: Database }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeSuiteTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSuiteTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-mono rounded-xl transition-all duration-250 ${
                    isActive 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/15" 
                      : "text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-900/50"
                  } ${isSidebarCollapsed ? "justify-center px-0" : ""}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="space-y-3.5 border-t border-slate-200 dark:border-slate-900 pt-4">
          {/* Settings Trigger */}
          <button
            onClick={() => setActiveSuiteTab("settings")}
            title={isSidebarCollapsed ? "Settings" : undefined}
            className={`w-full flex items-center gap-3 px-3.5 py-2 text-xs font-mono text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-205 rounded-xl hover:bg-slate-200/40 dark:hover:bg-slate-900/40 transition-colors ${
              isSidebarCollapsed ? "justify-center px-0" : ""
            } ${activeSuiteTab === "settings" ? "text-blue-500 font-semibold" : ""}`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Settings</span>}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isSidebarCollapsed ? "Toggle Theme" : undefined}
            className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-250/50 dark:border-slate-850 bg-slate-200/10 dark:bg-slate-900/10 hover:bg-slate-200/40 dark:hover:bg-slate-900/40 transition-colors ${
              isSidebarCollapsed ? "justify-center px-0 border-none bg-transparent hover:bg-transparent" : ""
            }`}
          >
            {!isSidebarCollapsed ? (
              <>
                <span className="text-slate-500 dark:text-slate-400">Theme</span>
                <span className="flex items-center gap-1.5 font-bold">
                  {theme === "dark" ? (
                    <>Dark <Moon className="w-3.5 h-3.5 text-blue-400" /></>
                  ) : (
                    <>Light <Sun className="w-3.5 h-3.5 text-amber-500" /></>
                  )}
                </span>
              </>
            ) : (
              theme === "dark" ? (
                <Moon className="w-4 h-4 text-blue-400 shrink-0" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500 shrink-0" />
              )
            )}
          </button>

          {/* Collapse Trigger arrow */}
          <button
            onClick={handleToggleSidebar}
            className={`w-full flex items-center gap-3 px-3.5 py-2 text-xs font-mono text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer ${
              isSidebarCollapsed ? "justify-center px-0" : ""
            }`}
          >
            {isSidebarCollapsed ? (
              <ChevronsRight className="w-4 h-4 shrink-0" />
            ) : (
              <>
                <ChevronsLeft className="w-4 h-4 shrink-0" />
                <span>Collapse menu</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER & DRAWER */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <header className="md:hidden border-b border-slate-200 dark:border-slate-900 bg-slate-100/50 dark:bg-slate-950/80 backdrop-blur sticky top-0 px-6 py-4 flex items-center justify-between z-40">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-bold text-slate-800 dark:text-white">Ariel Bath Ops</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-450 hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Mobile menu drawer overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm">
            <div className="w-64 h-full bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-900 p-5 flex flex-col justify-between animate-in slide-in-from-left duration-200">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Navigation</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <nav className="space-y-1">
                  {[
                    { id: "telemetry", label: "Call & Email Volume", icon: Phone },
                    { id: "staffing", label: "Staffing", icon: Users },
                    { id: "performance", label: "Performance", icon: TrendingUp },
                    { id: "quality", label: "Quality", icon: Shield },
                    { id: "reports", label: "Reports", icon: FileText },
                    { id: "competitor", label: "Data", icon: Database }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSuiteTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveSuiteTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-mono rounded-xl transition-all duration-200 ${
                          isActive 
                            ? "bg-blue-600 text-white" 
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-900/50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-900">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-200/20 dark:bg-slate-900/20"
                >
                  <span className="text-slate-500">Theme</span>
                  <span className="flex items-center gap-1.5 font-bold">
                    {theme === "dark" ? (
                      <>Dark <Moon className="w-3.5 h-3.5 text-blue-400" /></>
                    ) : (
                      <>Light <Sun className="w-3.5 h-3.5 text-amber-500" /></>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">


          {/* ==========================================
              VIEW: RINGCENTRAL TELEMETRY
              ========================================== */}
          {activeSuiteTab === "telemetry" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-900 pb-5">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold font-heading text-slate-800 dark:text-white flex items-center gap-2.5">
                    Call & Email Volume
                    {rcData?.status === "fallback" && (
                      <Badge variant="outline" className="text-[9px] font-mono text-amber-500 border-amber-500/20 bg-amber-500/5">
                        FALLBACK SIMULATION
                      </Badge>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Call performance and staffing coverage
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input 
                    type="date"
                    value={selectedDate}
                    max={new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" })}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                  <span className="text-[10px] font-mono text-slate-450 dark:text-slate-500 hidden sm:inline">
                    {selectedDate === new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }) 
                      ? `Update: ${rcData?.lastUpdated ? new Date(rcData.lastUpdated).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }) + " PST" : "Pending"}`
                      : `Data as of: ${selectedDate} 11:59 PM PST`
                    }
                  </span>
                  <Button 
                    onClick={() => fetchRcMetrics(selectedDate)} 
                    disabled={rcLoading}
                    variant="outline"
                    size="sm"
                    className="bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-850"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-2 ${rcLoading ? "animate-spin text-blue-500" : ""}`} />
                    {rcLoading ? "Refreshing..." : "REFRESH LIVE"}
                  </Button>
                </div>
              </div>

              {/* Hard error — no data available */}
              {rcError && !rcData && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span><strong>Live data unavailable.</strong> {rcError}</span>
                </div>
              )}
              {/* Stale cache warning — metrics visible but from last known snapshot */}
              {rcData?.status === "stale" && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span><strong>Stale data.</strong> {rcData.error ?? "RingCentral API is temporarily unreachable. Displaying last cached snapshot."}</span>
                </div>
              )}              {/* KPI Cards */}
              {rcData?.metrics && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    <Card className="glass-card shadow-sm border-slate-200 dark:border-slate-900 glow-blue">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-550 dark:text-slate-400 uppercase">{"Today's Call Volume"}</CardTitle>
                        <Phone className="w-4 h-4 text-blue-500" />
                      </CardHeader>
                      <CardContent className="space-y-1.5">
                        <div className="text-3xl font-bold text-slate-800 dark:text-white font-mono">{rcData.metrics.totalCallsToday}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-2">
                          <span className="text-emerald-500 font-semibold">{rcData.metrics.answeredCalls} Ans</span>
                          <span>•</span>
                          <span className="text-red-500 font-semibold">{rcData.metrics.missedCalls} Miss</span>
                          <span>•</span>
                          <span className="text-amber-500 font-semibold">{rcData.metrics.abandonedCalls || 0} Aband</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass-card shadow-sm border-slate-200 dark:border-slate-900 glow-amber">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-550 dark:text-slate-400 uppercase">Live Callers in Queue</CardTitle>
                        <BarChart2 className="w-4 h-4 text-amber-500" />
                      </CardHeader>
                      <CardContent className="space-y-1.5">
                        <div className={`text-3xl font-bold font-mono ${getSLAColor(getSLAStatus(rcData.metrics.activeQueueCount, SLA_THRESHOLDS.activeQueue))}`}>{rcData.metrics.activeQueueCount}</div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 space-y-0.5 border-t border-slate-200 dark:border-slate-855 pt-1.5">
                          {rcData.activeQueues && rcData.activeQueues.length > 0 ? (
                            rcData.activeQueues.map((q, idx: number) => (
                              <div key={idx} className="flex justify-between gap-2 font-mono">
                                <span className="truncate max-w-[130px]">{q.name.split(" (")[0]}:</span>
                                <strong className="text-slate-700 dark:text-slate-205">{q.count}</strong>
                              </div>
                            ))
                          ) : (
                            <p className="text-emerald-500 font-medium">Queue Clear • 0 callers waiting now</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass-card shadow-sm border-slate-200 dark:border-slate-900 glow-indigo">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-550 dark:text-slate-400 uppercase">Average Wait Time</CardTitle>
                        <Clock className="w-4 h-4 text-indigo-500" />
                      </CardHeader>
                      <CardContent className="space-y-1.5">
                        <div className={`text-3xl font-bold font-mono ${getSLAColor(getSLAStatus(rcData.metrics.avgWaitSeconds, SLA_THRESHOLDS.avgWaitSeconds))}`}>{rcData.metrics.avgWaitSeconds}s</div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-455">Target SLA threshold: &lt; 60 seconds</p>
                      </CardContent>
                    </Card>

                    <Card className="glass-card shadow-sm border-slate-200 dark:border-slate-900 glow-emerald">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-550 dark:text-slate-400 uppercase">Agent Occupancy</CardTitle>
                        <Percent className="w-4 h-4 text-emerald-500" />
                      </CardHeader>
                      <CardContent className="space-y-1.5">
                        <div className={`text-3xl font-bold font-mono ${getSLAColor(getSLAStatus(rcData.metrics.agentOccupancy, SLA_THRESHOLDS.agentOccupancy))}`}>{rcData.metrics.agentOccupancy}%</div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-450">Active talk time vs total capacity</p>
                      </CardContent>
                    </Card>

                    <Card className="glass-card shadow-sm border-slate-200 dark:border-slate-900 glow-indigo">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-550 dark:text-slate-400 uppercase">Agents Online</CardTitle>
                        <Users className="w-4 h-4 text-blue-500" />
                      </CardHeader>
                      <CardContent className="space-y-1.5">
                        <div className="text-3xl font-bold text-slate-800 dark:text-white font-mono flex items-baseline justify-between">
                          <span>{rcData.metrics.agentsOnline}</span>
                          <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            {rcData.metrics.agentsOnCall || 0} On Call
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Active Extensions monitored: {rcData.extensions?.length || 0}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* SLA Status Legend */}
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 dark:text-slate-400 pt-1 px-1">
                    <span className="font-mono font-semibold uppercase tracking-wider">SLA Status:</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> OK
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Warning
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Critical
                    </span>
                  </div>
                </div>
              )}

              {/* Performance Table (Full Width) */}
              {rcData?.comparisonData && rcData?.sparklines && (
                <div className="w-full">
                  <PerformanceTable
                    comparisonData={rcData.comparisonData}
                    sparklines={rcData.sparklines}
                    period={period}
                    setPeriod={setPeriod}
                    onMetricClick={(metricName) => {
                      if (metricName === "Missed Calls") {
                        setIsMissedModalOpen(true);
                      }
                    }}
                    dataStatus={rcData.comparison_status}
                  />
                </div>
              )}

              {/* Row 1: Charts (2 Columns) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {rcData?.hourlyTrends && (
                  <CallsByHourChart hourlyTrends={rcData.hourlyTrends} />
                )}
                {rcData?.businessHoursData && (
                  <BusinessHoursChart businessHoursData={rcData.businessHoursData} />
                )}
              </div>

              {/* Row 2: Heatmap Matrix (Full Width) */}
              {rcData?.hotspotData && (
                <div className="w-full">
                  <HotspotsHeatmap hotspotData={rcData.hotspotData} />
                </div>
              )}

              {/* Bottom Row: Daily Volume Trend (Full Width) */}
              {rcData?.dailyTrends && (
                <div className="w-full">
                  <DailyTrendChart dailyTrends={rcData.dailyTrends} />
                </div>
              )}

            </div>
          )}

          {/* PLACEHOLDER VIEWS */}
          {["staffing", "performance", "quality", "reports", "settings"].includes(activeSuiteTab) && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-300">
              <div className="p-4 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                <LayoutDashboard className="w-10 h-10 animate-pulse" />
              </div>
              <div className="text-center space-y-1.5">
                <h2 className="text-lg font-bold capitalize text-slate-800 dark:text-white">{activeSuiteTab} Analytics</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  This section is currently under development. Real-time active data sets are configured under Call & Email Volume and Data tabs.
                </p>
              </div>
            </div>
          )}
              {/* ==========================================
              VIEW: COMPETITOR PRICING
              ========================================== */}
          {activeSuiteTab === "competitor" && (
            <CompetitorDashboard
              products={products}
              setProducts={setProducts}
              isPricingLoading={isPricingLoading}
              pricingCacheError={pricingCacheError}
              onRetry={fetchCachedPrices}
              lastSyncedTime={lastSyncedTime}
              setLastSyncedTime={setLastSyncedTime}
            />
          )}
        </main>
      </div>

      {/* Missed Calls Detail Modal */}
      {isMissedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-500" />
                  Missed Call Log Detail
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  List of inbound callers that were not answered on {selectedDate}
                </p>
              </div>
              <button
                onClick={() => setIsMissedModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {(!rcData?.missedCallsList || rcData.missedCallsList.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 space-y-2">
                  <Phone className="w-8 h-8 opacity-40" />
                  <p className="text-xs font-medium">No missed call details available for this day.</p>
                </div>
              ) : (
                <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-lg">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-950">
                      <TableRow>
                        <TableHead className="w-[140px] text-xs font-bold text-slate-500 dark:text-slate-400">Time</TableHead>
                        <TableHead className="text-xs font-bold text-slate-500 dark:text-slate-400">Caller</TableHead>
                        <TableHead className="text-xs font-bold text-slate-500 dark:text-slate-400">Number</TableHead>
                        <TableHead className="text-xs font-bold text-slate-500 dark:text-slate-400">Target Queue / Ext</TableHead>
                        <TableHead className="w-[100px] text-xs font-bold text-slate-500 dark:text-slate-400 text-right">Ring Time</TableHead>
                        <TableHead className="w-[150px] text-xs font-bold text-slate-500 dark:text-slate-400 text-center">Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {rcData.missedCallsList.map((call) => {
                        const formattedTime = new Date(call.startTime).toLocaleTimeString("en-US", {
                          timeZone: "America/Los_Angeles",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit"
                        });
                        return (
                          <TableRow key={call.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <TableCell className="font-mono text-xs text-slate-650 dark:text-slate-350">{formattedTime}</TableCell>
                            <TableCell className="text-xs font-semibold text-slate-800 dark:text-slate-200">{call.fromName}</TableCell>
                            <TableCell className="font-mono text-xs text-slate-650 dark:text-slate-350">{call.fromNumber}</TableCell>
                            <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                              {call.toName} {call.toNumber !== "Support" && <span className="text-[10px] opacity-75 font-mono">({call.toNumber})</span>}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-slate-800 dark:text-slate-200 text-right font-semibold">{call.duration}s</TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/15 border-none text-[10px] font-medium font-sans px-2 py-0.5 capitalize">
                                {call.result.replace(/([A-Z])/g, ' $1').trim()}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <span className="text-[10px] text-slate-450 dark:text-slate-550 font-mono">
                Total Logs: {rcData?.missedCallsList?.length || 0} calls
              </span>
              <Button size="sm" onClick={() => setIsMissedModalOpen(false)}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
