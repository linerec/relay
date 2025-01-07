import React from 'react';
import { useMochipadStore } from '../../stores/mochipadStore';

export function HistoryPanel() {
  const { history, historyIndex } = useMochipadStore();

  const handleHistoryClick = (index: number) => {
    const store = useMochipadStore.getState();
    if (index === historyIndex) return;
    store.moveToHistoryIndex(index);
  };

  return (
    <div className="history-panel">
      <div className="history-list">
        {history.map((item, index) => (
          <div
            key={index}
            className={`history-item ${index === historyIndex ? 'active' : ''} ${
              index > historyIndex ? 'future' : ''
            }`}
            onClick={() => handleHistoryClick(index)}
          >
            {item.description || `Drawing ${index + 1}`}
          </div>
        ))}
      </div>
    </div>
  );
} 