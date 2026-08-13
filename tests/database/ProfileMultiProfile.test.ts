import { describe, it, expect, beforeEach } from 'vitest';
import { profileRepository } from '../../src/database/repositories/ProfileRepository';
import { db } from '../../src/database/db';
import { generateProfileName, withUpdatedAge } from '../../src/utils/profileNames';

describe('profile name generator', () => {
  it('generates adjective-animal-age names', () => {
    const name = generateProfileName(40);
    expect(name).toMatch(/^[a-z]+-[a-z]+-40$/);
  });

  it('updates the age suffix of auto-generated names only', () => {
    expect(withUpdatedAge('green-falcon-40', 55)).toBe('green-falcon-55');
    expect(withUpdatedAge('My Custom Name', 55)).toBe('My Custom Name');
  });
});

describe('multi-profile repository', () => {
  beforeEach(async () => {
    await db.profiles.clear();
    profileRepository.setActiveProfile(null);
  });

  it('creates a profile with name, age-derived DOB, and createdAt, and makes it active', async () => {
    const profile = await profileRepository.createProfile({ name: 'green-falcon-40', age: 40 });
    expect(profile.name).toBe('green-falcon-40');
    expect(profile.createdAt).toBeGreaterThan(0);
    const birthYear = new Date().getFullYear() - 40;
    expect(profile.demographics?.dateOfBirth?.value).toBe(`${birthYear}-01-01`);
    expect(profileRepository.getActiveProfileId()).toBe(profile.profileId);

    const loaded = await profileRepository.getProfile();
    expect(loaded?.profileId).toBe(profile.profileId);
  });

  it('lists profiles with age and creation time, most recent first', async () => {
    const a = await profileRepository.createProfile({ name: 'calm-otter-50', age: 50 });
    await new Promise(r => setTimeout(r, 5));
    const b = await profileRepository.createProfile({ name: 'bold-lynx-30', age: 30 });

    const list = await profileRepository.listProfiles();
    expect(list).toHaveLength(2);
    expect(list[0].profileId).toBe(b.profileId);
    expect(list[0].name).toBe('bold-lynx-30');
    expect(list[0].age).toBeGreaterThanOrEqual(29);
    expect(list[0].age).toBeLessThanOrEqual(30);
    expect(list[0].createdAt).toBeGreaterThan(0);
    expect(list[1].profileId).toBe(a.profileId);
  });

  it('scopes reads and writes to the active profile', async () => {
    const a = await profileRepository.createProfile({ name: 'a', age: 40 });
    const b = await profileRepository.createProfile({ name: 'b', age: 60 });

    profileRepository.setActiveProfile(a.profileId);
    await profileRepository.saveProfile({ name: 'a-renamed' });
    expect((await profileRepository.getProfile())?.name).toBe('a-renamed');

    profileRepository.setActiveProfile(b.profileId);
    expect((await profileRepository.getProfile())?.name).toBe('b');
  });

  it('clearProfile deletes only the active profile', async () => {
    const a = await profileRepository.createProfile({ name: 'a', age: 40 });
    const b = await profileRepository.createProfile({ name: 'b', age: 60 });

    profileRepository.setActiveProfile(a.profileId);
    await profileRepository.clearProfile();

    const list = await profileRepository.listProfiles();
    expect(list).toHaveLength(1);
    expect(list[0].profileId).toBe(b.profileId);
  });

  it('falls back to the first profile when no active profile is set (legacy/E2E)', async () => {
    await profileRepository.createProfile({ name: 'only', age: 40 });
    profileRepository.setActiveProfile(null);
    const loaded = await profileRepository.getProfile();
    expect(loaded?.name).toBe('only');
  });
});
