import React, { useState } from 'react';
import { UserProfile } from '../../types/user';
import { CompactProfileEditor } from './CompactProfileEditor';
import './ProfileTabs.css';

interface ProfileTabsProps {
  profile: UserProfile | null;
  onProfileChange: (profile: UserProfile) => void;
  onResetProfile: () => void;
}

type TabType = 'profile' | 'swiping';

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ profile, onProfileChange, onResetProfile }) => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  return (
    <div className="profile-tabs">
      <div className="profile-tabs-header">
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            📋 Profile Editor
          </button>
          <button
            className={`tab-button ${activeTab === 'swiping' ? 'active' : ''}`}
            onClick={() => setActiveTab('swiping')}
          >
            💳 Quick Input
          </button>
        </div>
        <button
          className="reset-button"
          onClick={onResetProfile}
          title="Reset all profile data"
          type="button"
        >
          🗑️ Reset
        </button>
      </div>

      <div className="profile-tabs-content">
        {activeTab === 'profile' && (
          <div className="tab-panel">
            <CompactProfileEditor
              profile={profile}
              onProfileChange={onProfileChange}
            />
          </div>
        )}

        {activeTab === 'swiping' && (
          <div className="tab-panel swiping-panel">
            <div className="coming-soon">
              <h3>Quick Input Mode</h3>
              <p>Swipe-based data entry coming soon!</p>
              <p className="hint">This will provide a faster, card-based way to input your health data.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
