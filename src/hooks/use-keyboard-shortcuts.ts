import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  callback: () => void;
  disabled?: boolean;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when user is typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const activeShortcut = shortcuts.find((shortcut) => {
      if (shortcut.disabled) return false;

      return (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        Boolean(event.ctrlKey) === Boolean(shortcut.ctrlKey) &&
        Boolean(event.altKey) === Boolean(shortcut.altKey) &&
        Boolean(event.shiftKey) === Boolean(shortcut.shiftKey));

    });

    if (activeShortcut) {
      event.preventDefault();
      activeShortcut.callback();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

export const useListKeyboardShortcuts = (
selectedId: number | null,
onView: (id: number) => void,
onEdit: (id: number) => void,
onDelete: (id: number) => void,
onCreate: () => void) =>
{
  const shortcuts: KeyboardShortcut[] = [
  {
    key: 'v',
    callback: () => selectedId && onView(selectedId),
    disabled: !selectedId
  },
  {
    key: 'e',
    callback: () => selectedId && onEdit(selectedId),
    disabled: !selectedId
  },
  {
    key: 'd',
    callback: () => selectedId && onDelete(selectedId),
    disabled: !selectedId
  },
  {
    key: 'n',
    ctrlKey: true,
    callback: onCreate
  }];


  useKeyboardShortcuts(shortcuts);
};

export default useKeyboardShortcuts;