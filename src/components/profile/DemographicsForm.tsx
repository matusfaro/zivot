import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Demographics, Ethnicity } from '../../types/user/demographics';
import { createUserDataPoint } from '../../types/common/datapoint';

interface DemographicsFormProps {
  initialData?: Demographics;
  onSave: (data: Demographics) => void;
  onNext?: () => void;
}

export const DemographicsForm: React.FC<DemographicsFormProps> = ({
  initialData,
  onSave,
  onNext,
}) => {
  const [dateOfBirth, setDateOfBirth] = useState(
    initialData?.dateOfBirth?.value || ''
  );
  const [biologicalSex, setBiologicalSex] = useState<'male' | 'female' | ''>(
    (initialData?.biologicalSex?.value as 'male' | 'female') || ''
  );
  const [ethnicity, setEthnicity] = useState<Ethnicity | ''>(
    (initialData?.ethnicity?.value as Ethnicity) || ''
  );
  const [country, setCountry] = useState(initialData?.country?.value || 'US');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const demographics: Demographics = {};

    if (dateOfBirth) {
      demographics.dateOfBirth = createUserDataPoint(dateOfBirth);
    }

    if (biologicalSex) {
      demographics.biologicalSex = createUserDataPoint(biologicalSex);
    }

    if (ethnicity) {
      demographics.ethnicity = createUserDataPoint(ethnicity);
    }

    if (country) {
      demographics.country = createUserDataPoint(country);
    }

    onSave(demographics);
    if (onNext) onNext();
  };

  const sexOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];

  const ethnicityOptions = [
    { value: 'white', label: 'White / Caucasian' },
    { value: 'black', label: 'Black / African American' },
    { value: 'hispanic', label: 'Hispanic / Latino' },
    { value: 'asian', label: 'Asian' },
    { value: 'native_american', label: 'Native American' },
    { value: 'pacific_islander', label: 'Pacific Islander' },
    { value: 'mixed', label: 'Mixed' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Card title="Basic Demographics">
      <form onSubmit={handleSubmit}>
        <p className="form-intro">
          Let's start with some basic information. This helps us estimate your baseline risk.
        </p>

        <Input
          label="Date of Birth"
          type="date"
          value={dateOfBirth}
          onChange={setDateOfBirth}
          required
          helpText="Required for calculating age-based risk"
        />

        <Select
          label="Biological Sex"
          value={biologicalSex}
          onChange={(val) => setBiologicalSex(val as 'male' | 'female')}
          options={sexOptions}
          required
          helpText="Assigned sex at birth (used for risk calculations)"
        />

        <Select
          label="Ethnicity"
          value={ethnicity}
          onChange={(val) => setEthnicity(val as Ethnicity)}
          options={ethnicityOptions}
          helpText="Optional, but improves accuracy of risk estimates"
        />

        <Input
          label="Country"
          type="text"
          value={country}
          onChange={setCountry}
          placeholder="United States"
          helpText="Optional"
        />

        <div className="form-actions">
          <Button type="submit" variant="primary">
            {onNext ? 'Next: Measurements' : 'Save'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
