 import { useState } from 'react';
 import { useAuth } from '@/contexts/AuthContext';
 import { useNavigate } from 'react-router-dom';
 
 export function useLoginPrompt() {
   const { user } = useAuth();
   const navigate = useNavigate();
   const [showLoginDialog, setShowLoginDialog] = useState(false);
 
   const requireAuth = (callback: () => void) => {
     if (!user) {
       setShowLoginDialog(true);
       return false;
     }
     callback();
     return true;
   };
 
   const goToLogin = () => {
     setShowLoginDialog(false);
     navigate('/login');
   };
 
   const goToSignup = () => {
     setShowLoginDialog(false);
     navigate('/signup');
   };
 
   return {
     isAuthenticated: !!user,
     showLoginDialog,
     setShowLoginDialog,
     requireAuth,
     goToLogin,
     goToSignup,
   };
 }