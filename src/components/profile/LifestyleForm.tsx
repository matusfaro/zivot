import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Lifestyle, SmokingStatus } from '../../types/user/lifestyle';
import { createUserDataPoint, addToTimeSeries } from '../../types/common/datapoint';

interface LifestyleFormProps {
  initialData?: Lifestyle;
  onSave: (data: Lifestyle) => void;
  onNext?: () => void;
  onBack?: () => void;
}

export const LifestyleForm: React.FC<LifestyleFormProps> = ({
  initialData,
  onSave,
  onNext,
  onBack,
}) => {
  // Smoking
  const [smokingStatus, setSmokingStatus] = useState<SmokingStatus | ''>(
    (initialData?.smoking?.status?.value as SmokingStatus) || ''
  );
  const [packYears, setPackYears] = useState(
    initialData?.smoking?.packYears?.value?.toString() || ''
  );

  // Exercise
  const [exerciseMinutes, setExerciseMinutes] = useState(
    initialData?.exercise?.moderateMinutesPerWeek?.mostRecent?.value?.toString() || ''
  );

  // Alcohol
  const [drinksPerWeek, setDrinksPerWeek] = useState(
    initialData?.alcohol?.drinksPerWeek?.mostRecent?.value?.toString() || ''
  );

  // Diet
  const [vegetablesPerDay, setVegetablesPerDay] = useState(
    initialData?.diet?.vegetableServingsPerDay?.mostRecent?.value?.toString() || ''
  );
  const [fruitPerDay, setFruitPerDay] = useState(
    initialData?.diet?.fruitServingsPerDay?.mostRecent?.value?.toString() || ''
  );
  const [processedMeatPerWeek, setProcessedMeatPerWeek] = useState(
    initialData?.diet?.processedMeatServingsPerWeek?.mostRecent?.value?.toString() || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const lifestyle: Lifestyle = {};

    // Smoking
    if (smokingStatus) {
      lifestyle.smoking = {
        status: createUserDataPoint(smokingStatus),
      };

      if (packYears) {
        lifestyle.smoking.packYears = createUserDataPoint(parseFloat(packYears));
      }
    }

    // Exercise
    if (exerciseMinutes) {
      lifestyle.exercise = {
        moderateMinutesPerWeek: addToTimeSeries(
          initialData?.exercise?.moderateMinutesPerWeek,
          createUserDataPoint(parseFloat(exerciseMinutes))
        ),
      };
    }

    // Alcohol
    if (drinksPerWeek) {
      lifestyle.alcohol = {
        drinksPerWeek: addToTimeSeries(
          initialData?.alcohol?.drinksPerWeek,
          createUserDataPoint(parseFloat(drinksPerWeek))
        ),
      };
    }

    // Diet
    if (vegetablesPerDay || fruitPerDay || processedMeatPerWeek) {
      lifestyle.diet = {};

      if (vegetablesPerDay) {
        lifestyle.diet.vegetableServingsPerDay = addToTimeSeries(
          initialData?.diet?.vegetableServingsPerDay,
          createUserDataPoint(parseFloat(vegetablesPerDay))
        );
      }

      if (fruitPerDay) {
        lifestyle.diet.fruitServingsPerDay = addToTimeSeries(
          initialData?.diet?.fruitServingsPerDay,
          createUserDataPoint(parseFloat(fruitPerDay))
        );
      }

      if (processedMeatPerWeek) {
        lifestyle.diet.processedMeatServingsPerWeek = addToTimeSeries(
          initialData?.diet?.processedMeatServingsPerWeek,
          createUserDataPoint(parseFloat(processedMeatPerWeek))
        );
      }
    }

    onSave(lifestyle);
    if (onNext) onNext();
  };

  const smokingOptions = [
    { value: 'never', label: 'Never smoked' },
    { value: 'former', label: 'Former smoker' },
    { value: 'current', label: 'Current smoker' },
  ];

  return (
    <Card title="Lifestyle & Habits">
      <form onSubmit={handleSubmit}>
        <p className="form-intro">
          Lifestyle factors have a major impact on your health risks. Be honest - this is
          just for you!
        </p>

        <div className="section-divider">
          <h4>Smoking</h4>
        </div>

        <Select
          label="Smoking Status"
          value={smokingStatus}
          onChange={(val) => setSmokingStatus(val as SmokingStatus)}
          options={smokingOptions}
          helpText="Have you smoked at least 100 cigarettes in your lifetime?"
        />

        {(smokingStatus === 'former' || smokingStatus === 'current') && (
          <Input
            label="Pack-Years"
            type="number"
            value={packYears}
            onChange={setPackYears}
            placeholder="20"
            min={0}
            max={100}
            step={0.5}
            helpText="Packs per day × years smoked. Example: 1 pack/day for 20 years = 20 pack-years"
          />
        )}

        <div className="section-divider">
          <h4>Physical Activity</h4>
        </div>

        <Input
          label="Exercise per Week"
          type="number"
          value={exerciseMinutes}
          onChange={setExerciseMinutes}
          placeholder="150"
          unit="minutes"
          min={0}
          max={1000}
          helpText="Moderate-intensity exercise (brisk walking, cycling, swimming). Recommended: ≥ 150 min/week"
        />

        <div className="section-divider">
          <h4>Alcohol Consumption</h4>
        </div>

        <Input
          label="Drinks per Week"
          type="number"
          value={drinksPerWeek}
          onChange={setDrinksPerWeek}
          placeholder="0"
          unit="drinks"
          min={0}
          max={50}
          helpText="1 drink = 12oz beer, 5oz wine, or 1.5oz spirits. Moderate: ≤ 7/week (women), ≤ 14/week (men)"
        />

        <div className="section-divider">
          <h4>Diet</h4>
        </div>

        <Input
          label="Vegetable Servings per Day"
          type="number"
          value={vegetablesPerDay}
          onChange={setVegetablesPerDay}
          placeholder="3"
          unit="servings"
          min={0}
          max={20}
          step={0.5}
          helpText="1 serving = 1 cup raw or ½ cup cooked. Recommended: ≥ 3-5 servings/day"
        />

        <Input
          label="Fruit Servings per Day"
          type="number"
          value={fruitPerDay}
          onChange={setFruitPerDay}
          placeholder="2"
          unit="servings"
          min={0}
          max={20}
          step={0.5}
          helpText="1 serving = 1 medium fruit or ½ cup. Recommended: ≥ 2-3 servings/day"
        />

        <Input
          label="Processed/Red Meat per Week"
          type="number"
          value={processedMeatPerWeek}
          onChange={setProcessedMeatPerWeek}
          placeholder="2"
          unit="servings"
          min={0}
          max={30}
          helpText="Bacon, sausage, deli meat, red meat. Recommended: &lt; 3 servings/week"
        />

        <div className="form-actions">
          {onBack && (
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
          <Button type="submit" variant="primary">
            {onNext ? 'Next: Medical History' : 'Save'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
