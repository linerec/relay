import { useEffect } from 'react';
import { useMochipadStore } from '../stores/mochipadStore';

interface LayerData {
  background_color?: string;
  layer01?: string;
  layer02?: string;
  layer03?: string;
  layer04?: string;
  layer05?: string;
}

export function useMochipadLayers(initialLayers?: LayerData) {
  const {
    layers,
    addLayer,
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

    // Create additional layers if they exist
    const layerData = [
      initialLayers.layer01,
      initialLayers.layer02,
      initialLayers.layer03,
      initialLayers.layer04,
      initialLayers.layer05
    ];

    layerData.forEach(data => {
      if (data) {
        const layer = addLayer();
        if (layer) {
          loadImageToLayer(layer.id, data);
        }
      }
    });

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

    return {
      drawing: mergedCanvas.toDataURL('image/png'),
      layer01: layers[0]?.canvas?.toDataURL('image/png'),
      layer02: layers[1]?.canvas?.toDataURL('image/png'),
      layer03: layers[2]?.canvas?.toDataURL('image/png'),
      layer04: layers[3]?.canvas?.toDataURL('image/png'),
      layer05: layers[4]?.canvas?.toDataURL('image/png'),
      background_color: backgroundColor, // store에서 관리하는 배경색 사용
    };
  };

  return {
    getLayerData,
    backgroundColor,  // 배경색 상태 노출
    setBackgroundColor,  // 배경색 변경 함수 노출
  };
}