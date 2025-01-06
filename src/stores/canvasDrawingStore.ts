import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Tool = 'brush' | 'eraser' | 'bucket';

interface ToolSettings {
  size: number;
  opacity: number;
}

interface CanvasDrawingState {
  currentTool: Tool;
  brushColor: string;
  brushSettings: ToolSettings;
  eraserSettings: ToolSettings;
  context: CanvasRenderingContext2D | null;
  isDrawing: boolean;
  history: ImageData[];
  historyIndex: number;
  recentColors: string[];
  defaultColors: string[];

  setCurrentTool: (tool: Tool) => void;
  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setEraserSize: (size: number) => void;
  setContext: (context: CanvasRenderingContext2D) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  
  undo: () => void;
  redo: () => void;
  addToHistory: (imageData: ImageData) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  setOpacity: (opacity: number) => void;
  setEraserOpacity: (opacity: number) => void;
  addRecentColor: (color: string) => void;
}

export const useCanvasDrawingStore = create<CanvasDrawingState>()(
  persist(
    (set, get) => ({
      currentTool: 'brush' as Tool,
      brushColor: '#000000',
      brushSettings: {
        size: 5,
        opacity: 1
      },
      eraserSettings: {
        size: 20,
        opacity: 1
      },
      context: null,
      isDrawing: false,
      history: [],
      historyIndex: -1,
      recentColors: [],
      defaultColors: ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00'],

      setCurrentTool: (tool) => set({ currentTool: tool }),
      setBrushColor: (color) => set(state => {
        state.addRecentColor(color);
        return { brushColor: color };
      }),
      setBrushSize: (size) => set(state => ({
        brushSettings: { ...state.brushSettings, size }
      })),
      setEraserSize: (size) => set(state => ({
        eraserSettings: { ...state.eraserSettings, size }
      })),
      setContext: (context) => set({ context }),
      setIsDrawing: (isDrawing) => set({ isDrawing }),

      addToHistory: (imageData) => {
        set(state => ({
          history: [...state.history.slice(0, state.historyIndex + 1), imageData],
          historyIndex: state.historyIndex + 1
        }));
      },

      undo: () => {
        const { context, history, historyIndex } = get();
        if (!context || historyIndex <= 0) return;

        const newIndex = historyIndex - 1;
        context.putImageData(history[newIndex], 0, 0);
        set({ historyIndex: newIndex });
      },

      redo: () => {
        const { context, history, historyIndex } = get();
        if (!context || historyIndex >= history.length - 1) return;

        const newIndex = historyIndex + 1;
        context.putImageData(history[newIndex], 0, 0);
        set({ historyIndex: newIndex });
      },

      canUndo: () => {
        const { historyIndex } = get();
        return historyIndex > 0;
      },

      canRedo: () => {
        const { history, historyIndex } = get();
        return historyIndex < history.length - 1;
      },

      setOpacity: (opacity) => set(state => ({
        brushSettings: { ...state.brushSettings, opacity }
      })),

      setEraserOpacity: (opacity) => set(state => ({
        eraserSettings: { ...state.eraserSettings, opacity }
      })),

      addRecentColor: (color: string) => set(state => {
        const newRecentColors = [
          color,
          ...state.recentColors.filter(c => c !== color)
        ].slice(0, 4);
        return { recentColors: newRecentColors };
      })
    }),
    {
      name: 'canvas-drawing-storage',
      partialize: (state) => ({
        brushSettings: state.brushSettings,
        eraserSettings: state.eraserSettings,
        brushColor: state.brushColor,
        recentColors: state.recentColors
      })
    }
  )
);