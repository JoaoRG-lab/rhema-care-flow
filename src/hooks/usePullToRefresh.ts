 import { useState, useRef, useCallback, useEffect } from 'react';
 
 interface PullToRefreshConfig {
   onRefresh: () => Promise<void>;
   threshold?: number;
   enabled?: boolean;
 }
 
 export function usePullToRefresh<T extends HTMLElement = HTMLElement>({
   onRefresh,
   threshold = 80,
   enabled = true,
 }: PullToRefreshConfig) {
   const ref = useRef<T>(null);
   const [pullDistance, setPullDistance] = useState(0);
   const [isRefreshing, setIsRefreshing] = useState(false);
   const [isPulling, setIsPulling] = useState(false);
   const startY = useRef(0);
   const currentY = useRef(0);
 
   const handleTouchStart = useCallback((e: TouchEvent) => {
     const element = ref.current;
     if (!element || element.scrollTop > 0) return;
     
     startY.current = e.touches[0].clientY;
     setIsPulling(true);
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
     setPullDistance(resistedDistance);
   }, [isPulling, isRefreshing, threshold]);
 
   const handleTouchEnd = useCallback(async () => {
     if (!isPulling) return;
     
     setIsPulling(false);
     
     if (pullDistance >= threshold && !isRefreshing) {
       setIsRefreshing(true);
       setPullDistance(threshold * 0.6); // Keep indicator visible during refresh
       
       try {
         await onRefresh();
       } finally {
         setIsRefreshing(false);
         setPullDistance(0);
       }
     } else {
       setPullDistance(0);
     }
   }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);
 
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