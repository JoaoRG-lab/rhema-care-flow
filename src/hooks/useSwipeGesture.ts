 import { useRef, useEffect, useCallback } from 'react';
 
 interface SwipeConfig {
   onSwipeLeft?: () => void;
   onSwipeRight?: () => void;
   onSwipeUp?: () => void;
   onSwipeDown?: () => void;
   threshold?: number;
   enabled?: boolean;
 }
 
 export function useSwipeGesture<T extends HTMLElement = HTMLElement>({
   onSwipeLeft,
   onSwipeRight,
   onSwipeUp,
   onSwipeDown,
   threshold = 50,
   enabled = true,
 }: SwipeConfig) {
   const ref = useRef<T>(null);
   const touchStart = useRef<{ x: number; y: number } | null>(null);
   const touchEnd = useRef<{ x: number; y: number } | null>(null);
 
   const handleTouchStart = useCallback((e: TouchEvent) => {
     touchEnd.current = null;
     touchStart.current = {
       x: e.targetTouches[0].clientX,
       y: e.targetTouches[0].clientY,
     };
   }, []);
 
   const handleTouchMove = useCallback((e: TouchEvent) => {
     touchEnd.current = {
       x: e.targetTouches[0].clientX,
       y: e.targetTouches[0].clientY,
     };
   }, []);
 
   const handleTouchEnd = useCallback(() => {
     if (!touchStart.current || !touchEnd.current) return;
 
     const distanceX = touchStart.current.x - touchEnd.current.x;
     const distanceY = touchStart.current.y - touchEnd.current.y;
     const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);
 
     if (isHorizontalSwipe) {
       if (distanceX > threshold) {
         onSwipeLeft?.();
       } else if (distanceX < -threshold) {
         onSwipeRight?.();
       }
     } else {
       if (distanceY > threshold) {
         onSwipeUp?.();
       } else if (distanceY < -threshold) {
         onSwipeDown?.();
       }
     }
 
     touchStart.current = null;
     touchEnd.current = null;
   }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);
 
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
 
   return ref;
 }