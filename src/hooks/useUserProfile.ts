import { useState, useEffect } from 'react';
import { UserProfile } from '../types/user';
import { profileRepository } from '../database/repositories/ProfileRepository';

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await profileRepository.getProfile();
      setProfile(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    try {
      const updated = await profileRepository.saveProfile(updates);
      setProfile(updated);
      return updated;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }

  async function updateDemographics(demographics: Partial<UserProfile['demographics']>) {
    const updated = await profileRepository.updateDemographics(demographics);
    setProfile(updated);
    return updated;
  }

  async function updateBiometrics(biometrics: Partial<UserProfile['biometrics']>) {
    const updated = await profileRepository.updateBiometrics(biometrics);
    setProfile(updated);
    return updated;
  }

  async function updateLabTests(labTests: Partial<UserProfile['labTests']>) {
    const updated = await profileRepository.updateLabTests(labTests);
    setProfile(updated);
    return updated;
  }

  async function updateLifestyle(lifestyle: Partial<UserProfile['lifestyle']>) {
    const updated = await profileRepository.updateLifestyle(lifestyle);
    setProfile(updated);
    return updated;
  }

  async function updateMedicalHistory(medicalHistory: Partial<UserProfile['medicalHistory']>) {
    const updated = await profileRepository.updateMedicalHistory(medicalHistory);
    setProfile(updated);
    return updated;
  }

  async function updateSocial(social: Partial<UserProfile['social']>) {
    const updated = await profileRepository.updateSocial(social);
    setProfile(updated);
    return updated;
  }

  async function clearProfile() {
    try {
      await profileRepository.clearProfile();
      setProfile(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateDemographics,
    updateBiometrics,
    updateLabTests,
    updateLifestyle,
    updateMedicalHistory,
    updateSocial,
    clearProfile,
    reload: loadProfile,
  };
}
