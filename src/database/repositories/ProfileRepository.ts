import { db } from '../db';
import { UserProfile } from '../../types/user';
import { v4 as uuidv4 } from 'uuid';

/** Lightweight row for the profile-picker list */
export interface ProfileSummary {
  profileId: string;
  name: string;
  age: number | null;
  createdAt: number | null;
  lastUpdated: number;
}

export class ProfileRepository {
  private static CURRENT_VERSION = '1.0.0';

  /**
   * The profile the app is currently operating on. Selected via the profile
   * picker; when unset, falls back to the first stored profile (legacy
   * single-profile behavior, also used by tests and E2E mode).
   */
  private activeProfileId: string | null = null;

  setActiveProfile(profileId: string | null): void {
    this.activeProfileId = profileId;
  }

  getActiveProfileId(): string | null {
    return this.activeProfileId;
  }

  /**
   * Get the active user profile
   */
  async getProfile(): Promise<UserProfile | null> {
    if (this.activeProfileId) {
      const record = await db.profiles.get(this.activeProfileId);
      return record?.data ?? null;
    }
    // Legacy fallback: first/only profile
    const record = await db.profiles.toCollection().first();
    return record?.data ?? null;
  }

  /**
   * List all stored profiles for the picker (most recently used first)
   */
  async listProfiles(): Promise<ProfileSummary[]> {
    const records = await db.profiles.toArray();
    const summaries = records
      .filter(r => r.data)
      .map(r => {
        const dob = r.data!.demographics?.dateOfBirth?.value;
        let age: number | null = null;
        if (typeof dob === 'string') {
          const born = new Date(dob);
          if (!Number.isNaN(born.getTime())) {
            age = Math.floor((Date.now() - born.getTime()) / (365.25 * 24 * 3600 * 1000));
          }
        }
        return {
          profileId: r.profileId,
          name: r.data!.name || 'unnamed-profile',
          age,
          createdAt: r.data!.createdAt ?? null,
          lastUpdated: r.lastUpdated,
        };
      });
    summaries.sort((a, b) => b.lastUpdated - a.lastUpdated);
    return summaries;
  }

  /**
   * Create a new profile with a name and an approximate age, and make it
   * active. Date of birth is set to Jan 1 of the matching year (refine in
   * the editor).
   */
  async createProfile(options: { name: string; age: number }): Promise<UserProfile> {
    const now = Date.now();
    const birthYear = new Date().getFullYear() - options.age;
    const profile: UserProfile = {
      profileId: uuidv4(),
      version: ProfileRepository.CURRENT_VERSION,
      lastUpdated: now,
      name: options.name,
      createdAt: now,
      demographics: {
        dateOfBirth: {
          value: `${birthYear}-01-01`,
          provenance: { source: 'user_entered' as never, timestamp: now },
        },
      },
    };
    await db.profiles.put({
      profileId: profile.profileId,
      version: profile.version,
      lastUpdated: now,
      data: profile,
    });
    this.activeProfileId = profile.profileId;
    return profile;
  }

  /**
   * Save or update the active user profile
   */
  async saveProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const existing = await this.getProfile();

    const updated: UserProfile = {
      profileId: existing?.profileId || this.activeProfileId || uuidv4(),
      version: ProfileRepository.CURRENT_VERSION,
      lastUpdated: Date.now(),
      ...existing,
      ...profile,
    };

    await db.profiles.put({
      profileId: updated.profileId,
      version: updated.version,
      lastUpdated: updated.lastUpdated,
      data: updated,
    });

    return updated;
  }

  /**
   * Update demographics section
   */
  async updateDemographics(demographics: Partial<UserProfile['demographics']>): Promise<UserProfile> {
    const profile = await this.getProfile();
    return this.saveProfile({
      ...profile,
      demographics: {
        ...profile?.demographics,
        ...demographics,
      },
    });
  }

  /**
   * Update biometrics section
   */
  async updateBiometrics(biometrics: Partial<UserProfile['biometrics']>): Promise<UserProfile> {
    const profile = await this.getProfile();
    return this.saveProfile({
      ...profile,
      biometrics: {
        ...profile?.biometrics,
        ...biometrics,
      },
    });
  }

  /**
   * Update lab tests section
   */
  async updateLabTests(labTests: Partial<UserProfile['labTests']>): Promise<UserProfile> {
    const profile = await this.getProfile();
    return this.saveProfile({
      ...profile,
      labTests: {
        ...profile?.labTests,
        ...labTests,
      },
    });
  }

  /**
   * Update lifestyle section
   */
  async updateLifestyle(lifestyle: Partial<UserProfile['lifestyle']>): Promise<UserProfile> {
    const profile = await this.getProfile();
    return this.saveProfile({
      ...profile,
      lifestyle: {
        ...profile?.lifestyle,
        ...lifestyle,
      },
    });
  }

  /**
   * Update medical history section
   */
  async updateMedicalHistory(medicalHistory: Partial<UserProfile['medicalHistory']>): Promise<UserProfile> {
    const profile = await this.getProfile();
    return this.saveProfile({
      ...profile,
      medicalHistory: {
        ...profile?.medicalHistory,
        ...medicalHistory,
      },
    });
  }

  /**
   * Update social section
   */
  async updateSocial(social: Partial<UserProfile['social']>): Promise<UserProfile> {
    const profile = await this.getProfile();
    return this.saveProfile({
      ...profile,
      social: {
        ...profile?.social,
        ...social,
      },
    });
  }

  /**
   * Update interventions section (Phase 2)
   */
  async updateInterventions(interventions: Partial<UserProfile['interventions']>): Promise<UserProfile> {
    const profile = await this.getProfile();
    return this.saveProfile({
      ...profile,
      interventions: {
        ...profile?.interventions,
        ...interventions,
      },
    });
  }

  /**
   * Clear all profile data
   */
  async clearProfile(): Promise<void> {
    // Only clear the ACTIVE profile — other stored profiles must survive
    if (this.activeProfileId) {
      await db.profiles.delete(this.activeProfileId);
      this.activeProfileId = null;
    } else {
      await db.profiles.clear();
    }
  }

  /**
   * Check if a profile exists
   */
  async hasProfile(): Promise<boolean> {
    const count = await db.profiles.count();
    return count > 0;
  }
}

export const profileRepository = new ProfileRepository();
