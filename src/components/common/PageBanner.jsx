import React from 'react';

export default function PageBanner({ title, description }) {
  return (
    <div className="bg-brand-50/50  border border-blue-100  rounded-lg p-5 mb-6 shadow-sm relative overflow-hidden">
      {/* 좌측 브랜드 포인트 라인 */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-500" />
      
      <div className="pl-2">
        <h1 className="text-2xl font-bold text-slate-800  tracking-tight mb-1">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
