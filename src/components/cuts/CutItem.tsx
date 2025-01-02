import React from 'react';
import { Card, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { ArrowUp, ArrowDown, Edit } from 'lucide-react';
import { Cut } from '../../types';
import { useNavigate } from 'react-router-dom';

interface CutItemProps {
  cut: Cut;
  canEdit: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  onCutUpdated: () => void;
}

export function CutItem({
  cut,
  canEdit,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onCutUpdated,
}: CutItemProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <Card.Body>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start">
          <div className="flex-grow-1 mb-2 mb-md-0 me-md-3">
            {cut.drawing && (
              <img
                src={cut.drawing}
                alt="Cut drawing"
                className="img-fluid"
                style={{ maxHeight: '150px' }}
              />
            )}
          </div>
          <div className="flex-grow-1">
            <p className="mb-1">{cut.storyboard_text}</p>
            <p className="mb-1 text-muted">
              생성 날짜: {new Date(cut.created_at).toLocaleString()}
            </p>
            <p className="mb-2 text-muted">
              생성자: {cut.profiles?.username || 'Unknown'}
            </p>
            <div className="d-flex gap-2">
              {canEdit && (
                <>
                  <div className="d-flex flex-column">
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip id={`tooltip-move-up-${cut.id}`}>Move Up</Tooltip>}
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={onMoveUp}
                        disabled={isFirst}
                        className="mb-1"
                      >
                        <ArrowUp size={16} />
                      </Button>
                    </OverlayTrigger>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip id={`tooltip-move-down-${cut.id}`}>Move Down</Tooltip>}
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={onMoveDown}
                        disabled={isLast}
                      >
                        <ArrowDown size={16} />
                      </Button>
                    </OverlayTrigger>
                  </div>
                  <OverlayTrigger
                    placement="top"
                    overlay={<Tooltip id={`tooltip-edit-${cut.id}`}>Edit Cut</Tooltip>}
                  >
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/comics/${cut.comic_id}/cuts/${cut.id}`)}
                    >
                      <Edit size={16} />
                    </Button>
                  </OverlayTrigger>
                </>
              )}
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}