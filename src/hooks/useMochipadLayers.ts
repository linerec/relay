import { useEffect } from 'react';
import { useMochipadStore } from '../stores/mochipadStore';

interface LayerData {
  layers_data?: LayerData[];
  background_color: string;
}

export function useMochipadLayers(initialLayers?: LayerData) {
  const {
    layers,
    addLayer,
    initializeLayerCanvas,
    setActiveLayer,
    backgroundColor,
    setBackgroundColor,
    backgroundLayer,
    initializeBackgroundLayer,
  } = useMochipadStore();

  // 배경 레이어 초기화
  useEffect(() => {
    if (!backgroundLayer) {
      const canvas = document.createElement('canvas');
      canvas.width = useMochipadStore.getState().canvasWidth;
      canvas.height = useMochipadStore.getState().canvasHeight;
      initializeBackgroundLayer(canvas);
    }
  }, []);

  // Initialize layers with saved data
  useEffect(() => {
    if (!initialLayers || layers.length > 0) return;

    // 배경색 설정
    if (initialLayers.background_color) {
      setBackgroundColor(initialLayers.background_color);
    }

    // Create layers from layers_data
    if (initialLayers.layers_data) {
      initialLayers.layers_data.forEach(layerData => {
        const layer = addLayer();
        if (layer) {
          loadImageToLayer(layer.id, layerData.imageData);
          // Set layer properties
          useMochipadStore.getState().setLayerVisibility(layer.id, layerData.visible);
          useMochipadStore.getState().setLayerOpacity(layer.id, layerData.opacity);
          useMochipadStore.getState().setLayerLocked(layer.id, layerData.locked);
        }
      });
    }

    // Set first layer as active
    if (layers[0]) {
      setActiveLayer(layers[0].id);
    }
  }, [initialLayers]);

  const loadImageToLayer = async (layerId: string, imageData: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !layer.context) return;

    const img = new Image();
    img.onload = () => {
      layer.context?.drawImage(img, 0, 0);
    };
    img.src = imageData;
  };

  const getLayerData = (): LayerData & { drawing?: string } => {
    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = useMochipadStore.getState().canvasWidth;
    mergedCanvas.height = useMochipadStore.getState().canvasHeight;
    const mergedContext = mergedCanvas.getContext('2d');

    if (!mergedContext) return {};

    // 먼저 배경 레이어 그리기
    if (backgroundLayer?.canvas && backgroundLayer.visible) {
      mergedContext.globalAlpha = backgroundLayer.opacity;
      mergedContext.drawImage(backgroundLayer.canvas, 0, 0);
    }

    // 그 위에 나머지 레이어들 그리기
    layers.forEach(layer => {
      if (layer.visible && layer.canvas) {
        mergedContext.globalAlpha = layer.opacity;
        mergedContext.drawImage(layer.canvas, 0, 0);
      }
    });

    // 레이어 데이터 수집
    const layersData = layers.map(layer => ({
      imageData: layer.canvas?.toDataURL('image/png') || '',
      name: layer.name,
      visible: layer.visible,
      opacity: layer.opacity,
      locked: layer.locked
    }));
    return {
      drawing: mergedCanvas.toDataURL('image/png'),
      layers_data: layersData,
      background_color: backgroundColor, // store에서 관리하는 배경색 사용
    };
  };

  return {
    getLayerData,
    backgroundColor,  // 배경색 상태 노출
    setBackgroundColor,  // 배경색 변경 함수 노출
  };
}