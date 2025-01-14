import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button } from 'react-bootstrap';
import { fetchCutById, updateCut } from '../services/cutService';
import { Cut, CutUpdate } from '../types';
import { CutDrawing } from '../components/cuts/CutDrawing';
import { supabase } from '../lib/supabase';

export function CutDetail() {
  const { comicId, cutId } = useParams<{ comicId: string; cutId: string }>();
  const navigate = useNavigate();
  const [cut, setCut] = useState<Cut | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [formData, setFormData] = useState<CutUpdate>({
    storyboard_text: '',
    drawing: undefined,
    background_color: '#ffffff',
    layer01: undefined,
    layer02: undefined,
    layer03: undefined,
    layer04: undefined,
    layer05: undefined,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDrawingModified, setIsDrawingModified] = useState(false);

  useEffect(() => {
    loadCut();
  }, [cutId]);

  const loadCut = async () => {
    if (!cutId) return;
    try {
      const data = await fetchCutById(cutId);
      setCut(data);
      setFormData({
        storyboard_text: data.storyboard_text,
        drawing: data.drawing,
        background_color: data.background_color || '#ffffff',
        layer01: data.layer01,
        layer02: data.layer02,
        layer03: data.layer03,
        layer04: data.layer04,
        layer05: data.layer05,
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (data.comics) {
        const isOwner = user?.id === data.comics.owner_id;
        const isCollaborator = data.comics.collaborators?.includes(user?.id);
        setCanEdit(isOwner || isCollaborator);
      }
    } catch (error) {
      console.error('Error loading cut:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cutId) return;

    if (!canEdit) {
      alert('수정 권한이 없습니다.');
      return;
    }

    try {
      setIsSaving(true);
      await updateCut(cutId, formData);
      setIsDrawingModified(false);
      navigate(`/comics/${comicId}/cuts`);
    } catch (error) {
      console.error('Error updating cut:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDrawingChange = (
    drawing: string | undefined, 
    layers?: {
      background_color?: string;
      layer01?: string;
      layer02?: string;
      layer03?: string;
      layer04?: string;
      layer05?: string;
    }
  ) => {
    setFormData(prev => ({
      ...prev,
      drawing,
      ...layers,
    }));
    setIsDrawingModified(true);
  };

  const handleBack = () => {
    if (isDrawingModified) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    navigate(`/comics/${comicId}/cuts`);
  };

  if (!cut) return <div>Loading...</div>;

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Edit Cut</h1>
      </div>

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-4">
          <Form.Label>Storyboard Text</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={formData.storyboard_text}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              storyboard_text: e.target.value
            }))}
            disabled={!canEdit}
          />
        </Form.Group>

        <CutDrawing
          drawing={formData.drawing}
          layers={{
            background_color: formData.background_color,
            layer01: formData.layer01,
            layer02: formData.layer02,
            layer03: formData.layer03,
            layer04: formData.layer04,
            layer05: formData.layer05,
          }}
          onDrawingChange={handleDrawingChange}
        />

        <div className="d-flex gap-2">
          <Button
            variant="secondary"
            onClick={handleBack}
          >
            Back
          </Button>
          {canEdit && (
            <Button 
              type="submit" 
              variant="primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </Form>
    </Container>
  );
}