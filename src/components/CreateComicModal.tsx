import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { supabase } from '../lib/supabase';

interface CreateComicModalProps {
  show: boolean;
  onHide: () => void;
  onComicCreated: () => void;
}

export function CreateComicModal({ show, onHide, onComicCreated }: CreateComicModalProps) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to create a comic');

      const { error } = await supabase
        .from('comics')
        .insert([{ 
          title,
          owner_id: user.id
        }]);

      if (error) throw error;
      
      setTitle('');
      onComicCreated();
      onHide();
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>새 Comic 만들기</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
          Comic 만들기
        </Button>
      </Modal.Footer>
    </Modal>
  );
}