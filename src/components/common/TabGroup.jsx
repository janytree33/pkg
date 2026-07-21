import React from 'react';

export default function TabGroup({ tabs = [], activeTab, onTabChange }) {
  return (
    <div className="flex border-b border-slate-200 dark:border-slate-700 w-full overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center px-4 py-3 text-sm font-medium transition-all whitespace-nowrap
              ${isActive 
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 border-b-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
              }
            `}
          >
            {tab.icon && (
              <span className="mr-2 shrink-0">
                {tab.icon}
              </span>
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
