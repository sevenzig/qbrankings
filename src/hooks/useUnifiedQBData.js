// Simplified QB data hook that uses Supabase exclusively
import { useSupabaseQBData } from './useSupabaseQBData.js';

export const useUnifiedQBData = () => {
  // Simply return the Supabase data hook directly
  return useSupabaseQBData();
}; 