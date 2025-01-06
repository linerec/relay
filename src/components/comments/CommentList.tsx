import React from 'react';
import { Alert } from 'react-bootstrap';
import { CommentItem } from './CommentItem';
import { Comment } from '../../types';

interface CommentListProps {
  comments: Comment[];
  currentUserId?: string;
  onReply: (content: string, parentId: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

export function CommentList({ comments, currentUserId, onReply, onDelete }: CommentListProps) {
  // 댓글을 트리 구조로 구성
  const commentMap = new Map<string | null, Comment[]>();
  
  // 부모 ID별로 댓글 그룹화
  comments.forEach(comment => {
    const parentId = comment.parent_id || null;
    if (!commentMap.has(parentId)) {
      commentMap.set(parentId, []);
    }
    commentMap.get(parentId)!.push(comment);
  });

  // 최상위 댓글 가져오기
  const rootComments = commentMap.get(null) || [];

  if (comments.length === 0) {
    return (
      <Alert variant="light" className="text-center">
        No comments yet. Be the first to comment!
      </Alert>
    );
  }

  return (
    <div>
      {rootComments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          onReply={onReply}
          onDelete={onDelete}
          replies={commentMap.get(comment.id) || []}
        />
      ))}
    </div>
  );
}