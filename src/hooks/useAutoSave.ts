import { useEffect } from 'react';
import { useDrawingStore } from '../stores/drawingStore';

export function useAutoSave() {
  const { canvas, addToHistory } = useDrawingStore();

  useEffect(() => {
    if (!canvas) return;

    let isDrawing = false;

    const handlePathCreated = () => {
      const json = JSON.stringify(canvas.toJSON());
      addToHistory(json);
    };

    const handleObjectModified = () => {
      if (!isDrawing) {
        const json = JSON.stringify(canvas.toJSON());
        addToHistory(json);
      }
    };

    const handleMouseDown = () => {
      isDrawing = true;
    };

    const handleMouseUp = () => {
      isDrawing = false;
    };

    canvas.on('path:created', handlePathCreated);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:up', handleMouseUp);

    // Save initial state
    const initialJson = JSON.stringify(canvas.toJSON());
    addToHistory(initialJson);

    return () => {
      canvas.off('path:created', handlePathCreated);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [canvas, addToHistory]);
}