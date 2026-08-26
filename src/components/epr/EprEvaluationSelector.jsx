import React, { useState } from 'react';
import useEprEvaluationStore from '../../stores/eprEvaluationStore';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import { Search, FileText } from 'lucide-react';

export default function EprEvaluationSelector({ isOpen, onClose, onSelect }) {
  const evaluations = useEprEvaluationStore((state) => state.evaluations);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = evaluations.filter((e) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (e.certNo && e.certNo.toLowerCase().includes(q)) ||
      (e.evalName && e.evalName.toLowerCase().includes(q))
    );
  });

  const columns = [
    { label: '평가결과서 번호', render: (_, row) => row.certNo },
    { label: '평가 대표명', render: (_, row) => row.evalName },
    {
      label: '최종 평가등급',
      render: (_, row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
          row.evalGrade.includes('어려움') ? 'bg-red-50 text-red-600 border-red-200' :
          row.evalGrade.includes('우수') ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
          row.evalGrade === '미평가' ? 'bg-slate-50 text-slate-500 border-slate-200' :
          'bg-blue-50 text-blue-600 border-blue-200'
        }`}>
          {row.evalGrade}
        </span>
      )
    },
    {
      label: '등록일자',
      render: (_, row) => new Date(row.createdAt).toLocaleDateString()
    },
    {
      label: '선택',
      render: (_, row) => (
        <button
          onClick={() => onSelect(row)}
          className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors shadow-sm"
        >
          연결
        </button>
      )
    }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="EPR 평가결과서 선택 (BOM 연동)" size="lg">
      <div className="flex flex-col h-[60vh]">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="결과서 번호 또는 대표명 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden border border-slate-200 rounded-xl shadow-sm bg-white">
          <DataTable
            columns={columns}
            data={filtered}
            emptyMessage={searchTerm ? '검색 결과가 없습니다.' : '등록된 EPR 평가결과서가 없습니다.'}
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => onSelect(null)}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors mr-2"
          >
            연결 해제 (초기화)
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </Modal>
  );
}
