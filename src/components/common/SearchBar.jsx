import React from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = '검색어를 입력하세요...' }) {
  return (
    <div className="relative flex items-center w-full">
      <div className="absolute left-3 text-slate-400  pointer-events-none">
        <Search size={18} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-4 text-sm bg-white  border border-slate-200  rounded-full text-slate-800  placeholder-slate-400  focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 transition-shadow"
      />
    </div>
  );
}
