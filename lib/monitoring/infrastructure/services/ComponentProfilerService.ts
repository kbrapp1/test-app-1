import { ComponentPerformance } from '../../domain/entities/DetailedPerformanceMetrics';

export class ComponentProfilerService {
  private static performanceData: Map<string, ComponentPerformanceData> = new Map();
  private static isEnabled = false;

  static enable() {
    this.isEnabled = true;
    this.setupPerformanceObserver();
  }

  static disable() {
    this.isEnabled = false;
  }

  static recordComponentMount(componentName: string, duration: number) {
    if (!this.isEnabled) return;

    const existing = this.performanceData.get(componentName) || {
      mountTime: 0,
      renderTime: 0,
      reRenderCount: 0,
      memoryUsage: 0,
      totalMounts: 0
    };

    existing.mountTime = (existing.mountTime * existing.totalMounts + duration) / (existing.totalMounts + 1);
    existing.totalMounts++;

    this.performanceData.set(componentName, existing);
  }

  static recordComponentRender(componentName: string, duration: number, isReRender: boolean = false) {
    if (!this.isEnabled) return;

    const existing = this.performanceData.get(componentName) || {
      mountTime: 0,
      renderTime: 0,
      reRenderCount: 0,
      memoryUsage: 0,
      totalMounts: 0
    };

    existing.renderTime = Math.max(existing.renderTime, duration);
    if (isReRender) {
      existing.reRenderCount++;
    }

    this.performanceData.set(componentName, existing);
  }

  static getComponentPerformance(): ComponentPerformance[] {
    const results: ComponentPerformance[] = [];

    this.performanceData.forEach((data, componentName) => {
      results.push({
        name: componentName,
        mountTime: data.mountTime,
        renderTime: data.renderTime,
        reRenderCount: data.reRenderCount,
        memoryUsage: data.memoryUsage,
        children: [] // Could be enhanced to track component hierarchies
      });
    });

    return results.sort((a, b) => b.renderTime - a.renderTime);
  }

  static reset() {
    this.performanceData.clear();
  }

  private static setupPerformanceObserver() {
    if (typeof window === 'undefined') return;

    // Monitor React performance marks if available
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.name.startsWith('⚛️')) {
            // React DevTools performance marks
            this.parseReactPerformanceMark(entry);
          }
        });
      });

      observer.observe({ entryTypes: ['mark', 'measure'] });
    } catch {
      // PerformanceObserver not supported
    }

    // Monitor memory usage periodically
    this.monitorMemoryUsage();
  }

  private static parseReactPerformanceMark(entry: PerformanceEntry) {
    // Parse React DevTools performance marks
    // Example: "⚛️ Component render"
    const match = entry.name.match(/⚛️\s+(.+?)\s+(render|mount)/);
    if (match) {
      const [, componentName, action] = match;
      if (action === 'render') {
        this.recordComponentRender(componentName, entry.duration || 0);
      } else if (action === 'mount') {
        this.recordComponentMount(componentName, entry.duration || 0);
      }
    }
  }

  private static monitorMemoryUsage() {
    if (typeof window === 'undefined') return;

    const checkMemory = () => {
      if ('memory' in performance) {
        const performanceWithMemory = performance as Performance & { memory?: { usedJSHeapSize: number } };
        const memory = performanceWithMemory.memory;
        if (!memory) return;
        const currentUsage = memory.usedJSHeapSize;

        // Update memory usage for all tracked components
        this.performanceData.forEach((data, _componentName) => {
          data.memoryUsage = Math.max(data.memoryUsage, currentUsage);
        });
      }
    };

    setInterval(checkMemory, 5000); // Check every 5 seconds
  }

  static getPerformanceInsights(): PerformanceInsight[] {
    const insights: PerformanceInsight[] = [];
    const components = this.getComponentPerformance();

    // Detect slow mounting components
    components.forEach(component => {
      if (component.mountTime > 100) {
        insights.push({
          type: 'slow-mount',
          component: component.name,
          severity: component.mountTime > 500 ? 'high' : 'medium',
          value: component.mountTime,
          recommendation: `Consider lazy loading ${component.name} or optimizing its mount logic`
        });
      }

      if (component.reRenderCount > 10) {
        insights.push({
          type: 'excessive-rerenders',
          component: component.name,
          severity: component.reRenderCount > 50 ? 'high' : 'medium',
          value: component.reRenderCount,
          recommendation: `Add React.memo() or useMemo() to ${component.name}`
        });
      }

      if (component.renderTime > 16) { // Above 60fps threshold
        insights.push({
          type: 'slow-render',
          component: component.name,
          severity: component.renderTime > 32 ? 'high' : 'medium',
          value: component.renderTime,
          recommendation: `Optimize render performance in ${component.name}`
        });
      }
    });

    return insights;
  }
}

interface ComponentPerformanceData {
  mountTime: number;
  renderTime: number;
  reRenderCount: number;
  memoryUsage: number;
  totalMounts: number;
}

interface PerformanceInsight {
  type: 'slow-mount' | 'excessive-rerenders' | 'slow-render';
  component: string;
  severity: 'low' | 'medium' | 'high';
  value: number;
  recommendation: string;
} 