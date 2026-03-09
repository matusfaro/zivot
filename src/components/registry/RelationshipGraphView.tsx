/**
 * Main visualization component for the relationship graph
 * Displays user inputs, survey questions, risk factors, diseases, and their relationships
 * Uses Cytoscape.js for interactive graph visualization
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import cytoscape from 'cytoscape';
import { RelationshipGraph } from '../../types/registry';
import { buildGraphLayout, filterGraph } from './graphLayout';
import { GraphControls } from './GraphControls';
import { GraphLegend } from './GraphLegend';
import { GraphStatistics } from './GraphStatistics';

interface RelationshipGraphViewProps {
  graph: RelationshipGraph;
  onNodeClick?: (nodeId: string, nodeType: string) => void;
}

export function RelationshipGraphView({ graph, onNodeClick }: RelationshipGraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const [showStatistics, setShowStatistics] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'orphaned' | 'connected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [layoutAlgorithm, setLayoutAlgorithm] = useState<'cose' | 'dagre' | 'klay' | 'cola'>('cose');

  // Filter graph based on current filters
  const filteredGraph = useMemo(() => {
    return filterGraph(graph, filterType, selectedCategory || undefined, searchQuery);
  }, [graph, filterType, selectedCategory, searchQuery]);

  // Build graph data
  const { elements, style, layout } = useMemo(() => {
    return buildGraphLayout(filteredGraph, { layout: layoutAlgorithm, animate: true });
  }, [filteredGraph, layoutAlgorithm]);

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    console.log('[RelationshipGraphView] Initializing Cytoscape with', elements.length, 'elements');

    // Create Cytoscape instance
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style,
      layout,
      wheelSensitivity: 0.2,
      minZoom: 0.3,
      maxZoom: 3,
    });

    // Add styles for highlighting
    cy.style()
      .selector('.highlighted')
      .style({
        'opacity': 1,
        'z-index': 999,
      })
      .update();

    cy.style()
      .selector('.dimmed')
      .style({
        'opacity': 0.2,
      })
      .update();

    // Add event listeners
    cy.on('tap', 'node', (event) => {
      const node = event.target;
      const nodeId = node.id();
      const nodeType = node.data('type');

      console.log('[Graph] Node clicked:', nodeId, nodeType);

      if (onNodeClick) {
        onNodeClick(nodeId, nodeType);
      }

      // Highlight connected nodes
      cy.elements().removeClass('highlighted dimmed');
      const connectedNodes = node.neighborhood().add(node);
      connectedNodes.addClass('highlighted');
      cy.elements().not(connectedNodes).addClass('dimmed');
    });

    cy.on('tap', (event) => {
      // If clicking on background, clear highlights
      if (event.target === cy) {
        cy.elements().removeClass('highlighted dimmed');
      }
    });

    // Store reference
    cyRef.current = cy;

    // Cleanup
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [elements, style, layout, onNodeClick]);

  // Handle filter changes
  const handleFilterChange = (newFilter: 'all' | 'orphaned' | 'connected') => {
    setFilterType(newFilter);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
  };

  const handleLayoutChange = (newLayout: 'cose' | 'dagre' | 'klay' | 'cola') => {
    setLayoutAlgorithm(newLayout);
  };

  const handleExport = () => {
    if (!cyRef.current) return;

    const data = {
      nodes: cyRef.current.nodes().map(n => n.data()),
      edges: cyRef.current.edges().map(e => e.data()),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relationship-graph-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetZoom = () => {
    if (!cyRef.current) return;
    cyRef.current.fit(undefined, 50);
    cyRef.current.center();
  };

  return (
    <div className="relationship-graph-container">
      {/* Controls */}
      <GraphControls
        filterType={filterType}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        layoutAlgorithm={layoutAlgorithm}
        showStatistics={showStatistics}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onLayoutChange={handleLayoutChange}
        onToggleStatistics={() => setShowStatistics(!showStatistics)}
        onExport={handleExport}
        onResetZoom={handleResetZoom}
      />

      {/* Statistics */}
      {showStatistics && (
        <GraphStatistics graph={filteredGraph} />
      )}

      {/* Graph Content */}
      <div className="graph-content">
        {/* Main Graph Viewport */}
        <div className="graph-viewport" ref={containerRef} />

        {/* Legend */}
        <GraphLegend />
      </div>
    </div>
  );
}
