import { useEffect } from 'react';
import { toast } from 'sonner';

const compliments = [
  "You're amazing! 💜",
  "You brighten up the codebase. ✨",
  "Debugging is better with you. 🐛",
  "You make Lovable, lovable! 💕",
  "Keep shining, superstar! 🌟",
  "Your code makes a difference! 🚀",
  "You're doing great work! 👏",
  "Every line you write matters! 💪",
  "You've got this! 🎯",
  "Your dedication is inspiring! 🔥",
];

export function useDailyCompliment() {
  useEffect(() => {
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem('lovable-compliment-date');
    
    if (lastShown !== today) {
      // Small delay so it doesn't compete with page load
      const timer = setTimeout(() => {
        const compliment = compliments[Math.floor(Math.random() * compliments.length)];
        toast(compliment, {
          duration: 5000,
          position: 'bottom-center',
        });
        localStorage.setItem('lovable-compliment-date', today);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);
}
