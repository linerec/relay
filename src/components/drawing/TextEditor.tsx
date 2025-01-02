import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { useDrawingStore } from '../../stores/drawingStore';

interface TextEditorProps {
  show: boolean;
  onHide: () => void;
}

export function TextEditor({ show, onHide }: TextEditorProps) {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [color, setColor] = useState('#000000');
  const { addText, setTool } = useDrawingStore();

  const fonts = [
    'Arial',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Verdana',
    'Helvetica'
  ];

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!text.trim()) return;
    
    addText({
      text,
      fontSize,
      fontFamily,
      color
    });
    setTool('select');
    
    setText('');
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Add Text</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <Form.Label>Text</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your text"
          />
        </div>

        <Row className="mb-3">
          <Col>
            <Form.Label>Font Size</Form.Label>
            <Form.Control
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              min="8"
              max="72"
            />
          </Col>
          <Col>
            <Form.Label>Font Family</Form.Label>
            <Form.Select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
            >
              {fonts.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </Form.Select>
          </Col>
        </Row>

        <div className="mb-3">
          <Form.Label>Color</Form.Label>
          <Form.Control
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>

        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={!text.trim()}
          >
            Add Text
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}