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

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside 
      className={`relative flex flex-col min-h-full bg-white  border-r border-slate-200  transition-all duration-300 ease-in-out z-20 flex-shrink-0 ${collapsed ? 'w-[72px]' : 'w-64'}`}
    >
      {/* 로고 영역 */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-slate-100 dark:border-slate-800">
        {!collapsed && (
          <div className="flex items-center justify-start overflow-hidden w-full h-full pt-2">
            <img src="/logo_new.png" alt="Logo" className="h-10 object-contain" />
          </div>
        )}
        {collapsed && (
          <div className="w-full flex justify-center pt-2">
            <img src="/logo_new.png" alt="Logo" className="h-8 object-contain" />
          </div>
        )}
      </div>

      {/* 메뉴 리스트 */}
      <nav className="flex-1 overflow-y-auto py-6 scrollbar-hide">
        <ul className="space-y-1">
          {SIDEBAR_MENUS?.map((menu) => {
            const Icon = iconMap[menu.icon] || Package;
            return (
              <li key={menu.id}>
                <NavLink
                  to={menu.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 transition-colors group relative ${
                      isActive 
                        ? 'bg-brand-50/80  text-brand-700  font-semibold' 
                        : 'text-slate-600  hover:bg-white dark:hover:bg-slate-800/50 hover:text-gray-800 dark:hover:text-slate-200'
                    } ${collapsed ? 'justify-center px-0' : ''}`
                  }
                  title={collapsed ? menu.label : ''}
                >
                  {({ isActive }) => (
                    <>
                      {/* 활성 탭 좌측 보더 하이라이트 */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-600  rounded-r" />
                      )}
                      
                      <Icon size={18} className={`shrink-0 ${collapsed ? '' : 'mr-3'} ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      {!collapsed && (
                        <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                          {menu.label}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 접힘/펼침 토글 버튼 (하단) */}
      <div className="p-4 border-t border-slate-100  flex justify-center">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-8 h-8 bg-white  border border-slate-200  text-slate-500 rounded-full hover:text-brand-600 hover:border-brand-300 transition-colors focus:outline-none"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
