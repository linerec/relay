import React, { useState } from 'react';
import { Card, Button } from 'react-bootstrap';
import { ArrowUp, ArrowDown, Edit } from 'lucide-react';
import { Cut } from '../../types';
import { useNavigate } from 'react-router-dom';

interface CutItemProps {
  cut: Cut;
  isOwner: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onCutUpdated: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function CutItem({
  cut,
  isOwner,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: CutItemProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            {cut.drawing && (
              <img
                src={cut.drawing}
                alt="Cut drawing"
                className="img-fluid mb-2"
                style={{ maxHeight: '150px' }}
              />
            )}
            <p className="mb-0">{cut.storyboard_text}</p>
          </div>
          <div className="d-flex gap-2 ms-3">
            {isOwner && (
              <>
                <div className="d-flex flex-column">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={onMoveUp}
                    disabled={isFirst}
                  >
                    <ArrowUp size={16} />
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={onMoveDown}
                    disabled={isLast}
                  >
                    <ArrowDown size={16} />
                  </Button>
                </div>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => navigate(`/comics/${cut.comic_id}/cuts/${cut.id}`)}
                >
                  <Edit size={16} />
                </Button>
              </>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}