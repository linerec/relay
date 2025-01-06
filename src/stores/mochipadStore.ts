import { create } from 'zustand';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  canvas: HTMLCanvasElement | null;
  context: CanvasRenderingContext2D | null;
  color: string;
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
  
  // Actions
  addLayer: () => void;
  removeLayer: (id: string) => void;
  setActiveLayer: (id: string) => void;
  setLayerVisibility: (id: string, visible: boolean) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  setBrushSize: (size: number) => void;
  setBrushColor: (color: string) => void;
  setBrushOpacity: (opacity: number) => void;
  getActiveLayer: () => Layer | null;
  initializeLayerCanvas: (id: string, canvas: HTMLCanvasElement) => void;
  reorderLayers: (sourceIndex: number, destinationIndex: number) => void;
  setScale: (scale: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;
  updateZoom: (delta: number, point: { x: number; y: number }) => void;
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

  addLayer: () => set((state) => {
    if (state.layers.length >= 5) return state;
    
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${state.layers.length + 1}`,
      visible: true,
      opacity: 1,
      canvas: null,
      context: null,
      color: generateRandomColor()
    };

    return {
      layers: [...state.layers, newLayer],
      activeLayerId: newLayer.id,
    };
  }),

  removeLayer: (id) => set((state) => {
    if (state.layers.length <= 1) return state;
    return {
      layers: state.layers.filter((layer) => layer.id !== id),
      activeLayerId: state.activeLayerId === id ? 
        state.layers[state.layers.findIndex(l => l.id === id) - 1]?.id ?? 
        state.layers[0].id : state.activeLayerId,
    };
  }),

  setActiveLayer: (id) => set({ activeLayerId: id }),
  
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

  setBrushSize: (size) => set({ brushSize: size }),
  setBrushColor: (color) => set({ brushColor: color }),
  setBrushOpacity: (opacity) => set({ brushOpacity: opacity }),

  getActiveLayer: () => {
    const state = get();
    return state.layers.find(layer => layer.id === state.activeLayerId) ?? null;
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

    // 캔버스의 z-index 업데이트를 위해 전체 상태 업데이트
    return {
      ...state,
      layers: newLayers
    };
  }),

  setScale: (scale) => set({ scale }),
  setOffset: (offset) => set({ offset }),
  
  updateZoom: (delta: number, point: { x: number; y: number }) => {
    const state = get();
    const minScale = 0.1;
    const maxScale = 5;
    
    // 새로운 스케일 계산
    const newScale = Math.min(maxScale, Math.max(minScale, state.scale * (1 - delta * 0.1)));
    
    // 줌의 중심점을 현재 마우스 위치로 설정
    const scaleChange = newScale / state.scale;
    const newOffset = {
      x: point.x - (point.x - state.offset.x) * scaleChange,
      y: point.y - (point.y - state.offset.y) * scaleChange
    };

    set({
      scale: newScale,
      offset: newOffset
    });
  }
})); 