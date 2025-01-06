import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Layers } from 'lucide-react';
import { Comic, Profile } from '../types';
import { supabase } from '../lib/supabase';

interface ComicCardProps {
  comic: Comic;
  currentUserId?: string;
  onComicUpdated: () => void;
}

export function ComicCard({ comic, currentUserId, onComicUpdated }: ComicCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(comic.title);
  const [collaborators, setCollaborators] = useState<Profile[]>([]);
  const [cutCount, setCutCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const navigate = useNavigate();

  const isOwner = currentUserId === comic.owner_id;
  const isCollaborator = comic.collaborators?.includes(currentUserId || '');
  const canEdit = isOwner || isCollaborator;

  useEffect(() => {
    if (comic.collaborators?.length) {
      fetchCollaborators();
    }
    fetchCounts();
  }, [comic]);

  const fetchCollaborators = async () => {
    if (!comic.collaborators?.length) return;

    const { data } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', comic.collaborators);

    if (data) {
      setCollaborators(data);
    }
  };

  const fetchCounts = async () => {
    // Fetch cut count
    const { count: cuts } = await supabase
      .from('cuts')
      .select('*', { count: 'exact', head: true })
      .eq('comic_id', comic.id);

    // Fetch comment count
    const { count: comments } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('comic_id', comic.id);

    setCutCount(cuts || 0);
    setCommentCount(comments || 0);
  };

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
            
            <div className="d-flex gap-2 mb-2">
              <Badge bg="secondary" className="d-flex align-items-center gap-1">
                <Layers size={14} />
                {cutCount} cuts
              </Badge>
              <Badge bg="secondary" className="d-flex align-items-center gap-1">
                <MessageSquare size={14} />
                {commentCount} comments
              </Badge>
            </div>

            {collaborators.length > 0 && (
              <div className="mb-2 text-muted">
                <small>
                  Collaborators: {collaborators.map(c => c.username).join(', ')}
                </small>
              </div>
            )}

            {canEdit && (
              <div className="mt-2">
                <Button variant="outline-primary" size="sm" onClick={() => setIsEditing(true)} className="me-2">
                  Edit
                </Button>
                {isOwner && (
                  <Button variant="outline-danger" size="sm" onClick={handleDelete}>
                    Delete
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
}