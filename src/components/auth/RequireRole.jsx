import { Navigate } from 'react-router-dom';
import { useProfile } from '../../context/ProfileContext';

export function RequireRole({ roles, children }) {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-fsu-muted">
        Loading…
      </div>
    );
  }

  if (!profile || !roles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
