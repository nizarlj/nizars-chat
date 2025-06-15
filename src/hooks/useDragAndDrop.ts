"use client";

import { useCallback, useState, useRef } from 'react';
import { type Model } from '@/lib/models';
import { getAcceptedFileTypes } from '@/lib/fileUtils';

interface UseDragAndDropOptions {
  onFilesDropped: (files: File[]) => void;
  disabled?: boolean;
  model?: Model;
}

export function useDragAndDrop({
  onFilesDropped,
  disabled = false,
  model
}: UseDragAndDropOptions) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  const acceptedTypes = getAcceptedFileTypes(model);

  const isValidFile = useCallback((file: File) => {
    return acceptedTypes.some(acceptType => {
      if (acceptType.startsWith('.')) {
        return file.name.toLowerCase().endsWith(acceptType.toLowerCase());
      }
      if (acceptType.includes('*')) {
        const [type] = acceptType.split('/');
        return file.type.startsWith(type);
      }
      return file.type === acceptType;
    });
  }, [acceptedTypes]);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    dragCounterRef.current++;
    
    if (e.dataTransfer?.items) {
      const hasFiles = Array.from(e.dataTransfer.items).some(
        item => item.kind === 'file'
      );
      if (hasFiles) {
        setIsDragOver(true);
      }
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    dragCounterRef.current--;
    
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, [disabled]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, [disabled]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    setIsDragOver(false);
    dragCounterRef.current = 0;
    
    const files = Array.from(e.dataTransfer?.files || []);
    const validFiles = files.filter(isValidFile);
    
    if (validFiles.length > 0) {
      onFilesDropped(validFiles);
    }
  }, [disabled, isValidFile, onFilesDropped]);

  const bindDropZone = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('drop', handleDrop);

    return () => {
      element.removeEventListener('dragenter', handleDragEnter);
      element.removeEventListener('dragleave', handleDragLeave);
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return {
    isDragOver,
    bindDropZone,
  };
} 