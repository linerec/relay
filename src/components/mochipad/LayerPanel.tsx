import React, { useState } from 'react';
import { Button, Form, ButtonGroup, Collapse, Modal } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { BsGripVertical, BsLock, BsUnlock, BsTrash, BsFiles, BsArrowDown, BsXCircle, BsChevronDown, BsChevronUp, BsEye } from 'react-icons/bs';
import { useMochipadStore } from '../../stores/mochipadStore';

export function LayerPanel() {
  const isDev = import.meta.env.VITE_DEV_MODE === 'true';
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [previewLayer, setPreviewLayer] = useState<{ id: string, imageData: string } | null>(null);
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
    // 활성 레이어만 변경
    setActiveLayer(layerId);
  };

  const handleExpandLayer = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();  // 상위로의 이벤트 전파 방지
    setExpandedLayer(expandedLayer === layerId ? null : layerId);
  };

  const handlePreviewClick = (layer: Layer) => {
    if (layer.canvas) {
      setPreviewLayer({
        id: layer.id,
        imageData: layer.canvas.toDataURL('image/png')
      });
    }
  };

  const getLayerDimensions = (layer: Layer) => {
    if (!layer.canvas) return null;

    const ctx = layer.canvas.getContext('2d');
    if (!ctx) return null;

    const imageData = ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
    let left = layer.canvas.width;
    let right = 0;
    let top = layer.canvas.height;
    let bottom = 0;

    // 투명하지 않은 픽셀의 범위를 찾음
    for (let y = 0; y < layer.canvas.height; y++) {
      for (let x = 0; x < layer.canvas.width; x++) {
        const alpha = imageData.data[(y * layer.canvas.width + x) * 4 + 3];
        if (alpha > 0) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    }

    // 실제 그림이 있는 영역이 있는 경우에만 치수 반환
    if (left <= right && top <= bottom) {
      return {
        width: right - left + 1,
        height: bottom - top + 1
      };
    }

    return null;
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
                      className={`layer-item ${layer.id === activeLayerId ? 'active' : ''} ${snapshot.isDragging ? 'dragging' : ''}`}
                      onClick={() => handleLayerClick(layer.id)}
                      style={{
                        borderLeft: `4px solid ${layer.color}`,
                        opacity: layer.visible ? 1 : 0.5,
                        ...provided.draggableProps.style,
                        ...(isDev && {
                          border: `2px solid ${layer.color}`,
                          position: 'relative'
                        })
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
                          onClick={(e) => handleExpandLayer(layer.id, e)}
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
                          {isDev && (
                            <>
                              <div style={{ fontSize: '10px', color: 'gray' }}>
                                Layer ID: {layer.id}
                              </div>
                              <div style={{ fontSize: '10px', color: 'gray' }}>
                                Active: {layer.id === activeLayerId ? 'Yes' : 'No'}
                              </div>
                              {(() => {
                                const dimensions = getLayerDimensions(layer);
                                return dimensions && (
                                  <div style={{ fontSize: '10px', color: 'gray' }}>
                                    Size: {dimensions.width}x{dimensions.height}
                                  </div>
                                );
                              })()}
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                className="mt-1 mb-1"
                                onClick={() => handlePreviewClick(layer)}
                              >
                                <BsEye /> Preview Layer
                              </Button>
                            </>
                          )}
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

      {/* Preview Modal */}
      <Modal
        show={previewLayer !== null}
        onHide={() => setPreviewLayer(null)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Layer Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {previewLayer && (
            <img
              src={previewLayer.imageData}
              alt="Layer Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                backgroundColor: '#f0f0f0'  // 투명 부분을 잘 보이게 하기 위한 배경
              }}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}