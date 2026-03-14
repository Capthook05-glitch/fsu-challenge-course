import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';

const ProfileContext = createContext(null);

export function ProfileProvider({ session, children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase
      .from('profiles')
      .select('id, name, role, email')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error || data == null) {
          setProfile(null);
          setProfileError(error ?? new Error('Profile not found'));
          return;
        }

        setProfile(data);
        setProfileError(null);
      })
      .catch((error) => {
        setProfile(null);
        setProfileError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session.user.id]);

  const role = profile?.role;

  return (
    <ProfileContext.Provider value={{
      profile,
      loading,
      profileError,
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
