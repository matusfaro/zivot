import React, { useState, useEffect } from 'react';
import { DemographicsForm } from './DemographicsForm';
import { BiometricsForm } from './BiometricsForm';
import { LabTestsForm } from './LabTestsForm';
import { LifestyleForm } from './LifestyleForm';
import { MedicalHistoryForm } from './MedicalHistoryForm';
import { Demographics } from '../../types/user/demographics';
import { Biometrics } from '../../types/user/biometrics';
import { LabTests } from '../../types/user/labTests';
import { Lifestyle } from '../../types/user/lifestyle';
import { MedicalHistory } from '../../types/user/medicalHistory';
import { profileRepository } from '../../database/repositories/ProfileRepository';

type Step = 'demographics' | 'biometrics' | 'labTests' | 'lifestyle' | 'medicalHistory';

const STEPS: Step[] = ['demographics', 'biometrics', 'labTests', 'lifestyle', 'medicalHistory'];

const STEP_TITLES = {
  demographics: 'Basic Information',
  biometrics: 'Measurements',
  labTests: 'Lab Tests',
  lifestyle: 'Lifestyle',
  medicalHistory: 'Medical History',
};

interface ProfileWizardProps {
  onComplete?: () => void;
}

export const ProfileWizard: React.FC<ProfileWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<Step>('demographics');
  const [demographics, setDemographics] = useState<Demographics>();
  const [biometrics, setBiometrics] = useState<Biometrics>();
  const [labTests, setLabTests] = useState<LabTests>();
  const [lifestyle, setLifestyle] = useState<Lifestyle>();
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory>();
  const [loading, setLoading] = useState(true);

  // Load existing profile data if available
  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await profileRepository.getProfile();
        if (profile) {
          setDemographics(profile.demographics);
          setBiometrics(profile.biometrics);
          setLabTests(profile.labTests);
          setLifestyle(profile.lifestyle);
          setMedicalHistory(profile.medicalHistory);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleSaveDemographics = async (data: Demographics) => {
    setDemographics(data);
    await profileRepository.updateDemographics(data);
  };

  const handleSaveBiometrics = async (data: Biometrics) => {
    setBiometrics(data);
    await profileRepository.updateBiometrics(data);
  };

  const handleSaveLabTests = async (data: LabTests) => {
    setLabTests(data);
    await profileRepository.updateLabTests(data);
  };

  const handleSaveLifestyle = async (data: Lifestyle) => {
    setLifestyle(data);
    await profileRepository.updateLifestyle(data);
  };

  const handleSaveMedicalHistory = async (data: MedicalHistory) => {
    setMedicalHistory(data);
    await profileRepository.updateMedicalHistory(data);
  };

  const handleNext = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    } else {
      // Wizard complete
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const handleStepClick = (step: Step) => {
    setCurrentStep(step);
  };

  if (loading) {
    return <div className="wizard-loading">Loading...</div>;
  }

  const currentIndex = STEPS.indexOf(currentStep);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  return (
    <div className="profile-wizard">
      <div className="wizard-header">
        <h2>Health Profile Setup</h2>
        <p>Help us understand your health to calculate personalized risk estimates</p>
      </div>

      {/* Progress bar */}
      <div className="wizard-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-text">
          Step {currentIndex + 1} of {STEPS.length}: {STEP_TITLES[currentStep]}
        </div>
      </div>

      {/* Step indicators */}
      <div className="wizard-steps">
        {STEPS.map((step, index) => (
          <button
            key={step}
            className={`step-indicator ${index <= currentIndex ? 'active' : ''} ${
              index === currentIndex ? 'current' : ''
            }`}
            onClick={() => handleStepClick(step)}
            type="button"
          >
            <span className="step-number">{index + 1}</span>
            <span className="step-label">{STEP_TITLES[step]}</span>
          </button>
        ))}
      </div>

      {/* Current step form */}
      <div className="wizard-content">
        {currentStep === 'demographics' && (
          <DemographicsForm
            initialData={demographics}
            onSave={handleSaveDemographics}
            onNext={handleNext}
          />
        )}

        {currentStep === 'biometrics' && (
          <BiometricsForm
            initialData={biometrics}
            onSave={handleSaveBiometrics}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 'labTests' && (
          <LabTestsForm
            initialData={labTests}
            onSave={handleSaveLabTests}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 'lifestyle' && (
          <LifestyleForm
            initialData={lifestyle}
            onSave={handleSaveLifestyle}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 'medicalHistory' && (
          <MedicalHistoryForm
            initialData={medicalHistory}
            onSave={handleSaveMedicalHistory}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
      </div>

      {/* Data privacy note */}
      <div className="wizard-footer">
        <p className="privacy-note">
          🔒 All your data is stored locally on your device. Nothing is sent to our servers.
        </p>
      </div>
    </div>
  );
};
