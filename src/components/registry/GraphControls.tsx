/**
 * Graph controls for filtering, searching, layout selection, and exporting
 */

import React from 'react';

interface GraphControlsProps {
  filterType: 'all' | 'orphaned' | 'connected';
  searchQuery: string;
  selectedCategory: string | null;
  layoutAlgorithm: 'cose' | 'dagre' | 'klay' | 'cola';
  showStatistics: boolean;
  onFilterChange: (type: 'all' | 'orphaned' | 'connected') => void;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string | null) => void;
  onLayoutChange: (layout: 'cose' | 'dagre' | 'klay' | 'cola') => void;
  onToggleStatistics: () => void;
  onExport: () => void;
  onResetZoom: () => void;
}

export function GraphControls({
  filterType,
  searchQuery,
  selectedCategory,
  layoutAlgorithm,
  showStatistics,
  onFilterChange,
  onSearchChange,
  onCategoryChange,
  onLayoutChange,
  onToggleStatistics,
  onExport,
  onResetZoom,
}: GraphControlsProps) {
  return (
    <div className="graph-controls">
      <div className="control-group">
        <label htmlFor="search">Search</label>
        <input
          id="search"
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="control-group">
        <label htmlFor="filter">Filter</label>
        <select
          id="filter"
          value={filterType}
          onChange={(e) => onFilterChange(e.target.value as any)}
          className="filter-select"
        >
          <option value="all">Show All</option>
          <option value="orphaned">Show Orphaned Only</option>
          <option value="connected">Show Connected Only</option>
        </select>
      </div>

      <div className="control-group">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={selectedCategory || ''}
          onChange={(e) => onCategoryChange(e.target.value || null)}
          className="category-select"
        >
          <option value="">All Categories</option>
          <option value="Demographics">Demographics</option>
          <option value="Biometrics">Biometrics</option>
          <option value="LabTests">Lab Tests</option>
          <option value="Lifestyle">Lifestyle</option>
          <option value="MedicalHistory">Medical History</option>
          <option value="Social">Social</option>
          <option value="Interventions">Interventions</option>
        </select>
      </div>

      <div className="control-group">
        <label htmlFor="layout">Layout</label>
        <select
          id="layout"
          value={layoutAlgorithm}
          onChange={(e) => onLayoutChange(e.target.value as any)}
          className="filter-select"
        >
          <option value="cose">Physics (CoSE)</option>
          <option value="dagre">Hierarchical (Dagre)</option>
          <option value="cola">Force-Directed (Cola)</option>
          <option value="klay">Layered (Klay)</option>
        </select>
      </div>

      <div className="control-actions">
        <button onClick={onResetZoom} className="btn-toggle-stats">
          Reset Zoom
        </button>

        <button onClick={onToggleStatistics} className="btn-toggle-stats">
          {showStatistics ? 'Hide' : 'Show'} Statistics
        </button>

        <button onClick={onExport} className="btn-export">
          Export JSON
        </button>
      </div>
    </div>
  );
}
