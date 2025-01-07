import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  canvas: HTMLCanvasElement | null;
  context: CanvasRenderingContext2D | null;
  color: string;
  locked: boolean;
}

interface HistoryState {
  layerImages: { [layerId: string]: string };
  description?: string;
}

interface LayerData {
  imageData: string;  // base64 이미지 데이터
  name: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
}

interface MochipadState {
  layers: Layer[];
  activeLayerId: string | null;
  brushSize: number;
  brushColor: string;
  brushOpacity: number;
  canvasWidth: number;
  canvasHeight: number;
  scale: number;
  offset: { x: number; y: number };
  backgroundColor: string;
  backgroundLayer: Layer | null;
  history: HistoryState[];
  historyIndex: number;
  offscreenCanvas: HTMLCanvasElement | null;
  offscreenContext: CanvasRenderingContext2D | null;
  
  // Actions
  addLayer: () => Layer;
  removeLayer: (id: string) => void;
  setActiveLayer: (id: string) => void;
  setLayerVisibility: (id: string, visible: boolean) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  setLayerLocked: (id: string, locked: boolean) => void;
  setBrushSize: (size: number) => void;
  setBrushColor: (color: string) => void;
  setBrushOpacity: (opacity: number) => void;
  getActiveLayer: () => Layer | null;
  initializeLayerCanvas: (id: string, canvas: HTMLCanvasElement) => void;
  reorderLayers: (sourceIndex: number, destinationIndex: number) => void;
  setScale: (scale: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;
  updateZoom: (delta: number, point: { x: number; y: number }) => void;
  duplicateLayer: (id: string) => void;
  mergeLayerDown: (id: string) => void;
  clearLayer: (id: string) => void;
  setBackgroundColor: (color: string) => void;
  initializeBackgroundLayer: (canvas: HTMLCanvasElement) => void;
  loadFromCut: (cutData: { 
    layer01: string | null,
    layer02: string | null,
    layer03: string | null,
    layer04: string | null,
    layer05: string | null,
    background_color: string 
  }) => void;
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  moveToHistoryIndex: (index: number) => void;
  initializeOffscreenCanvas: () => void;
  getLayerData: () => { 
    layerData: { [key: string]: LayerData | null };
    mergedImage: string;
  };
}

const generateRandomColor = () => {
  const h = Math.random() * 360;
  const s = 70 + Math.random() * 30;
  const l = 45 + Math.random() * 10;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

export const useMochipadStore = create<MochipadState>((set, get) => ({
  layers: [],
  activeLayerId: null,
  brushSize: 5,
  brushColor: '#000000',
  brushOpacity: 1,
  canvasWidth: 800,
  canvasHeight: 600,
  scale: 1,
  offset: { x: 0, y: 0 },
  backgroundColor: '#ffffff',
  backgroundLayer: null,
  history: [],
  historyIndex: -1,
  offscreenCanvas: null,
  offscreenContext: null,

  addLayer: () => {
    const newLayer: Layer = {
      id: uuidv4(),
      name: `Layer ${get().layers.length + 1}`,
      visible: true,
      opacity: 1,
      canvas: null,
      context: null,
      color: generateRandomColor(),
      locked: false
    };

    set((state) => ({
      layers: [...state.layers, newLayer],
      activeLayerId: newLayer.id,
    }));

    return newLayer;
  },

  removeLayer: (id) => set((state) => {
    if (state.layers.length <= 1) return state;

    const layerIndex = state.layers.findIndex(l => l.id === id);
    if (layerIndex === -1) return state;

    // Clean up canvas resources
    const layer = state.layers[layerIndex];
    if (layer.canvas) {
      layer.context?.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
      layer.canvas = null;
      layer.context = null;
    }

    const newLayers = state.layers.filter(l => l.id !== id);
    const newActiveId = state.activeLayerId === id ? 
      newLayers[Math.max(0, layerIndex - 1)]?.id : 
      state.activeLayerId;

    return {
      layers: newLayers,
      activeLayerId: newActiveId,
    };
  }),

  setActiveLayer: (id) => set((state) => {
    const layer = state.layers.find(l => l.id === id);
    if (!layer || layer.locked) return state;
    return { activeLayerId: id };
  }),
  
  setLayerVisibility: (id, visible) => set((state) => ({
    layers: state.layers.map((layer) =>
      layer.id === id ? { ...layer, visible } : layer
    ),
  })),

  setLayerOpacity: (id, opacity) => set((state) => ({
    layers: state.layers.map((layer) =>
      layer.id === id ? { ...layer, opacity } : layer
    ),
  })),

  setLayerLocked: (id, locked) => set((state) => ({
    layers: state.layers.map((layer) =>
      layer.id === id ? { ...layer, locked } : layer
    ),
  })),

  setBrushSize: (size) => set({ brushSize: size }),
  setBrushColor: (color) => set({ brushColor: color }),
  setBrushOpacity: (opacity) => set({ brushOpacity: opacity }),

  getActiveLayer: () => {
    const state = get();
    const layer = state.layers.find(layer => layer.id === state.activeLayerId);
    return layer && !layer.locked ? layer : null;
  },

  initializeLayerCanvas: (id, canvas) => set((state) => {
    const context = canvas.getContext('2d');
    if (!context) return state;

    // 캔버스 초기 설정
    context.globalAlpha = 1;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    return {
      layers: state.layers.map((layer) =>
        layer.id === id ? {
          ...layer,
          canvas,
          context
        } : layer
      ),
    };
  }),

  reorderLayers: (sourceIndex: number, destinationIndex: number) => set((state) => {
    const newLayers = [...state.layers];
    const [removed] = newLayers.splice(sourceIndex, 1);
    newLayers.splice(destinationIndex, 0, removed);

    return {
      layers: newLayers
    };
  }),

  setScale: (scale) => set({ scale }),
  setOffset: (offset) => set({ offset }),
  
  updateZoom: (delta: number, point: { x: number; y: number }) => {
    const state = get();
    const minScale = 0.1;
    const maxScale = 5;
    
    const newScale = Math.min(maxScale, Math.max(minScale, state.scale * (1 - delta * 0.1)));
    const scaleChange = newScale / state.scale;
    const newOffset = {
      x: point.x - (point.x - state.offset.x) * scaleChange,
      y: point.y - (point.y - state.offset.y) * scaleChange
    };

    set({
      scale: newScale,
      offset: newOffset
    });
  },

  duplicateLayer: (id) => set((state) => {
    const sourceLayer = state.layers.find(l => l.id === id);
    if (!sourceLayer || state.layers.length >= 5) return state;

    const newLayer: Layer = {
      ...sourceLayer,
      id: `layer-${Date.now()}`,
      name: `${sourceLayer.name} Copy`,
      canvas: null,
      context: null
    };

    // 새 캔버스 생성 및 내용 복사
    const newCanvas = document.createElement('canvas');
    newCanvas.width = state.canvasWidth;
    newCanvas.height = state.canvasHeight;
    const newContext = newCanvas.getContext('2d');

    if (newContext && sourceLayer.canvas) {
      newContext.drawImage(sourceLayer.canvas, 0, 0);
      newLayer.canvas = newCanvas;
      newLayer.context = newContext;
    }

    return {
      layers: [...state.layers, newLayer],
      activeLayerId: newLayer.id
    };
  }),

  mergeLayerDown: (id) => set((state) => {
    const layerIndex = state.layers.findIndex(l => l.id === id);
    if (layerIndex <= 0) return state;

    const upperLayer = state.layers[layerIndex];
    const lowerLayer = state.layers[layerIndex - 1];

    if (!upperLayer.canvas || !lowerLayer.canvas || !lowerLayer.context) return state;

    // 아래 레이어에 현재 레이어 병합
    lowerLayer.context.globalAlpha = upperLayer.opacity;
    lowerLayer.context.drawImage(upperLayer.canvas, 0, 0);
    lowerLayer.context.globalAlpha = 1;

    // 현재 레이어 제거
    const newLayers = state.layers.filter(l => l.id !== id);

    return {
      layers: newLayers,
      activeLayerId: lowerLayer.id
    };
  }),

  clearLayer: (id) => set((state) => {
    const layer = state.layers.find(l => l.id === id);
    if (!layer || !layer.context) return state;

    layer.context.clearRect(0, 0, state.canvasWidth, state.canvasHeight);

    return {
      layers: state.layers.map(l => 
        l.id === id ? { ...l } : l
      )
    };
  }),

  setBackgroundColor: (color) => set((state) => {
    if (state.backgroundLayer?.context) {
      state.backgroundLayer.context.fillStyle = color;
      state.backgroundLayer.context.fillRect(0, 0, state.canvasWidth, state.canvasHeight);
    }
    return { backgroundColor: color };
  }),

  initializeBackgroundLayer: (canvas) => set((state) => {
    const context = canvas.getContext('2d');
    if (!context) return state;

    const backgroundLayer: Layer = {
      id: 'background',
      name: 'Background',
      visible: true,
      opacity: 1,
      canvas,
      context,
      color: state.backgroundColor,
      locked: true
    };

    context.fillStyle = state.backgroundColor;
    context.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

    return { backgroundLayer };
  }),

  loadFromCut: (cutData: { 
    layer01: string | null,
    layer02: string | null,
    layer03: string | null,
    layer04: string | null,
    layer05: string | null,
    background_color: string 
  }) => set((state) => {
    if (state.backgroundLayer?.context) {
      state.backgroundLayer.context.fillStyle = cutData.background_color;
      state.backgroundLayer.context.fillRect(0, 0, state.canvasWidth, state.canvasHeight);
    }

    return {
      backgroundColor: cutData.background_color
    };
  }),

  saveHistory: () => {
    const state = get();
    const layerImages: { [layerId: string]: string } = {};
    
    let hasContent = false;
    
    // 모든 레이어의 현재 상태를 저장
    state.layers.forEach(layer => {
      if (layer.canvas) {
        const dataURL = layer.canvas.toDataURL('image/png');
        const emptyCanvas = document.createElement('canvas');
        emptyCanvas.width = state.canvasWidth;
        emptyCanvas.height = state.canvasHeight;
        
        if (dataURL !== emptyCanvas.toDataURL()) {
          layerImages[layer.id] = dataURL;
          hasContent = true;
        }
      }
    });

    if (!hasContent) return;

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    const newHistoryEntry = { 
      layerImages,
      description: `Drawing ${newHistory.length + 1}`
    };

    set({
      history: [...newHistory, newHistoryEntry],
      historyIndex: newHistory.length
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > -1) {
      get().moveToHistoryIndex(state.historyIndex - 1);
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;
    get().moveToHistoryIndex(state.historyIndex + 1);
  },

  moveToHistoryIndex: (index) => {
    const state = get();
    if (index === state.historyIndex || index < -1 || index >= state.history.length) return;

    if (index === -1) {
      const updatedLayers = state.layers.map(layer => {
        if (layer.canvas && layer.context) {
          layer.context.globalAlpha = 1;
          layer.context.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
        }
        return layer;
      });

      set({
        historyIndex: -1,
        layers: updatedLayers
      });
      return;
    }

    const { layerImages } = state.history[index];
    const loadPromises: Promise<void>[] = [];

    const updatedLayers = state.layers.map(layer => {
      if (!layer.canvas || !layerImages[layer.id]) {
        if (layer.canvas && layer.context) {
          layer.context.globalAlpha = 1;
          layer.context.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
        }
        return layer;
      }

      const ctx = layer.canvas.getContext('2d');
      if (!ctx) return layer;

      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);

      const loadPromise = new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          if (ctx) {
            ctx.globalAlpha = 1;
            ctx.drawImage(img, 0, 0);
          }
          resolve();
        };
        img.src = layerImages[layer.id];
      });

      loadPromises.push(loadPromise);
      return layer;
    });

    Promise.all(loadPromises).then(() => {
      set({
        historyIndex: index,
        layers: updatedLayers
      });
    });
  },

  initializeOffscreenCanvas: () => {
    const canvas = document.createElement('canvas');
    canvas.width = get().canvasWidth;
    canvas.height = get().canvasHeight;
    const context = canvas.getContext('2d');

    if (context) {
      context.lineCap = 'round';
      context.lineJoin = 'round';
    }

    set({ offscreenCanvas: canvas, offscreenContext: context });
  },

  getLayerData: () => {
    const state = get();
    const layerData: { [key: string]: LayerData | null } = {
      layer01: null,
      layer02: null,
      layer03: null,
      layer04: null,
      layer05: null
    };

    // 각 레이어의 데이터를 JSON 형식으로 변환
    state.layers.forEach((layer, index) => {
      const layerKey = `layer${String(index + 1).padStart(2, '0')}`;
      
      if (layer.canvas) {
        layerData[layerKey] = {
          imageData: layer.canvas.toDataURL('image/png'),
          name: layer.name,
          visible: layer.visible,
          opacity: layer.opacity,
          locked: layer.locked
        };
      }
    });

    // 모든 레이어를 합친 이미지 생성
    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = state.canvasWidth;
    mergedCanvas.height = state.canvasHeight;
    const mergedContext = mergedCanvas.getContext('2d');

    if (mergedContext) {
      // 배경색 먼저 채우기
      mergedContext.fillStyle = state.backgroundColor;
      mergedContext.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

      // 각 레이어 순서대로 그리기
      state.layers.forEach(layer => {
        if (layer.visible && layer.canvas) {
          mergedContext.globalAlpha = layer.opacity;
          mergedContext.drawImage(layer.canvas, 0, 0);
        }
      });
    }

    return {
      layerData,
      mergedImage: mergedCanvas.toDataURL('image/png')
    };
  },
}));