import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  buttonText?: string;
}

export function CommentForm({ onSubmit, placeholder = 'Write a comment...', buttonText = 'Post Comment' }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(content);
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-2">
        <Form.Control
          as="textarea"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
        />
      </Form.Group>
      <div className="d-flex justify-content-end">
        <Button 
          type="submit" 
          variant="primary" 
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? 'Posting...' : buttonText}
        </Button>
      </div>
    </Form>
  );
}