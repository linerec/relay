import React from 'react';
import { ButtonGroup, Button } from 'react-bootstrap';
import { List, Rows } from 'lucide-react';

interface ViewModeToggleProps {
  mode: 'list' | 'webtoon';
  onModeChange: (mode: 'list' | 'webtoon') => void;
}

export function ViewModeToggle({ mode, onModeChange }: ViewModeToggleProps) {
  return (
    <ButtonGroup>
      <Button
        variant={mode === 'list' ? 'primary' : 'outline-primary'}
        onClick={() => onModeChange('list')}
      >
        <List size={16} className="me-1" />
        List View
      </Button>
      <Button
        variant={mode === 'webtoon' ? 'primary' : 'outline-primary'}
        onClick={() => onModeChange('webtoon')}
      >
        <Rows size={16} className="me-1" />
        Webtoon View
      </Button>
    </ButtonGroup>
  );
}