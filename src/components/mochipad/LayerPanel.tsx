import React from 'react';
import { Button, Form } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { BsGripVertical } from 'react-icons/bs';
import { useMochipadStore } from '../../stores/mochipadStore';

export function LayerPanel() {
  const {
    layers,
    activeLayerId,
    addLayer,
    removeLayer,
    setActiveLayer,
    setLayerVisibility,
    setLayerOpacity,
    reorderLayers
  } = useMochipadStore();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = layers.length - 1 - result.source.index;
    const destinationIndex = layers.length - 1 - result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    reorderLayers(sourceIndex, destinationIndex);
  };

  // 레이어를 역순으로 표시하기 위해 복사 후 뒤집기
  const reversedLayers = [...layers].reverse();

  return (
    <div className="mochipad-layer-panel">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="m-0">Layers</h6>
        <Button
          size="sm"
          variant="outline-primary"
          onClick={addLayer}
          disabled={layers.length >= 5}
        >
          Add Layer
        </Button>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="droppable-layers" type="LAYER">
          {(provided) => (
            <div
              className="layer-list"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {reversedLayers.map((layer, index) => (
                <Draggable
                  key={layer.id}
                  draggableId={layer.id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`layer-item ${layer.id === activeLayerId ? 'active' : ''} ${
                        snapshot.isDragging ? 'dragging' : ''
                      }`}
                      onClick={() => setActiveLayer(layer.id)}
                      style={{
                        borderLeft: `4px solid ${layer.color}`,
                      }}
                    >
                      <div className="d-flex align-items-center gap-2 flex-grow-1">
                        <Form.Check
                          type="checkbox"
                          checked={layer.visible}
                          onChange={(e) => {
                            e.stopPropagation();
                            setLayerVisibility(layer.id, e.target.checked);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="layer-info">
                          <span className="layer-name">{layer.name}</span>
                          <div 
                            className="layer-color-indicator"
                            style={{ backgroundColor: layer.color }}
                          />
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <Form.Control
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={layer.opacity}
                          onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value))}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '80px' }}
                        />
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLayer(layer.id);
                          }}
                          disabled={layers.length <= 1}
                        >
                          ×
                        </Button>
                        <div
                          {...provided.dragHandleProps}
                          className="layer-drag-handle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <BsGripVertical />
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
} 