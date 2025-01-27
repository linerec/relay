import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button } from 'react-bootstrap';
import { fetchCutById, updateCut } from '../services/cutService';
import { Cut, LayerData } from '../types';
import { Mochipad } from '../components/mochipad/Mochipad';
import { useMochipadStore } from '../stores/mochipadStore';

export function CutDetail() {
  const navigate = useNavigate();
  const { cutId, comicId } = useParams<{ cutId: string; comicId: string }>();
  const [storyboardText, setStoryboardText] = useState('');
  const store = useMochipadStore();
  const cut = useMochipadStore(state => state.cut);

  useEffect(() => {
    if (!cutId) return;

    const initializeCut = async () => {
      await store.loadCut(cutId);

      // cut 로드 후 레이어가 없으면 기본 레이어 추가
      const currentLayers = useMochipadStore.getState().layers;
      if (currentLayers.length === 0) {
        await store.addLayer({
          name: "Layer 1",
          sequence: 1,
          visible: true,
          opacity: 1,
          locked: false
        });
      }
    };

    initializeCut();
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
        layers_data: Object.values(layerData).filter((layer): layer is LayerData => layer !== null),
        background_color: store.backgroundColor
      });

      // cut 데이터 업데이트
      store.loadCut(cutId);

      // Cut List 페이지로 이동
      handleBackToCuts();
    } catch (error) {
      console.error('Error updating cut:', error);
    }
  };

  const handleBackToCuts = () => {
    // comic ID가 있으면 해당 comic의 cuts 목록으로 이동
    if (comicId) {
      navigate(`/comics/${comicId}/cuts`);
    } else {
      // comic ID가 없으면 전체 cuts 목록으로 이동
      navigate('/comics');
    }
  };

  if (!cut) return <div>Loading...</div>;

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Button variant="outline-secondary" onClick={handleBackToCuts}>
            Back to Cuts
          </Button>
        </div>
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