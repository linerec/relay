import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { CanvasDrawingEditor } from '../drawing/CanvasDrawingEditor';

interface CutDrawingProps {
  drawing?: string;
  onDrawingChange: (drawing: string | undefined) => void;
}

export function CutDrawing({ drawing, onDrawingChange }: CutDrawingProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <div className="mb-4">
        <CanvasDrawingEditor
          initialImage={drawing}
          onSave={(imageData) => {
            onDrawingChange(imageData);
            setIsEditing(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="mb-4">
      {drawing ? (
        <div className="position-relative mb-2">
          <img
            src={drawing}
            alt="Cut drawing"
            className="img-fluid mb-2"
            style={{ maxHeight: '300px' }}
          />
          <div className="position-absolute top-0 end-0 m-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="me-2"
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDrawingChange(undefined)}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline-primary"
          onClick={() => setIsEditing(true)}
        >
          Create Drawing
        </Button>
      )}
    </div>
  );
}