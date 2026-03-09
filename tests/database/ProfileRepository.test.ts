import { describe, it, expect, beforeEach } from 'vitest';
import { ProfileRepository } from '../../src/database/repositories/ProfileRepository';
import { createUserDataPoint } from '../../src/types/common/datapoint';
import { db } from '../../src/database/db';

describe('ProfileRepository', () => {
  let repository: ProfileRepository;

  beforeEach(async () => {
    repository = new ProfileRepository();
    // Clear database before each test
    await db.profiles.clear();
  });

  it('should handle completely sparse profile (only age and sex)', async () => {
    // Minimal data - just what's needed for baseline risk
    const minimalProfile = await repository.saveProfile({
      demographics: {
        dateOfBirth: createUserDataPoint('1980-01-01'),
        biologicalSex: createUserDataPoint('male'),
      },
    });

    expect(minimalProfile).toBeDefined();
    expect(minimalProfile.profileId).toBeDefined();
    expect(minimalProfile.demographics?.dateOfBirth?.value).toBe('1980-01-01');
    expect(minimalProfile.demographics?.biologicalSex?.value).toBe('male');

    // All other fields should be undefined
    expect(minimalProfile.biometrics).toBeUndefined();
    expect(minimalProfile.labTests).toBeUndefined();
    expect(minimalProfile.lifestyle).toBeUndefined();
  });

  it('should handle progressive data entry', async () => {
    // Start with minimal data
    let profile = await repository.saveProfile({
      demographics: {
        dateOfBirth: createUserDataPoint('1975-05-15'),
        biologicalSex: createUserDataPoint('female'),
      },
    });

    const profileId = profile.profileId;

    // Add biometrics later
    profile = await repository.updateBiometrics({
      height: createUserDataPoint(165), // cm
      weight: {
        dataPoints: [
          createUserDataPoint({ value: 68, unit: 'kg' }),
        ],
        mostRecent: createUserDataPoint({ value: 68, unit: 'kg' }),
      },
    });

    expect(profile.profileId).toBe(profileId); // Same profile
    expect(profile.demographics?.dateOfBirth?.value).toBe('1975-05-15'); // Preserved
    expect(profile.biometrics?.height?.value).toBe(165); // Added

    // Add lab tests even later
    profile = await repository.updateLabTests({
      lipidPanel: {
        ldlCholesterol: createUserDataPoint(120),
        hdlCholesterol: createUserDataPoint(55),
      },
    });

    expect(profile.profileId).toBe(profileId); // Still same profile
    expect(profile.demographics?.dateOfBirth?.value).toBe('1975-05-15'); // Still preserved
    expect(profile.biometrics?.height?.value).toBe(165); // Still preserved
    expect(profile.labTests?.lipidPanel?.ldlCholesterol?.value).toBe(120); // Added
  });

  it('should store provenance for all data points', async () => {
    const profile = await repository.saveProfile({
      demographics: {
        dateOfBirth: createUserDataPoint('1990-12-25'),
      },
      labTests: {
        lipidPanel: {
          ldlCholesterol: {
            value: 130,
            provenance: {
              source: 'lab_report',
              timestamp: Date.now(),
              sourceIdentifier: 'LabCorp #12345',
            },
            confidence: 'high',
          },
        },
      },
    });

    expect(profile.demographics?.dateOfBirth?.provenance.source).toBe('user_entered');
    expect(profile.labTests?.lipidPanel?.ldlCholesterol?.provenance.source).toBe('lab_report');
    expect(profile.labTests?.lipidPanel?.ldlCholesterol?.provenance.sourceIdentifier).toBe(
      'LabCorp #12345'
    );
  });

  it('should handle completely empty lab results (future-proofing)', async () => {
    const profile = await repository.saveProfile({
      demographics: {
        dateOfBirth: createUserDataPoint('1985-03-10'),
      },
      labTests: {
        // Store markers we don't actively use yet
        markers: {
          vitamin_d: {
            value: 32,
            unit: 'ng/mL',
            provenance: {
              source: 'lab_report',
              timestamp: Date.now(),
            },
          },
          ferritin: {
            value: 85,
            unit: 'ng/mL',
            provenance: {
              source: 'lab_report',
              timestamp: Date.now(),
            },
          },
        },
      },
    });

    // Even though we don't use these markers in Phase 1, they're stored
    expect(profile.labTests?.markers?.vitamin_d?.value).toBe(32);
    expect(profile.labTests?.markers?.ferritin?.value).toBe(85);
  });

  it('should retrieve profile correctly', async () => {
    const saved = await repository.saveProfile({
      demographics: {
        dateOfBirth: createUserDataPoint('1982-07-20'),
        biologicalSex: createUserDataPoint('male'),
      },
    });

    const retrieved = await repository.getProfile();

    expect(retrieved).toBeDefined();
    expect(retrieved?.profileId).toBe(saved.profileId);
    expect(retrieved?.demographics?.dateOfBirth?.value).toBe('1982-07-20');
  });

  it('should handle no profile gracefully', async () => {
    const profile = await repository.getProfile();
    expect(profile).toBeNull();

    const hasProfile = await repository.hasProfile();
    expect(hasProfile).toBe(false);
  });

  it('should clear profile', async () => {
    await repository.saveProfile({
      demographics: {
        dateOfBirth: createUserDataPoint('1990-01-01'),
      },
    });

    await repository.clearProfile();

    const profile = await repository.getProfile();
    expect(profile).toBeNull();
  });
});
