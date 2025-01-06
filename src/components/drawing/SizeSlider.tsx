import React from 'react';
import { Form } from 'react-bootstrap';

interface SizeSliderProps {
  value: number;
  onChange: (size: number) => void;
}

export function SizeSlider({ value, onChange }: SizeSliderProps) {
  return (
    <Form.Group className="d-flex align-items-center gap-2">
      <Form.Label className="mb-0 me-2" style={{ minWidth: '45px' }}>Size:</Form.Label>
      <Form.Range
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min="1"
        max="50"
        style={{ width: '120px' }}
      />
      <span className="ms-2 text-muted" style={{ minWidth: '2.5rem' }}>
        {value}
      </span>
    </Form.Group>
  );
} 