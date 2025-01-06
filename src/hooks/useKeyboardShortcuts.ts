import { useEffect } from 'react';
import { useCanvasDrawingStore } from '../stores/canvasDrawingStore';

export function useKeyboardShortcuts() {
  const { 
    setCurrentTool,
    undo,
    redo,
    canUndo,
    canRedo
  } = useCanvasDrawingStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Z: 실행 취소
      if (e.ctrlKey && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) {
          undo();
        }
      }
      
      // Ctrl + Y 또는 Ctrl + Shift + Z: 다시 실행
      if ((e.ctrlKey && e.key.toLowerCase() === 'y') || 
          (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        if (canRedo()) {
          redo();
        }
      }

      // 도구 단축키
      if (!e.ctrlKey && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'a':
            setCurrentTool('brush');
            break;
          case 's':
            setCurrentTool('eraser');
            break;
          case 'd':
            setCurrentTool('bucket');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setCurrentTool, undo, redo, canUndo, canRedo]);
}