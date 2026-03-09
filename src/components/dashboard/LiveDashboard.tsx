import React, { useState, useCallback, useEffect } from 'react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useRiskCalculation } from '../../hooks/useRiskCalculation';
import { useDebounceProp } from '../../hooks/useDebounceProp';
import { ChartsSection } from './ChartsSection';
import { DetailsSection } from './DetailsSection';
import { CompactProfileEditor } from './CompactProfileEditor';
import { SwipeSurvey } from '../survey/SwipeSurvey';
import { HabitsDashboard } from '../habits/HabitsDashboard';
import { Header } from '../layout/Header';
import { DebugPanel } from '../debug/DebugPanel';
import { RiskReportCard } from '../results/RiskReportCard';
import { RecommendationsPanel } from './RecommendationsPanel';
import { RelationshipGraphView } from '../registry/RelationshipGraphView';
import { UserProfile } from '../../types/user';
import { RiskEngine } from '../../engine/RiskEngine';
import { RelationshipGraph } from '../../types/registry';
import { getRelationshipGraph } from '../../registry/RelationshipGraphBuilder';

export const LiveDashboard: React.FC = () => {
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [riskEngine, setRiskEngine] = useState<RiskEngine | null>(null);
  const [relationshipGraph, setRelationshipGraph] = useState<RelationshipGraph | null>(null);
  const { profile, loading, updateDemographics, updateBiometrics, updateLabTests, updateLifestyle, updateMedicalHistory, updateSocial, clearProfile } = useUserProfile();

  // Initialize RiskEngine for survey impact calculations
  useEffect(() => {
    const initEngine = async () => {
      const engine = new RiskEngine();
      await engine.initialize();
      setRiskEngine(engine);
    };
    initEngine();
  }, []);

  // Build relationship graph on mount
  useEffect(() => {
    const buildGraph = async () => {
      try {
        console.log('[LiveDashboard] Building relationship graph...');
        const graph = await getRelationshipGraph();
        setRelationshipGraph(graph);
        console.log('[LiveDashboard] Relationship graph loaded successfully');
      } catch (error) {
        console.error('[LiveDashboard] Failed to build relationship graph:', error);
      }
    };
    buildGraph();
  }, []);

  // Debounced save function for profile updates
  const saveProfile = useCallback(async (updatedProfile: UserProfile) => {
    console.log('[PERSISTENCE] Saving profile to IndexedDB (debounced)');

    // Save each section sequentially to avoid race conditions
    // Each updateXYZ method fetches the current profile, merges its section, and saves
    // If run in parallel, they overwrite each other's changes!
    try {
      if (updatedProfile.demographics) {
        console.log('[PERSISTENCE] Saving demographics');
        await updateDemographics(updatedProfile.demographics);
      }
      if (updatedProfile.biometrics) {
        console.log('[PERSISTENCE] Saving biometrics');
        await updateBiometrics(updatedProfile.biometrics);
      }
      if (updatedProfile.labTests) {
        await updateLabTests(updatedProfile.labTests);
      }
      if (updatedProfile.lifestyle) {
        console.log('[PERSISTENCE] Saving lifestyle');
        await updateLifestyle(updatedProfile.lifestyle);
      }
      if (updatedProfile.medicalHistory) {
        await updateMedicalHistory(updatedProfile.medicalHistory);
      }
      if (updatedProfile.social) {
        console.log('[PERSISTENCE] Saving social');
        await updateSocial(updatedProfile.social);
      }
      console.log('[PERSISTENCE] All sections saved successfully');
    } catch (error) {
      console.error('[PERSISTENCE] Error saving profile:', error);
    }
  }, [updateDemographics, updateBiometrics, updateLabTests, updateLifestyle, updateMedicalHistory, updateSocial]);

  // Use useDebounceProp for automatic external sync + debounced saves
  const [localProfile, setLocalProfile] = useDebounceProp(
    profile || {
      profileId: 'default',
      version: '1.0.0',
      lastUpdated: Date.now(),
      demographics: {
        dateOfBirth: {
          value: `${new Date().getFullYear() - 40}-01-01`,
          provenance: { source: 'default' as any, timestamp: Date.now() },
        },
      },
    },
    saveProfile,
    () => console.log('[PROFILE] User started editing')
  );

  // Risk calculation based on local profile (always up-to-date)
  const { result, calculating, error: calcError } = useRiskCalculation(localProfile);

  // Handle profile reset
  const handleResetProfile = async () => {
    if (window.confirm('Are you sure you want to reset your entire health profile? This cannot be undone.')) {
      try {
        await clearProfile();
        console.log('[PROFILE] Profile reset completed');
        // Local profile will automatically sync with cleared profile from IndexedDB
      } catch (err) {
        console.error('Failed to reset profile:', err);
        alert('Failed to reset profile. Please try again.');
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
    <>
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

            {/* Details Section: Top Levers + Individual Diseases */}
            {result && (
              <section className="dashboard-section details-section-wrapper full-width">
                <DetailsSection result={result} />
              </section>
            )}

            {/* Swipe Survey Section */}
            <section className="dashboard-section swipe-section full-width">
              <h2>🎯 QUICK INPUT</h2>
              <SwipeSurvey
                profile={localProfile}
                onProfileChange={setLocalProfile}
                riskEngine={riskEngine}
                currentRisk={result?.overallMortality.estimatedRisk ? result.overallMortality.estimatedRisk * 100 : undefined}
              />
            </section>

            {/* Habits Tracking Section */}
            <section className="dashboard-section habits-section full-width">
              <HabitsDashboard />
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
                  <RelationshipGraphView graph={relationshipGraph} />
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
        <DebugPanel
          profile={localProfile}
          result={result}
          onClose={() => setShowDebugPanel(false)}
          onProfileUpdate={setLocalProfile}
        />
      )}
    </>
  );
};
