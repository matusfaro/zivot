import { describe, it, expect } from 'vitest';
import {
  ProvenanceBuilder,
  createInterpolationProvenance,
  createHRMultiplicationProvenance,
} from '../../../src/engine/provenance/ProvenanceBuilder';
import { ProvenanceChain, Reference } from '../../../src/types/risk/provenance';

describe('ProvenanceBuilder', () => {
  describe('Basic Builder Construction', () => {
    it('should require at least one step to build', () => {
      const builder = new ProvenanceBuilder('test-calc-1');

      expect(() => builder.build()).toThrow('ProvenanceChain requires at least one step');
    });

    it('should auto-set final result from last step if not explicitly set', () => {
      const builder = new ProvenanceBuilder('test-calc-2');

      builder
        .addStep()
        .operation({ type: 'add', terms: ['a', 'b'] })
        .addInput(ProvenanceBuilder.userInput(5, 'a', 'A', 'units'))
        .setOutput(ProvenanceBuilder.calculated(5, 0, 'Result', 'units'))
        .complete();

      const chain = builder.build();

      expect(chain.finalResult).toEqual(chain.steps[chain.steps.length - 1].output);
      expect(chain.finalResult.value).toBe(5);
    });

    it('should allow explicitly setting final result', () => {
      const builder = new ProvenanceBuilder('test-calc-3');
      const finalResult = ProvenanceBuilder.calculated(0.15, 0, 'Final Risk', '%');

      builder
        .addStep()
        .operation({ type: 'add', terms: ['a'] })
        .addInput(ProvenanceBuilder.userInput(0.15, 'risk', 'Risk', '%'))
        .setOutput(finalResult)
        .complete();

      builder.setFinalResult(finalResult);
      const chain = builder.build();

      expect(chain.finalResult).toEqual(finalResult);
      expect(chain.finalResult.value).toBe(0.15);
      expect(chain.finalResult.label).toBe('Final Risk');
    });

    it('should add methodology references', () => {
      const builder = new ProvenanceBuilder('test-calc-4');
      const reference: Reference = {
        citation: 'Test Study 2023',
        doi: '10.1234/test',
        evidenceLevel: 'rct',
      };

      builder.addMethodologyReference(reference);

      builder
        .addStep()
        .operation({ type: 'add', terms: ['a'] })
        .addInput(ProvenanceBuilder.userInput(1, 'a', 'A', ''))
        .setOutput(ProvenanceBuilder.calculated(1, 0, 'Result', ''))
        .complete();

      const chain = builder.build();

      expect(chain.methodologyReferences).toHaveLength(1);
      expect(chain.methodologyReferences![0].citation).toBe('Test Study 2023');
    });
  });

  describe('Step Building', () => {
    it('should add a simple calculation step', () => {
      const builder = new ProvenanceBuilder('test-calc-5');

      builder
        .addStep()
        .operation({ type: 'add', terms: ['a', 'b'] })
        .addInput(ProvenanceBuilder.userInput(5, 'age', 'Age', 'years'))
        .addInput(ProvenanceBuilder.userInput(10, 'risk', 'Base Risk', '%'))
        .setOutput(ProvenanceBuilder.calculated(15, 0, 'Total', '%'))
        .setFormula('total = 5 + 10 = 15')
        .setExplanation('Add age to base risk')
        .complete();

      const chain = builder.build();

      expect(chain.steps).toHaveLength(1);
      expect(chain.steps[0].operation.type).toBe('add');
      expect(chain.steps[0].inputs).toHaveLength(2);
      expect(chain.steps[0].output.value).toBe(15);
      expect(chain.steps[0].formula).toBe('total = 5 + 10 = 15');
      expect(chain.steps[0].explanation).toBe('Add age to base risk');
    });

    it('should add multiple steps', () => {
      const builder = new ProvenanceBuilder('test-calc-6');

      builder
        .addStep()
        .operation({ type: 'multiply', factors: ['baseline', 'hr'] })
        .addInput(ProvenanceBuilder.userInput(0.05, 'baseline', 'Baseline', '%'))
        .addInput(ProvenanceBuilder.calculated(2.0, 0, 'HR', ''))
        .setOutput(ProvenanceBuilder.calculated(0.10, 1, 'Adjusted Risk', '%'))
        .complete();

      builder
        .addStep()
        .operation({ type: 'complement', probability: 'risk' })
        .addInput(ProvenanceBuilder.calculated(0.10, 1, 'Adjusted Risk', '%'))
        .setOutput(ProvenanceBuilder.calculated(0.90, 2, 'Survival', '%'))
        .complete();

      const chain = builder.build();

      expect(chain.steps).toHaveLength(2);
      expect(chain.steps[0].operation.type).toBe('multiply');
      expect(chain.steps[1].operation.type).toBe('complement');
    });

    it('should require at least one input per step', () => {
      const builder = new ProvenanceBuilder('test-calc-7');

      const stepBuilder = builder
        .addStep()
        .operation({ type: 'add', terms: [] })
        .setOutput(ProvenanceBuilder.constant(0, 'zero', 'Default', ''));

      expect(() => stepBuilder.complete()).toThrow('ProvenanceStep requires at least one input value');
    });
  });

  describe('Value Source Helpers', () => {
    it('should create user input value', () => {
      const value = ProvenanceBuilder.userInput(45, 'demographics.age', 'Age', 'years');

      expect(value.value).toBe(45);
      expect(value.label).toBe('Age');
      expect(value.unit).toBe('years');
      expect(value.source.type).toBe('user_input');
      if (value.source.type === 'user_input') {
        expect(value.source.path).toBe('demographics.age');
      }
    });

    it('should create baseline data value', () => {
      const value = ProvenanceBuilder.baselineData(
        0.05,
        'white_male_us',
        45,
        'Baseline Risk',
        false
      );

      expect(value.value).toBe(0.05);
      expect(value.label).toBe('Baseline Risk');
      expect(value.unit).toBe('%');
      expect(value.source.type).toBe('baseline_data');
      if (value.source.type === 'baseline_data') {
        expect(value.source.curveId).toBe('white_male_us');
        expect(value.source.age).toBe(45);
        expect(value.source.interpolated).toBe(false);
      }
    });

    it('should create disease model value', () => {
      const value = ProvenanceBuilder.diseaseModel(
        2.0,
        'smoking_status',
        'categorical',
        'Smoking HR',
        ''
      );

      expect(value.value).toBe(2.0);
      expect(value.label).toBe('Smoking HR');
      expect(value.source.type).toBe('disease_model');
      if (value.source.type === 'disease_model') {
        expect(value.source.factorId).toBe('smoking_status');
        expect(value.source.mappingType).toBe('categorical');
      }
    });

    it('should create calculated value', () => {
      const value = ProvenanceBuilder.calculated(0.15, 3, 'Adjusted Risk', '%');

      expect(value.value).toBe(0.15);
      expect(value.label).toBe('Adjusted Risk');
      expect(value.source.type).toBe('calculated');
      if (value.source.type === 'calculated') {
        expect(value.source.fromStep).toBe(3);
      }
    });

    it('should create constant value', () => {
      const value = ProvenanceBuilder.constant(100, 'reference_ldl', 'Reference LDL', 'mg/dL');

      expect(value.value).toBe(100);
      expect(value.label).toBe('Reference LDL');
      expect(value.unit).toBe('mg/dL');
      expect(value.source.type).toBe('constant');
      if (value.source.type === 'constant') {
        expect(value.source.name).toBe('reference_ldl');
      }
    });
  });

  describe('Intermediate Values', () => {
    it('should add intermediate values to a step', () => {
      const builder = new ProvenanceBuilder('test-calc-8');

      builder
        .addStep()
        .operation({ type: 'multiply', factors: ['a', 'b', 'c'] })
        .addInput(ProvenanceBuilder.userInput(2, 'a', 'A', ''))
        .addInput(ProvenanceBuilder.userInput(3, 'b', 'B', ''))
        .addInput(ProvenanceBuilder.userInput(4, 'c', 'C', ''))
        .addIntermediate('a × b', 6, '2 × 3')
        .addIntermediate('(a × b) × c', 24, '6 × 4')
        .setOutput(ProvenanceBuilder.calculated(24, 0, 'Result', ''))
        .complete();

      const chain = builder.build();

      expect(chain.steps[0].intermediateValues).toHaveLength(2);
      expect(chain.steps[0].intermediateValues![0].label).toBe('a × b');
      expect(chain.steps[0].intermediateValues![0].value).toBe(6);
      expect(chain.steps[0].intermediateValues![1].value).toBe(24);
    });
  });

  describe('References', () => {
    it('should add references to a step', () => {
      const builder = new ProvenanceBuilder('test-calc-9');
      const ref: Reference = {
        citation: 'Framingham Study 2013',
        doi: '10.1161/example',
        evidenceLevel: 'cohort',
        notes: 'Primary source for baseline risk',
      };

      builder
        .addStep()
        .operation({ type: 'lookup', table: 'baseline', key: 45 })
        .addInput(ProvenanceBuilder.userInput(45, 'age', 'Age', 'years'))
        .setOutput(ProvenanceBuilder.baselineData(0.05, 'curve', 45, 'Risk', false))
        .addReferences([ref])
        .complete();

      const chain = builder.build();

      expect(chain.steps[0].references).toHaveLength(1);
      expect(chain.steps[0].references![0].citation).toBe('Framingham Study 2013');
      expect(chain.steps[0].references![0].doi).toBe('10.1161/example');
    });

    it('should add multiple references to a step', () => {
      const builder = new ProvenanceBuilder('test-calc-10');
      const refs: Reference[] = [
        { citation: 'Study A', doi: '10.1/a', evidenceLevel: 'rct' },
        { citation: 'Study B', doi: '10.1/b', evidenceLevel: 'cohort' },
      ];

      builder
        .addStep()
        .operation({ type: 'add', terms: [] })
        .addInput(ProvenanceBuilder.userInput(1, 'x', 'X', ''))
        .setOutput(ProvenanceBuilder.calculated(0, 0, 'Result', ''))
        .addReferences(refs)
        .complete();

      const chain = builder.build();

      expect(chain.steps[0].references).toHaveLength(2);
    });
  });

  describe('Helper Functions', () => {
    describe('createInterpolationProvenance', () => {
      it('should create interpolation provenance for age-based risk', () => {
        const chain = createInterpolationProvenance(
          'test-calc-11',
          45,
          40,
          0.042,
          50,
          0.068,
          0.0552,
          'white_male_us'
        );

        expect(chain.calculationId).toBe('test-calc-11');
        expect(chain.steps).toHaveLength(1);
        expect(chain.steps[0].operation.type).toBe('interpolate');
        expect(chain.steps[0].inputs).toHaveLength(3);
        expect(chain.steps[0].output.value).toBe(0.0552);
        expect(chain.steps[0].formula).toContain('0.042');
        expect(chain.steps[0].formula).toContain('0.068');
      });

      it('should handle exact match (no interpolation)', () => {
        const chain = createInterpolationProvenance(
          'test-calc-12',
          50,
          50,
          0.068,
          60,
          0.125,
          0.068,
          'white_male_us'
        );

        expect(chain.steps[0].output.value).toBe(0.068);
        expect(chain.finalResult.value).toBe(0.068);
      });
    });

    describe('createHRMultiplicationProvenance', () => {
      it('should create HR multiplication provenance', () => {
        const hrs = [
          { factorId: 'smoking', hr: 2.0, label: 'Smoking' },
          { factorId: 'ldl', hr: 1.5, label: 'LDL' },
        ];

        const chain = createHRMultiplicationProvenance(
          'test-calc-13',
          0.05,
          hrs,
          0.15
        );

        expect(chain.calculationId).toBe('test-calc-13');
        expect(chain.steps).toHaveLength(1);
        expect(chain.steps[0].operation.type).toBe('multiply');
        expect(chain.steps[0].inputs.length).toBeGreaterThanOrEqual(1);
        expect(chain.steps[0].output.value).toBe(0.15);
        expect(chain.steps[0].formula).toContain('2.0');
        expect(chain.steps[0].formula).toContain('1.5');
      });

      it('should handle single HR', () => {
        const hrs = [
          { factorId: 'smoking', hr: 2.0, label: 'Smoking' },
        ];

        const chain = createHRMultiplicationProvenance(
          'test-calc-14',
          0.05,
          hrs,
          0.10
        );

        expect(chain.steps[0].inputs.length).toBeGreaterThanOrEqual(1);
        expect(chain.steps[0].output.value).toBe(0.10);
      });

      it('should handle no HRs (baseline only)', () => {
        const chain = createHRMultiplicationProvenance(
          'test-calc-15',
          0.05,
          [],
          0.05
        );

        expect(chain.steps).toHaveLength(1);
        expect(chain.steps[0].output.value).toBe(0.05);
        // When no HRs, formula is "adjusted = 0.05% ×  = 0.05%" (empty hrTerms)
        expect(chain.steps[0].formula).toContain('adjusted');
        expect(chain.steps[0].inputs.length).toBe(1); // Only baseline
      });
    });
  });

  describe('Complete Workflow Example', () => {
    it('should build a complete CVD risk calculation provenance', () => {
      const builder = new ProvenanceBuilder('cvd-calc-complete');

      // Add methodology reference
      builder.addMethodologyReference({
        citation: 'Framingham Heart Study',
        doi: '10.1161/example',
        evidenceLevel: 'cohort',
      });

      // Step 1: Baseline risk interpolation
      builder
        .addStep()
        .operation({ type: 'interpolate', between: [40, 50] })
        .addInput(ProvenanceBuilder.userInput(45, 'demographics.dateOfBirth', 'Age', 'years'))
        .addInput(ProvenanceBuilder.baselineData(0.042, 'white_male_us', 40, 'Risk@40', false))
        .addInput(ProvenanceBuilder.baselineData(0.068, 'white_male_us', 50, 'Risk@50', false))
        .setOutput(ProvenanceBuilder.baselineData(0.055, 'white_male_us', 45, 'Baseline Risk', true))
        .setFormula('baseline = 4.2% + 0.5 × (6.8% - 4.2%) = 5.5%')
        .setExplanation('Interpolate baseline risk for age 45')
        .complete();

      // Step 2: Apply smoking HR
      builder
        .addStep()
        .operation({ type: 'multiply', factors: ['baseline', 'hr_smoking'] })
        .addInput(ProvenanceBuilder.calculated(0.055, 0, 'Baseline Risk', '%'))
        .addInput(ProvenanceBuilder.diseaseModel(2.0, 'smoking_status', 'categorical', 'Smoking HR', ''))
        .setOutput(ProvenanceBuilder.calculated(0.11, 1, 'Adjusted Risk', '%'))
        .setFormula('adjusted = 5.5% × 2.0 = 11.0%')
        .setExplanation('Apply smoking hazard ratio')
        .complete();

      // Set final result
      builder.setFinalResult(ProvenanceBuilder.calculated(0.11, 1, '10-Year CVD Risk', '%'));

      const chain = builder.build();

      // Verify structure
      expect(chain.calculationId).toBe('cvd-calc-complete');
      expect(chain.steps).toHaveLength(2);
      expect(chain.methodologyReferences).toHaveLength(1);
      expect(chain.finalResult.value).toBe(0.11);

      // Verify step 1
      expect(chain.steps[0].operation.type).toBe('interpolate');
      expect(chain.steps[0].inputs).toHaveLength(3);
      expect(chain.steps[0].output.value).toBe(0.055);

      // Verify step 2
      expect(chain.steps[1].operation.type).toBe('multiply');
      expect(chain.steps[1].inputs).toHaveLength(2);
      expect(chain.steps[1].output.value).toBe(0.11);
    });
  });

  describe('Edge Cases', () => {
    it('should handle boolean values', () => {
      const builder = new ProvenanceBuilder('test-edge-1');

      builder
        .addStep()
        .operation({ type: 'lookup', table: 'hr', key: true })
        .addInput(ProvenanceBuilder.userInput(true, 'medicalHistory.diabetes', 'Has Diabetes', ''))
        .setOutput(ProvenanceBuilder.calculated(1.5, 0, 'HR', ''))
        .complete();

      const chain = builder.build();

      expect(chain.steps[0].inputs[0].value).toBe(true);
    });

    it('should handle string values', () => {
      const builder = new ProvenanceBuilder('test-edge-2');

      builder
        .addStep()
        .operation({ type: 'lookup', table: 'hr', key: 'current' })
        .addInput(ProvenanceBuilder.userInput('current', 'lifestyle.smoking.status', 'Smoking Status', ''))
        .setOutput(ProvenanceBuilder.calculated(2.0, 0, 'HR', ''))
        .complete();

      const chain = builder.build();

      expect(chain.steps[0].inputs[0].value).toBe('current');
    });
  });
});
