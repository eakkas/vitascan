import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
  Capacitor.isNativePlatform() ? {
    auth: {
      flowType: 'implicit',
      detectSessionInUrl: false,
    }
  } : {}
);
