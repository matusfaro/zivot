import React, { useEffect, useMemo, useState } from 'react';
import {
  profileRepository,
  ProfileSummary,
} from '../../database/repositories/ProfileRepository';
import { generateProfileName, withUpdatedAge } from '../../utils/profileNames';

interface ProfilePickerProps {
  onSelected: (profileId: string) => void;
}

/**
 * Shown on page load: continue one of the stored profiles, or create a new
 * one with an auto-generated name (adjective-animal-age) and an age slider.
 * Profile data lives in the browser (IndexedDB) and never leaves it.
 */
export const ProfilePicker: React.FC<ProfilePickerProps> = ({ onSelected }) => {
  const [profiles, setProfiles] = useState<ProfileSummary[] | null>(null);
  const [age, setAge] = useState(40);
  const initialName = useMemo(() => generateProfileName(40), []);
  const [name, setName] = useState(initialName);
  const [nameTouched, setNameTouched] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    profileRepository.listProfiles().then(setProfiles).catch(() => setProfiles([]));
  }, []);

  const handleAgeChange = (newAge: number) => {
    setAge(newAge);
    if (!nameTouched) {
      setName(prev => withUpdatedAge(prev, newAge));
    }
  };

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const profile = await profileRepository.createProfile({
        name: name.trim() || generateProfileName(age),
        age,
      });
      onSelected(profile.profileId);
    } finally {
      setCreating(false);
    }
  };

  const handleContinue = (profileId: string) => {
    profileRepository.setActiveProfile(profileId);
    onSelected(profileId);
  };

  const formatDate = (ts: number | null) =>
    ts ? new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <div className="profile-picker" role="main">
      <div className="profile-picker-card">
        <h1>Zivot</h1>
        <p className="picker-subtitle">Who is this session for? Everything stays in your browser.</p>

        {profiles === null ? (
          <p>Loading profiles…</p>
        ) : profiles.length > 0 ? (
          <section aria-label="Saved profiles">
            <h2>Continue</h2>
            <ul className="picker-list">
              {profiles.map(p => (
                <li key={p.profileId}>
                  <button className="picker-profile" onClick={() => handleContinue(p.profileId)}>
                    <span className="picker-name">{p.name}</span>
                    <span className="picker-meta">
                      {p.age !== null ? `age ${p.age}` : 'age unknown'} · created {formatDate(p.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-label="Create a new profile">
          <h2>{profiles && profiles.length > 0 ? 'Or start fresh' : 'Create a profile'}</h2>
          <label className="picker-field">
            Name
            <input
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value);
                setNameTouched(true);
              }}
              placeholder={initialName}
              data-testid="picker-name"
            />
          </label>
          <label className="picker-field">
            Age: {age}
            <input
              type="range"
              min={18}
              max={95}
              value={age}
              onChange={e => handleAgeChange(parseInt(e.target.value, 10))}
              data-testid="picker-age"
            />
          </label>
          <button
            className="picker-create"
            onClick={handleCreate}
            disabled={creating}
            data-testid="picker-create"
          >
            {creating ? 'Creating…' : 'Create & start'}
          </button>
        </section>
      </div>

      <style>{`
        .profile-picker {
          min-height: 70vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }
        .profile-picker-card {
          width: 100%;
          max-width: 430px;
          border: 2px solid var(--color-border, #888);
          border-radius: 10px;
          padding: 1.5rem;
          font-family: 'Courier New', monospace;
        }
        .profile-picker-card h1 {
          margin: 0 0 0.25rem;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .picker-subtitle {
          margin: 0 0 1.25rem;
          font-size: 0.85rem;
          color: var(--color-text-secondary, #999);
        }
        .profile-picker-card h2 {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 1rem 0 0.5rem;
        }
        .picker-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 240px;
          overflow-y: auto;
        }
        .picker-profile {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.15rem;
          padding: 0.6rem 0.8rem;
          border: 1px solid var(--color-border, #888);
          border-radius: 8px;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
        }
        .picker-profile:hover {
          border-color: var(--color-success, #22c55e);
        }
        .picker-name {
          font-weight: 700;
        }
        .picker-meta {
          font-size: 0.72rem;
          color: var(--color-text-secondary, #999);
        }
        .picker-field {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          margin-bottom: 0.9rem;
          font-size: 0.8rem;
        }
        .picker-field input[type='text'] {
          padding: 0.5rem;
          border: 1px solid var(--color-border, #888);
          border-radius: 6px;
          background: transparent;
          color: inherit;
          font-family: inherit;
        }
        .picker-create {
          width: 100%;
          padding: 0.65rem;
          border: none;
          border-radius: 8px;
          background: var(--color-success, #22c55e);
          color: #fff;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
        }
        .picker-create:disabled {
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
};
