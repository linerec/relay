import React from 'react';
import { Cut } from '../../types';
import './styles.css';
import { Button } from 'react-bootstrap';
import { FaShareAlt } from 'react-icons/fa';

interface WebtoonViewProps {
  cuts: Cut[];
}

export function WebtoonView({ cuts }: WebtoonViewProps) {
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        alert('URL이 클립보드에 복사되었습니다!');
      })
      .catch(() => {
        alert('URL 복사에 실패했습니다.');
      });
  };

  return (
    <div>
      <div className="d-flex justify-content-end mb-3">
        <Button variant="outline-secondary" size="sm" onClick={handleShare}>
          <FaShareAlt /> 공유하기
        </Button>
      </div>
      <div className="webtoon-view">
        {cuts.map((cut) => (
          <div key={cut.id} className="webtoon-cut">
            {cut.drawing && (
              <img
                src={cut.drawing}
                alt={`Cut ${cut.order_index + 1}`}
                className="webtoon-image"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}