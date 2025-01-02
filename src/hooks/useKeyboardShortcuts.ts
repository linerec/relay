import { useEffect } from 'react';
import { useDrawingStore } from '../stores/drawingStore';

export function useKeyboardShortcuts() {
  const { undo, redo, setCurrentTool, deleteSelectedObjects } = useDrawingStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          undo();
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        }
      } else {
        switch (e.key.toLowerCase()) {
          case 'v':
            setCurrentTool('select');
            break;
          case 'b':
            setCurrentTool('brush');
            break;
          case 'e':
            setCurrentTool('eraser');
            break;
          case 't':
            // Handled by DrawingToolbar
            break;
          case 'delete':
          case 'backspace':
            e.preventDefault();
            deleteSelectedObjects();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setCurrentTool, deleteSelectedObjects]);
}