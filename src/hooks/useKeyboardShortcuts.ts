import { useEffect } from 'react';
import { useMochipadStore } from '../stores/mochipadStore';

interface KeyboardShortcutsProps {
  setIsSpacePressed?: (isPressed: boolean) => void;
}

export function useKeyboardShortcuts({ setIsSpacePressed }: KeyboardShortcutsProps = {}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space bar (Pan tool)
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed?.(true);
      }

      // Undo (Ctrl + Z)
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        useMochipadStore.getState().undo();
      }

      // Redo (Ctrl + Y)
      if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        useMochipadStore.getState().redo();
      }

      // 도구 단축키
      if (!e.ctrlKey && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'a':
            // setCurrentTool('brush');
            break;
          case 's':
            // setCurrentTool('eraser');
            break;
          case 'd':
            // setCurrentTool('bucket');
            break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed?.(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setIsSpacePressed]);
}