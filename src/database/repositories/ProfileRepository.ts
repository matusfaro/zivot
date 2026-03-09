import { db } from '../db';
import { UserProfile } from '../../types/user';
import { v4 as uuidv4 } from 'uuid';

export class ProfileRepository {
  private static CURRENT_VERSION = '1.0.0';

  /**
   * Get the user profile (single-user app)
   */
  async getProfile(): Promise<UserProfile | null> {
    // Single-user app: get the first/only profile
    const record = await db.profiles.toCollection().first();
    if (!record?.data) {
      return null;
    }

    return record.data;
  }

  /**
   * Save or update the user profile
   */
  async saveProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const existing = await this.getProfile();

    const updated: UserProfile = {
      profileId: existing?.profileId || uuidv4(),
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
    await db.profiles.clear();
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
