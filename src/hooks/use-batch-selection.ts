import { useState, useCallback, useMemo } from 'react';

export interface BatchSelectionHook<T> {
  selectedItems: Set<string | number>;
  isSelected: (id: string | number) => boolean;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  selectedCount: number;
  selectItem: (id: string | number) => void;
  deselectItem: (id: string | number) => void;
  toggleItem: (id: string | number) => void;
  selectAll: (items: T[], getItemId: (item: T) => string | number) => void;
  deselectAll: () => void;
  toggleSelectAll: (items: T[], getItemId: (item: T) => string | number) => void;
  getSelectedData: (items: T[], getItemId: (item: T) => string | number) => T[];
  clearSelection: () => void;
}

export function useBatchSelection<T>(): BatchSelectionHook<T> {
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set());

  const isSelected = useCallback((id: string | number) => {
    return selectedItems.has(id);
  }, [selectedItems]);

  const selectItem = useCallback((id: string | number) => {
    setSelectedItems((prev) => new Set([...prev, id]));
  }, []);

  const deselectItem = useCallback((id: string | number) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  const toggleItem = useCallback((id: string | number) => {
    if (isSelected(id)) {
      deselectItem(id);
    } else {
      selectItem(id);
    }
  }, [isSelected, selectItem, deselectItem]);

  const selectAll = useCallback((items: T[], getItemId: (item: T) => string | number) => {
    const allIds = items.map(getItemId);
    setSelectedItems(new Set(allIds));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const toggleSelectAll = useCallback((items: T[], getItemId: (item: T) => string | number) => {
    const allIds = items.map(getItemId);
    const allSelected = allIds.every((id) => selectedItems.has(id));

    if (allSelected) {
      deselectAll();
    } else {
      selectAll(items, getItemId);
    }
  }, [selectedItems, selectAll, deselectAll]);

  const getSelectedData = useCallback((items: T[], getItemId: (item: T) => string | number) => {
    return items.filter((item) => selectedItems.has(getItemId(item)));
  }, [selectedItems]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const isAllSelected = useMemo(() => {
    return selectedItems.size > 0;
  }, [selectedItems.size]);

  const isPartiallySelected = useMemo(() => {
    return selectedItems.size > 0;
  }, [selectedItems.size]);

  const selectedCount = useMemo(() => {
    return selectedItems.size;
  }, [selectedItems.size]);

  return {
    selectedItems,
    isSelected,
    isAllSelected,
    isPartiallySelected,
    selectedCount,
    selectItem,
    deselectItem,
    toggleItem,
    selectAll,
    deselectAll,
    toggleSelectAll,
    getSelectedData,
    clearSelection
  };
}