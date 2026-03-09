import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { MedicalHistory } from '../../types/user/medicalHistory';

interface MedicalHistoryFormProps {
  initialData?: MedicalHistory;
  onSave: (data: MedicalHistory) => void;
  onNext?: () => void;
  onBack?: () => void;
}

export const MedicalHistoryForm: React.FC<MedicalHistoryFormProps> = ({
  initialData,
  onSave,
  onNext,
  onBack,
}) => {
  const [hasDiabetes, setHasDiabetes] = useState('no');
  const [hasHeartDisease, setHasHeartDisease] = useState('no');
  const [hasIBD, setHasIBD] = useState('no');
  const [hasCOPD, setHasCOPD] = useState('no');

  // Family History
  const [familyCVD, setFamilyCVD] = useState('no');
  const [familyColorectalCancer, setFamilyColorectalCancer] = useState('no');
  const [familyLungCancer, setFamilyLungCancer] = useState('no');
  const [familyDiabetes, setFamilyDiabetes] = useState('no');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const medicalHistory: MedicalHistory = {
      conditions: [],
      familyHistory: [],
    };

    // Personal conditions
    if (hasDiabetes === 'yes') {
      medicalHistory.conditions!.push({
        conditionId: 'type2_diabetes',
        name: 'Type 2 Diabetes',
        status: 'active',
      });
    }

    if (hasHeartDisease === 'yes') {
      medicalHistory.conditions!.push({
        conditionId: 'cvd',
        name: 'Cardiovascular Disease',
        status: 'active',
      });
    }

    if (hasIBD === 'yes') {
      medicalHistory.conditions!.push({
        conditionId: 'ibd',
        name: 'Inflammatory Bowel Disease',
        status: 'active',
      });
    }

    if (hasCOPD === 'yes') {
      medicalHistory.conditions!.push({
        conditionId: 'copd',
        name: 'COPD',
        status: 'active',
      });
    }

    // Family history
    if (familyCVD === 'yes') {
      medicalHistory.familyHistory!.push({
        conditionId: 'cvd',
        relation: 'parent',
      });
    }

    if (familyColorectalCancer === 'yes') {
      medicalHistory.familyHistory!.push({
        conditionId: 'colorectal_cancer',
        relation: 'parent',
      });
    }

    if (familyLungCancer === 'yes') {
      medicalHistory.familyHistory!.push({
        conditionId: 'lung_cancer',
        relation: 'parent',
      });
    }

    if (familyDiabetes === 'yes') {
      medicalHistory.familyHistory!.push({
        conditionId: 'type2_diabetes',
        relation: 'parent',
      });
    }

    onSave(medicalHistory);
    if (onNext) onNext();
  };

  const yesNoOptions = [
    { value: 'no', label: 'No' },
    { value: 'yes', label: 'Yes' },
  ];

  return (
    <Card title="Medical History">
      <form onSubmit={handleSubmit}>
        <p className="form-intro">
          Information about your medical history and family history helps identify
          additional risk factors.
        </p>

        <div className="section-divider">
          <h4>Your Health Conditions</h4>
          <p className="section-help">Do you currently have or have you been diagnosed with:</p>
        </div>

        <Select
          label="Type 2 Diabetes"
          value={hasDiabetes}
          onChange={setHasDiabetes}
          options={yesNoOptions}
        />

        <Select
          label="Heart Disease or Stroke"
          value={hasHeartDisease}
          onChange={setHasHeartDisease}
          options={yesNoOptions}
          helpText="Previous heart attack, angina, stroke, or coronary artery disease"
        />

        <Select
          label="Inflammatory Bowel Disease (IBD)"
          value={hasIBD}
          onChange={setHasIBD}
          options={yesNoOptions}
          helpText="Crohn's disease or ulcerative colitis"
        />

        <Select
          label="COPD or Emphysema"
          value={hasCOPD}
          onChange={setHasCOPD}
          options={yesNoOptions}
        />

        <div className="section-divider">
          <h4>Family History</h4>
          <p className="section-help">
            Have any of your parents or siblings been diagnosed with:
          </p>
        </div>

        <Select
          label="Heart Disease or Stroke"
          value={familyCVD}
          onChange={setFamilyCVD}
          options={yesNoOptions}
          helpText="Especially if diagnosed before age 50"
        />

        <Select
          label="Colorectal Cancer"
          value={familyColorectalCancer}
          onChange={setFamilyColorectalCancer}
          options={yesNoOptions}
        />

        <Select
          label="Lung Cancer"
          value={familyLungCancer}
          onChange={setFamilyLungCancer}
          options={yesNoOptions}
        />

        <Select
          label="Type 2 Diabetes"
          value={familyDiabetes}
          onChange={setFamilyDiabetes}
          options={yesNoOptions}
        />

        <div className="form-note">
          <strong>Note:</strong> You can add more detailed medical history (other conditions,
          medications, surgeries) later from your profile page.
        </div>

        <div className="form-actions">
          {onBack && (
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
          <Button type="submit" variant="primary">
            {onNext ? 'Finish' : 'Save'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
