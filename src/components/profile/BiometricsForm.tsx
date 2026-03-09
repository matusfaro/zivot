import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Biometrics } from '../../types/user/biometrics';
import { createUserDataPoint, addToTimeSeries } from '../../types/common/datapoint';

interface BiometricsFormProps {
  initialData?: Biometrics;
  onSave: (data: Biometrics) => void;
  onNext?: () => void;
  onBack?: () => void;
}

export const BiometricsForm: React.FC<BiometricsFormProps> = ({
  initialData,
  onSave,
  onNext,
  onBack,
}) => {
  const [height, setHeight] = useState(
    initialData?.height?.value?.toString() || ''
  );
  const [weight, setWeight] = useState(
    initialData?.weight?.mostRecent?.value.value.toString() || ''
  );
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>(
    initialData?.weight?.mostRecent?.value.unit || 'kg'
  );
  const [systolic, setSystolic] = useState(
    initialData?.bloodPressure?.mostRecent?.value.systolic.toString() || ''
  );
  const [diastolic, setDiastolic] = useState(
    initialData?.bloodPressure?.mostRecent?.value.diastolic.toString() || ''
  );
  const [waist, setWaist] = useState(
    initialData?.waistCircumference?.mostRecent?.value.toString() || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const biometrics: Biometrics = {};

    if (height) {
      biometrics.height = createUserDataPoint(parseFloat(height));
    }

    if (weight) {
      const weightValue = { value: parseFloat(weight), unit: weightUnit };
      biometrics.weight = addToTimeSeries(
        initialData?.weight,
        createUserDataPoint(weightValue)
      );
    }

    if (systolic && diastolic) {
      const bpValue = {
        systolic: parseFloat(systolic),
        diastolic: parseFloat(diastolic),
      };
      biometrics.bloodPressure = addToTimeSeries(
        initialData?.bloodPressure,
        createUserDataPoint(bpValue)
      );
    }

    if (waist) {
      biometrics.waistCircumference = addToTimeSeries(
        initialData?.waistCircumference,
        createUserDataPoint(parseFloat(waist))
      );
    }

    onSave(biometrics);
    if (onNext) onNext();
  };

  const weightUnitOptions = [
    { value: 'kg', label: 'kg' },
    { value: 'lbs', label: 'lbs' },
  ];

  // Calculate and display BMI if height and weight are entered
  const calculateBMI = () => {
    if (!height || !weight) return null;
    let weightKg = parseFloat(weight);
    if (weightUnit === 'lbs') {
      weightKg = weightKg * 0.453592;
    }
    const heightM = parseFloat(height) / 100;
    const bmi = weightKg / (heightM * heightM);
    return bmi.toFixed(1);
  };

  const bmi = calculateBMI();

  return (
    <Card title="Physical Measurements">
      <form onSubmit={handleSubmit}>
        <p className="form-intro">
          These measurements help calculate your BMI and assess cardiovascular risk.
        </p>

        <Input
          label="Height"
          type="number"
          value={height}
          onChange={setHeight}
          placeholder="170"
          unit="cm"
          min={100}
          max={250}
          step={0.1}
          helpText="Your height in centimeters"
        />

        <div className="input-row">
          <Input
            label="Weight"
            type="number"
            value={weight}
            onChange={setWeight}
            placeholder="70"
            min={30}
            max={300}
            step={0.1}
          />
          <Select
            label="Unit"
            value={weightUnit}
            onChange={(val) => setWeightUnit(val as 'kg' | 'lbs')}
            options={weightUnitOptions}
          />
        </div>

        {bmi && (
          <div className="bmi-display">
            <strong>BMI:</strong> {bmi}
            {parseFloat(bmi) < 18.5 && ' (Underweight)'}
            {parseFloat(bmi) >= 18.5 && parseFloat(bmi) < 25 && ' (Normal)'}
            {parseFloat(bmi) >= 25 && parseFloat(bmi) < 30 && ' (Overweight)'}
            {parseFloat(bmi) >= 30 && ' (Obese)'}
          </div>
        )}

        <div className="section-divider">
          <h4>Blood Pressure</h4>
          <p className="section-help">Optional but strongly recommended</p>
        </div>

        <div className="input-row">
          <Input
            label="Systolic (top number)"
            type="number"
            value={systolic}
            onChange={setSystolic}
            placeholder="120"
            unit="mmHg"
            min={70}
            max={250}
          />
          <Input
            label="Diastolic (bottom number)"
            type="number"
            value={diastolic}
            onChange={setDiastolic}
            placeholder="80"
            unit="mmHg"
            min={40}
            max={150}
          />
        </div>

        <div className="section-divider">
          <h4>Additional Measurements</h4>
          <p className="section-help">Optional</p>
        </div>

        <Input
          label="Waist Circumference"
          type="number"
          value={waist}
          onChange={setWaist}
          placeholder="85"
          unit="cm"
          min={50}
          max={200}
          helpText="Measure around your waist at belly button level"
        />

        <div className="form-actions">
          {onBack && (
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
          <Button type="submit" variant="primary">
            {onNext ? 'Next: Lab Tests' : 'Save'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
