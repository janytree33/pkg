import React, { useState } from 'react';
import Modal from '../common/Modal';
import usePackagingStore from '../../stores/packagingStore';
import { Search } from 'lucide-react';

export default function BomComponentSelector({ isOpen, onClose, onSelect, onOpenNewForm }) {
  const { packagingComponents } = usePackagingStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  if (!isOpen) return null;

  // 검색 필터링
  const filteredComponents = packagingComponents.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onSelect(selectedIds);
    setSelectedIds([]); // 초기화
  };

  const handleClose = () => {
    setSelectedIds([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="기존 포장재 목록에서 선택" size="2xl">
      <div className="flex flex-col h-[500px]">
        {/* 검색 및 새 포장재 등록 영역 */}
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="포장재 이름 또는 코드 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={() => {
              handleClose();
              onOpenNewForm();
            }}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg border border-emerald-200 hover:bg-emerald-100 whitespace-nowrap"
          >
            + 새 포장재 직접 등록
          </button>
        </div>

        {/* 목록 영역 */}
        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 w-12 text-center">선택</th>
                <th className="px-4 py-3">코드</th>
                <th className="px-4 py-3">부재료명</th>
                <th className="px-4 py-3">종류</th>
                <th className="px-4 py-3">재질</th>
                <th className="px-4 py-3 text-right">중량(g)</th>
              </tr>
            </thead>
            <tbody>
              {filteredComponents.length > 0 ? (
                filteredComponents.map((comp) => (
                  <tr 
                    key={comp.id} 
                    className="border-b hover:bg-brand-50 cursor-pointer transition-colors"
                    onClick={() => toggleSelect(comp.id)}
                  >
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(comp.id)}
                        onChange={() => toggleSelect(comp.id)}
                        className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{comp.code}</td>
                    <td className="px-4 py-3">{comp.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        comp.type === '충진부자재' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {comp.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">{comp.material}</td>
                    <td className="px-4 py-3 text-right">{Number(comp.weightPerUnit || comp.weight || 0).toFixed(4)}g</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    등록된 포장재가 없거나 검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <div className="text-sm text-gray-600">
            총 <span className="font-bold text-brand-600">{selectedIds.length}</span>개 선택됨
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-md hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              선택한 포장재 추가
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
