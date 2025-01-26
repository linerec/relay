import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { fetchCutById } from '../services/cutService';
import { Cut, LayerData } from '../types';

// 레이어 관련 기본 인터페이스 정의
// 각 레이어는 고유한 ID, 이름, 가시성, 투명도 등의 속성을 가집니다.
export interface Layer {
  id: string;
  name: string;
  sequence: number;
  visible: boolean;
  opacity: number;
  canvas: HTMLCanvasElement | null;  // 실제 그림이 그려지는 캔버스 요소
  context: CanvasRenderingContext2D | null;  // 캔버스 컨텍스트
  color: string;  // 레이어 식별을 위한 색상
  locked: boolean;  // 레이어 잠금 상태
}

interface HistoryState {
  layerImages: { [layerId: string]: string };
  description?: string;
}

// 레이어 시퀀스 번호를 관리하기 위한 상태 추가
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
  cut: Cut | null;
  nextSequence: number;

  // Actions
  addLayer: (layerData?: LayerData) => Promise<Layer>;
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
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  moveToHistoryIndex: (index: number) => void;
  initializeOffscreenCanvas: () => void;
  getLayerData: () => {
    layerData: { [key: string]: LayerData | null };
    mergedImage: string;
  };
  initializeLayerData: (layerId: string, imageData: string) => void;
  loadCut: (cutId: string) => Promise<void>;
  getNextSequence: () => number;
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
  cut: null,
  nextSequence: 1,

  getNextSequence: () => {
    const sequence = get().nextSequence;
    set(state => ({ nextSequence: state.nextSequence + 1 }));
    return sequence;
  },

  addLayer: async (layerData?: LayerData) => {
    const sequence = get().getNextSequence();
    const layerId = uuidv4();
    const state = get();

    let canvas: HTMLCanvasElement | null = null;
    let context: CanvasRenderingContext2D | null = null;

    if (layerData?.imageData) {
      canvas = document.createElement('canvas');
      canvas.width = state.canvasWidth;
      canvas.height = state.canvasHeight;
      context = canvas.getContext('2d');

      if (context) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            context!.globalAlpha = 1;
            context!.drawImage(img, 0, 0);
            resolve();
          };
          img.src = layerData.imageData;
        });
      }
    }

    const newLayer: Layer = {
      id: layerId,
      name: layerData?.name || `Layer ${sequence}`,
      sequence,
      visible: layerData?.visible ?? true,
      opacity: layerData?.opacity ?? 1,
      canvas,
      context,
      color: generateRandomColor(),
      locked: layerData?.locked ?? false
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

    const layer = state.layers.find(l => l.id === id);
    if (!layer) return state;

    // 캔버스 초기 설정
    context.globalAlpha = 1;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = state.brushColor;
    context.lineWidth = state.brushSize;

    return {
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, canvas, context } : l
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
      sequence: 0,
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

  // getLayerData 메서드
  // 현재 캔버스의 모든 레이어 데이터를 DB 저장 가능한 형태로 변환합니다.
  getLayerData: () => {
    const state = get();
    const layerData: { [key: string]: LayerData | null } = {};

    // 각 레이어의 데이터를 순회하면서 저장 가능한 형태로 변환
    state.layers.forEach(layer => {
      if (layer.canvas) {
        layerData[layer.id] = {
          id: layer.id,
          imageData: layer.canvas.toDataURL('image/png'),
          name: layer.name,
          sequence: layer.sequence,
          visible: layer.visible,
          opacity: layer.opacity,
          locked: layer.locked
        };
      }
    });

    // 모든 레이어를 하나의 이미지로 합치는 과정
    // 이는 미리보기나 썸네일로 사용됩니다.
    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = state.canvasWidth;
    mergedCanvas.height = state.canvasHeight;
    const mergedContext = mergedCanvas.getContext('2d');

    if (mergedContext) {
      // 배경색을 먼저 그립니다
      mergedContext.fillStyle = state.backgroundColor;
      mergedContext.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

      // 각 레이어를 순서대로 합성
      // 레이어의 가시성과 투명도를 고려하여 그립니다
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

  initializeLayerData: (layerId: string, imageData: string) => {
    set((state) => {
      const layer = state.layers.find(l => l.id === layerId);
      if (!layer || !layer.canvas) return state;

      const ctx = layer.canvas.getContext('2d');
      if (!ctx) return state;

      // 캔버스 클리어
      ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);

      // 이미지 데이터 그리기
      const img = new Image();
      img.onload = () => {
        if (ctx) {
          ctx.globalAlpha = 1;  // 투명도 초기화
          ctx.drawImage(img, 0, 0);
        }
      };
      img.src = imageData;

      return state;
    });
  },

  loadCut: async (cutId: string) => {
    try {
      const cutData = await fetchCutById(cutId);
      set({ layers: [] });  // 기존 레이어 초기화

      let maxSequence = 0;
      if (cutData.layers_data) {
        maxSequence = Math.max(...cutData.layers_data.map(layer => layer.sequence || 0));
      }
      set({ nextSequence: maxSequence + 1 });

      if (cutData.layers_data) {
        // 모든 레이어를 순차적으로 로드
        for (const layerData of cutData.layers_data) {
          const canvas = document.createElement('canvas');
          canvas.width = get().canvasWidth;
          canvas.height = get().canvasHeight;
          const context = canvas.getContext('2d');

          if (context && layerData.imageData) {
            // 이미지 로딩을 Promise로 처리
            await new Promise<void>((resolve, reject) => {
              const img = new Image();
              img.onload = () => {
                context.globalAlpha = 1;
                context.drawImage(img, 0, 0);
                resolve();
              };
              img.onerror = reject;
              img.src = layerData.imageData;
            });

            // 레이어 생성 및 추가
            const newLayer: Layer = {
              id: layerData.id || uuidv4(),
              name: layerData.name,
              sequence: layerData.sequence,
              visible: layerData.visible,
              opacity: layerData.opacity,
              canvas,
              context,
              color: generateRandomColor(),
              locked: layerData.locked
            };

            set(state => ({
              layers: [...state.layers, newLayer],
              activeLayerId: state.activeLayerId || newLayer.id
            }));
          }
        }
      }

      if (cutData.background_color) {
        get().setBackgroundColor(cutData.background_color);
      }

      set({ cut: cutData });
    } catch (error) {
      console.error('Error loading cut:', error);
    }
  },
}));