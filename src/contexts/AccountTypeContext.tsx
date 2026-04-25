import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type AccountType = 'clinician' | 'patient';

const LS_KEY = 'uhs:account_type';

interface AccountTypeContextType {
  accountType: AccountType | null;
  setAccountType: (type: AccountType) => Promise<void>;
  loading: boolean;
  isClinician: boolean;
  isPatient: boolean;
  isOnboarded: boolean;
}

const AccountTypeContext = createContext<AccountTypeContextType | undefined>(undefined);

export function AccountTypeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [accountType, setAccountTypeState] = useState<AccountType | null>(() => {
    try { return localStorage.getItem(LS_KEY) as AccountType | null; } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('account_type' as any)
          .eq('user_id', user.id)
          .maybeSingle();
        if (cancelled) return;
        const remote = (data as any)?.account_type as AccountType | null;
        if (remote) {
          setAccountTypeState(remote);
          try { localStorage.setItem(LS_KEY, remote); } catch { /* no-op */ }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const setAccountType = useCallback(async (type: AccountType) => {
    setAccountTypeState(type);
    try { localStorage.setItem(LS_KEY, type); } catch { /* no-op */ }
    if (user) {
      await supabase
        .from('profiles')
        .update({ account_type: type } as any)
        .eq('user_id', user.id);
    }
  }, [user]);

  return (
    <AccountTypeContext.Provider value={{
      accountType, setAccountType, loading,
      isClinician: accountType === 'clinician',
      isPatient: accountType === 'patient',
      isOnboarded: accountType !== null,
    }}>
      {children}
    </AccountTypeContext.Provider>
  );
}

export function useAccountType() {
  const ctx = useContext(AccountTypeContext);
  if (!ctx) throw new Error('useAccountType must be used within AccountTypeProvider');
  return ctx;
}
