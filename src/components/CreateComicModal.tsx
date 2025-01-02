import React, { useState } from 'react';
import { Modal, Button, Form, Badge } from 'react-bootstrap';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserSearch } from './UserSearch';
import { Profile } from '../types';

interface CreateComicModalProps {
  show: boolean;
  onHide: () => void;
  onComicCreated: () => void;
}

export function CreateComicModal({ show, onHide, onComicCreated }: CreateComicModalProps) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [selectedCollaborators, setSelectedCollaborators] = useState<Profile[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to create a comic');

      const { error } = await supabase
        .from('comics')
        .insert([{ 
          title,
          owner_id: user.id,
          collaborators: selectedCollaborators.map(c => c.id)
        }]);

      if (error) throw error;
      
      setTitle('');
      setSelectedCollaborators([]);
      onComicCreated();
      onHide();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleCollaboratorSelect = (user: Profile) => {
    setSelectedCollaborators(prev => [...prev, user]);
  };

  const removeCollaborator = (userId: string) => {
    setSelectedCollaborators(prev => prev.filter(c => c.id !== userId));
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Create New Comic</Modal.Title>
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

          <Form.Group className="mb-3">
            <Form.Label>Add Collaborators</Form.Label>
            <UserSearch
              onUserSelect={handleCollaboratorSelect}
              selectedUsers={selectedCollaborators}
            />
          </Form.Group>

          {selectedCollaborators.length > 0 && (
            <div className="mb-3">
              <div className="fw-bold mb-2">Selected Collaborators:</div>
              <div className="d-flex flex-wrap gap-2">
                {selectedCollaborators.map(user => (
                  <Badge 
                    key={user.id} 
                    bg="primary"
                    className="d-flex align-items-center gap-2"
                  >
                    {user.username}
                    <X
                      size={14}
                      className="cursor-pointer"
                      onClick={() => removeCollaborator(user.id)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {error && <div className="alert alert-danger">{error}</div>}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Create Comic
        </Button>
      </Modal.Footer>
    </Modal>
  );
}