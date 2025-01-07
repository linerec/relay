import { useEffect, useRef } from 'react';
import { useMochipadStore } from '../stores/mochipadStore';

export function useCanvasSetup() {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    layers,
    canvasWidth,
    canvasHeight,
    scale,
    offset,
    addLayer,
  } = useMochipadStore();

  // Initialize first layer if needed
  useEffect(() => {
    if (layers.length === 0) {
      addLayer();
    }
  }, []);

  // Handle canvas resize and positioning
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const baseScale = Math.min(
        containerWidth / canvasWidth,
        containerHeight / canvasHeight
      );

      const displayWidth = canvasWidth * baseScale * scale;
      const displayHeight = canvasHeight * baseScale * scale;

      const drawableArea = container.querySelector('.canvas-drawable-area') as HTMLElement;
      const layersContainer = container.querySelector('.canvas-layers-container') as HTMLElement;

      if (drawableArea && layersContainer) {
        const styles = {
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          transform: `translate(${offset.x}px, ${offset.y}px)`
        };

        Object.assign(drawableArea.style, styles);
        Object.assign(layersContainer.style, styles);

        layers.forEach(layer => {
          if (layer.canvas) {
            layer.canvas.style.width = `${displayWidth}px`;
            layer.canvas.style.height = `${displayHeight}px`;
          }
        });
      }
    };

    const resizeObserver = new ResizeObserver(updateCanvasSize);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    updateCanvasSize();

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [layers, canvasWidth, canvasHeight, scale, offset]);

  return containerRef;
}