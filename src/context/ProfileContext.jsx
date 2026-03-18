import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';

const ProfileContext = createContext(null);

export function ProfileProvider({ session, children }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase
      .from('profiles')
      .select('id, name, role, email')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching profile:', error);
          setError(error);
        } else {
          setProfile(data);
          setError(null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Unexpected error in ProfileProvider:', err);
        setError(err);
        setLoading(false);
      });
  }, [session.user.id]);

  const role = profile?.role;

  return (
    <ProfileContext.Provider value={{
      profile,
      loading,
      error,
      isAdmin:                role === 'admin',
      isLeadFacilitator:      role === 'lead_facilitator',
      isAssistantFacilitator: role === 'assistant_facilitator',
      canPlan:                role === 'admin' || role === 'lead_facilitator',
      canAdmin:               role === 'admin',
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
