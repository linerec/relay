import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { formatDistanceToNow } from 'date-fns';
import { Reply, Trash2 } from 'lucide-react';
import { CommentForm } from './CommentForm';
import { Comment } from '../../types';

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onReply: (content: string, parentId: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  replies?: Comment[];
  level?: number;
}

export function CommentItem({ 
  comment, 
  currentUserId, 
  onReply, 
  onDelete,
  replies = [],
  level = 0 
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleReply = async (content: string) => {
    await onReply(content, comment.id);
    setShowReplyForm(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      setIsDeleting(true);
      await onDelete(comment.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const isOwner = currentUserId === comment.user_id;
  const showReplyButton = level === 0; // 최상위 댓글에만 Reply 버튼 표시

  return (
    <div className={`ms-${level * 4}`}>
      <div className="border rounded p-3 mb-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <strong className="me-2">{comment.user_username}</strong>
            <small className="text-muted">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </small>
          </div>
          {isOwner && (
            <Button
              variant="link"
              className="p-0 text-danger"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
        
        <p className="mb-2">{comment.content}</p>
        
        {showReplyButton && (
          <div>
            <Button
              variant="link"
              className="p-0"
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              <Reply size={16} className="me-1" />
              Reply
            </Button>
          </div>
        )}

        {showReplyForm && (
          <div className="mt-3">
            <CommentForm
              onSubmit={handleReply}
              placeholder="Write a reply..."
              buttonText="Post Reply"
            />
          </div>
        )}
      </div>

      {replies.length > 0 && (
        <div className="ms-4">
          {replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={onDelete}
              replies={[]}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}