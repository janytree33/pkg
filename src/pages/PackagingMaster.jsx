import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Package, Edit, Trash2 } from 'lucide-react';
import usePackagingStore from '../stores/packagingStore';
import PackagingComponentForm from '../components/items/PackagingComponentForm';
import { MATERIAL_OPTIONS, CONTAINER_TYPE_MAP } from '../utils/constants';

export default function PackagingMaster() {
  const { 
    packagingComponents, 
    addPackagingComponent, 
    updatePackagingComponent, 
    deletePackagingComponent 
  } = usePackagingStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, 충진부자재, 포장부자재

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);

  // ─── 데이터 필터링 ───
  const filteredComponents = useMemo(() => {
    return packagingComponents.filter((comp) => {
      const matchesSearch = 
        comp.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        comp.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.regNo?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || comp.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [packagingComponents, searchTerm, filterType]);

  // ─── 폼 오픈 핸들러 ───
  const handleOpenForm = (comp = null) => {
    setEditingComponent(comp);
    setIsFormOpen(true);
  };

  // ─── 폼 저장 핸들러 ───
  const handleSaveComponent = (formData) => {
    if (editingComponent) {
      updatePackagingComponent(editingComponent.id, formData);
    } else {
      addPackagingComponent({
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      });
    }
    setIsFormOpen(false);
  };

  // ─── 삭제 핸들러 ───
  const handleDelete = (id, name) => {
    if (window.confirm(`'${name}' 포장재를 삭제하시겠습니까? (이미 BOM에 사용된 경우 문제가 발생할 수 있습니다)`)) {
      deletePackagingComponent(id);
    }
  };

  // 컨테이너 타입 라벨 찾기
  const getContainerLabel = (code) => {
    return CONTAINER_TYPE_MAP.find(c => c.code === code)?.label || code || '-';
  };

  return (
    <div className="h-full flex flex-col">
      {/* ─── 페이지 헤더 ─── */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">포장재 마스터 관리</h1>
          <p className="text-sm text-slate-500 mt-1">제품 BOM에 사용할 부자재(충진/포장재)를 사전에 등록하고 관리합니다.</p>
        </div>
        <button
          onClick={() => handleOpenForm(null)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:shadow-md"
          style={{ background: 'linear-gradient(90deg,#10b981,#06b6d4)' }}
        >
          <Plus size={16} /> 새 포장재 등록
        </button>
      </div>

      {/* ─── 툴바 (검색 및 필터) ─── */}
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="부자재명, 코드, 등록번호 검색..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>
        <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden text-sm">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 font-medium transition-colors ${filterType === 'all' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            전체
          </button>
          <div className="w-px bg-slate-200"></div>
          <button
            onClick={() => setFilterType('충진부자재')}
            className={`px-4 py-2 font-medium transition-colors ${filterType === '충진부자재' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            충진부자재
          </button>
          <div className="w-px bg-slate-200"></div>
          <button
            onClick={() => setFilterType('포장부자재')}
            className={`px-4 py-2 font-medium transition-colors ${filterType === '포장부자재' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            포장부자재
          </button>
        </div>
      </div>

      {/* ─── 데이터 테이블 ─── */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">등록번호</th>
                <th className="px-4 py-3 font-semibold text-slate-600">코드</th>
                <th className="px-4 py-3 font-semibold text-slate-600">부재료명</th>
                <th className="px-4 py-3 font-semibold text-slate-600">유형 (구분)</th>
                <th className="px-4 py-3 font-semibold text-slate-600">재질</th>
                <th className="px-4 py-3 font-semibold text-slate-600">개당 중량(g)</th>
                <th className="px-4 py-3 font-semibold text-slate-600">용기형태 (EPR)</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComponents.length > 0 ? (
                filteredComponents.map((comp) => (
                  <tr key={comp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{comp.regNo || '-'}</td>
                    <td className="px-4 py-3 text-emerald-700 font-medium font-mono text-xs">{comp.code}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{comp.name}</div>
                      {comp.spec && <div className="text-[11px] text-slate-400 mt-0.5">{comp.spec}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${comp.type === '충진부자재' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                        {comp.type} {comp.category && `(${comp.category})`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{comp.material || '-'}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{comp.weightPerUnit?.toFixed(4) || 0}g</td>
                    <td className="px-4 py-3 text-slate-600 text-xs truncate max-w-[150px]" title={getContainerLabel(comp.containerType)}>
                      {getContainerLabel(comp.containerType)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenForm(comp)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="수정"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(comp.id, comp.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-4 py-16 text-center text-slate-400">
                    <Package size={32} className="mx-auto mb-3 opacity-30" />
                    등록된 포장재가 없거나 검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* 하단 요약 바 */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 text-xs text-slate-500 flex justify-between">
          <span>총 <strong>{filteredComponents.length}</strong>건의 포장재 마스터</span>
          <span>부자재 목록을 체계적으로 관리하세요.</span>
        </div>
      </div>

      {/* ─── 등록/수정 모달 ─── */}
      <PackagingComponentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveComponent}
        editData={editingComponent}
      />
    </div>
  );
}
