import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Form, Button } from 'react-bootstrap';
import { fetchCutById, updateCut } from '../services/cutService';
import { Cut } from '../types';
import { Mochipad } from '../components/mochipad/Mochipad';
import { useMochipadStore } from '../stores/mochipadStore';

export function CutDetail() {
  const { cutId } = useParams<{ cutId: string }>();
  const [storyboardText, setStoryboardText] = useState('');
  const store = useMochipadStore();
  const cut = useMochipadStore(state => state.cut);

  useEffect(() => {
    if (!cutId) return;
    store.loadCut(cutId);
  }, [cutId]);

  useEffect(() => {
    if (cut) {
      setStoryboardText(cut.storyboard_text || '');
    }
  }, [cut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cutId || !cut) return;

    try {
      const { layerData, mergedImage } = store.getLayerData();

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

      // cut 데이터 업데이트
      store.loadCut(cutId);
    } catch (error) {
      console.error('Error updating cut:', error);
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
            cutData={cut}
          />
        </div>

        <Button variant="primary" type="submit">
          Save Changes
        </Button>
      </Form>
    </Container>
  );
}