/**
 * Build organic, fluid graph layout for Cytoscape
 * Converts RelationshipGraph → Cytoscape nodes & edges with automatic positioning
 */

import { RelationshipGraph } from '../../types/registry';

export interface GraphLayoutOptions {
  layout?: 'cose' | 'dagre' | 'klay' | 'cola'; // Layout algorithm
  animate?: boolean; // Animate layout transitions
}

const DEFAULT_OPTIONS: Required<GraphLayoutOptions> = {
  layout: 'cose', // Force-directed physics layout
  animate: true,
};

/**
 * Build organic graph layout using Cytoscape format
 */
export function buildGraphLayout(
  graph: RelationshipGraph,
  options?: GraphLayoutOptions
): { elements: any; style: any; layout: any } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const nodes: any[] = [];
  const edges: any[] = [];

  // Layer 1: Questions
  for (const [id, question] of graph.questions) {
    nodes.push({
      data: {
        id: `question-${id}`,
        label: truncate(question.question, 60),
        type: 'question',
        questionId: id,
      },
      classes: 'question-node',
    });
  }

  // Layer 2: Fields
  for (const [id, field] of graph.fields) {
    nodes.push({
      data: {
        id: `field-${id}`,
        label: field.label,
        type: 'field',
        fieldId: id,
        category: field.category.toLowerCase(),
      },
      classes: `field-node ${field.category.toLowerCase()}`,
    });
  }

  // Layer 3: Risk Factors
  for (const [id, factor] of graph.riskFactors) {
    nodes.push({
      data: {
        id: `factor-${id}`,
        label: truncate(factor.name, 45),
        type: 'riskFactor',
        factorId: id,
        diseaseId: factor.diseaseId,
        evidenceStrength: factor.evidenceStrength,
      },
      classes: `risk-factor-node ${factor.evidenceStrength}`,
    });
  }

  // Layer 4: Diseases
  for (const [id, disease] of graph.diseases) {
    nodes.push({
      data: {
        id: `disease-${id}`,
        label: disease.name,
        type: 'disease',
        diseaseId: id,
        category: disease.category,
        riskFactorCount: disease.usesRiskFactors.length,
      },
      classes: `disease-node ${disease.category}`,
    });
  }

  // Layer 5: Overall Mortality
  nodes.push({
    data: {
      id: 'overall-mortality',
      label: 'Overall 10-Year Mortality',
      type: 'mortality',
    },
    classes: 'mortality-node',
  });

  // Add edges: Questions → Fields
  for (const [id, field] of graph.fields) {
    const fieldNodeId = `field-${id}`;
    for (const qId of field.mappedFromQuestions) {
      const questionNodeId = `question-${qId}`;
      edges.push({
        data: {
          id: `q-${qId}-f-${id}`,
          source: questionNodeId,
          target: fieldNodeId,
        },
        classes: 'edge-question-field',
      });
    }
  }

  // Add edges: Fields → Risk Factors
  for (const [id, factor] of graph.riskFactors) {
    const factorNodeId = `factor-${id}`;
    for (const fieldId of factor.usesFields) {
      const fieldNodeId = `field-${fieldId}`;
      edges.push({
        data: {
          id: `f-${fieldId}-rf-${id}`,
          source: fieldNodeId,
          target: factorNodeId,
        },
        classes: 'edge-field-factor',
      });
    }
  }

  // Add edges: Risk Factors → Diseases
  for (const [id, disease] of graph.diseases) {
    const diseaseNodeId = `disease-${id}`;
    for (const factorId of disease.usesRiskFactors) {
      const factorNodeId = `factor-${factorId}`;
      edges.push({
        data: {
          id: `rf-${factorId}-d-${id}`,
          source: factorNodeId,
          target: diseaseNodeId,
        },
        classes: 'edge-factor-disease',
      });
    }
  }

  // Add edges: Diseases → Overall Mortality
  for (const id of graph.diseases.keys()) {
    const diseaseNodeId = `disease-${id}`;
    edges.push({
      data: {
        id: `d-${id}-om`,
        source: diseaseNodeId,
        target: 'overall-mortality',
      },
      classes: 'edge-disease-mortality',
    });
  }

  const elements = [...nodes, ...edges];

  console.log(`[GraphLayout] Created ${nodes.length} nodes and ${edges.length} edges for Cytoscape`);

  return {
    elements,
    style: getCytoscapeStyle(),
    layout: getCytoscapeLayout(opts.layout, opts.animate),
  };
}

/**
 * Filter graph based on criteria
 */
export function filterGraph(
  graph: RelationshipGraph,
  filter: 'all' | 'orphaned' | 'connected',
  category?: string,
  searchQuery?: string
): RelationshipGraph {
  const filtered: RelationshipGraph = {
    fields: new Map(),
    questions: new Map(),
    riskFactors: new Map(),
    diseases: new Map(),
    fieldsByDisease: new Map(),
    riskFactorsByField: new Map(),
    diseasesByField: new Map(),
    questionsByField: new Map(),
  };

  // Apply filters to fields
  for (const [id, field] of graph.fields) {
    let include = true;

    // Filter by type (orphaned vs connected)
    if (filter === 'orphaned') {
      include = field.usedByRiskFactors.length === 0 && field.type !== 'Derived';
    } else if (filter === 'connected') {
      include = field.usedByRiskFactors.length > 0;
    }

    // Filter by category
    if (category && field.category !== category) {
      include = false;
    }

    // Filter by search query
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matches =
        field.label.toLowerCase().includes(query) ||
        field.id.toLowerCase().includes(query) ||
        field.category.toLowerCase().includes(query);
      if (!matches) {
        include = false;
      }
    }

    if (include) {
      filtered.fields.set(id, field);
    }
  }

  // Include related questions
  for (const [id, question] of graph.questions) {
    for (const fieldId of question.mapsToFields) {
      if (filtered.fields.has(fieldId)) {
        filtered.questions.set(id, question);
        break;
      }
    }
  }

  // Include related risk factors
  for (const [id, rf] of graph.riskFactors) {
    for (const fieldId of rf.usesFields) {
      if (filtered.fields.has(fieldId)) {
        filtered.riskFactors.set(id, rf);
        break;
      }
    }
  }

  // Include related diseases
  for (const [id, disease] of graph.diseases) {
    for (const rfId of disease.usesRiskFactors) {
      if (filtered.riskFactors.has(rfId)) {
        filtered.diseases.set(id, disease);
        break;
      }
    }
  }

  return filtered;
}

/**
 * Cytoscape stylesheet
 */
function getCytoscapeStyle() {
  return [
    // Default node style
    {
      selector: 'node',
      style: {
        'background-color': '#ffffff',
        'border-width': 2,
        'border-color': '#999',
        'label': 'data(label)',
        'text-wrap': 'wrap',
        'text-max-width': '180px',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': '11px',
        'font-weight': '500',
        'color': '#1f2937',
        'width': 80,
        'height': 80,
      },
    },

    // Question nodes
    {
      selector: '.question-node',
      style: {
        'background-color': '#3b82f6',
        'border-color': '#1e40af',
        'color': '#ffffff',
        'font-weight': '600',
        'width': 90,
        'height': 90,
        'shape': 'ellipse',
      },
    },

    // Field nodes - by category
    {
      selector: '.field-node.demographics',
      style: {
        'background-color': '#f3e8ff',
        'border-color': '#8b5cf6',
        'width': 85,
        'height': 85,
      },
    },
    {
      selector: '.field-node.biometrics',
      style: {
        'background-color': '#d1fae5',
        'border-color': '#10b981',
      },
    },
    {
      selector: '.field-node.labtests',
      style: {
        'background-color': '#fef3c7',
        'border-color': '#f59e0b',
      },
    },
    {
      selector: '.field-node.lifestyle',
      style: {
        'background-color': '#dbeafe',
        'border-color': '#3b82f6',
      },
    },
    {
      selector: '.field-node.medicalhistory',
      style: {
        'background-color': '#fee2e2',
        'border-color': '#ef4444',
      },
    },
    {
      selector: '.field-node.social',
      style: {
        'background-color': '#fce7f3',
        'border-color': '#ec4899',
      },
    },

    // Risk factor nodes - by evidence strength
    {
      selector: '.risk-factor-node',
      style: {
        'background-color': '#fffbeb',
        'border-color': '#f59e0b',
        'border-width': 3,
        'width': 85,
        'height': 85,
        'shape': 'diamond',
      },
    },
    {
      selector: '.risk-factor-node.strong',
      style: {
        'border-color': '#10b981',
      },
    },
    {
      selector: '.risk-factor-node.moderate',
      style: {
        'border-color': '#f59e0b',
      },
    },
    {
      selector: '.risk-factor-node.limited',
      style: {
        'border-color': '#ef4444',
      },
    },
    {
      selector: '.risk-factor-node.emerging',
      style: {
        'border-color': '#6366f1',
      },
    },

    // Disease nodes - by category
    {
      selector: '.disease-node',
      style: {
        'background-color': '#fee2e2',
        'border-color': '#dc2626',
        'border-width': 3,
        'font-weight': '700',
        'width': 100,
        'height': 100,
        'shape': 'roundrectangle',
      },
    },
    {
      selector: '.disease-node.cancer',
      style: {
        'background-color': '#ede9fe',
        'border-color': '#7c3aed',
      },
    },
    {
      selector: '.disease-node.metabolic',
      style: {
        'background-color': '#ffedd5',
        'border-color': '#f97316',
      },
    },
    {
      selector: '.disease-node.respiratory',
      style: {
        'background-color': '#cffafe',
        'border-color': '#06b6d4',
      },
    },

    // Mortality node
    {
      selector: '.mortality-node',
      style: {
        'background-color': '#8b5cf6',
        'border-color': '#6d28d9',
        'border-width': 4,
        'color': '#ffffff',
        'font-weight': '700',
        'font-size': '13px',
        'width': 120,
        'height': 120,
        'shape': 'hexagon',
      },
    },

    // Default edge style
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#d1d5db',
        'target-arrow-color': '#d1d5db',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'arrow-scale': 1.2,
      },
    },

    // Edge types
    {
      selector: '.edge-question-field',
      style: {
        'line-color': '#3b82f6',
        'target-arrow-color': '#3b82f6',
        'width': 2,
      },
    },
    {
      selector: '.edge-field-factor',
      style: {
        'line-color': '#10b981',
        'target-arrow-color': '#10b981',
        'line-style': 'dashed',
        'width': 2,
      },
    },
    {
      selector: '.edge-factor-disease',
      style: {
        'line-color': '#f59e0b',
        'target-arrow-color': '#f59e0b',
        'width': 2.5,
      },
    },
    {
      selector: '.edge-disease-mortality',
      style: {
        'line-color': '#8b5cf6',
        'target-arrow-color': '#8b5cf6',
        'width': 3,
      },
    },

    // Hover states
    {
      selector: 'node:active',
      style: {
        'overlay-color': '#3b82f6',
        'overlay-opacity': 0.2,
        'overlay-padding': 8,
      },
    },
    {
      selector: 'edge:active',
      style: {
        'overlay-color': '#3b82f6',
        'overlay-opacity': 0.2,
        'overlay-padding': 4,
      },
    },
  ];
}

/**
 * Cytoscape layout configuration
 */
function getCytoscapeLayout(algorithm: string, animate: boolean) {
  const baseLayout = {
    animate,
    animationDuration: 1000,
    animationEasing: 'ease-in-out-cubic',
    fit: true,
    padding: 50,
  };

  switch (algorithm) {
    case 'cose':
      return {
        name: 'cose',
        ...baseLayout,
        nodeRepulsion: 8000,
        idealEdgeLength: 100,
        edgeElasticity: 100,
        nestingFactor: 1.2,
        gravity: 1,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0,
      };

    case 'dagre':
      return {
        name: 'dagre',
        ...baseLayout,
        rankDir: 'LR',
        nodeSep: 80,
        rankSep: 150,
      };

    case 'klay':
      return {
        name: 'klay',
        ...baseLayout,
        klay: {
          direction: 'RIGHT',
          spacing: 100,
          thoroughness: 7,
        },
      };

    case 'cola':
      return {
        name: 'cola',
        ...baseLayout,
        nodeSpacing: 80,
        edgeLength: 120,
        animate: true,
        randomize: false,
        maxSimulationTime: 2000,
      };

    default:
      return {
        name: 'cose',
        ...baseLayout,
      };
  }
}

/**
 * Truncate text with ellipsis
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}
