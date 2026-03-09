import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { LabTests } from '../../types/user/labTests';
import { createUserDataPoint } from '../../types/common/datapoint';

interface LabTestsFormProps {
  initialData?: LabTests;
  onSave: (data: LabTests) => void;
  onNext?: () => void;
  onBack?: () => void;
}

export const LabTestsForm: React.FC<LabTestsFormProps> = ({
  initialData,
  onSave,
  onNext,
  onBack,
}) => {
  // Lipid Panel
  const [totalChol, setTotalChol] = useState(
    initialData?.lipidPanel?.totalCholesterol?.value?.toString() || ''
  );
  const [ldl, setLdl] = useState(
    initialData?.lipidPanel?.ldlCholesterol?.value?.toString() || ''
  );
  const [hdl, setHdl] = useState(
    initialData?.lipidPanel?.hdlCholesterol?.value?.toString() || ''
  );
  const [triglycerides, setTriglycerides] = useState(
    initialData?.lipidPanel?.triglycerides?.value?.toString() || ''
  );

  // Metabolic Panel
  const [glucose, setGlucose] = useState(
    initialData?.metabolicPanel?.glucose?.value?.toString() || ''
  );
  const [hba1c, setHba1c] = useState(
    initialData?.metabolicPanel?.hba1c?.value?.toString() || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const labTests: LabTests = {};

    // Build lipid panel if any value is entered
    if (totalChol || ldl || hdl || triglycerides) {
      labTests.lipidPanel = {};

      if (totalChol) {
        labTests.lipidPanel.totalCholesterol = createUserDataPoint(
          parseFloat(totalChol)
        );
      }
      if (ldl) {
        labTests.lipidPanel.ldlCholesterol = createUserDataPoint(parseFloat(ldl));
      }
      if (hdl) {
        labTests.lipidPanel.hdlCholesterol = createUserDataPoint(parseFloat(hdl));
      }
      if (triglycerides) {
        labTests.lipidPanel.triglycerides = createUserDataPoint(
          parseFloat(triglycerides)
        );
      }
    }

    // Build metabolic panel if any value is entered
    if (glucose || hba1c) {
      labTests.metabolicPanel = {};

      if (glucose) {
        labTests.metabolicPanel.glucose = createUserDataPoint(parseFloat(glucose));
      }
      if (hba1c) {
        labTests.metabolicPanel.hba1c = createUserDataPoint(parseFloat(hba1c));
      }
    }

    onSave(labTests);
    if (onNext) onNext();
  };

  return (
    <Card title="Lab Test Results">
      <form onSubmit={handleSubmit}>
        <p className="form-intro">
          Enter your most recent lab test results. All fields are optional, but more data
          improves accuracy.
        </p>

        <div className="section-divider">
          <h4>Lipid Panel (Cholesterol)</h4>
          <p className="section-help">
            From blood test, usually part of routine physical. Values in mg/dL.
          </p>
        </div>

        <Input
          label="Total Cholesterol"
          type="number"
          value={totalChol}
          onChange={setTotalChol}
          placeholder="200"
          unit="mg/dL"
          min={100}
          max={400}
          helpText="Normal: &lt; 200 mg/dL"
        />

        <Input
          label="LDL Cholesterol"
          type="number"
          value={ldl}
          onChange={setLdl}
          placeholder="100"
          unit="mg/dL"
          min={30}
          max={300}
          helpText="'Bad' cholesterol. Optimal: &lt; 100 mg/dL"
        />

        <Input
          label="HDL Cholesterol"
          type="number"
          value={hdl}
          onChange={setHdl}
          placeholder="50"
          unit="mg/dL"
          min={20}
          max={120}
          helpText="'Good' cholesterol. Higher is better: &gt; 60 mg/dL"
        />

        <Input
          label="Triglycerides"
          type="number"
          value={triglycerides}
          onChange={setTriglycerides}
          placeholder="150"
          unit="mg/dL"
          min={30}
          max={500}
          helpText="Normal: &lt; 150 mg/dL"
        />

        <div className="section-divider">
          <h4>Blood Sugar</h4>
          <p className="section-help">Diabetes screening tests</p>
        </div>

        <Input
          label="Fasting Glucose"
          type="number"
          value={glucose}
          onChange={setGlucose}
          placeholder="90"
          unit="mg/dL"
          min={50}
          max={300}
          helpText="Normal fasting: 70-99 mg/dL. Diabetes: ≥ 126 mg/dL"
        />

        <Input
          label="HbA1c"
          type="number"
          value={hba1c}
          onChange={setHba1c}
          placeholder="5.5"
          unit="%"
          min={4}
          max={15}
          step={0.1}
          helpText="3-month average. Normal: &lt; 5.7%. Diabetes: ≥ 6.5%"
        />

        <div className="form-note">
          <strong>Note:</strong> You can upload a complete lab report later. For now, enter
          the key values that affect your risk.
        </div>

        <div className="form-actions">
          {onBack && (
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
          <Button type="submit" variant="primary">
            {onNext ? 'Next: Lifestyle' : 'Save'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
