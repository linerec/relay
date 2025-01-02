import React from 'react';
import { Button, Form } from 'react-bootstrap';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { useDrawingStore } from '../../stores/drawingStore';

export function LayerPanel() {
  const {
    layers,
    currentLayer,
    setCurrentLayer,
    toggleLayerVisibility,
    deleteLayer,
    addLayer,
    canAddLayer
  } = useDrawingStore();

  return (
    <div className="layer-panel">
      <h5>Layers</h5>
      <div className="d-flex flex-column gap-2">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            className={`d-flex align-items-center gap-2 p-2 border rounded ${
              currentLayer === index ? 'bg-light' : ''
            }`}
          >
            <Button
              variant="link"
              className="p-0"
              onClick={() => toggleLayerVisibility(index)}
            >
              {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </Button>
            
            <span
              className="flex-grow-1 cursor-pointer"
              onClick={() => setCurrentLayer(index)}
            >
              Layer {index + 1}
            </span>

            <Button
              variant="link"
              className="p-0 text-danger"
              onClick={() => deleteLayer(index)}
              disabled={layers.length === 1}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </div>

      <Button
        variant="outline-primary"
        className="mt-2 w-100"
        onClick={addLayer}
        disabled={!canAddLayer}
      >
        Add Layer
      </Button>
    </div>
  );
}