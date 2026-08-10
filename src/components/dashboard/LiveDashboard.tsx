import React, { Suspense, lazy, useState, useCallback, useEffect } from 'react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { UserProfileContext } from '../../contexts/UserProfileContext';
import { useRiskCalculation } from '../../hooks/useRiskCalculation';
import { useDebounceProp } from '../../hooks/useDebounceProp';
import { ChartsSection } from './ChartsSection';
import { CompactProfileEditor } from './CompactProfileEditor';
import { Header } from '../layout/Header';
import { RiskReportCard } from '../results/RiskReportCard';
import { RecommendationsPanel } from './RecommendationsPanel';
import { UserProfile } from '../../types/user';
import { RiskEngine, getSharedRiskEngine } from '../../engine/RiskEngine';
import { RelationshipGraph } from '../../types/registry';
import { getRelationshipGraph } from '../../registry/RelationshipGraphBuilder';

// Heavy, below-the-fold sections are code-split out of the initial bundle
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

export const LiveDashboard: React.FC = () => {
  const [showDebugPanel, setShowDebugPanel] = useState(false);
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

  // Build relationship graph on mount
  useEffect(() => {
    getRelationshipGraph()
      .then(setRelationshipGraph)
      .catch(error => console.error('[LiveDashboard] Failed to build relationship graph:', error));
  }, []);

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

  // Handle profile reset
  const handleResetProfile = async () => {
    if (window.confirm('Are you sure you want to reset your entire health profile? This cannot be undone.')) {
      try {
        await clearProfile();
        // Local profile will automatically sync with cleared profile from IndexedDB
      } catch (err) {
        console.error('Failed to reset profile:', err);
      }
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

  return (
    <UserProfileContext.Provider value={profileApi}>
      <Header
        onLogoDoubleClick={() => setShowDebugPanel(true)}
        result={result}
        calculating={calculating}
        error={calcError}
        onResetProfile={handleResetProfile}
      />
      <main className="main-content">
        <div className="live-dashboard">
          <div className="dashboard-layout">
            {/* Charts Section: Risk Over Time + Breakdown */}
            {result && localProfile && (
              <section className="dashboard-section charts-section-wrapper full-width">
                <ChartsSection result={result} profile={localProfile} />
              </section>
            )}

            {/* Personalized Recommendations */}
            {result?.interpretation?.recommendations && result.interpretation.recommendations.length > 0 && (
              <section className="dashboard-section recommendations-section full-width">
                <RecommendationsPanel recommendations={result.interpretation.recommendations} />
              </section>
            )}

            {/* Swipe Survey Section */}
            <section className="dashboard-section swipe-section full-width">
              <h2>🎯 QUICK INPUT</h2>
              <Suspense fallback={<SectionSpinner />}>
                <SwipeSurvey
                  profile={localProfile}
                  onProfileChange={setLocalProfile}
                  riskEngine={riskEngine}
                  currentRisk={result?.overallMortality.estimatedRisk ? result.overallMortality.estimatedRisk * 100 : undefined}
                />
              </Suspense>
            </section>

            {/* Habits Tracking Section */}
            <section className="dashboard-section habits-section full-width">
              <Suspense fallback={<SectionSpinner />}>
                <HabitsDashboard />
              </Suspense>
            </section>

            {/* Profile Input Section */}
            <section className="dashboard-section profile-section full-width">
              <CompactProfileEditor
                profile={localProfile}
                onProfileChange={setLocalProfile}
              />
            </section>

            {/* Risk Report Card - Bottom of page to avoid jumping */}
            {result && (
              <section className="dashboard-section risk-report-section full-width">
                <RiskReportCard result={result} />
              </section>
            )}

            {/* Relationship Graph Section - Always shown at the end */}
            <section className="dashboard-section relationship-graph-section full-width">
              <h2>🔗 RELATIONSHIP GRAPH</h2>
              <p className="section-description">
                Visualizing connections between inputs, questions, risk factors, and diseases
              </p>
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
        </div>
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
