import React, { Suspense, lazy, useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useUserProfile } from '../../hooks/useUserProfile';
import { UserProfileContext } from '../../contexts/UserProfileContext';
import { useRiskCalculation } from '../../hooks/useRiskCalculation';
import { useDebounceProp } from '../../hooks/useDebounceProp';
import { ChartsSection } from './ChartsSection';
import { CompactProfileEditor } from './CompactProfileEditor';
import { TopBar } from '../layout/TopBar';
import { SurvivalHero } from './SurvivalHero';
import { RiskReportCard } from '../results/RiskReportCard';
import { RecommendationsPanel } from './RecommendationsPanel';
import { UserProfile } from '../../types/user';
import { RiskEngine, getSharedRiskEngine } from '../../engine/RiskEngine';
import { RelationshipGraph } from '../../types/registry';
import { getRelationshipGraph } from '../../registry/RelationshipGraphBuilder';

// Heavy, tab-specific sections are code-split out of the initial bundle
const SwipeSurvey = lazy(() =>
  import('../survey/SwipeSurvey').then(m => ({ default: m.SwipeSurvey }))
);
const HabitsDashboard = lazy(() =>
  import('../habits/HabitsDashboard').then(m => ({ default: m.HabitsDashboard }))
);
const RelationshipGraphView = lazy(() =>
  import('../registry/RelationshipGraphView').then(m => ({ default: m.RelationshipGraphView }))
);
const DebugPanel = lazy(() =>
  import('../debug/DebugPanel').then(m => ({ default: m.DebugPanel }))
);

const SectionSpinner: React.FC = () => (
  <div className="graph-loading">
    <div className="spinner"></div>
  </div>
);

// Default profile shown before any data exists. Created once at module load
// (creating it during render trips the react-hooks purity rules via Date.now).
const DEFAULT_PROFILE: UserProfile = {
  profileId: 'default',
  version: '1.0.0',
  lastUpdated: Date.now(),
  demographics: {
    dateOfBirth: {
      value: `${new Date().getFullYear() - 40}-01-01`,
      provenance: { source: 'default' as never, timestamp: Date.now() },
    },
  },
};

type TabId = 'overview' | 'survey' | 'profile' | 'habits' | 'explore';

function tabFromParam(param: string | undefined): TabId {
  switch (param) {
    case undefined:
    case '':
      return 'overview';
    case 'survey':
    case 'profile':
    case 'habits':
    case 'explore':
      return param;
    default:
      return 'overview';
  }
}

interface LiveDashboardProps {
  onSwitchProfile?: () => void;
}

export const LiveDashboard: React.FC<LiveDashboardProps> = ({ onSwitchProfile }) => {
  const { tab: tabParam } = useParams();
  const tab = tabFromParam(tabParam);

  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [riskEngine, setRiskEngine] = useState<RiskEngine | null>(null);
  const [relationshipGraph, setRelationshipGraph] = useState<RelationshipGraph | null>(null);
  const profileApi = useUserProfile();
  const {
    profile,
    loading,
    updateDemographics,
    updateBiometrics,
    updateLabTests,
    updateLifestyle,
    updateMedicalHistory,
    updateSocial,
    clearProfile,
  } = profileApi;

  // Shared RiskEngine (also used by useRiskCalculation) for survey previews
  useEffect(() => {
    const engine = getSharedRiskEngine();
    engine.initialize().then(() => setRiskEngine(engine));
  }, []);

  // Build the relationship graph only when the Explore tab is first opened
  useEffect(() => {
    if (tab !== 'explore' || relationshipGraph) return;
    getRelationshipGraph()
      .then(setRelationshipGraph)
      .catch(error => console.error('[LiveDashboard] Failed to build relationship graph:', error));
  }, [tab, relationshipGraph]);

  // Debounced save function for profile updates
  const saveProfile = useCallback(async (updatedProfile: UserProfile) => {
    // Save each section sequentially to avoid race conditions:
    // each updateXYZ fetches the current profile, merges its section, and
    // saves — run in parallel they would overwrite each other's changes.
    try {
      if (updatedProfile.demographics) {
        await updateDemographics(updatedProfile.demographics);
      }
      if (updatedProfile.biometrics) {
        await updateBiometrics(updatedProfile.biometrics);
      }
      if (updatedProfile.labTests) {
        await updateLabTests(updatedProfile.labTests);
      }
      if (updatedProfile.lifestyle) {
        await updateLifestyle(updatedProfile.lifestyle);
      }
      if (updatedProfile.medicalHistory) {
        await updateMedicalHistory(updatedProfile.medicalHistory);
      }
      if (updatedProfile.social) {
        await updateSocial(updatedProfile.social);
      }
      console.log('[PERSISTENCE] Profile saved');
    } catch (error) {
      console.error('[PERSISTENCE] Error saving profile:', error);
    }
  }, [updateDemographics, updateBiometrics, updateLabTests, updateLifestyle, updateMedicalHistory, updateSocial]);

  // Use useDebounceProp for automatic external sync + debounced saves
  const [localProfile, setLocalProfile] = useDebounceProp(
    profile || DEFAULT_PROFILE,
    saveProfile
  );

  // Risk calculation based on local profile (always up-to-date)
  const { result, calculating, error: calcError } = useRiskCalculation(localProfile);

  // Handle profile reset (confirmed via accessible dialog)
  const handleConfirmedReset = async () => {
    setShowResetConfirm(false);
    try {
      await clearProfile();
      onSwitchProfile?.();
    } catch (err) {
      console.error('Failed to reset profile:', err);
    }
  };

  if (loading) {
    return (
      <div className="live-dashboard loading">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  const survivalPercent = result ? (1 - result.overallMortality.estimatedRisk) * 100 : null;

  return (
    <UserProfileContext.Provider value={profileApi}>
      <TopBar
        profileName={localProfile?.name}
        survivalPercent={survivalPercent}
        calculating={calculating}
        error={calcError}
        onSwitchProfile={onSwitchProfile}
        onLogoDoubleClick={() => setShowDebugPanel(true)}
      />

      {showResetConfirm && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="reset-confirm-title"
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{ background: 'var(--color-bg-secondary)', color: 'inherit', padding: '1.5rem', borderRadius: 'var(--radius-md)', maxWidth: 420, margin: '1rem', border: '1px solid var(--color-border)' }}>
            <h3 id="reset-confirm-title" style={{ marginTop: 0 }}>Delete this profile?</h3>
            <p>This permanently deletes the profile "{localProfile?.name || 'unnamed'}" from this browser. This cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button autoFocus onClick={() => setShowResetConfirm(false)}>Cancel</button>
              <button onClick={handleConfirmedReset} style={{ background: 'var(--color-danger)', color: '#fff' }}>
                Delete profile
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="main-content">
        {tab === 'overview' && (
          <div className="page">
            <SurvivalHero result={result} calculating={calculating} />
            {result?.interpretation?.recommendations && result.interpretation.recommendations.length > 0 && (
              <section className="dashboard-section recommendations-section">
                <RecommendationsPanel recommendations={result.interpretation.recommendations} />
              </section>
            )}
            {result && localProfile && (
              <section className="dashboard-section charts-section-wrapper">
                <ChartsSection result={result} profile={localProfile} />
              </section>
            )}
            {result && (
              <section className="dashboard-section risk-report-section">
                <RiskReportCard result={result} />
              </section>
            )}
          </div>
        )}

        {tab === 'survey' && (
          <div className="page page-narrow">
            <div>
              <h1 className="page-title">Quick survey</h1>
              <p className="page-subtitle">
                Swipe through the questions that matter most — every answer updates your survival estimate live.
              </p>
            </div>
            <section className="dashboard-section swipe-section">
              <Suspense fallback={<SectionSpinner />}>
                <SwipeSurvey
                  profile={localProfile}
                  onProfileChange={setLocalProfile}
                  riskEngine={riskEngine}
                  currentRisk={result?.overallMortality.estimatedRisk ? result.overallMortality.estimatedRisk * 100 : undefined}
                />
              </Suspense>
            </section>
          </div>
        )}

        {tab === 'profile' && (
          <div className="page">
            <div>
              <h1 className="page-title">Health profile</h1>
              <p className="page-subtitle">
                The precise version of the survey — everything the models can use, with sources for every factor.
              </p>
            </div>
            <CompactProfileEditor
              profile={localProfile}
              onProfileChange={setLocalProfile}
            />
            <div className="danger-zone">
              <p>Delete this profile and all of its data from this browser.</p>
              <button onClick={() => setShowResetConfirm(true)}>Delete profile</button>
            </div>
          </div>
        )}

        {tab === 'habits' && (
          <div className="page page-narrow">
            <div>
              <h1 className="page-title">Habits</h1>
              <p className="page-subtitle">
                Log day-to-day behavior — rolling averages feed back into your profile automatically.
              </p>
            </div>
            <section className="dashboard-section habits-section">
              <Suspense fallback={<SectionSpinner />}>
                <HabitsDashboard />
              </Suspense>
            </section>
          </div>
        )}

        {tab === 'explore' && (
          <div className="page">
            <div>
              <h1 className="page-title">Explore the model</h1>
              <p className="page-subtitle">
                How inputs, risk factors, and diseases connect — every edge is backed by a cited study.
              </p>
            </div>
            <section className="dashboard-section relationship-graph-section">
              {relationshipGraph ? (
                <div className="graph-wrapper">
                  <Suspense fallback={<SectionSpinner />}>
                    <RelationshipGraphView graph={relationshipGraph} />
                  </Suspense>
                </div>
              ) : (
                <div className="graph-loading">
                  <div className="spinner"></div>
                  <p>Building relationship graph...</p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Debug Panel */}
      {showDebugPanel && (
        <Suspense fallback={null}>
          <DebugPanel
            profile={localProfile}
            result={result}
            onClose={() => setShowDebugPanel(false)}
            onProfileUpdate={setLocalProfile}
          />
        </Suspense>
      )}
    </UserProfileContext.Provider>
  );
};
