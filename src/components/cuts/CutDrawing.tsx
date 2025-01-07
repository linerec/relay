import React from 'react';
import { Mochipad } from '../mochipad/Mochipad';
import { useMochipadLayers } from '../../hooks/useMochipadLayers';

interface CutDrawingProps {
  drawing?: string;
  layers?: {
    background_color?: string;
    layer01?: string;
    layer02?: string;
    layer03?: string;
    layer04?: string;
    layer05?: string;
  };
  onDrawingChange: (
    drawing: string | undefined,
    layers?: {
      background_color?: string;
      layer01?: string;
      layer02?: string;
      layer03?: string;
      layer04?: string;
      layer05?: string;
    }
  ) => void;
}

export function CutDrawing({ drawing, layers, onDrawingChange }: CutDrawingProps) {
  const { getLayerData } = useMochipadLayers(layers);

  const handleSave = () => {
    const layerData = getLayerData();
    onDrawingChange(layerData.drawing, {
      background_color: layerData.background_color,
      layer01: layerData.layer01,
      layer02: layerData.layer02,
      layer03: layerData.layer03,
      layer04: layerData.layer04,
      layer05: layerData.layer05,
    });
  };

  return (
    <div className="cut-drawing mb-4">
      <Mochipad onSave={handleSave} />
    </div>
  );
}