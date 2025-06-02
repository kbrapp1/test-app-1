import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NetworkMonitorDisplay } from '../NetworkMonitorDisplay';

// Mock the super admin hook
const mockUseAuthWithSuperAdmin = vi.fn();
vi.mock('@/lib/auth/super-admin', () => ({
  useAuthWithSuperAdmin: () => mockUseAuthWithSuperAdmin()
}));

// Mock the network monitor hook
const mockUseNetworkMonitor = vi.fn();
vi.mock('../hooks/useNetworkMonitor', () => ({
  useNetworkMonitor: () => mockUseNetworkMonitor()
}));

// Mock the deduplication service using factory function
vi.mock('@/lib/dam/application/services/ApiDeduplicationService', () => ({
  apiDeduplicationService: {
    getPendingCount: vi.fn(() => 0),
    getPendingRequests: vi.fn(() => []),
    getRecentDeduplications: vi.fn(() => []),
    clearRecentDeduplications: vi.fn()
  }
}));

// Mock all the component dependencies
vi.mock('../components/ActionControlPanel', () => ({
  ActionControlPanel: ({ currentAction, actions, onMarkAction }: any) => (
    <div data-testid="action-control-panel">
      Action Control Panel - Actions: {actions?.length || 0}
    </div>
  )
}));

vi.mock('../components/AnalysisResultsPanel', () => ({
  AnalysisResultsPanel: ({ analysis }: any) => (
    <div data-testid="analysis-results-panel">
      Analysis Results Panel - Total Calls: {analysis?.totalCalls || 0}
    </div>
  )
}));

vi.mock('../components/NetworkCallsList', () => ({
  NetworkCallsList: ({ calls, currentAction }: any) => (
    <div data-testid="network-calls-list">
      Network Calls List - Calls: {calls?.length || 0}
    </div>
  )
}));

vi.mock('../components/DeduplicationPanel', () => ({
  DeduplicationPanel: ({ pendingRequests, recentDeduplications, onClearRecent }: any) => (
    <div data-testid="deduplication-panel">
      <span>Deduplication Panel - Pending: {pendingRequests?.length || 0}</span>
      <button onClick={onClearRecent} data-testid="clear-recent-button">Clear Recent</button>
    </div>
  )
}));

vi.mock('../components/ServerActionMonitor', () => ({
  ServerActionMonitor: () => (
    <div data-testid="server-action-monitor">Server Action Monitor</div>
  )
}));

describe('NetworkMonitorDisplay', () => {
  const defaultNetworkMonitorState = {
    calls: [],
    analysis: null,
    actions: [],
    currentAction: null,
    initializeMonitoring: vi.fn(),
    analyzeRedundancy: vi.fn(),
    analyzeCurrentAction: vi.fn(),
    copyAnalysis: vi.fn(() => Promise.resolve(true)),
    markAction: vi.fn(),
    clearAll: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset all timers
    vi.clearAllTimers();
    mockUseNetworkMonitor.mockReturnValue(defaultNetworkMonitorState);
    
    // Get the mocked service and reset its functions
    const { apiDeduplicationService } = await import('@/lib/dam/application/services/ApiDeduplicationService');
    vi.mocked(apiDeduplicationService.getPendingCount).mockReturnValue(0);
    vi.mocked(apiDeduplicationService.getPendingRequests).mockReturnValue([]);
    vi.mocked(apiDeduplicationService.getRecentDeduplications).mockReturnValue([]);
    vi.mocked(apiDeduplicationService.clearRecentDeduplications).mockClear();
  });

  it('should not render when loading', () => {
    mockUseAuthWithSuperAdmin.mockReturnValue({
      isSuperAdmin: true,
      loading: true
    });

    const { container } = render(<NetworkMonitorDisplay />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render for non-super admin users', () => {
    mockUseAuthWithSuperAdmin.mockReturnValue({
      isSuperAdmin: false,
      loading: false
    });

    const { container } = render(<NetworkMonitorDisplay />);
    expect(container.firstChild).toBeNull();
  });

  it('should render monitor button for super admin users', () => {
    mockUseAuthWithSuperAdmin.mockReturnValue({
      isSuperAdmin: true,
      loading: false
    });

    render(<NetworkMonitorDisplay />);
    expect(screen.getByRole('button', { name: /monitor/i })).toBeInTheDocument();
  });

  it('should show call count in button when calls exist', () => {
    mockUseAuthWithSuperAdmin.mockReturnValue({
      isSuperAdmin: true,
      loading: false
    });

    mockUseNetworkMonitor.mockReturnValue({
      ...defaultNetworkMonitorState,
      calls: [{ id: '1' }, { id: '2' }]
    });

    render(<NetworkMonitorDisplay />);
    expect(screen.getByRole('button', { name: /monitor \(2\)/i })).toBeInTheDocument();
  });

  it('should show deduplication status when pending requests exist', async () => {
    mockUseAuthWithSuperAdmin.mockReturnValue({
      isSuperAdmin: true,
      loading: false
    });

    const { apiDeduplicationService } = await import('@/lib/dam/application/services/ApiDeduplicationService');
    vi.mocked(apiDeduplicationService.getPendingCount).mockReturnValue(2);

    render(<NetworkMonitorDisplay />);
    
    await waitFor(() => {
      expect(screen.getByText('2 deduplicating...')).toBeInTheDocument();
    });
  });

  it('should open monitor panel when button is clicked', () => {
    mockUseAuthWithSuperAdmin.mockReturnValue({
      isSuperAdmin: true,
      loading: false
    });

    render(<NetworkMonitorDisplay />);
    
    const button = screen.getByRole('button', { name: /monitor/i });
    fireEvent.click(button);
    
    expect(screen.getByText('DAM Network Monitor')).toBeInTheDocument();
    expect(screen.getByText('Network Calls')).toBeInTheDocument();
    expect(screen.getByText('Server Actions')).toBeInTheDocument();
  });

  it('should show Network Calls tab content by default', () => {
    mockUseAuthWithSuperAdmin.mockReturnValue({
      isSuperAdmin: true,
      loading: false
    });

    render(<NetworkMonitorDisplay />);
    
    const button = screen.getByRole('button', { name: /monitor/i });
    fireEvent.click(button);
    
    expect(screen.getByTestId('action-control-panel')).toBeInTheDocument();
    expect(screen.getByTestId('network-calls-list')).toBeInTheDocument();
    expect(screen.getByTestId('deduplication-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('server-action-monitor')).not.toBeInTheDocument();
  });

  it('should switch to Server Actions tab when clicked', () => {
    mockUseAuthWithSuperAdmin.mockReturnValue({
      isSuperAdmin: true,
      loading: false
    });

    render(<NetworkMonitorDisplay />);
    
    const button = screen.getByRole('button', { name: /monitor/i });
    fireEvent.click(button);
    
    const serverActionsTab = screen.getByRole('button', { name: /server actions/i });
    fireEvent.click(serverActionsTab);
    
    expect(screen.getByTestId('server-action-monitor')).toBeInTheDocument();
    expect(screen.queryByTestId('action-control-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('network-calls-list')).not.toBeInTheDocument();
  });

  it('should show analysis results when analysis exists', () => {
    mockUseAuthWithSuperAdmin.mockReturnValue({
      isSuperAdmin: true,
      loading: false
    });

    mockUseNetworkMonitor.mockReturnValue({
      ...defaultNetworkMonitorState,
      analysis: { redundantCalls: [], totalCalls: 5 }
    });

    render(<NetworkMonitorDisplay />);
    
    const button = screen.getByRole('button', { name: /monitor/i });
    fireEvent.click(button);
    
    expect(screen.getByTestId('analysis-results-panel')).toBeInTheDocument();
    expect(screen.getByText(/total calls: 5/i)).toBeInTheDocument();
  });

  it('should initialize monitoring on mount for super admin', () => {
    const initializeMonitoring = vi.fn();
    
    mockUseAuthWithSuperAdmin.mockReturnValue({
      isSuperAdmin: true,
      loading: false
    });

    mockUseNetworkMonitor.mockReturnValue({
      ...defaultNetworkMonitorState,
      initializeMonitoring
    });

    render(<NetworkMonitorDisplay />);
    
    expect(initializeMonitoring).toHaveBeenCalled();
  });

  it('should handle copy analysis successfully', async () => {
    const copyAnalysis = vi.fn(() => Promise.resolve(true));
    
    mockUseAuthWithSuperAdmin.mockReturnValue({
      isSuperAdmin: true,
      loading: false
    });

    mockUseNetworkMonitor.mockReturnValue({
      ...defaultNetworkMonitorState,
      analysis: { redundantCalls: [], totalCalls: 5 },
      copyAnalysis
    });

    render(<NetworkMonitorDisplay />);
    
    const button = screen.getByRole('button', { name: /monitor/i });
    fireEvent.click(button);
    
    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(copyAnalysis).toHaveBeenCalled();
    });
  });

  it('should clear recent deduplications when clear button is clicked', async () => {
    mockUseAuthWithSuperAdmin.mockReturnValue({
      isSuperAdmin: true,
      loading: false
    });

    render(<NetworkMonitorDisplay />);
    
    const button = screen.getByRole('button', { name: /monitor/i });
    fireEvent.click(button);
    
    const clearButton = screen.getByTestId('clear-recent-button');
    fireEvent.click(clearButton);
    
    const { apiDeduplicationService } = await import('@/lib/dam/application/services/ApiDeduplicationService');
    expect(apiDeduplicationService.clearRecentDeduplications).toHaveBeenCalled();
  });

  it('should not initialize monitoring for non-super admin', () => {
    const initializeMonitoring = vi.fn();
    
    mockUseAuthWithSuperAdmin.mockReturnValue({
      isSuperAdmin: false,
      loading: false
    });

    mockUseNetworkMonitor.mockReturnValue({
      ...defaultNetworkMonitorState,
      initializeMonitoring
    });

    render(<NetworkMonitorDisplay />);
    
    expect(initializeMonitoring).not.toHaveBeenCalled();
  });
}); 