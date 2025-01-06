import React, { useEffect, useState } from 'react';
import { Container, Button, Row, Col } from 'react-bootstrap';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Cut, Comic } from '../types';
import { CutList } from '../components/cuts/CutList';
import { WebtoonView } from '../components/cuts/WebtoonView';
import { ViewModeToggle } from '../components/cuts/ViewModeToggle';
import { CreateCutModal } from '../components/cuts/CreateCutModal';
import { CommentsSection } from '../components/comments/CommentsSection';
import { fetchCutsByComicId } from '../services/cutService';

export function ComicCuts() {
  const { comicId } = useParams<{ comicId: string }>();
  const location = useLocation();
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [comic, setComic] = useState<Comic | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const query = new URLSearchParams(location.search);
  const initialViewMode = query.get('view') === 'webtoon' ? 'webtoon' : 'list';
  const [viewMode, setViewMode] = useState<'list' | 'webtoon'>(initialViewMode);

  useEffect(() => {
    fetchComic();
    fetchCuts();
    getCurrentUser();
  }, [comicId, location.search]);

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

  const handleViewModeChange = (mode: 'list' | 'webtoon') => {
    setViewMode(mode);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('view', mode);
    window.history.replaceState(null, '', newUrl.toString());
  };

  const canEdit: boolean = !!comic && (
    comic.owner_id === user?.id || 
    (comic.collaborators?.includes(user?.id) ?? false)
  );

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{comic?.title} - Cuts</h1>
        <div className="d-flex gap-3">
          <ViewModeToggle mode={viewMode} onModeChange={handleViewModeChange} />
          {canEdit && (
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              Add Cut
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'list' ? (
        <CutList
          canEdit={canEdit}
          cuts={cuts}
          onCutsUpdated={fetchCuts}
        />
      ) : (
        <WebtoonView cuts={cuts} />
      )}

      {comicId && <CommentsSection comicId={comicId} user={user} />}

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