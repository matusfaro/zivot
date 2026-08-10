import { createContext, useContext } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';

type UserProfileApi = ReturnType<typeof useUserProfile>;

/**
 * Single source of truth for the user profile.
 *
 * useUserProfile() keeps per-instance state, so every component that called it
 * directly got an independent copy of the profile — writes from one copy
 * (e.g. habit-event extrapolation) never reached the others until a reload.
 * LiveDashboard owns the one hook instance and provides it here; everything
 * else must consume the context.
 */
export const UserProfileContext = createContext<UserProfileApi | null>(null);

export function useUserProfileContext(): UserProfileApi {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error('useUserProfileContext must be used within a UserProfileContext.Provider');
  }
  return ctx;
}
