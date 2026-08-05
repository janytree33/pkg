/**
 * Sidebar.jsx
 * ─────────────────────────────────────
 * 좌측 사이드바
 * janytree.com 스타일: 흰색 배경 + 민트/틸 포인트 컬러
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { SIDEBAR_MENUS } from '../../utils/constants';

// 아이콘 매핑
const iconMap = {
  LayoutDashboard,
  Package,
  FileText,
  BarChart3,
  Settings
};

export default function Sidebar({ collapsed, onToggle, isOpenMobile }) {
  return (
    <aside
      // 모바일: 화면 위에 띄우고(fixed) 스위치에 따라 넣고 뺌(translate-x)
      // PC(lg): 항상 화면에 배치(relative)하고 넓이(width)만 조절
      className={`
        fixed inset-y-0 left-0 z-30 lg:relative lg:translate-x-0 
        transform transition-all duration-300 ease-in-out overflow-hidden
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col min-h-full bg-white border-r border-slate-100 flex-shrink-0 
        ${collapsed ? 'w-[64px]' : 'w-56'}
      `}
      style={{ boxShadow: '1px 0 8px 0 rgba(16,185,129,0.05)' }}
    >
      {/* 상단 로고 영역 */}
      <div
        className="flex items-center justify-center h-14 border-b border-slate-100 px-3 shrink-0 transition-all duration-300"
        style={{ background: 'linear-gradient(135deg, #f0fdf9 0%, #ecfdf5 100%)' }}
      >
        {!collapsed ? (
          <img
            src="/JT_Logo_Horizontal_copy.svg"
            alt="Janytree"
            className="h-6 object-contain whitespace-nowrap"
            style={{ maxWidth: '130px' }}
          />
        ) : (
          /* 축소 시 JT 이니셜 뱃지 */
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
          >
            JT
          </div>
        )}
      </div>

      {/* 메뉴 리스트 */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
        <ul className="space-y-0.5">
          {SIDEBAR_MENUS?.map((menu) => {
            const Icon = iconMap[menu.icon] || Package;
            return (
              <li key={menu.id}>
                <NavLink
                  to={menu.path}
                  title={collapsed ? menu.label : ''}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative text-sm ${
                      isActive
                        ? 'text-emerald-700 font-semibold'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    } ${collapsed ? 'justify-center px-0' : ''}`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? { background: 'linear-gradient(90deg, #d1fae5 0%, #cffafe 100%)' }
                      : {}
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={17}
                        className={`shrink-0 transition-colors ${
                          isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500'
                        }`}
                      />
                      {!collapsed && (
                        <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                          {menu.label}
                        </span>
                      )}
                      {/* 활성 표시 우측 도트 */}
                      {isActive && !collapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 하단 접기 버튼: 모바일에서는 불필요하므로 숨김(hidden lg:flex) */}
      <div className="hidden lg:flex p-3 border-t border-slate-100 justify-center shrink-0">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>
    </aside>
  );
}