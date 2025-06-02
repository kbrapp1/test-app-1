'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe,
  Server,
  Database,
  Wifi,
  WifiOff,
  Pause,
  Play,
  Trash2,
  Eye
} from 'lucide-react';
import { globalNetworkMonitor, NetworkStats, NetworkCall, RedundantCall } from '../services/GenericNetworkMonitor';
import { networkInterceptors } from '../services/NetworkInterceptors';

/**
 * Generic Network Monitor UI
 * 
 * Universal network monitoring component that can track:
 * - Server Actions
 * - API Routes  
 * - Fetch requests
 * - XMLHttpRequest calls
 * - Any HTTP requests
 */

interface GenericNetworkMonitorUIProps {
  isFullPage?: boolean;
}

export function GenericNetworkMonitorUI({ isFullPage = false }: GenericNetworkMonitorUIProps) {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [isOpen, setIsOpen] = useState(isFullPage ? true : false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const refreshStats = async () => {
      if (!autoRefresh) return;
      setIsRefreshing(true);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for visual feedback
      setStats(globalNetworkMonitor.getStats());
      setIsRefreshing(false);
    };

    refreshStats();

    if (autoRefresh) {
      const interval = setInterval(refreshStats, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen, autoRefresh]);

  const handleClear = () => {
    globalNetworkMonitor.clear();
    setStats(globalNetworkMonitor.getStats());
  };

  const handleToggleInterceptors = () => {
    if (networkInterceptors['isInstalled']) {
      networkInterceptors.uninstall();
    } else {
      networkInterceptors.install();
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setStats(globalNetworkMonitor.getStats());
      setIsRefreshing(false);
    }, 300);
  };

  // Floating widget when not full page
  if (!isOpen && !isFullPage) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 group"
          size="lg"
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Activity className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              {stats && stats.redundantCalls > 0 && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Network Monitor</span>
              {stats && (
                <span className="text-xs opacity-90">
                  {stats.totalCalls} calls
                  {stats.redundantCalls > 0 && (
                    <span className="ml-1 text-red-200">• {stats.redundantCalls} redundant</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={`${
        isFullPage 
          ? "w-full min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" 
          : "fixed bottom-6 right-6 z-50 w-[900px] max-h-[700px] shadow-2xl"
      } transition-all duration-500`}
    >
      <Card className={`${
        isFullPage 
          ? "w-full border-0 shadow-none bg-transparent" 
          : "w-full border-2 border-blue-100 bg-white/95 backdrop-blur-sm"
      }`}>
        {/* Header */}
        <CardHeader className={`${isFullPage ? "pb-6" : "pb-4"} border-b border-gray-100`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Network Monitor
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Real-time network activity tracking
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                className="transition-all duration-200"
              >
                {autoRefresh ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {autoRefresh ? 'Auto' : 'Manual'}
              </Button>
              
              <Button
                onClick={handleToggleInterceptors}
                variant={networkInterceptors['isInstalled'] ? 'default' : 'outline'}
                size="sm"
                className={networkInterceptors['isInstalled'] 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "border-red-300 text-red-600 hover:bg-red-50"
                }
              >
                {networkInterceptors['isInstalled'] ? <Wifi className="w-4 h-4 mr-2" /> : <WifiOff className="w-4 h-4 mr-2" />}
                {networkInterceptors['isInstalled'] ? 'Monitoring' : 'Disabled'}
              </Button>

              <Button 
                onClick={handleManualRefresh} 
                variant="ghost" 
                size="sm"
                disabled={isRefreshing}
                className="transition-all duration-200"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>

              {!isFullPage && (
                <Button 
                  onClick={() => setIsOpen(false)} 
                  variant="ghost" 
                  size="sm"
                  className="hover:bg-red-50 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className={`${isFullPage ? "p-8" : "p-6"} space-y-6`}>
          {!stats ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Network Statistics</h3>
              <p className="text-gray-500">Gathering network activity data...</p>
            </div>
          ) : (
            <>
              {/* Quick Stats Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Calls"
                  value={stats.totalCalls}
                  icon={<Globe className="w-5 h-5" />}
                  gradient="from-blue-500 to-blue-600"
                  subtitle="All requests"
                />
                <StatCard
                  title="Active Issues"
                  value={stats.redundantCalls}
                  icon={<AlertTriangle className="w-5 h-5" />}
                  gradient="from-red-500 to-red-600"
                  subtitle="Redundant calls"
                  isAlert={stats.redundantCalls > 0}
                />
                <StatCard
                  title="Session Total"
                  value={stats.persistentRedundantCount}
                  icon={<BarChart3 className="w-5 h-5" />}
                  gradient="from-orange-500 to-orange-600"
                  subtitle="All detected issues"
                />
                <StatCard
                  title="Efficiency"
                  value={`${(100 - stats.sessionRedundancyRate).toFixed(1)}%`}
                  icon={stats.sessionRedundancyRate < 10 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  gradient={stats.sessionRedundancyRate < 10 ? "from-green-500 to-green-600" : "from-yellow-500 to-yellow-600"}
                  subtitle="Network efficiency"
                />
              </div>

              {/* Alert Section */}
              {stats.persistentRedundantCount > 0 && (
                <Alert 
                  variant={stats.redundantCalls > 0 ? "destructive" : "default"}
                  className={`border-l-4 ${
                    stats.redundantCalls > 0 
                      ? 'border-l-red-500 bg-red-50' 
                      : 'border-l-yellow-500 bg-yellow-50'
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                  <AlertDescription className="text-sm">
                    {stats.redundantCalls > 0 ? (
                      <div>
                        <strong className="text-red-800">
                          {stats.redundantCalls} active redundant calls detected!
                        </strong>
                        <div className="mt-1 text-red-700">
                          Current redundancy rate: {stats.redundancyRate.toFixed(1)}%
                        </div>
                      </div>
                    ) : (
                      <div>
                        <strong className="text-yellow-800">
                          Session detected {stats.persistentRedundantCount} redundant calls
                        </strong>
                        <div className="mt-1 text-yellow-700">
                          Overall session rate: {stats.sessionRedundancyRate.toFixed(1)}% - No active issues
                        </div>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Main Content Tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger 
                    value="overview" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="recent"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Recent
                  </TabsTrigger>
                  <TabsTrigger 
                    value="redundant"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Active Issues
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    History
                  </TabsTrigger>
                  <TabsTrigger 
                    value="types"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <Server className="w-4 h-4 mr-2" />
                    Types
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                  <OverviewTab stats={stats} onClear={handleClear} />
                  <RecentCallsTab stats={stats} />
                  <RedundantPatternsTab stats={stats} />
                  <HistoryTab />
                  <TypesTab stats={stats} />
                </div>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  icon, 
  gradient, 
  subtitle, 
  isAlert = false 
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  gradient: string;
  subtitle: string;
  isAlert?: boolean;
}) {
  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
      isAlert ? 'ring-2 ring-red-200 animate-pulse' : 'hover:scale-105'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${gradient} flex items-center justify-center text-white`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Tab Components
function OverviewTab({ stats, onClear }: { stats: NetworkStats; onClear: () => void }) {
  return (
    <TabsContent value="overview" className="space-y-6 mt-0">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">Network Overview</h3>
        <div className="flex gap-3">
          <Button 
            onClick={() => globalNetworkMonitor.clearCalls()} 
            variant="outline" 
            size="sm"
            className="hover:bg-blue-50"
          >
            <Eye className="w-4 h-4 mr-2" />
            Clear Calls
          </Button>
          <Button 
            onClick={onClear} 
            variant="outline" 
            size="sm"
            className="hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Call Types */}
        <Card className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Server className="w-5 h-5 mr-2 text-blue-600" />
            Call Types Distribution
          </h4>
          <div className="space-y-4">
            {Object.entries(stats.callsByType).map(([type, count]) => {
              const percentage = (count / stats.totalCalls) * 100;
              return (
                <div key={type} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="capitalize font-medium text-gray-700">{type.replace('-', ' ')}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">{count}</Badge>
                      <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </Card>
        
        {/* Session Statistics */}
        <Card className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
            Session Performance
          </h4>
          <div className="space-y-4">
            <MetricRow 
              label="Current Efficiency" 
              value={`${((stats.totalCalls - stats.redundantCalls) / Math.max(stats.totalCalls, 1) * 100).toFixed(1)}%`}
              isGood={(stats.totalCalls - stats.redundantCalls) / Math.max(stats.totalCalls, 1) * 100 > 90}
            />
            <MetricRow 
              label="Session Efficiency" 
              value={`${(100 - stats.sessionRedundancyRate).toFixed(1)}%`}
              isGood={stats.sessionRedundancyRate < 10}
            />
            <MetricRow 
              label="Active Patterns" 
              value={stats.redundantPatterns.length.toString()}
              isGood={stats.redundantPatterns.length === 0}
            />
            <MetricRow 
              label="Total Patterns Detected" 
              value={globalNetworkMonitor.getAllRedundancies().length.toString()}
              isGood={globalNetworkMonitor.getAllRedundancies().length < 5}
            />
          </div>
        </Card>
      </div>
    </TabsContent>
  );
}

function MetricRow({ label, value, isGood }: { label: string; value: string; isGood: boolean }) {
  return (
    <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-semibold">{value}</span>
        {isGood ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-red-500" />
        )}
      </div>
    </div>
  );
}

function RecentCallsTab({ stats }: { stats: NetworkStats }) {
  return (
    <TabsContent value="recent" className="space-y-4 mt-0">
      <h3 className="text-xl font-semibold text-gray-900 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-blue-600" />
        Recent Network Calls
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {stats.recentCalls.map((call) => (
          <RecentCallCard key={call.id} call={call} />
        ))}
        {stats.recentCalls.length === 0 && (
          <EmptyState 
            icon={<Clock className="w-8 h-8" />}
            title="No recent calls"
            description="Network calls will appear here as they happen"
          />
        )}
      </div>
    </TabsContent>
  );
}

function RedundantPatternsTab({ stats }: { stats: NetworkStats }) {
  return (
    <TabsContent value="redundant" className="space-y-4 mt-0">
      <h3 className="text-xl font-semibold text-gray-900 flex items-center">
        <Zap className="w-5 h-5 mr-2 text-red-600" />
        Active Redundant Patterns
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {stats.redundantPatterns.map((pattern, index) => (
          <RedundantPatternCard key={index} pattern={pattern} />
        ))}
        {stats.redundantPatterns.length === 0 && (
          <EmptyState 
            icon={<CheckCircle className="w-8 h-8 text-green-500" />}
            title="No active redundant patterns"
            description="Great! Your network usage is optimized"
            isSuccess
          />
        )}
      </div>
    </TabsContent>
  );
}

function HistoryTab() {
  return (
    <TabsContent value="history" className="space-y-4 mt-0">
      <h3 className="text-xl font-semibold text-gray-900 flex items-center">
        <Activity className="w-5 h-5 mr-2 text-purple-600" />
        Session Redundancy History
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {globalNetworkMonitor.getAllRedundancies().map((pattern, index) => (
          <HistoricalPatternCard key={index} pattern={pattern} />
        ))}
        {globalNetworkMonitor.getAllRedundancies().length === 0 && (
          <EmptyState 
            icon={<CheckCircle className="w-8 h-8 text-green-500" />}
            title="No redundancy detected"
            description="Perfect session with no duplicate network calls"
            isSuccess
          />
        )}
      </div>
    </TabsContent>
  );
}

function TypesTab({ stats }: { stats: NetworkStats }) {
  return (
    <TabsContent value="types" className="space-y-4 mt-0">
      <h3 className="text-xl font-semibold text-gray-900 flex items-center">
        <Server className="w-5 h-5 mr-2 text-indigo-600" />
        Network Calls by Type
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(stats.callsByType).map(([type, count]) => {
          const typePercentage = (count / stats.totalCalls) * 100;
          const getTypeInfo = (type: string) => {
            switch (type) {
              case 'server-action': return { color: 'blue', icon: <Database className="w-5 h-5" /> };
              case 'api-route': return { color: 'green', icon: <Server className="w-5 h-5" /> };
              case 'fetch': return { color: 'purple', icon: <Globe className="w-5 h-5" /> };
              default: return { color: 'gray', icon: <Activity className="w-5 h-5" /> };
            }
          };
          const typeInfo = getTypeInfo(type);
          
          return (
            <Card key={type} className="p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg bg-${typeInfo.color}-100 flex items-center justify-center text-${typeInfo.color}-600`}>
                    {typeInfo.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 capitalize">{type.replace('-', ' ')}</h4>
                    <p className="text-sm text-gray-500">{count} calls total</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg font-semibold">{count}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Percentage of total</span>
                  <span className="font-medium">{typePercentage.toFixed(1)}%</span>
                </div>
                <Progress value={typePercentage} className="h-3" />
              </div>
            </Card>
          );
        })}
      </div>
    </TabsContent>
  );
}

// Enhanced Card Components
function RecentCallCard({ call }: { call: NetworkCall }) {
  const getStatusColor = (status?: number) => {
    if (!status) return 'bg-gray-100 text-gray-600';
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-700';
    if (status >= 400) return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'server-action': return 'bg-blue-100 text-blue-700';
      case 'api-route': return 'bg-green-100 text-green-700';
      case 'fetch': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="p-4 hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Badge className={`${getTypeColor(call.type)} text-xs font-medium`}>
            {call.type}
          </Badge>
          {call.status && (
            <Badge className={`${getStatusColor(call.status)} text-xs font-medium`}>
              {call.status}
            </Badge>
          )}
        </div>
        <div className="text-sm font-medium text-gray-600 flex-shrink-0">
          {call.duration ? `${call.duration}ms` : (
            <span className="flex items-center">
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              pending
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-900">
          <div className="flex items-start space-x-2">
            <span className="font-semibold text-blue-600 flex-shrink-0">{call.method}</span>
            <div 
              className="break-all text-left"
              title={call.url}
              style={{ 
                wordBreak: 'break-all',
                overflowWrap: 'break-word',
                maxWidth: '100%'
              }}
            >
              {call.url}
            </div>
          </div>
        </div>
        {call.error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            <strong>Error:</strong> 
            <div 
              className="mt-1"
              style={{ 
                wordBreak: 'break-all',
                overflowWrap: 'break-word'
              }}
              title={call.error}
            >
              {call.error.length > 200 ? `${call.error.substring(0, 200)}...` : call.error}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function RedundantPatternCard({ pattern }: { pattern: RedundantCall }) {
  return (
    <Card className="p-4 border-l-4 border-l-red-400 bg-red-50 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Badge variant="destructive" className="font-medium">{pattern.pattern}</Badge>
          <Badge variant="outline" className="bg-white">
            {pattern.duplicateCalls.length + 1} calls
          </Badge>
        </div>
        <div className="text-sm text-gray-600 bg-white px-2 py-1 rounded flex-shrink-0">
          {pattern.timeWindow}ms window
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-900">
          <div className="flex items-start space-x-2">
            <span className="font-semibold text-red-600 flex-shrink-0">{pattern.originalCall.method}</span>
            <div 
              className="break-all text-left"
              title={pattern.originalCall.url}
              style={{ 
                wordBreak: 'break-all',
                overflowWrap: 'break-word',
                maxWidth: '100%'
              }}
            >
              {pattern.originalCall.url}
            </div>
          </div>
        </div>
        <div className="text-xs text-red-700 bg-red-100 p-2 rounded">
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          Original call + {pattern.duplicateCalls.length} duplicate call{pattern.duplicateCalls.length !== 1 ? 's' : ''}
        </div>
      </div>
    </Card>
  );
}

function HistoricalPatternCard({ pattern }: { pattern: RedundantCall }) {
  return (
    <Card className="p-4 border-l-4 border-l-orange-400 bg-orange-50 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Badge variant="outline" className="bg-white text-orange-700 border-orange-300">
            {pattern.pattern}
          </Badge>
          <Badge variant="outline" className="bg-white">
            {pattern.duplicateCalls.length + 1} calls
          </Badge>
        </div>
        <div className="text-sm text-gray-600 bg-white px-2 py-1 rounded flex-shrink-0">
          {pattern.timeWindow}ms window
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-900">
          <div className="flex items-start space-x-2">
            <span className="font-semibold text-orange-600 flex-shrink-0">{pattern.originalCall.method}</span>
            <div 
              className="break-all text-left"
              title={pattern.originalCall.url}
              style={{ 
                wordBreak: 'break-all',
                overflowWrap: 'break-word',
                maxWidth: '100%'
              }}
            >
              {pattern.originalCall.url}
            </div>
          </div>
        </div>
        <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
          <Clock className="w-3 h-3 inline mr-1" />
          Session detected: Original + {pattern.duplicateCalls.length} duplicate{pattern.duplicateCalls.length !== 1 ? 's' : ''}
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ 
  icon, 
  title, 
  description, 
  isSuccess = false 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  isSuccess?: boolean; 
}) {
  return (
    <div className="text-center py-12">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
        isSuccess ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
      }`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </div>
  );
} 