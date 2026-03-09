import { describe, it, expect } from 'vitest';
import { loadDiseaseKB, getDiseaseModel, validateAllModels, validateDiseaseModel } from '../../src/knowledge';

describe('Disease Knowledge Base', () => {
  it('should load all disease models', async () => {
    const kb = await loadDiseaseKB();

    expect(kb.size).toBe(19); // Updated: now includes all disease models
    expect(kb.has('cvd_10year')).toBe(true);
    expect(kb.has('colorectal_cancer_10year')).toBe(true);
    expect(kb.has('lung_cancer_10year')).toBe(true);
    expect(kb.has('type2_diabetes_10year')).toBe(true);
  });

  it('should get individual disease models', () => {
    const cvd = getDiseaseModel('cvd_10year');

    expect(cvd).toBeDefined();
    expect(cvd?.metadata.id).toBe('cvd_10year');
    expect(cvd?.metadata.name).toBe('Cardiovascular Disease (10-year)');
    expect(cvd?.metadata.category).toBe('cardiovascular');
  });

  it('should return null for unknown disease', () => {
    const unknown = getDiseaseModel('unknown_disease');
    expect(unknown).toBeNull();
  });

  describe('CVD Model', () => {
    const cvd = getDiseaseModel('cvd_10year')!;

    it('should have baseline risk curves', () => {
      expect(cvd.baselineRisk.curves.length).toBeGreaterThan(0);

      const whiteMale = cvd.baselineRisk.curves.find(c => c.id === 'white_male_us');
      expect(whiteMale).toBeDefined();
      expect(whiteMale?.applicability.sex).toBe('male');
      expect(whiteMale?.ageRiskMapping.length).toBeGreaterThan(0);
    });

    it('should have risk factors', () => {
      expect(cvd.riskFactors.length).toBeGreaterThan(0);

      const ldl = cvd.riskFactors.find(f => f.factorId === 'ldl_cholesterol');
      expect(ldl).toBeDefined();
      expect(ldl?.type).toBe('continuous');
      expect(ldl?.modifiable).toBe(true);
      expect(ldl?.evidenceStrength).toBe('strong');
    });

    it('should have LDL cholesterol risk mapping', () => {
      const ldl = cvd.riskFactors.find(f => f.factorId === 'ldl_cholesterol')!;

      expect(ldl.mapping.type).toBe('continuous');
      if (ldl.mapping.type === 'continuous') {
        expect(ldl.mapping.strategy).toBe('lookup');
        expect(ldl.mapping.points).toBeDefined();
        expect(ldl.mapping.points!.length).toBeGreaterThan(0);
      }
    });

    it('should have smoking status as categorical risk factor', () => {
      const smoking = cvd.riskFactors.find(f => f.factorId === 'smoking_status')!;

      expect(smoking.type).toBe('categorical');
      if (smoking.mapping.type === 'categorical') {
        expect(smoking.mapping.categories.length).toBe(3);
        expect(smoking.mapping.referenceCategory).toBe('never');

        const current = smoking.mapping.categories.find(c => c.value === 'current');
        expect(current).toBeDefined();
        expect(current!.hazardRatio).toBeGreaterThan(1);
      }
    });

    it('should validate successfully', () => {
      const validation = validateDiseaseModel(cvd);
      expect(validation).toBeNull();
    });
  });

  describe('Colorectal Cancer Model', () => {
    const crc = getDiseaseModel('colorectal_cancer_10year')!;

    it('should have lower baseline risk than CVD', () => {
      const cvd = getDiseaseModel('cvd_10year')!;

      const crcMale = crc.baselineRisk.curves.find(c => c.id === 'average_male_us')!;
      const cvdMale = cvd.baselineRisk.curves.find(c => c.id === 'white_male_us')!;

      // At age 50, CRC risk should be lower than CVD risk
      const crcRisk50 = crcMale.ageRiskMapping.find(a => a.age === 50)!;
      const cvdRisk50 = cvdMale.ageRiskMapping.find(a => a.age === 50)!;

      expect(crcRisk50.risk).toBeLessThan(cvdRisk50.risk);
    });

    it('should have family history as major risk factor', () => {
      const familyHistory = crc.riskFactors.find(f => f.factorId === 'family_history_crc');

      expect(familyHistory).toBeDefined();
      expect(familyHistory?.type).toBe('categorical');
      expect(familyHistory?.evidenceStrength).toBe('strong');
    });

    it('should validate successfully', () => {
      const validation = validateDiseaseModel(crc);
      expect(validation).toBeNull();
    });
  });

  describe('Lung Cancer Model', () => {
    const lung = getDiseaseModel('lung_cancer_10year')!;

    it('should have very low baseline risk for never-smokers', () => {
      const neverSmoker = lung.baselineRisk.curves.find(c => c.id === 'never_smoker_male')!;

      const risk50 = neverSmoker.ageRiskMapping.find(a => a.age === 50)!;
      expect(risk50.risk).toBeLessThan(0.001); // Less than 0.1%
    });

    it('should have pack-years as strongest risk factor', () => {
      const packYears = lung.riskFactors.find(f => f.factorId === 'pack_years')!;

      expect(packYears).toBeDefined();
      expect(packYears.evidenceStrength).toBe('strong');

      if (packYears.mapping.type === 'continuous') {
        const points = packYears.mapping.points!;
        // High pack-years should have very high hazard ratio
        const highPackYears = points.find(p => p.value >= 40);
        expect(highPackYears).toBeDefined();
        expect(highPackYears!.hazardRatio).toBeGreaterThan(20);
      }
    });

    it('should validate successfully', () => {
      const validation = validateDiseaseModel(lung);
      expect(validation).toBeNull();
    });
  });

  describe('Type 2 Diabetes Model', () => {
    const diabetes = getDiseaseModel('type2_diabetes_10year')!;

    it('should have higher baseline risk than cancers', () => {
      const crc = getDiseaseModel('colorectal_cancer_10year')!;

      const diabetesMale = diabetes.baselineRisk.curves.find(c => c.id === 'average_male_us')!;
      const crcMale = crc.baselineRisk.curves.find(c => c.id === 'average_male_us')!;

      const diabetesRisk50 = diabetesMale.ageRiskMapping.find(a => a.age === 50)!;
      const crcRisk50 = crcMale.ageRiskMapping.find(a => a.age === 50)!;

      expect(diabetesRisk50.risk).toBeGreaterThan(crcRisk50.risk);
    });

    it('should have BMI as strongest modifiable risk factor', () => {
      const bmi = diabetes.riskFactors.find(f => f.factorId === 'bmi_diabetes')!;

      expect(bmi).toBeDefined();
      expect(bmi.evidenceStrength).toBe('strong');
      expect(bmi.modifiable).toBe(true);

      if (bmi.mapping.type === 'continuous') {
        const points = bmi.mapping.points!;
        // BMI 35 should have very high HR
        const obese = points.find(p => p.value === 35);
        expect(obese).toBeDefined();
        expect(obese!.hazardRatio).toBeGreaterThan(5);
      }
    });

    it('should validate successfully', () => {
      const validation = validateDiseaseModel(diabetes);
      expect(validation).toBeNull();
    });
  });

  it('should validate all models successfully', async () => {
    const results = await validateAllModels();

    expect(results['cvd_10year']).toBeNull();
    expect(results['colorectal_cancer_10year']).toBeNull();
    expect(results['lung_cancer_10year']).toBeNull();
    expect(results['type2_diabetes_10year']).toBeNull();
  });

  it('should have correct data paths in risk factors', () => {
    const cvd = getDiseaseModel('cvd_10year')!;
    const ldl = cvd.riskFactors.find(f => f.factorId === 'ldl_cholesterol')!;

    expect(ldl.requiredFields[0].path).toBe('labTests.lipidPanel.ldlCholesterol.value');
    expect(ldl.requiredFields[0].required).toBe(false); // Should be optional
    expect(ldl.requiredFields[0].alternatives).toBeDefined();
  });

  it('should have confidence intervals for risk mappings', () => {
    const cvd = getDiseaseModel('cvd_10year')!;
    const smoking = cvd.riskFactors.find(f => f.factorId === 'smoking_status')!;

    if (smoking.mapping.type === 'categorical') {
      const current = smoking.mapping.categories.find(c => c.value === 'current')!;
      expect(current.confidence).toBeDefined();
      expect(current.confidence!.length).toBe(2);
      expect(current.confidence![0]).toBeLessThan(current.hazardRatio);
      expect(current.confidence![1]).toBeGreaterThan(current.hazardRatio);
    }
  });
});
