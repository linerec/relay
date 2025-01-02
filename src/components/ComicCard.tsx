import React, { useState } from 'react';
import { Card, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Comic } from '../types';
import { supabase } from '../lib/supabase';

interface ComicCardProps {
  comic: Comic;
  currentUserId?: string;
  onComicUpdated: () => void;
}

export function ComicCard({ comic, currentUserId, onComicUpdated }: ComicCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(comic.title);
  const navigate = useNavigate();

  const isOwner = currentUserId === comic.owner_id;

  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from('comics')
        .update({ title })
        .eq('id', comic.id);

      if (error) throw error;
      
      setIsEditing(false);
      onComicUpdated();
    } catch (error) {
      console.error('Error updating comic:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comic?')) return;

    try {
      const { error } = await supabase
        .from('comics')
        .delete()
        .eq('id', comic.id);

      if (error) throw error;
      
      onComicUpdated();
    } catch (error) {
      console.error('Error deleting comic:', error);
    }
  };

  return (
    <Card className="mb-3">
      <Card.Body>
        {isEditing ? (
          <Form.Group>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="mt-2">
              <Button variant="primary" size="sm" onClick={handleUpdate} className="me-2">
                Save
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </Form.Group>
        ) : (
          <>
            <Card.Title 
              className="cursor-pointer" 
              onClick={() => navigate(`/comics/${comic.id}/cuts`)}
              style={{ cursor: 'pointer' }}
            >
              {comic.title}
            </Card.Title>
            {isOwner && (
              <div className="mt-2">
                <Button variant="outline-primary" size="sm" onClick={() => setIsEditing(true)} className="me-2">
                  Edit
                </Button>
                <Button variant="outline-danger" size="sm" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
}