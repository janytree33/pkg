/**
 * Header.jsx
 * ─────────────────────────────────────
 * 상단 헤더 컴포넌트
 * janytree.com 사이트 스타일 참고: 흰 배경 + 좌측 로고 + 우측 페이지 정보
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { SIDEBAR_MENUS } from '../../utils/constants';

export default function Header() {
  // 현재 경로에 해당하는 메뉴 정보 가져오기
  const location = useLocation();
  const currentMenu = SIDEBAR_MENUS.find((m) => m.path === location.pathname);
  const pageTitle = currentMenu?.label || 'PKG Portal';

  // 오늘 날짜 표시
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <header
      className="flex items-center justify-between h-14 px-5 bg-white border-b border-slate-100 z-10 shrink-0"
      style={{ boxShadow: '0 1px 8px 0 rgba(16,185,129,0.06)' }}
    >
      {/* 좌측: JT 로고 */}
      <div className="flex items-center gap-3 flex-1">
        <img
          src="/JT_Logo_Horizontal_copy.svg"
          alt="Janytree Logo"
          className="h-7 object-contain"
          style={{ maxWidth: '160px' }}
        />
        {/* 구분선 */}
        <div className="w-px h-5 bg-slate-200 mx-1" />
        {/* 현재 페이지명 */}
        <span className="text-sm font-medium text-slate-500">{pageTitle}</span>
      </div>

      {/* 중앙: 앱 공식 타이틀 */}
      <div className="hidden lg:flex items-center justify-center flex-1">
        <div className="text-sm font-bold text-slate-700 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 whitespace-nowrap shadow-sm">
          Janytree PKG Portal <span className="font-normal text-slate-500 ml-1">(화장품 패키징 및 생산자책임재활용제도(EPR) 실적신고 자동화 시스템)</span>
        </div>
      </div>

      {/* 우측: 날짜 */}
      <div className="flex items-center justify-end gap-3 flex-1">
        <span className="text-xs text-slate-400 hidden sm:block">{today}</span>
        {/* 작은 브랜드 뱃지 */}
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
          style={{ background: 'linear-gradient(90deg, #10b981, #06b6d4)' }}
        >
          PKG Portal
        </span>
      </div>
    </header>
  );
}
