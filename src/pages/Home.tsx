import React, { useEffect, useState } from 'react';
import { Container, Button, Row, Col } from 'react-bootstrap';
import { supabase } from '../lib/supabase';
import { Comic } from '../types';
import { CreateComicModal } from '../components/CreateComicModal';
import { ComicCard } from '../components/ComicCard';

export function Home() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchComics();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchComics = async () => {
    try {
      const { data, error } = await supabase
        .from('comics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setComics(data || []);
    } catch (error) {
      console.error('Error fetching comics:', error);
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Comics Library</h1>
        {user && (
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Comic 만들기
          </Button>
        )}
      </div>

      <Row>
        {comics.map((comic) => (
          <Col key={comic.id} xs={12} sm={6} md={4} lg={3} className="mb-4">
            <ComicCard
              comic={comic}
              currentUserId={user?.id}
              onComicUpdated={fetchComics}
            />
          </Col>
        ))}
      </Row>

      <CreateComicModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onComicCreated={fetchComics}
      />
    </Container>
  );
}