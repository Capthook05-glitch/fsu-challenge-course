import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';

const ProfileContext = createContext(null);

export function ProfileProvider({ session, children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase
      .from('profiles')
      .select('name, role, email')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [session.user.id]);

  return (
    <ProfileContext.Provider value={{ profile, loading, isAdmin: profile?.role === 'admin' }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
