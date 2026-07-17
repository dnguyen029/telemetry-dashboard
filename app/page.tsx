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
  DollarSign
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

  // ==========================================
  // RINGCENTRAL TELEMETRY STATE & LOGIC
  // ==========================================
  const [rcData, setRcData] = useState<any>(null);
  const [rcLoading, setRcLoading] = useState(false);
  const [rcError, setRcError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"DoD" | "MoM" | "QoQ">("MoM");

  const fetchRcMetrics = useCallback(async () => {
    setRcLoading(true);
    setRcError(null);
    try {
      const res = await fetch("/api/ringcentral");
      if (!res.ok) throw new Error(`Failed to fetch RingCentral: ${res.statusText}`);
      const payload = await res.json();
      setRcData(payload);
    } catch (err: any) {
      console.error(err);
      setRcError(err.message || "Unknown error occurred.");
    } finally {
      setRcLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRcMetrics();
    const intervalId = setInterval(() => {
      fetchRcMetrics();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [fetchRcMetrics]);

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
    <div className="flex flex-col min-h-screen bg-slate-950 font-sans text-slate-100">
      {/* Operations Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white font-heading">Ariel Bath Operations Suite</h1>
            <p className="text-[10px] font-mono text-slate-400">DEC-2026 Core Telemetry Hub</p>
          </div>
        </div>

        {/* Global tab controllers */}
        <div className="flex items-center gap-2">
          <Tabs value={activeSuiteTab} onValueChange={setActiveSuiteTab} className="w-auto">
            <TabsList className="bg-slate-900 border border-slate-800 text-slate-400">
              <TabsTrigger value="telemetry" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs font-mono tracking-wider">
                CALL TELEMETRY
              </TabsTrigger>
              <TabsTrigger value="competitor" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-xs font-mono tracking-wider">
                COMPETITOR PRICING
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Main Suite Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        
        {/* ==========================================
            VIEW: RINGCENTRAL TELEMETRY
            ========================================== */}
        {activeSuiteTab === "telemetry" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2.5">
                  Call Operations Control
                  {rcData?.status === "fallback" && (
                    <Badge variant="outline" className="text-[9px] font-mono text-amber-500 border-amber-500/20 bg-amber-500/5">
                      FALLBACK SIMULATION
                    </Badge>
                  )}
                </h2>
                <p className="text-xs text-slate-400">
                  Active Connection: <span className="text-blue-400 font-mono font-medium">{rcData?.integrationSource || "Locating..."}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-500">
                  Update: {rcData?.lastUpdated ? new Date(rcData.lastUpdated).toLocaleTimeString() : "Pending"}
                </span>
                <Button 
                  onClick={fetchRcMetrics} 
                  disabled={rcLoading}
                  variant="outline"
                  size="sm"
                  className="bg-slate-900 border-slate-800 text-xs text-slate-200 hover:bg-slate-850 hover:text-white"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-2 ${rcLoading ? "animate-spin text-blue-500" : ""}`} />
                  {rcLoading ? "Refreshing..." : "REFRESH LIVE"}
                </Button>
              </div>
            </div>

            {rcError && (
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>Error communicating with RingCentral: {rcError}. Rendering cached/simulated baseline.</span>
              </div>
            )}

            {/* KPI Cards */}
            {rcData?.metrics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">Today's Call Volume</CardTitle>
                    <Phone className="w-4 h-4 text-blue-500" />
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    <div className="text-3xl font-bold text-white font-mono">{rcData.metrics.totalCallsToday}</div>
                    <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-2">
                      <span className="text-emerald-500 font-semibold">{rcData.metrics.answeredCalls} Ans</span>
                      <span>•</span>
                      <span className="text-red-400 font-semibold">{rcData.metrics.missedCalls} Miss</span>
                      <span>•</span>
                      <span className="text-amber-500 font-semibold">{rcData.metrics.abandonedCalls || 0} Aband</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">Active Queue Lines</CardTitle>
                    <BarChart2 className="w-4 h-4 text-amber-500" />
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    <div className="text-3xl font-bold text-amber-500 font-mono">{rcData.metrics.activeQueueCount}</div>
                    <div className="text-[9px] text-slate-400 space-y-0.5 border-t border-slate-800 pt-1.5">
                      {rcData.activeQueues && rcData.activeQueues.length > 0 ? (
                        rcData.activeQueues.map((q: any, idx: number) => (
                          <div key={idx} className="flex justify-between gap-2 font-mono">
                            <span className="truncate max-w-[130px]">{q.name.split(" (")[0]}:</span>
                            <strong className="text-slate-200">{q.count}</strong>
                          </div>
                        ))
                      ) : (
                        <p>No queued connections</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">Average Wait Time</CardTitle>
                    <Clock className="w-4 h-4 text-slate-400" />
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    <div className="text-3xl font-bold text-white font-mono">{rcData.metrics.avgWaitSeconds}s</div>
                    <p className="text-[10px] text-slate-400">Target SLA threshold: &lt; 60 seconds</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">Agents Online</CardTitle>
                    <Users className="w-4 h-4 text-blue-400" />
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    <div className="text-3xl font-bold text-white font-mono">{rcData.metrics.agentsOnline}</div>
                    <p className="text-[10px] text-slate-400">Active Extensions monitored: {rcData.extensions?.length || 0}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Performance charts and grids */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Telemetry charts column */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
                  <h3 className="font-bold text-sm text-white">Call Volume Trend (Hourly)</h3>
                  <div className="h-[240px]">
                    {rcData?.hourlyTrends && <CallsByHourChart hourlyTrends={rcData.hourlyTrends} />}
                  </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {rcData?.hotspotData && (
                    <HotspotsHeatmap hotspotData={rcData.hotspotData} />
                  )}
                  {rcData?.dailyTrends && (
                    <DailyTrendChart dailyTrends={rcData.dailyTrends} />
                  )}
                </div>
              </div>

              {/* Performance sidebar */}
              <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-white">Product Spec Support Allocations</CardTitle>
                    <CardDescription className="text-[11px] text-slate-400">Missed calls distributed by queue priority</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {rcData?.queue8Allocations && (
                      <div className="space-y-3.5">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400">Product Specs:</span>
                            <strong className="text-white">{rcData.queue8Allocations.productSpecs} calls ({getPercent(rcData.queue8Allocations.productSpecs)}%)</strong>
                          </div>
                          <Progress value={getPercent(rcData.queue8Allocations.productSpecs)} className="h-1.5 bg-slate-800" />
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400">Damages & Defects:</span>
                            <strong className="text-white">{rcData.queue8Allocations.damagesDefects} calls ({getPercent(rcData.queue8Allocations.damagesDefects)}%)</strong>
                          </div>
                          <Progress value={getPercent(rcData.queue8Allocations.damagesDefects)} className="h-1.5 bg-slate-800" />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400">WISMO Order Status:</span>
                            <strong className="text-white">{rcData.queue8Allocations.wismo} calls ({getPercent(rcData.queue8Allocations.wismo)}%)</strong>
                          </div>
                          <Progress value={getPercent(rcData.queue8Allocations.wismo)} className="h-1.5 bg-slate-800" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Queue Active List */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-white">Active Queue Monitoring</CardTitle>
                    <CardDescription className="text-[11px] text-slate-400">Extensions status and lines logs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {rcData?.extensions && (
                      <div className="divide-y divide-slate-800 max-h-[300px] overflow-y-auto pr-1">
                        {rcData.extensions.map((ext: any) => (
                          <div key={ext.id} className="py-2.5 flex justify-between items-center text-xs font-mono">
                            <div className="space-y-0.5">
                              <span className="text-slate-350 block font-medium font-sans">{ext.name}</span>
                              <span className="text-[10px] text-slate-500">Ext {ext.extensionNumber} • {ext.type}</span>
                            </div>
                            <Badge className={
                              ext.status === "Closed" 
                                ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }>
                              {ext.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>

          </div>
        )}

        {/* ==========================================
            VIEW: COMPETITOR PRICING
            ========================================== */}
        {activeSuiteTab === "competitor" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Header info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2.5">
                  MAP & Competitor Monitoring Dashboard
                  <Badge variant="outline" className="text-[9px] font-mono text-emerald-400 border-emerald-500/20 bg-emerald-500/5">
                    MAP Compliance: {complianceRate}%
                  </Badge>
                </h2>
                <p className="text-xs text-slate-400">
                  Track retail prices, stock shortages, and MAP violations across leading marketplaces.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Landed Cost Toggle */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
                  <Sliders className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-slate-300 font-mono text-[10px]">LANDED COST SIMULATION</span>
                  <input 
                    type="checkbox" 
                    checked={isLandedCost}
                    onChange={(e) => setIsLandedCost(e.target.checked)}
                    className="w-3.5 h-3.5 accent-amber-500 rounded border-slate-700 bg-slate-800"
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

            {/* Simulated freight cost slider if toggled */}
            {isLandedCost && (
              <Card className="bg-slate-900 border-amber-500/20 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    Landed Cost Configurations
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Add simulated freight pricing & minus active retailer cart coupons for evaluation.
                  </p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <span className="text-xs font-mono text-slate-350">Simulated Freight:</span>
                  <input 
                    type="range" 
                    min="50" 
                    max="300" 
                    value={simulatedFreight} 
                    onChange={(e) => setSimulatedFreight(parseInt(e.target.value))}
                    className="w-40 accent-amber-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <strong className="text-amber-500 font-mono text-sm">${simulatedFreight}</strong>
                </div>
              </Card>
            )}

            {/* Pricing KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">Monitored Models</CardTitle>
                  <ShoppingBag className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white font-mono">{totalMonitored}</div>
                  <p className="text-[10px] text-slate-400 mt-1">Active Ariel Bath vanities & catalog models</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">MAP Violations</CardTitle>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold font-mono ${activeViolations > 0 ? "text-red-500" : "text-white"}`}>
                    {activeViolations}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Retail prices listing below MAP threshold</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">OOS Alerts</CardTitle>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white font-mono">{outOfStockAlerts}</div>
                  <p className="text-[10px] text-slate-400 mt-1">Active retail listings showing out-of-stock</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">Compliance Score</CardTitle>
                  <Percent className="w-4 h-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-500 font-mono">{complianceRate}%</div>
                  <p className="text-[10px] text-slate-400 mt-1">Overall pricing compliance threshold rating</p>
                </CardContent>
              </Card>
            </div>

            {/* Grid layout containing the Pricing table and Copilot */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              
              {/* Pricing Grid */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Grid Filters */}
                <div className="flex border-b border-slate-900 pb-3 space-x-6">
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
                          ? "text-amber-500 border-amber-500 font-bold"
                          : "text-slate-400 border-transparent hover:text-slate-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Table View */}
                <Card className="bg-slate-900 border-slate-800 overflow-hidden">
                  <Table className="w-full text-xs font-sans border-collapse">
                    <TableHeader className="bg-slate-950 font-mono text-[10px] uppercase border-b border-slate-850">
                      <TableRow>
                        <TableHead className="text-slate-400">Product Model</TableHead>
                        <TableHead className="text-slate-400 text-right">MAP Floor</TableHead>
                        <TableHead className="text-slate-400 text-right">Home Depot</TableHead>
                        <TableHead className="text-slate-400 text-right">Lowe's</TableHead>
                        <TableHead className="text-slate-400 text-right">Wayfair</TableHead>
                        <TableHead className="text-slate-400 text-right">Amazon</TableHead>
                        <TableHead className="text-slate-400 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-850">
                      {displayProducts.map((prod) => (
                        <TableRow key={prod.model} className="hover:bg-slate-850/30 transition-colors">
                          <TableCell className="py-3">
                            <div className="font-medium text-slate-100">{prod.name.split(" Single")[0].split(" Double")[0]}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{prod.model} • UPC: {prod.upc}</div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-slate-200">${prod.mapPrice.toFixed(0)}</TableCell>
                          
                          {/* Retailers */}
                          {['homedepot', 'lowes', 'wayfair', 'amazon'].map((rKey) => {
                            const val = getDisplayPrice(prod, rKey);
                            const pInfo = (prod.prices as any)[rKey];
                            const isViolating = val > 0 && val < prod.mapPrice;
                            
                            return (
                              <TableCell key={rKey} className="text-right font-mono">
                                {val === 0 ? (
                                  <span className="text-slate-600">N/A</span>
                                ) : (
                                  <div className="space-y-0.5">
                                    <span className={`font-semibold ${isViolating ? "text-red-500 font-bold" : "text-slate-200"}`}>
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
                              className="h-7 text-[10px] bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300"
                            >
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>

              {/* AI Pricing Copilot Side Drawer (Embedded) */}
              <div className="lg:col-span-1">
                <Card className="bg-slate-900 border-slate-800 flex flex-col h-[520px] overflow-hidden">
                  <CardHeader className="bg-slate-950/40 p-4 border-b border-slate-850">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-xs font-bold text-white uppercase font-mono">PRICING COPILOT</CardTitle>
                        <CardDescription className="text-[10px] text-slate-400">Gemini 3.5 Assistant</CardDescription>
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
                            ? "bg-blue-600/10 border border-blue-500/20 text-slate-200 ml-6" 
                            : "bg-slate-950 border border-slate-850 text-slate-300 mr-6"
                        }`}
                      >
                        <div className="font-mono text-[9px] text-slate-400 uppercase mb-1">
                          {msg.sender === "user" ? "You" : "Pricing Copilot"}
                        </div>
                        <p className="whitespace-pre-wrap font-sans leading-normal">{msg.text}</p>
                      </div>
                    ))}
                    {isCopilotSending && (
                      <div className="text-slate-400 font-mono text-[10px] animate-pulse">
                        Analyzing price cache...
                      </div>
                    )}
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendCopilotMessage} className="p-3 border-t border-slate-850 bg-slate-950/20 flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Ask about compliance or out-of-stock..." 
                      value={newCopilotMessage}
                      onChange={(e) => setNewCopilotMessage(e.target.value)}
                      disabled={isCopilotSending}
                      className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-600"
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

      {/* Details modal / MAP Editor Dialog */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="bg-slate-900 border-slate-800 max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="bg-slate-950 p-5 flex flex-row justify-between items-start">
              <div>
                <CardTitle className="text-sm font-bold text-white font-heading">{selectedProduct.name}</CardTitle>
                <CardDescription className="text-[10px] font-mono text-slate-400 mt-1">SKU: {selectedProduct.model} • UPC: {selectedProduct.upc}</CardDescription>
              </div>
              <Button 
                onClick={() => setSelectedProduct(null)}
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-xs">
              
              {/* MAP Price floor Editor */}
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-850 space-y-3">
                <h4 className="font-bold text-white font-heading">Configure MAP Floor</h4>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                    <input 
                      type="number" 
                      value={editingMapValue} 
                      onChange={(e) => setEditingMapValue(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-3 py-1.5 text-white font-mono text-sm focus:outline-none"
                    />
                  </div>
                  <Button 
                    onClick={handleSaveMap} 
                    disabled={isSavingMap}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {isSavingMap ? "Saving..." : "UPDATE FLOOR"}
                  </Button>
                </div>
              </div>

              {/* Price comparison detail table */}
              <div className="space-y-3.5">
                <h4 className="font-bold text-white font-heading">Competitor Stock Breakdown</h4>
                <div className="border border-slate-850 rounded-lg overflow-hidden">
                  <Table className="w-full font-mono text-[10px]">
                    <TableHeader className="bg-slate-950">
                      <TableRow>
                        <TableHead className="text-slate-400">Retailer</TableHead>
                        <TableHead className="text-slate-400 text-right">Raw Price</TableHead>
                        <TableHead className="text-slate-400 text-right">Landed Cost</TableHead>
                        <TableHead className="text-slate-400 text-center">Regional Stock (E/M/W)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-850">
                      {['homedepot', 'lowes', 'wayfair', 'amazon'].map((rKey) => {
                        const pInfo = (selectedProduct.prices as any)[rKey];
                        const landed = getDisplayPrice(selectedProduct, rKey);
                        if (pInfo.price === 0) return null;
                        
                        return (
                          <TableRow key={rKey}>
                            <TableCell className="font-sans font-medium text-slate-350 capitalize">{rKey}</TableCell>
                            <TableCell className="text-right text-slate-200 font-bold">${pInfo.price}</TableCell>
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
    </div>
  );
}
