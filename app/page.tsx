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
  TrendingDown, 
  ShoppingBag, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  ExternalLink, 
  ChevronRight, 
  X, 
  Send,
  Database,
  Grid,
  Percent,
  Sliders,
  DollarSign,
  Menu,
  Moon,
  Sun,
  LayoutDashboard,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  FileText
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// RingCentral Subcomponents
import PerformanceTable from "@/components/ringcentral/PerformanceTable";
import CallsByHourChart from "@/components/ringcentral/CallsByHourChart";
import HotspotsHeatmap from "@/components/ringcentral/HotspotsHeatmap";
import BusinessHoursChart from "@/components/ringcentral/BusinessHoursChart";
import DailyTrendChart from "@/components/ringcentral/DailyTrendChart";

// Competitor Data
import { CORE_PRODUCTS, CompetitorProduct, ProductPrice } from "@/lib/competitorData";

const RETAILERS = ['homedepot', 'lowes', 'wayfair', 'amazon', 'walmart', 'ebay', 'target', 'bestbuy'];

const normalizeProductPrices = (prod: any) => {
  const prices = { ...prod.prices } as any;
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
    // Read persisted theme or system setting on mount
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
  const [rcData, setRcData] = useState<any>(null);
  const [rcLoading, setRcLoading] = useState(false);
  const [rcError, setRcError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"DoD" | "WoW" | "MoM" | "QoQ">("WoW");
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
      if (!res.ok) throw new Error(`Failed to fetch RingCentral: ${res.statusText}`);
      const payload = await res.json();
      setRcData(payload);
    } catch (err: any) {
      console.error(err);
      setRcError(err.message || "Unknown error occurred.");
    } finally {
      setRcLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchRcMetrics(selectedDate);
    const todayLA = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
    if (selectedDate === todayLA) {
      const intervalId = setInterval(() => {
        fetchRcMetrics(selectedDate);
      }, 30000);
      return () => clearInterval(intervalId);
    }
  }, [selectedDate, fetchRcMetrics]);

  const getPercent = (val: number) => {
    if (!rcData?.metrics || rcData.metrics.totalCallsToday === 0) return 0;
    return Math.round((val / rcData.metrics.totalCallsToday) * 100);
  };

  // ==========================================
  // COMPETITOR DASHBOARD STATE & LOGIC
  // ==========================================
  const [products, setProducts] = useState<CompetitorProduct[]>(() => CORE_PRODUCTS.map(normalizeProductPrices));
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);

  // Landed cost & freight slider state
  const [isLandedCost, setIsLandedCost] = useState(false);
  const [simulatedFreight, setSimulatedFreight] = useState(120);

  // Grid filter states
  const [activeGridFilter, setActiveGridFilter] = useState<'all' | 'violations' | 'outages'>('all');

  // MAP editing states
  const [editingMapValue, setEditingMapValue] = useState<string>("");
  const [isSavingMap, setIsSavingMap] = useState(false);

  // AI Copilot Chat states
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [newCopilotMessage, setNewCopilotMessage] = useState("");
  const [isCopilotSending, setIsCopilotSending] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<Array<{ sender: "user" | "assistant"; text: string }>>([
    {
      sender: "assistant",
      text: "Hi! I'm your Ariel Bath Pricing Copilot. I have full access to your pricing grid. Ask me to analyze stock outages, calculate margins, or draft compliance notices."
    }
  ]);

  // Helper to calculate display price based on simulation settings
  const getDisplayPrice = (product: any, retailerKey: string) => {
    const priceInfo = product.prices[retailerKey];
    if (!priceInfo || priceInfo.price === 0) return 0;
    
    if (isLandedCost) {
      return Math.max(0, priceInfo.price + simulatedFreight - (priceInfo.coupon || 0));
    }
    return priceInfo.price;
  };

  const hasOutage = (prod: any) => {
    return Object.values(prod.prices).some((retailer: any) => {
      if (!retailer || retailer.price === 0) return false;
      const isOOS = retailer.inStock === false;
      const hasRegOutage = retailer.regionalStock && (
        retailer.regionalStock.east === false ||
        retailer.regionalStock.midwest === false ||
        retailer.regionalStock.west === false
      );
      return isOOS || hasRegOutage;
    });
  };

  const displayProducts = products.filter((prod) => {
    if (activeGridFilter === 'violations') {
      let hasProdViolation = false;
      Object.keys(prod.prices).forEach(key => {
        const priceVal = getDisplayPrice(prod, key);
        if (priceVal > 0 && priceVal < prod.mapPrice) hasProdViolation = true;
      });
      return hasProdViolation;
    }
    if (activeGridFilter === 'outages') {
      return hasOutage(prod);
    }
    return true;
  });

  const handleSendCopilotMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCopilotMessage.trim() || isCopilotSending) return;

    const userTxt = newCopilotMessage.trim();
    setNewCopilotMessage("");
    setCopilotMessages(prev => [...prev, { sender: "user", text: userTxt }]);
    setIsCopilotSending(true);

    try {
      const res = await fetch("/api/competitor-scan/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userTxt, products }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get reply");

      setCopilotMessages(prev => [...prev, { sender: "assistant", text: data.reply }]);
    } catch (err: any) {
      setCopilotMessages(prev => [...prev, { sender: "assistant", text: `Error: ${err.message || "Failed to get reply."}` }]);
    } finally {
      setIsCopilotSending(false);
    }
  };

  useEffect(() => {
    if (selectedProduct) {
      setEditingMapValue(selectedProduct.mapPrice.toString());
    } else {
      setEditingMapValue("");
    }
  }, [selectedProduct]);

  const handleSaveMap = async () => {
    const newPrice = parseFloat(editingMapValue);
    if (isNaN(newPrice) || newPrice <= 0) {
      alert("Please enter a valid positive number for the MAP price.");
      return;
    }

    setIsSavingMap(true);
    try {
      const updatedProducts = products.map((p) => {
        if (p.model === selectedProduct.model) {
          return { ...p, mapPrice: newPrice };
        }
        return p;
      });

      const response = await fetch("/api/competitor-scan/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: updatedProducts }),
      });

      if (!response.ok) throw new Error("Failed to save updated MAP price to server.");

      setProducts(updatedProducts);
      setSelectedProduct((prev: any) => prev ? { ...prev, mapPrice: newPrice } : null);
      alert("MAP price successfully updated!");
    } catch (err: any) {
      alert(`Error updating MAP: ${err.message || err}`);
    } finally {
      setIsSavingMap(false);
    }
  };

  useEffect(() => {
    const fetchCachedPrices = async () => {
      try {
        const response = await fetch("/api/competitor-scan/cache");
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setProducts(data.map(normalizeProductPrices));
          } else {
            setProducts(data);
          }
        }
      } catch (err) {
        console.error("Failed to load cached pricing data:", err);
      }
    };
    fetchCachedPrices();
  }, []);

  const handleBatchSync = async () => {
    setIsSyncing(true);
    const updatedProducts = JSON.parse(JSON.stringify(products));

    try {
      for (let i = 0; i < updatedProducts.length; i++) {
        const product = updatedProducts[i];
        setSyncProgress({ current: i + 1, total: updatedProducts.length });

        try {
          let scanRes = await fetch("/api/competitor-scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: product.upc }),
          });

          if (scanRes.status === 429) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
            scanRes = await fetch("/api/competitor-scan", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ identifier: product.upc }),
            });
          }

          if (scanRes.ok) {
            const data = await scanRes.json();
            const cross = data.cross_retailer || {};
            
            Object.keys(product.prices).forEach((retailerKey) => {
              const apiRetailerKey = retailerKey === "lowes" ? "lowes" : retailerKey === "homedepot" ? "homedepot" : retailerKey;
              const offer = cross[apiRetailerKey];

              if (offer && offer.status !== "mismatch") {
                if (offer.price !== null && offer.price !== undefined && offer.price > 0) {
                  product.prices[retailerKey].price = offer.price;
                } else {
                  product.prices[retailerKey].price = 0;
                }
                product.prices[retailerKey].inStock = offer.in_stock !== false;
                if (offer.url) {
                  product.prices[retailerKey].url = offer.url;
                }
              }
            });

            product.rating = data.average_rating || product.rating || 0;
            product.reviewCount = data.review_count || product.reviewCount || 0;
            setProducts((prev) => prev.map(p => p.model === product.model ? JSON.parse(JSON.stringify(product)) : p));
          }
        } catch (singleErr) {
          console.error(`Failed scanning ${product.name}:`, singleErr);
        }

        if (i < updatedProducts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 4500));
        }
      }

      await fetch("/api/competitor-scan/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: updatedProducts }),
      });

      setProducts(updatedProducts);
    } catch (err: any) {
      alert(`Sync error: ${err.message || err}`);
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  // Pricing Aggregates
  const totalMonitored = products.length;
  let activeViolations = 0;
  let totalChecks = 0;
  let compliantChecks = 0;
  let outOfStockAlerts = 0;

  products.forEach(p => {
    Object.keys(p.prices).forEach(key => {
      const pInfo = (p.prices as any)[key];
      if (pInfo.price > 0) {
        totalChecks++;
        const displayPrice = getDisplayPrice(p, key);
        if (!pInfo.inStock) outOfStockAlerts++;
        if (displayPrice < p.mapPrice) {
          activeViolations++;
        } else {
          compliantChecks++;
        }
      }
    });
  });
  const complianceRate = totalChecks > 0 ? ((compliantChecks / totalChecks) * 100).toFixed(0) : "100";

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

              {rcError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Error communicating with RingCentral: {rcError}. Rendering cached/simulated baseline.</span>
                </div>
              )}

              {/* KPI Cards */}
              {rcData?.metrics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  <Card className="glass-card shadow-sm border-slate-200 dark:border-slate-900 glow-blue">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-550 dark:text-slate-400 uppercase">Today's Call Volume</CardTitle>
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
                      <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-550 dark:text-slate-400 uppercase">Active Queue Lines</CardTitle>
                      <BarChart2 className="w-4 h-4 text-amber-500" />
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      <div className="text-3xl font-bold text-amber-500 font-mono">{rcData.metrics.activeQueueCount}</div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 space-y-0.5 border-t border-slate-200 dark:border-slate-855 pt-1.5">
                        {rcData.activeQueues && rcData.activeQueues.length > 0 ? (
                          rcData.activeQueues.map((q: any, idx: number) => (
                            <div key={idx} className="flex justify-between gap-2 font-mono">
                              <span className="truncate max-w-[130px]">{q.name.split(" (")[0]}:</span>
                              <strong className="text-slate-700 dark:text-slate-205">{q.count}</strong>
                            </div>
                          ))
                        ) : (
                          <p>No queued connections</p>
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
                      <div className="text-3xl font-bold text-slate-800 dark:text-white font-mono">{rcData.metrics.avgWaitSeconds}s</div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-455">Target SLA threshold: &lt; 60 seconds</p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card shadow-sm border-slate-200 dark:border-slate-900 glow-emerald">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-550 dark:text-slate-400 uppercase">Agent Occupancy</CardTitle>
                      <Percent className="w-4 h-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      <div className="text-3xl font-bold text-slate-800 dark:text-white font-mono">{rcData.metrics.agentOccupancy}%</div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-450">Active talk time vs total capacity</p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card shadow-sm border-slate-200 dark:border-slate-900 glow-indigo">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-550 dark:text-slate-400 uppercase">Agents Online</CardTitle>
                      <Users className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      <div className="text-3xl font-bold text-slate-800 dark:text-white font-mono">{rcData.metrics.agentsOnline}</div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Active Extensions monitored: {rcData.extensions?.length || 0}</p>
                    </CardContent>
                  </Card>
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
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-900 pb-5">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold font-heading text-slate-800 dark:text-white flex items-center gap-2.5">
                    MAP & Competitor Monitoring Dashboard
                    <Badge variant="outline" className="text-[9px] font-mono text-emerald-500 border-emerald-500/20 bg-emerald-500/5">
                      MAP Compliance: {complianceRate}%
                    </Badge>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Track retail prices, stock shortages, and MAP violations across leading marketplaces.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-200/55 dark:bg-slate-905 border border-slate-300/40 dark:border-slate-800 px-3 py-1.5 rounded-lg text-xs">
                    <Sliders className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-slate-700 dark:text-slate-300 font-mono text-[10px]">LANDED COST SIMULATION</span>
                    <input 
                      type="checkbox" 
                      checked={isLandedCost}
                      onChange={(e) => setIsLandedCost(e.target.checked)}
                      className="w-3.5 h-3.5 accent-amber-500 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                    />
                  </div>

                  <Button 
                    onClick={handleBatchSync} 
                    disabled={isSyncing}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-mono tracking-wider"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                    {isSyncing ? `SYNCING (${syncProgress?.current}/${syncProgress?.total})` : "BATCH SYNC ALL"}
                  </Button>
                </div>
              </div>

              {isLandedCost && (
                <Card className="glass-card border-amber-500/20 p-4 flex flex-col md:flex-row justify-between items-center gap-4 glow-amber">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 font-heading">
                      Landed Cost Configurations
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Add simulated freight pricing & minus active retailer cart coupons for evaluation.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Simulated Freight:</span>
                    <input 
                      type="range" 
                      min="50" 
                      max="300" 
                      value={simulatedFreight} 
                      onChange={(e) => setSimulatedFreight(parseInt(e.target.value))}
                      className="w-full md:w-40 accent-amber-500 h-1 bg-slate-300 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <strong className="text-amber-500 font-mono text-sm">${simulatedFreight}</strong>
                  </div>
                </Card>
              )}

              {/* Pricing KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="glass-card shadow-sm border-slate-200 dark:border-slate-900 glow-blue">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Monitored Models</CardTitle>
                    <ShoppingBag className="w-4 h-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-800 dark:text-white font-mono">{totalMonitored}</div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Active Ariel Bath vanities & catalog models</p>
                  </CardContent>
                </Card>

                <Card className="glass-card shadow-sm border-slate-200 dark:border-slate-900 glow-red">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">MAP Violations</CardTitle>
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold font-mono ${activeViolations > 0 ? "text-red-500 animate-pulse" : "text-slate-800 dark:text-white"}`}>
                      {activeViolations}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Retail prices listing below MAP threshold</p>
                  </CardContent>
                </Card>

                <Card className="glass-card shadow-sm border-slate-200 dark:border-slate-900 glow-amber">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">OOS Alerts</CardTitle>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-800 dark:text-white font-mono">{outOfStockAlerts}</div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Active retail listings showing out-of-stock</p>
                  </CardContent>
                </Card>

                <Card className="glass-card shadow-sm border-slate-200 dark:border-slate-900 glow-emerald">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Compliance Score</CardTitle>
                    <Percent className="w-4 h-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-emerald-500 font-mono">{complianceRate}%</div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Overall pricing compliance threshold rating</p>
                  </CardContent>
                </Card>
              </div>

              {/* Grid layout containing the Pricing table and Copilot */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                
                {/* Pricing Grid */}
                <div className="lg:col-span-3 space-y-6">
                  
                  {/* Grid Filters */}
                  <div className="flex border-b border-slate-200 dark:border-slate-900 pb-3 space-x-6">
                    {[
                      { id: "all", label: "ALL PRODUCTS" },
                      { id: "violations", label: "ACTIVE VIOLATIONS" },
                      { id: "outages", label: "STOCK OUTAGES" }
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setActiveGridFilter(filter.id as any)}
                        className={`pb-1.5 text-xs font-mono tracking-wider transition-all duration-300 border-b-2 ${
                          activeGridFilter === filter.id
                            ? "text-amber-505 border-amber-500 font-bold"
                            : "text-slate-500 border-transparent hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  {/* Table View */}
                  <Card className="glass-card shadow-sm border-slate-200 dark:border-slate-900 overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table className="w-full text-xs font-sans border-collapse min-w-[700px]">
                        <TableHeader className="bg-slate-100 dark:bg-slate-950 font-mono text-[10px] uppercase border-b border-slate-200 dark:border-slate-850">
                          <TableRow>
                            <TableHead className="text-slate-500 dark:text-slate-400">Product Model</TableHead>
                            <TableHead className="text-slate-500 dark:text-slate-400 text-right">MAP Floor</TableHead>
                            <TableHead className="text-slate-500 dark:text-slate-400 text-right">Home Depot</TableHead>
                            <TableHead className="text-slate-500 dark:text-slate-400 text-right">Lowe's</TableHead>
                            <TableHead className="text-slate-500 dark:text-slate-400 text-right">Wayfair</TableHead>
                            <TableHead className="text-slate-500 dark:text-slate-400 text-right">Amazon</TableHead>
                            <TableHead className="text-slate-500 dark:text-slate-400 text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-200 dark:divide-slate-850">
                          {displayProducts.map((prod) => (
                            <TableRow key={prod.model} className="hover:bg-slate-200/25 dark:hover:bg-slate-850/30 transition-colors">
                              <TableCell className="py-3">
                                <div className="font-medium text-slate-850 dark:text-slate-100">{prod.name.split(" Single")[0].split(" Double")[0]}</div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{prod.model} • UPC: {prod.upc}</div>
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold text-slate-800 dark:text-slate-200">${prod.mapPrice.toFixed(0)}</TableCell>
                              
                              {/* Retailers */}
                              {['homedepot', 'lowes', 'wayfair', 'amazon'].map((rKey) => {
                                const val = getDisplayPrice(prod, rKey);
                                const pInfo = (prod.prices as any)[rKey];
                                const isViolating = val > 0 && val < prod.mapPrice;
                                
                                return (
                                  <TableCell key={rKey} className="text-right font-mono">
                                    {val === 0 ? (
                                      <span className="text-slate-400 dark:text-slate-600">N/A</span>
                                    ) : (
                                      <div className="space-y-0.5">
                                        <span className={`font-semibold ${isViolating ? "text-red-500 font-bold" : "text-slate-800 dark:text-slate-200"}`}>
                                          ${val.toFixed(0)}
                                        </span>
                                        {pInfo.inStock === false && (
                                          <Badge variant="outline" className="block text-[8px] font-mono text-amber-500 border-amber-500/20 bg-amber-500/5 px-1 py-0 justify-end w-auto ml-auto">
                                            OOS
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </TableCell>
                                );
                              })}

                              <TableCell className="text-center">
                                <Button 
                                  onClick={() => setSelectedProduct(prod)}
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[10px] bg-white dark:bg-slate-950 border-slate-250 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                                >
                                  Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </div>

                {/* AI Pricing Copilot Side Drawer (Embedded) */}
                <div className="lg:col-span-1">
                  <Card className="glass-card shadow-sm border-slate-200 dark:border-slate-900 flex flex-col h-[520px] overflow-hidden glow-indigo">
                    <CardHeader className="bg-slate-100/40 dark:bg-slate-950/40 p-4 border-b border-slate-200 dark:border-slate-850">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-xs font-bold text-slate-800 dark:text-white uppercase font-mono">PRICING COPILOT</CardTitle>
                          <CardDescription className="text-[10px] text-slate-500 dark:text-slate-400">Gemini 3.5 Assistant</CardDescription>
                        </div>
                        <Badge className="bg-blue-600 text-white font-mono text-[9px]">LIVE DATA</Badge>
                      </div>
                    </CardHeader>

                    {/* Messages list */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs no-scrollbar">
                      {copilotMessages.map((msg, i) => (
                        <div 
                          key={i} 
                          className={`p-3 rounded-lg leading-relaxed ${
                            msg.sender === "user" 
                              ? "bg-blue-600/10 border border-blue-500/20 text-slate-800 dark:text-slate-200 ml-6" 
                              : "bg-slate-100/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 mr-6"
                          }`}
                        >
                          <div className="font-mono text-[9px] text-slate-550 dark:text-slate-400 uppercase mb-1">
                            {msg.sender === "user" ? "You" : "Pricing Copilot"}
                          </div>
                          <p className="whitespace-pre-wrap font-sans leading-normal">{msg.text}</p>
                        </div>
                      ))}
                      {isCopilotSending && (
                        <div className="text-slate-500 dark:text-slate-450 font-mono text-[10px] animate-pulse">
                          Analyzing price cache...
                        </div>
                      )}
                    </div>

                    {/* Input Form */}
                    <form onSubmit={handleSendCopilotMessage} className="p-3 border-t border-slate-200 dark:border-slate-850 bg-slate-100/30 dark:bg-slate-950/20 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Ask about compliance or out-of-stock..." 
                        value={newCopilotMessage}
                        onChange={(e) => setNewCopilotMessage(e.target.value)}
                        disabled={isCopilotSending}
                        className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-amber-600"
                      />
                      <Button 
                        type="submit" 
                        size="sm"
                        disabled={isCopilotSending || !newCopilotMessage.trim()}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    </form>
                  </Card>
                </div>

              </div>

            </div>
          )}
        </main>
      </div>

      {/* Details modal / MAP Editor Dialog */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="bg-white dark:bg-slate-900 border-slate-250 dark:border-slate-800 max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="bg-slate-50 dark:bg-slate-950 p-5 border-b border-slate-200 dark:border-slate-850 flex flex-row justify-between items-start">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-white font-heading">{selectedProduct.name}</CardTitle>
                <CardDescription className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1">SKU: {selectedProduct.model} • UPC: {selectedProduct.upc}</CardDescription>
              </div>
              <Button 
                onClick={() => setSelectedProduct(null)}
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-xs">
              
              {/* MAP Price floor Editor */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 space-y-3">
                <h4 className="font-bold text-slate-800 dark:text-white font-heading">Configure MAP Floor</h4>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                    <input 
                      type="number" 
                      value={editingMapValue} 
                      onChange={(e) => setEditingMapValue(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg pl-7 pr-3 py-1.5 text-slate-800 dark:text-white font-mono text-sm focus:outline-none"
                    />
                  </div>
                  <Button 
                    onClick={handleSaveMap} 
                    disabled={isSavingMap}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                  >
                    {isSavingMap ? "Saving..." : "UPDATE FLOOR"}
                  </Button>
                </div>
              </div>

              {/* Price comparison detail table */}
              <div className="space-y-3.5">
                <h4 className="font-bold text-slate-800 dark:text-white font-heading">Competitor Stock Breakdown</h4>
                <div className="border border-slate-200 dark:border-slate-850 rounded-lg overflow-hidden">
                  <Table className="w-full font-mono text-[10px]">
                    <TableHeader className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850">
                      <TableRow>
                        <TableHead className="text-slate-500 dark:text-slate-400">Retailer</TableHead>
                        <TableHead className="text-slate-500 dark:text-slate-400 text-right">Raw Price</TableHead>
                        <TableHead className="text-slate-500 dark:text-slate-400 text-right">Landed Cost</TableHead>
                        <TableHead className="text-slate-500 dark:text-slate-400 text-center">Regional Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-200 dark:divide-slate-850">
                      {['homedepot', 'lowes', 'wayfair', 'amazon'].map((rKey) => {
                        const pInfo = (selectedProduct.prices as any)[rKey];
                        const landed = getDisplayPrice(selectedProduct, rKey);
                        if (pInfo.price === 0) return null;
                        
                        return (
                          <TableRow key={rKey}>
                            <TableCell className="font-sans font-medium text-slate-650 dark:text-slate-350 capitalize">{rKey}</TableCell>
                            <TableCell className="text-right text-slate-800 dark:text-slate-200 font-bold">${pInfo.price}</TableCell>
                            <TableCell className="text-right text-amber-500 font-bold">${landed.toFixed(0)}</TableCell>
                            <TableCell className="text-center font-mono">
                              {pInfo.regionalStock ? (
                                <span className="space-x-1.5">
                                  <span className={pInfo.regionalStock.east ? "text-emerald-500" : "text-red-500"}>E</span>
                                  <span className={pInfo.regionalStock.midwest ? "text-emerald-500" : "text-red-500"}>M</span>
                                  <span className={pInfo.regionalStock.west ? "text-emerald-500" : "text-red-500"}>W</span>
                                </span>
                              ) : (
                                <span className="text-slate-500">Untracked</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      )}
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
                      {rcData.missedCallsList.map((call: any) => {
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
