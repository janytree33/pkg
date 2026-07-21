import React from 'react';
import { Moon, Sun } from 'lucide-react';
import useSettingsStore from '../../stores/settingsStore';

export default function Header({ title }) {
  

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-brand-400 shadow-sm border-b border-brand-300  transition-colors z-10 shrink-0 shadow-md">
      {/* 좌측: 현재 페이지 타이틀 */}
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-white">
          {title || '패키징 관리'}
        </h1>
      </div>
      
      {/* 우측: 실제 기능 (다크모드 토글) */}
      <div className="flex items-center space-x-3">
        {/* 다크모드 토글 버튼 */}
        
      </div>
    </header>
  );
}
