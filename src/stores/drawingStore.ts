import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fabric } from 'fabric';

type Tool = 'select' | 'brush' | 'eraser' | 'draw' | 'text';

const hexToRgba = (hex: string, opacity: number): string => {
  const bigint = parseInt(hex.replace('#', ''), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${opacity})`;
};

interface ToolSettings {
  size: number;
  opacity: number;
}

interface DrawingState {
  canvas: fabric.Canvas | null;
  currentTool: Tool;
  brushColor: string;
  brushSettings: ToolSettings;
  eraserSettings: ToolSettings;
  history: string[];
  historyIndex: number;
  
  setCanvas: (canvas: fabric.Canvas | null) => void;
  setCurrentTool: (tool: Tool) => void;
  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setEraserSize: (size: number) => void;
  
  addText: (options: { text: string; fontSize: number; fontFamily: string; color: string }) => void;
  deleteSelectedObjects: () => void;
  
  undo: () => void;
  redo: () => void;
  addToHistory: (state: string) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  setTool: (tool: Tool) => void;
}

export const useDrawingStore = create<DrawingState>()(
  persist(
    (set, get) => ({
      canvas: null,
      currentTool: 'brush',
      brushColor: '#000000',
      brushSettings: {
        size: 1,
        opacity: 1
      },
      eraserSettings: {
        size: 20,
        opacity: 1
      },
      history: [],
      historyIndex: -1,

      setCanvas: (canvas) => {
        set({ canvas });
        if (canvas) {
          canvas.isDrawingMode = get().currentTool !== 'select';
        }
      },

      setCurrentTool: (tool) => {
        const { canvas, brushColor, brushSettings, eraserSettings } = get();
        if (!canvas) return;

        canvas.isDrawingMode = tool !== 'select';
        
        if (tool === 'select') {
          canvas.selection = true;
          canvas.defaultCursor = 'default';
          canvas.hoverCursor = 'move';
        } else {
          canvas.selection = false;
          canvas.defaultCursor = 'crosshair';
          canvas.hoverCursor = 'crosshair';
          
          if (tool === 'eraser') {
            canvas.freeDrawingBrush.color = hexToRgba('#ffffff', eraserSettings.opacity);
            canvas.freeDrawingBrush.width = eraserSettings.size;
          } else {
            canvas.freeDrawingBrush.color = hexToRgba(brushColor, brushSettings.opacity);
            canvas.freeDrawingBrush.width = brushSettings.size;
          }
        }

        set({ currentTool: tool });
        canvas.renderAll();
      },

      setBrushColor: (color) => {
        const { canvas, brushSettings } = get();
        set({ brushColor: color });
        if (canvas && get().currentTool === 'brush') {
          canvas.freeDrawingBrush.color = hexToRgba(color, brushSettings.opacity);
        }
      },

      setBrushSize: (size) => {
        const { canvas, currentTool } = get();
        set(state => ({ brushSettings: { ...state.brushSettings, size } }));
        if (canvas && currentTool === 'brush') {
          canvas.freeDrawingBrush.width = size;
        }
      },

      setEraserSize: (size) => {
        const { canvas, currentTool } = get();
        set(state => ({ eraserSettings: { ...state.eraserSettings, size } }));
        if (canvas && currentTool === 'eraser') {
          canvas.freeDrawingBrush.width = size;
        }
      },

      addText: (options) => {
        const { canvas } = get();
        if (!canvas) return;

        const text = new fabric.IText(options.text, {
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          fontSize: options.fontSize,
          fontFamily: options.fontFamily,
          fill: options.color,
          originX: 'center',
          originY: 'center'
        });
        
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();

        const json = JSON.stringify(canvas.toJSON());
        get().addToHistory(json);
      },

      deleteSelectedObjects: () => {
        const { canvas } = get();
        if (!canvas) return;

        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length === 0) return;

        canvas.remove(...activeObjects);
        canvas.discardActiveObject();
        canvas.renderAll();

        const json = JSON.stringify(canvas.toJSON());
        get().addToHistory(json);
      },

      addToHistory: (state) => {
        set(({ history, historyIndex }) => ({
          history: [...history.slice(0, historyIndex + 1), state],
          historyIndex: historyIndex + 1
        }));
      },

      undo: () => {
        const { canvas, history, historyIndex } = get();
        if (!canvas || historyIndex <= 0) return;

        const newIndex = historyIndex - 1;
        const previousState = history[newIndex];
        
        canvas.loadFromJSON(JSON.parse(previousState), () => {
          canvas.renderAll();
          set({ historyIndex: newIndex });
        });
      },

      redo: () => {
        const { canvas, history, historyIndex } = get();
        if (!canvas || historyIndex >= history.length - 1) return;

        const newIndex = historyIndex + 1;
        const nextState = history[newIndex];
        
        canvas.loadFromJSON(JSON.parse(nextState), () => {
          canvas.renderAll();
          set({ historyIndex: newIndex });
        });
      },

      canUndo: () => {
        const { historyIndex } = get();
        return historyIndex > 0;
      },

      canRedo: () => {
        const { history, historyIndex } = get();
        return historyIndex < history.length - 1;
      },

      setTool: (tool) => {
        set({ currentTool: tool });
      }
    }),
    {
      name: 'drawing-storage',
      partialize: (state) => ({
        brushSettings: state.brushSettings,
        eraserSettings: state.eraserSettings,
        brushColor: state.brushColor
      })
    }
  )
);