import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function SplitWorkspace({ leftPanel, rightPanel, defaultLeftWidth = 320 }) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const minWidth = 240;
  const maxWidth = 480;

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    
    // 컨테이너 내 마우스 위치 계산
    const containerRect = containerRef.current.getBoundingClientRect();
    let newWidth = e.clientX - containerRect.left;

    // 최소/최대 너비 제한
    if (newWidth < minWidth) newWidth = minWidth;
    if (newWidth > maxWidth) newWidth = maxWidth;

    setLeftWidth(newWidth);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // 드래그 중 텍스트 선택 방지
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={containerRef}
      className="flex flex-1 overflow-hidden w-full h-full"
    >
      {/* 좌측 패널 */}
      <div 
        style={{ width: `${leftWidth}px` }} 
        className="shrink-0 flex flex-col h-full bg-brand-50/50 border-brand-100  border-r border-slate-200  transition-colors"
      >
        {leftPanel}
      </div>

      {/* 리사이저 (구분선) */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-1 cursor-col-resize hover:bg-blue-400 dark:hover:bg-brand-400 text-white shadow-sm transition-colors z-10 ${isDragging ? 'bg-brand-400 text-white shadow-sm' : 'bg-transparent'}`}
        title="드래그하여 크기 조절"
      />

      {/* 우측 패널 */}
      <div className="flex-1 flex flex-col h-full bg-white  min-w-0 transition-colors overflow-hidden">
        {rightPanel}
      </div>
    </div>
  );
}
