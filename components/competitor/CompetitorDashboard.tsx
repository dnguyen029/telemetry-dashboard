"use client";

import React, { useState, useEffect } from "react";
import { 
  Sliders, 
  RefreshCw, 
  ShoppingBag, 
  AlertTriangle, 
  Percent, 
  Send,
  X 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompetitorProduct } from "@/lib/competitorData";
import { isValidVanityMatch } from "@/lib/priceFilters";

const RETAILERS = ['homedepot', 'lowes', 'wayfair', 'amazon', 'walmart', 'ebay', 'target', 'bestbuy'];

interface CompetitorDashboardProps {
  products: CompetitorProduct[];
  setProducts: React.Dispatch<React.SetStateAction<CompetitorProduct[]>>;
  isPricingLoading: boolean;
  pricingCacheError: string | null;
  onRetry: () => void;
  lastSyncedTime: string | null;
  setLastSyncedTime: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function CompetitorDashboard({
  products,
  setProducts,
  isPricingLoading,
  pricingCacheError,
  onRetry,
  lastSyncedTime,
  setLastSyncedTime
}: CompetitorDashboardProps) {
  const [selectedProduct, setSelectedProduct] = useState<CompetitorProduct | null>(null);
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
  const [newCopilotMessage, setNewCopilotMessage] = useState("");
  const [isCopilotSending, setIsCopilotSending] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<Array<{ sender: "user" | "assistant"; text: string }>>([
    {
      sender: "assistant",
      text: "Hi! I'm your Ariel Bath Pricing Copilot. I have full access to your pricing grid. Ask me to analyze stock outages, calculate margins, or draft compliance notices."
    }
  ]);

  // Helper to calculate display price based on simulation settings
  const getDisplayPrice = (product: CompetitorProduct, retailerKey: string) => {
    const priceInfo = product.prices[retailerKey];
    if (!priceInfo || priceInfo.price === 0) return 0;
    
    if (isLandedCost) {
      return Math.max(0, priceInfo.price + simulatedFreight - (priceInfo.coupon || 0));
    }
    return priceInfo.price;
  };

  const hasOutage = (prod: CompetitorProduct) => {
    return Object.values(prod.prices).some((retailer) => {
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
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to get reply.";
      setCopilotMessages(prev => [...prev, { sender: "assistant", text: `Error: ${errMsg}` }]);
    } finally {
      setIsCopilotSending(false);
    }
  };



  const handleSaveMap = async () => {
    const newPrice = parseFloat(editingMapValue);
    if (isNaN(newPrice) || newPrice <= 0) {
      alert("Please enter a valid positive number for the MAP price.");
      return;
    }

    setIsSavingMap(true);
    try {
      const updatedProducts = products.map((p) => {
        if (p.model === selectedProduct!.model) {
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
      setSelectedProduct((prev) => prev ? { ...prev, mapPrice: newPrice } : null);
      alert("MAP price successfully updated!");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(`Error updating MAP: ${errMsg}`);
    } finally {
      setIsSavingMap(false);
    }
  };

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
                const offerPrice = offer.price !== null && offer.price !== undefined && offer.price > 0 ? offer.price : 0;
                
                // Validate match using heuristics
                const isValid = isValidVanityMatch(offer.url, offerPrice, product.mapPrice);

                if (isValid) {
                  product.prices[retailerKey].price = offerPrice;
                  product.prices[retailerKey].inStock = offer.in_stock !== false;
                  if (offer.url) {
                    product.prices[retailerKey].url = offer.url;
                  }
                } else {
                  // Mismatched or invalid listing price, set to 0 (N/A)
                  product.prices[retailerKey].price = 0;
                  product.prices[retailerKey].inStock = false;
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
      setLastSyncedTime(new Date().toISOString());
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(`Sync error: ${errMsg}`);
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
      const pInfo = p.prices[key];
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

  // Render skeleton loading state
  if (isPricingLoading) {
    return (
      <div className="space-y-6 animate-pulse p-1">
        <div className="flex justify-between items-center pb-5 border-b border-slate-200 dark:border-slate-900">
          <div className="space-y-2">
            <div className="h-6 w-72 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
          <div className="h-9 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass-card shadow-sm border-slate-200 dark:border-slate-900">
              <CardHeader className="pb-2">
                <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
                <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  // Render error state
  if (pricingCacheError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-10 h-10 text-red-500 animate-bounce" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white">Pricing Data Unreachable</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono text-center max-w-md">
          {pricingCacheError}
        </p>
        <Button onClick={onRetry} variant="outline" size="sm" className="font-mono text-xs mt-2 border-slate-300 dark:border-slate-800">
          <RefreshCw className="w-3.5 h-3.5 mr-2" /> Retry Fetch
        </Button>
      </div>
    );
  }

  return (
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

          {lastSyncedTime && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono self-center mr-2">
              LAST SYNCED: {new Date(lastSyncedTime).toLocaleString()}
            </span>
          )}

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
            {([
              { id: "all", label: "ALL PRODUCTS" },
              { id: "violations", label: "ACTIVE VIOLATIONS" },
              { id: "outages", label: "STOCK OUTAGES" }
            ] as const).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveGridFilter(filter.id)}
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
                    <TableHead className="text-slate-500 dark:text-slate-400 text-right">{"Lowe's"}</TableHead>
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
                        const pInfo = prod.prices[rKey];
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
                          onClick={() => {
                            setSelectedProduct(prod);
                            setEditingMapValue(prod.mapPrice.toString());
                          }}
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] bg-white dark:bg-slate-950 border-slate-250 dark:border-slate-800 hover:bg-slate-105 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
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
                className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-amber-605"
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
                onClick={() => {
                  setSelectedProduct(null);
                  setEditingMapValue("");
                }}
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
                        const pInfo = selectedProduct!.prices[rKey];
                        const landed = getDisplayPrice(selectedProduct!, rKey);
                        if (!pInfo || pInfo.price === 0) return null;
                        
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
    </div>
  );
}
