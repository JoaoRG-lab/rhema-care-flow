import { useState, useRef, useCallback, useEffect } from 'react';

interface PullToRefreshConfig {
  onRefresh: () => Promise<void>;
  threshold?: number;
  enabled?: boolean;
  enableHaptics?: boolean;
}

// Haptic feedback utility
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success') => {
  // Try Capacitor Haptics first (for native apps)
  if ('Capacitor' in window && (window as any).Capacitor?.Plugins?.Haptics) {
    const Haptics = (window as any).Capacitor.Plugins.Haptics;
    switch (type) {
      case 'light':
        Haptics.impact({ style: 'light' });
        break;
      case 'medium':
        Haptics.impact({ style: 'medium' });
        break;
      case 'heavy':
        Haptics.impact({ style: 'heavy' });
        break;
      case 'success':
        Haptics.notification({ type: 'success' });
        break;
    }
    return;
  }

  // Fallback to Web Vibration API
  if ('vibrate' in navigator) {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate(30);
        break;
      case 'success':
        navigator.vibrate([10, 50, 20]); // Pattern for success
        break;
    }
  }
};

export function usePullToRefresh<T extends HTMLElement = HTMLElement>({
  onRefresh,
  threshold = 80,
  enabled = true,
  enableHaptics = true,
}: PullToRefreshConfig) {
  const ref = useRef<T>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const hasTriggeredThresholdHaptic = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const element = ref.current;
    if (!element || element.scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
    hasTriggeredThresholdHaptic.current = false;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const element = ref.current;
    if (!element || element.scrollTop > 0) {
      setPullDistance(0);
      return;
    }
    
    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    
    // Apply resistance to make it feel natural
    const resistedDistance = Math.min(distance * 0.5, threshold * 1.5);
    
    // Trigger haptic when crossing threshold
    if (enableHaptics && resistedDistance >= threshold && !hasTriggeredThresholdHaptic.current) {
      triggerHaptic('medium');
      hasTriggeredThresholdHaptic.current = true;
    } else if (resistedDistance < threshold && hasTriggeredThresholdHaptic.current) {
      // Light haptic when pulling back below threshold
      triggerHaptic('light');
      hasTriggeredThresholdHaptic.current = false;
    }
    
    setPullDistance(resistedDistance);
  }, [isPulling, isRefreshing, threshold, enableHaptics]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    hasTriggeredThresholdHaptic.current = false;
    
    if (pullDistance >= threshold && !isRefreshing) {
      // Heavy haptic when refresh triggers
      if (enableHaptics) {
        triggerHaptic('heavy');
      }
      
      setIsRefreshing(true);
      setPullDistance(threshold * 0.6); // Keep indicator visible during refresh
      
      try {
        await onRefresh();
        // Success haptic when refresh completes
        if (enableHaptics) {
          triggerHaptic('success');
        }
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh, enableHaptics]);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;

  return {
    ref,
    pullDistance,
    isRefreshing,
    isPulling,
    progress,
    shouldTrigger,
  };
}