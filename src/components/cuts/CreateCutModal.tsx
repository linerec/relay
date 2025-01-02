import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { supabase } from '../../lib/supabase';

interface CreateCutModalProps {
  show: boolean;
  onHide: () => void;
  comicId: string;
  onCutCreated: () => void;
  currentOrderIndex: number;
}

export function CreateCutModal({
  show,
  onHide,
  comicId,
  onCutCreated,
  currentOrderIndex
}: CreateCutModalProps) {
  const [storyboardText, setStoryboardText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to create a cut');

      const { error } = await supabase
        .from('cuts')
        .insert([{
          comic_id: comicId,
          storyboard_text: storyboardText,
          order_index: currentOrderIndex,
          created_by: user.id
        }]);

      if (error) throw error;

      setStoryboardText('');
      onCutCreated();
      onHide();
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Add New Cut</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Storyboard Text</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={storyboardText}
              onChange={(e) => setStoryboardText(e.target.value)}
              required
            />
          </Form.Group>
          {error && <div className="alert alert-danger">{error}</div>}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Add Cut
        </Button>
      </Modal.Footer>
    </Modal>
  );
}