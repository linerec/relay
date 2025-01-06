import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import { useComments } from '../../hooks/useComments';

interface CommentsSectionProps {
  comicId: string;
  user: any | null;
}

export function CommentsSection({ comicId, user }: CommentsSectionProps) {
  const navigate = useNavigate();
  const { comments, addComment, replyToComment, deleteComment } = useComments(comicId);

  const handleAddComment = async (content: string) => {
    if (!user) return;
    await addComment(content);
  };

  const handleReply = async (content: string, parentId: string) => {
    if (!user) return;
    await replyToComment(content, parentId);
  };

  if (!user) {
    return (
      <Alert variant="info" className="d-flex justify-content-between align-items-center">
        <span>Please log in to join the discussion</span>
        <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
          Log In
        </Button>
      </Alert>
    );
  }

  return (
    <div className="mt-5">
      <h4 className="mb-4">Comments</h4>
      <div className="mb-4">
        <CommentForm onSubmit={handleAddComment} />
      </div>
      <CommentList
        comments={comments}
        currentUserId={user?.id}
        onReply={handleReply}
        onDelete={deleteComment}
      />
    </div>
  );
}