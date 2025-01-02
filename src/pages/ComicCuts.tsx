import React, { useEffect, useState } from 'react';
import { Container, Button } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Cut, Comic } from '../types';
import { CutList } from '../components/cuts/CutList';
import { CreateCutModal } from '../components/cuts/CreateCutModal';
import { fetchCutsByComicId } from '../services/cutService';

export function ComicCuts() {
  const { comicId } = useParams<{ comicId: string }>();
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [comic, setComic] = useState<Comic | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchComic();
    fetchCuts();
    getCurrentUser();
  }, [comicId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchComic = async () => {
    if (!comicId) return;
    const { data } = await supabase
      .from('comics')
      .select('*')
      .eq('id', comicId)
      .single();
    setComic(data);
  };

  const fetchCuts = async () => {
    if (!comicId) return;
    try {
      const data = await fetchCutsByComicId(comicId);
      setCuts(data);
    } catch (error) {
      console.error('Error fetching cuts:', error);
    }
  };

  const canEdit = comic && (
    comic.owner_id === user?.id || 
    comic.collaborators?.includes(user?.id)
  );

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{comic?.title} - Cuts</h1>
        {canEdit && (
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Add Cut
          </Button>
        )}
      </div>

      <CutList
        cuts={cuts}
        isOwner={canEdit}
        onCutsUpdated={fetchCuts}
      />

      <CreateCutModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        comicId={comicId!}
        onCutCreated={fetchCuts}
        currentOrderIndex={cuts.length}
      />
    </Container>
  );
}