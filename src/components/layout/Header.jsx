import React from 'react';
import { Moon, Sun } from 'lucide-react';
import useSettingsStore from '../../stores/settingsStore';

export default function Header({ title }) {
  const { theme, toggleTheme } = useSettingsStore();
  const isDark = theme === 'dark';

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-[#2d3748] dark:bg-slate-950 transition-colors z-10 shrink-0 shadow-md">
      {/* 좌측: 현재 페이지 타이틀 */}
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-white">
          {title || '패키징 관리'}
        </h1>
      </div>
      
      {/* 우측: 실제 기능 (다크모드 토글) */}
      <div className="flex items-center space-x-3">
        {/* 다크모드 토글 버튼 */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white bg-slate-800 rounded-full transition-colors focus:outline-none shadow-sm"
          title="테마 변경"
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  );
}
