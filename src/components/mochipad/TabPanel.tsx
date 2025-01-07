import React, { useState } from 'react';
import { LayerPanel } from './LayerPanel';
import { HistoryPanel } from './HistoryPanel';
import './tabpanel.css';

type Tab = 'layers' | 'history';

export function TabPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('layers');

  return (
    <div className="tab-panel">
      <div className="tab-buttons">
        <button 
          type="button"
          className={`tab-button ${activeTab === 'layers' ? 'active' : ''}`}
          onClick={() => setActiveTab('layers')}
        >
          Layers
        </button>
        <button 
          type="button"
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>
      <div className="tab-content">
        {activeTab === 'layers' && <LayerPanel />}
        {activeTab === 'history' && <HistoryPanel />}
      </div>
    </div>
  );
}