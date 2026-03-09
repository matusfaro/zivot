/**
 * ReferenceExtractor - Extract scientific references from disease models
 *
 * Converts references from disease model JSON structures into
 * standardized Reference objects for use in provenance chains.
 */

import { Reference } from '../../types/risk/provenance';
import {
  DiseaseModel,
  DiseaseMetadata,
  BaselineRiskCurve,
  Source,
} from '../../types/knowledge/disease';
import {
  RiskFactorDescriptor,
  RiskMapping,
  ContinuousRiskMapping,
  CategoricalRiskMapping,
  BooleanRiskMapping,
} from '../../types/knowledge/riskFactor';

export class ReferenceExtractor {
  /**
   * Get references from disease model metadata
   */
  static getModelReferences(model: DiseaseModel): Reference[] {
    return model.metadata.sources.map((source) => this.convertSource(source));
  }

  /**
   * Get references for a baseline risk curve
   */
  static getBaselineReferences(curve: BaselineRiskCurve): Reference[] {
    const references: Reference[] = [];

    // Main curve source
    if (curve.source) {
      references.push({
        citation: curve.source,
        doi: curve.doi,
        url: curve.url,
        notes: curve.notes,
      });
    }

    // Individual age point citations (if any are different from main source)
    curve.ageRiskMapping.forEach((point) => {
      if (point.citation && point.citation !== curve.source) {
        references.push({
          citation: point.citation,
          doi: point.doi,
          notes: `Age ${point.age} specific data`,
        });
      }
    });

    return references;
  }

  /**
   * Get references for a risk factor
   */
  static getFactorReferences(factor: RiskFactorDescriptor): Reference[] {
    const references: Reference[] = [];

    // Main factor citation
    if (factor.citation) {
      references.push({
        citation: factor.citation,
        doi: factor.doi,
        url: factor.url,
        evidenceLevel: factor.evidenceLevel,
        notes: factor.notes,
      });
    }

    // Mapping-specific citations
    const mappingRefs = this.getMappingReferences(factor.mapping);
    mappingRefs.forEach((ref) => {
      // Only add if not duplicate of main citation
      if (ref.citation !== factor.citation) {
        references.push(ref);
      }
    });

    return references;
  }

  /**
   * Get references from a risk mapping
   */
  static getMappingReferences(mapping: RiskMapping): Reference[] {
    const references: Reference[] = [];

    switch (mapping.type) {
      case 'continuous': {
        const contMapping = mapping as ContinuousRiskMapping;

        // Coefficient citations
        if (contMapping.coefficients?.citation) {
          references.push({
            citation: contMapping.coefficients.citation,
            doi: contMapping.coefficients.doi,
            notes: `Coefficient values: slope=${contMapping.coefficients.slope}`,
          });
        }

        // Point-specific citations (for lookup/spline)
        if (contMapping.points) {
          contMapping.points.forEach((point) => {
            if (point.citation) {
              references.push({
                citation: point.citation,
                doi: point.doi,
                notes: `Hazard ratio at value=${point.value}: HR=${point.hazardRatio}`,
              });
            }
          });
        }
        break;
      }

      case 'categorical': {
        const catMapping = mapping as CategoricalRiskMapping;
        catMapping.categories.forEach((category) => {
          if (category.citation) {
            const value = Array.isArray(category.value)
              ? category.value.join(', ')
              : category.value;
            references.push({
              citation: category.citation,
              doi: category.doi,
              notes: `Category "${value}": HR=${category.hazardRatio}`,
            });
          }
        });
        break;
      }

      case 'boolean': {
        const boolMapping = mapping as BooleanRiskMapping;
        if (boolMapping.citation) {
          references.push({
            citation: boolMapping.citation,
            doi: boolMapping.doi,
            notes: `True HR=${boolMapping.trueHazardRatio}, False HR=${boolMapping.falseHazardRatio}`,
          });
        }
        break;
      }

      case 'derived':
        // Derived mappings don't typically have their own citations
        break;
    }

    return references;
  }

  /**
   * Get a single reference from a baseline curve (for convenience)
   */
  static getBaselineReference(curve: BaselineRiskCurve): Reference | undefined {
    if (!curve.source) return undefined;

    return {
      citation: curve.source,
      doi: curve.doi,
      url: curve.url,
      notes: curve.notes,
    };
  }

  /**
   * Get a single reference from a risk factor (for convenience)
   */
  static getFactorReference(factor: RiskFactorDescriptor): Reference | undefined {
    if (!factor.citation) return undefined;

    return {
      citation: factor.citation,
      doi: factor.doi,
      url: factor.url,
      evidenceLevel: factor.evidenceLevel,
      notes: factor.notes,
    };
  }

  /**
   * Convert a Source object to a Reference object
   */
  private static convertSource(source: Source): Reference {
    return {
      citation: source.citation,
      doi: source.doi,
      url: source.url,
      evidenceLevel: source.evidenceLevel,
    };
  }

  /**
   * Create a reference for a calculation methodology
   * (used for complement rule, interpolation, etc.)
   */
  static createMethodologyReference(
    methodology: string,
    citation?: string,
    doi?: string,
    url?: string
  ): Reference {
    return {
      citation: citation || `${methodology} (standard statistical methodology)`,
      doi,
      url,
      notes: methodology,
    };
  }

  /**
   * Create a reference for competing risks methodology
   */
  static getCompetingRisksReference(): Reference {
    return {
      citation: 'Competing risks methodology',
      notes:
        'Standard epidemiological approach using the complement rule for independent events: P(survive all) = ∏(1 - disease_risk_i)',
      url: 'https://en.wikipedia.org/wiki/Competing_risks',
    };
  }

  /**
   * Create a reference for linear interpolation
   */
  static getLinearInterpolationReference(): Reference {
    return {
      citation: 'Linear interpolation',
      notes: 'Standard mathematical interpolation: y = y₁ + t(y₂ - y₁) where t = (x - x₁)/(x₂ - x₁)',
      url: 'https://en.wikipedia.org/wiki/Linear_interpolation',
    };
  }

  /**
   * Deduplicate references by citation
   */
  static deduplicateReferences(references: Reference[]): Reference[] {
    const seen = new Set<string>();
    return references.filter((ref) => {
      if (seen.has(ref.citation)) {
        return false;
      }
      seen.add(ref.citation);
      return true;
    });
  }

  /**
   * Merge multiple reference arrays and deduplicate
   */
  static mergeReferences(...referenceLists: Reference[][]): Reference[] {
    const all = referenceLists.flat();
    return this.deduplicateReferences(all);
  }
}
