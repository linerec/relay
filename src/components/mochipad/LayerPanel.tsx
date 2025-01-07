import React, { useState } from 'react';
import { Button, Form, ButtonGroup, Collapse } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { BsGripVertical, BsLock, BsUnlock, BsTrash, BsFiles, BsArrowDown, BsXCircle, BsChevronDown, BsChevronUp } from 'react-icons/bs';
import { useMochipadStore } from '../../stores/mochipadStore';

export function LayerPanel() {
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const {
    layers,
    activeLayerId,
    addLayer,
    removeLayer,
    setActiveLayer,
    setLayerVisibility,
    setLayerOpacity,
    setLayerLocked,
    reorderLayers,
    duplicateLayer,
    mergeLayerDown,
    clearLayer
  } = useMochipadStore();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    // 실제 레이어 순서는 표시되는 순서의 반대
    reorderLayers(
      layers.length - 1 - sourceIndex,
      layers.length - 1 - destinationIndex
    );
  };

  const handleLayerClick = (layerId: string) => {
    setActiveLayer(layerId);
    setExpandedLayer(expandedLayer === layerId ? null : layerId);
  };

  // 최상위 레이어가 맨 위에 표시되도록 역순 정렬
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
                  isDragDisabled={layer.locked}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`layer-item ${layer.id === activeLayerId ? 'active' : ''} ${
                        snapshot.isDragging ? 'dragging' : ''
                      }`}
                      onClick={() => handleLayerClick(layer.id)}
                      style={{
                        borderLeft: `4px solid ${layer.color}`,
                        opacity: layer.visible ? 1 : 0.5,
                        ...provided.draggableProps.style
                      }}
                    >
                      <div className="layer-header d-flex align-items-center gap-2 w-100">
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
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 text-muted"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedLayer(expandedLayer === layer.id ? null : layer.id);
                          }}
                        >
                          {expandedLayer === layer.id ? <BsChevronUp /> : <BsChevronDown />}
                        </Button>
                        <div
                          {...provided.dragHandleProps}
                          className="layer-drag-handle ms-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <BsGripVertical />
                        </div>
                      </div>

                      <Collapse in={expandedLayer === layer.id}>
                        <div className="layer-controls mt-2">
                          <div className="d-flex align-items-center gap-2 w-100 mb-2">
                            <small className="text-muted">Opacity:</small>
                            <Form.Control
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={layer.opacity}
                              onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value))}
                              onClick={(e) => e.stopPropagation()}
                              className="layer-opacity"
                            />
                            <small className="text-muted">{Math.round(layer.opacity * 100)}%</small>
                          </div>
                          <ButtonGroup size="sm" className="w-100">
                            <Button
                              variant="outline-secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLayerLocked(layer.id, !layer.locked);
                              }}
                              title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                            >
                              {layer.locked ? <BsLock /> : <BsUnlock />}
                            </Button>
                            <Button
                              variant="outline-secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateLayer(layer.id);
                              }}
                              disabled={layers.length >= 5}
                              title="Duplicate layer"
                            >
                              <BsFiles />
                            </Button>
                            <Button
                              variant="outline-secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                mergeLayerDown(layer.id);
                              }}
                              disabled={index === reversedLayers.length - 1}
                              title="Merge down"
                            >
                              <BsArrowDown />
                            </Button>
                            <Button
                              variant="outline-secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearLayer(layer.id);
                              }}
                              title="Clear layer"
                            >
                              <BsXCircle />
                            </Button>
                            <Button
                              variant="outline-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeLayer(layer.id);
                              }}
                              disabled={layers.length <= 1}
                              title="Delete layer"
                            >
                              <BsTrash />
                            </Button>
                          </ButtonGroup>
                        </div>
                      </Collapse>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <hr />
      <div className="d-flex align-items-center gap-2">
        
      </div>
    </div>
  );
}