import React from 'react';
import { Cut } from '../../types';
import { CutItem } from './CutItem';
import { updateCutOrder } from '../../services/cutService';

interface CutListProps {
  cuts: Cut[];
  canEdit: boolean;
  onCutsUpdated: () => void;
}

export function CutList({ cuts, canEdit, onCutsUpdated }: CutListProps) {
  const handleMoveUp = async (cut: Cut) => {
    if (cut.order_index === 0) return;
    const prevCut = cuts.find(c => c.order_index === cut.order_index - 1);
    if (!prevCut) return;

    try {
      await Promise.all([
        updateCutOrder(prevCut, cut.order_index),
        updateCutOrder(cut, cut.order_index - 1)
      ]);
      onCutsUpdated();
    } catch (error) {
      console.error('Error moving cut up:', error);
    }
  };

  const handleMoveDown = async (cut: Cut) => {
    if (cut.order_index === cuts.length - 1) return;
    const nextCut = cuts.find(c => c.order_index === cut.order_index + 1);
    if (!nextCut) return;

    try {
      await Promise.all([
        updateCutOrder(nextCut, cut.order_index),
        updateCutOrder(cut, cut.order_index + 1)
      ]);
      onCutsUpdated();
    } catch (error) {
      console.error('Error moving cut down:', error);
    }
  };

  return (
    <div className="d-flex flex-column gap-3">
      {cuts.map((cut) => (
        <CutItem
          key={cut.id}
          cut={cut}
          canEdit={canEdit}
          onMoveUp={() => handleMoveUp(cut)}
          onMoveDown={() => handleMoveDown(cut)}
          onCutUpdated={onCutsUpdated}
          isFirst={cut.order_index === 0}
          isLast={cut.order_index === cuts.length - 1}
        />
      ))}
    </div>
  );
}