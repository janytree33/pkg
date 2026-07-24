import React, { useState, useMemo, useRef } from 'react';
import { Plus, Search, Filter, Package, Edit, Trash2, Upload, Download } from 'lucide-react';
import usePackagingStore from '../stores/packagingStore';
import PackagingComponentForm from '../components/items/PackagingComponentForm';
import Modal from '../components/common/Modal';
import { MATERIAL_OPTIONS, CONTAINER_TYPE_MAP } from '../utils/constants';
import { parseExcelFile, formatComponentsFromExcel, downloadComponentTemplateExcel } from '../utils/excelParser';
export default function PackagingMaster() {
  const { 
    packagingComponents, 
    addPackagingComponent, 
    updatePackagingComponent, 
    deletePackagingComponent,
    uploadComponentsFromExcel
  } = usePackagingStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, 충진부자재, 포장부자재

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);

  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);
      const components = formatComponentsFromExcel(data);
      uploadComponentsFromExcel(components);
      setIsGuideModalOpen(false);
      alert(`${components.length}건의 포장재가 일괄 등록되었습니다.`);
    } catch (error) {
      console.error(error);
      alert('엑셀 파일 업로드 중 오류가 발생했습니다.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleProceedToUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const PACKAGING_EXCEL_COLUMNS = [
    { name: '등록번호', required: false, desc: '고유 식별번호 (자동발급 대체가능)', example: 'S000001154', important: false },
    { name: '부재료코드', required: true, desc: '내부 관리 부재료 코드', example: 'PKG-001', important: true },
    { name: '부재료명', required: true, desc: '포장재명 (또는 부재료명)', example: '제니트리 수분크림 용기', important: true },
    { name: '규격', required: false, desc: '사이즈 및 용량 규격', example: '100ml / 파이30', important: false },
    { name: '종류(구분)', required: false, desc: '충진부자재 / 포장부자재', example: '포장부자재', important: false },
    { name: '구분(1차/2차)', required: false, desc: '1차 / 2차 등 포장 계층', example: '1차', important: false },
    { name: '용기형태', required: false, desc: 'EPR 신고 용기 코드 (0410, 0450 등)', example: '0410', important: false },
    { name: '재질', required: false, desc: 'PET, PP, PE, 유리 등', example: 'PET', important: false },
    { name: '개당중량(g)', required: false, desc: '부자재 단위 중량 (숫자만)', example: '12.5', important: false },
    { name: '비고', required: false, desc: '기타 특이사항', example: '투명 용기', important: false }
  ];

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
  const handleSaveComponent = async (formData) => {
    let result = null;
    if (editingComponent) {
      result = await updatePackagingComponent(editingComponent.id, formData);
    } else {
      result = await addPackagingComponent({
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      });
    }

    if (result) {
      setIsFormOpen(false);
    } else {
      alert("포장재 저장에 실패했습니다. (콘솔 로그를 확인하세요)");
    }
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
        <div className="flex gap-2">
          <button
            onClick={() => setIsGuideModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-600 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors shadow-sm"
          >
            <Upload size={16} /> 엑셀 일괄 업로드
          </button>
          <button
            onClick={() => handleOpenForm(null)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:shadow-md"
            style={{ background: 'linear-gradient(90deg,#10b981,#06b6d4)' }}
          >
            <Plus size={16} /> 새 포장재 등록
          </button>
        </div>
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
                <th className="px-4 py-3 font-semibold text-slate-600 text-center">성적서</th>
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
                      {(() => {
                        let fileCount = 0;
                        try {
                          if (comp.specFile) {
                            const parsed = JSON.parse(comp.specFile);
                            if (Array.isArray(parsed)) fileCount = parsed.length;
                          }
                        } catch (e) {
                          if (comp.specFile) fileCount = 1;
                        }
                        
                        if (fileCount > 0) {
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200 rounded-full">
                              📎 {fileCount}개
                            </span>
                          );
                        }
                        return <span className="text-[10px] text-slate-300">없음</span>;
                      })()}
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
                  <td colSpan="9" className="px-4 py-16 text-center text-slate-400">
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

      {/* ─── 엑셀 업로드 가이드 모달 ─── */}
      <Modal isOpen={isGuideModalOpen} onClose={() => setIsGuideModalOpen(false)} title="📋 포장재 엑셀 업로드 - 열 이름 안내" size="2xl">
        <div className="space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
            엑셀 파일의 <strong>첫 번째 행(1행)</strong>을 아래 열 이름으로 작성해야 정상적으로 업로드됩니다.<br />
            양식을 직접 만들기 어려우시면 <strong>「양식 다운로드」</strong> 버튼으로 샘플 파일을 받으세요.
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col style={{ width: '130px' }} />
                <col style={{ width: '70px' }} />
                <col />
                <col style={{ width: '150px' }} />
              </colgroup>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">열 이름 (1행에 입력)</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 whitespace-nowrap">필수여부</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">설명</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">예시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PACKAGING_EXCEL_COLUMNS.map((col, i) => (
                  <tr key={i} className={col.important ? 'bg-amber-50' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <code className="text-sm font-mono font-bold text-slate-800">{col.name}</code>
                      {col.important && <span className="ml-1 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full whitespace-nowrap">⭐ 중요</span>}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {col.required
                        ? <span className="text-[11px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">필수</span>
                        : <span className="text-[11px] text-slate-400 whitespace-nowrap">선택</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{col.desc}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono whitespace-nowrap">{col.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <button
              onClick={downloadComponentTemplateExcel}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Download size={14} /> 샘플 양식 다운로드
            </button>
            <div className="flex gap-2">
              <button onClick={() => setIsGuideModalOpen(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">취소</button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleExcelUpload} 
                accept=".xlsx, .xls" 
                className="hidden" 
              />
              <button
                onClick={handleProceedToUpload}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:shadow-md"
                style={{ background: 'linear-gradient(90deg,#10b981,#06b6d4)' }}
              >
                <Upload size={14} /> 파일 선택 후 업로드
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
