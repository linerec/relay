import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Form, Button } from 'react-bootstrap';
import { fetchCutById, updateCut } from '../services/cutService';
import { Cut } from '../types';
import { Mochipad } from '../components/mochipad/Mochipad';
import { useMochipadStore } from '../stores/mochipadStore';

export function CutDetail() {
  const { cutId } = useParams<{ cutId: string }>();
  const [cut, setCut] = useState<Cut | null>(null);
  const [storyboardText, setStoryboardText] = useState('');

  useEffect(() => {
    if (!cutId) return;

    const loadCut = async () => {
      try {
        const cutData = await fetchCutById(cutId);
        setCut(cutData);
        setStoryboardText(cutData.storyboard_text || '');
      } catch (error) {
        console.error('Error loading cut:', error);
      }
    };

    loadCut();
  }, [cutId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cutId || !cut) return;

    try {
      console.log('Starting form submission...');
      
      // 1. 먼저 Mochipad의 그림 데이터를 가져옴
      const store = useMochipadStore.getState();
      const { layerData, mergedImage } = store.getLayerData();
      
      console.log('Got drawing data:', {
        hasLayers: Object.values(layerData).some(layer => layer !== null),
        mergedImageSize: mergedImage.length
      });

      // 2. 모든 데이터를 한번에 업데이트
      await updateCut(cutId, {
        storyboard_text: storyboardText,
        drawing: mergedImage,
        layer01: layerData.layer01 ? JSON.stringify(layerData.layer01) : undefined,
        layer02: layerData.layer02 ? JSON.stringify(layerData.layer02) : undefined,
        layer03: layerData.layer03 ? JSON.stringify(layerData.layer03) : undefined,
        layer04: layerData.layer04 ? JSON.stringify(layerData.layer04) : undefined,
        layer05: layerData.layer05 ? JSON.stringify(layerData.layer05) : undefined,
        background_color: store.backgroundColor
      });

      console.log('Cut updated successfully');
      
      // 3. 상태 업데이트
      setCut(prevCut => {
        if (!prevCut) return null;
        return {
          ...prevCut,
          storyboard_text: storyboardText,
          drawing: mergedImage,
          layer01: layerData.layer01 ? JSON.stringify(layerData.layer01) : undefined,
          layer02: layerData.layer02 ? JSON.stringify(layerData.layer02) : undefined,
          layer03: layerData.layer03 ? JSON.stringify(layerData.layer03) : undefined,
          layer04: layerData.layer04 ? JSON.stringify(layerData.layer04) : undefined,
          layer05: layerData.layer05 ? JSON.stringify(layerData.layer05) : undefined,
          background_color: store.backgroundColor
        };
      });

    } catch (error) {
      console.error('Error updating cut:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
    }
  };

  if (!cut) return <div>Loading...</div>;

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Storyboard Text</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={storyboardText}
            onChange={(e) => setStoryboardText(e.target.value)}
          />
        </Form.Group>

        <div className="mb-3">
          <Mochipad
            cutId={cutId}
            comicId={cut.comic_id}
          />
        </div>

        <Button variant="primary" type="submit">
          Save Changes
        </Button>
      </Form>
    </Container>
  );
}