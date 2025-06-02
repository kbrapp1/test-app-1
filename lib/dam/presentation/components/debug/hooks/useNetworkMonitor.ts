/**
 * Network Monitor Hook
 * 
 * Application hook for state coordination
 * Single responsibility: Coordinate state between services and UI
 */

import { useState, useEffect, useCallback } from 'react';
import { CallAnalysis } from '@/lib/utils/network-monitor';
import { NetworkMonitorService, NetworkCall } from '../services/NetworkMonitorService';
import { ReportGenerationService } from '../services/ReportGenerationService';

export interface ActionMarker {
  name: string;
  timestamp: number;
  timeString: string;
}

export function useNetworkMonitor() {
  const [calls, setCalls] = useState<NetworkCall[]>([]);
  const [analysis, setAnalysis] = useState<CallAnalysis | null>(null);
  const [actions, setActions] = useState<ActionMarker[]>([]);
  const [currentAction, setCurrentAction] = useState<string>('Page Load');
  const [monitorService, setMonitorService] = useState<NetworkMonitorService | null>(null);
  const [reportService] = useState(() => new ReportGenerationService());

  const handleCallDetected = useCallback((call: NetworkCall) => {
    setCalls(prev => [...prev.slice(-50), call]); // Keep last 50 calls
  }, []);

  const handleActionDetected = useCallback((action: string) => {
    setCurrentAction(action);
    setActions(prev => [...prev.slice(-10), {
      name: action,
      timestamp: Date.now(),
      timeString: new Date().toLocaleTimeString()
    }]);
  }, []);

  const initializeMonitoring = useCallback(() => {
    if (monitorService) return monitorService;

    const service = new NetworkMonitorService(
      handleCallDetected,
      handleActionDetected
    );
    
    service.startMonitoring(currentAction);
    setMonitorService(service);
    return service;
  }, [currentAction, handleCallDetected, handleActionDetected]);

  const analyzeRedundancy = useCallback(() => {
    if (!monitorService) return;
    
    const analysisResult = monitorService.analyzeRedundancy(5000);
    setAnalysis(analysisResult);
  }, [monitorService]);

  const analyzeCurrentAction = useCallback(() => {
    if (!monitorService) return;
    
    const analysisResult = monitorService.analyzeRedundancy(5000);
    if (!analysisResult) return;

    // Filter the results to current action
    const filteredAnalysis = {
      ...analysisResult,
      redundantCalls: analysisResult.redundantCalls.filter(call => 
        calls.find(c => c.url === call.url && c.method === call.method && c.actionContext === currentAction)
      ),
      timeAnalysis: {
        ...analysisResult.timeAnalysis,
        rapidFireCalls: analysisResult.timeAnalysis.rapidFireCalls.filter(group =>
          calls.find(c => c.url === group[0]?.url && c.actionContext === currentAction)
        )
      }
    };
    
    setAnalysis(filteredAnalysis);
  }, [monitorService, calls, currentAction]);

  const copyAnalysis = useCallback(async () => {
    if (!analysis) return false;
    
    const success = await reportService.generateAndCopyReport(analysis, calls, currentAction);
    return success;
  }, [analysis, calls, currentAction, reportService]);

  const markAction = useCallback((actionName: string) => {
    const marker: ActionMarker = {
      name: actionName,
      timestamp: Date.now(),
      timeString: new Date().toLocaleTimeString()
    };
    
    setActions(prev => [...prev.slice(-10), marker]);
    setCurrentAction(actionName);
  }, []);

  const clearAll = useCallback(() => {
    setCalls([]);
    setAnalysis(null);
    setActions([]);
    setCurrentAction('Page Load');
    
    if (monitorService) {
      monitorService.resetMonitoring();
      setMonitorService(null);
    }
  }, [monitorService]);

  const cleanup = useCallback(() => {
    if (monitorService) {
      monitorService.stopMonitoring();
    }
  }, [monitorService]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    // State
    calls,
    analysis,
    actions,
    currentAction,

    // Actions
    initializeMonitoring,
    analyzeRedundancy,
    analyzeCurrentAction,
    copyAnalysis,
    markAction,
    clearAll
  };
} 