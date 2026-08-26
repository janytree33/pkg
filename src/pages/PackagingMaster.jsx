import React, { useState, useMemo, useRef } from 'react';
import { Plus, Search, Package, Edit, Trash2, Upload, Download, ArrowUpDown, ArrowUp, ArrowDown, Layers, Link, Unlink, Copy } from 'lucide-react';
import usePackagingStore from '../stores/packagingStore';
import useEprEvaluationStore from '../stores/eprEvaluationStore';
import PackagingComponentForm from '../components/items/PackagingComponentForm';
import Modal from '../components/common/Modal';
import { MATERIAL_OPTIONS, CONTAINER_TYPE_MAP, DEFAULT_PART_TYPES } from '../utils/constants';
import { parseExcelFile, formatComponentsFromExcel, downloadComponentTemplateExcel } from '../utils/excelParser';

export default function PackagingMaster() {
  const { 
    packagingComponents, 
    addPackagingComponent, 
    updatePackagingComponent, 
    deletePackagingComponent,
    uploadComponentsFromExcel,
    groupPackagingComponents,
    ungroupPackagingComponents,
    duplicatePackagingComponent
  } = usePackagingStore();
  const eprEvaluations = useEprEvaluationStore(state => state.evaluations);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); 
  const [showOnlySubComponents, setShowOnlySubComponents] = useState(false); 
  
  // 🌟 기본 정렬 기준: 코드(code) 오름차순(asc)
  const [sortField, setSortField] = useState('code'); 
  const [sortOrder, setSortOrder] = useState('asc'); 
  
  const [selectedComponentIds, setSelectedComponentIds] = useState([]); // 다중 선택 상태 추가
  
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
    { name: '포장형태', required: false, desc: '용기, 캡, 단상자 등', example: '용기', important: false },
    { name: '용기형태', required: true, desc: 'EPR 신고 용기 코드 (0410, 0450 등)', example: '0410', important: true },
    { name: '재질', required: false, desc: 'PET, PP, PE, 유리 등', example: 'PET', important: false },
    { name: '개당중량(g)', required: false, desc: '부자재 단위 총 중량 (숫자만)', example: '12.5', important: false },
    { name: '비고', required: false, desc: '기타 특이사항', example: '투명 용기', important: false }
  ];

  // 1. 검색 및 유형/복합구성 필터링
  const filteredComponents = useMemo(() => {
    return packagingComponents.filter((comp) => {
      const matchesSearch = 
        comp.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        comp.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.regNo?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || comp.partType === filterType;
      const matchesSubComp = !showOnlySubComponents || (comp.subComponents && comp.subComponents.length > 0);
      
      return matchesSearch && matchesType && matchesSubComp;
    });
  }, [packagingComponents, searchTerm, filterType, showOnlySubComponents]);

  // 2. 컬럼별 클릭 정렬 처리 (기본: 코드 순)
  const sortedComponents = useMemo(() => {
    const field = sortField || 'code';
    const order = sortField ? sortOrder : 'asc';

    return [...filteredComponents].sort((a, b) => {
      let aVal = a[field] ?? '';
      let bVal = b[field] ?? '';

      if (field === 'weightPerUnit') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else if (field === 'material') {
        if (a.subComponents?.length > 0) aVal = a.subComponents.map(s => s.material).join(' ');
        if (b.subComponents?.length > 0) bVal = b.subComponents.map(s => s.material).join(' ');
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredComponents, sortField, sortOrder]);

  // 정렬 헤더 클릭 핸들러 (오름차순 -> 내림차순 -> 코드 오름차순으로 리셋)
  const handleSort = (field) => {
    if (sortField === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        // 정렬 해제 시 기본 '코드' 오름차순으로 복귀
        setSortField('code');
        setSortOrder('asc');
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={13} className="text-slate-300 opacity-60 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc'
      ? <ArrowUp size={13} className="text-emerald-600 font-bold" /> 
      : <ArrowDown size={13} className="text-emerald-600 font-bold" />;
  };

  const handleToggleSelectAll = () => {
    if (selectedComponentIds.length === sortedComponents.length) {
      setSelectedComponentIds([]);
    } else {
      setSelectedComponentIds(sortedComponents.map(c => c.id));
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedComponentIds.includes(id)) {
      setSelectedComponentIds(selectedComponentIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedComponentIds([...selectedComponentIds, id]);
    }
  };

  const handleGroupSelected = async () => {
    if (selectedComponentIds.length < 2) {
      alert('세트로 묶으려면 최소 2개 이상의 포장재를 선택해야 합니다.');
      return;
    }
    const setId = crypto.randomUUID();
    const success = await groupPackagingComponents(selectedComponentIds, setId);
    if (success) {
      setSelectedComponentIds([]);
      alert('선택된 포장재가 하나의 평가 세트로 묶였습니다.');
    }
  };

  const handleUngroupSelected = async () => {
    if (selectedComponentIds.length === 0) {
      alert('세트를 해제할 포장재를 선택해 주세요.');
      return;
    }
    const confirm = window.confirm(`선택한 ${selectedComponentIds.length}개 포장재의 평가 세트 그룹핑을 해제하시겠습니까?`);
    if (confirm) {
      const success = await ungroupPackagingComponents(selectedComponentIds);
      if (success) {
        setSelectedComponentIds([]);
        alert('평가 세트가 해제되었습니다.');
      }
    }
  };

  const handleOpenForm = (comp = null) => {
    setEditingComponent(comp);
    setIsFormOpen(true);
  };

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

  const handleDelete = (id, name) => {
    if (window.confirm(`'${name}' 포장재를 삭제하시겠습니까? (이미 BOM에 사용된 경우 문제가 발생할 수 있습니다)`)) {
      deletePackagingComponent(id);
    }
  };

  const handleDuplicate = async (id, name) => {
    if (window.confirm(`'${name}' 포장재를 복제하시겠습니까? (EPR 세트 지정은 해제된 상태로 복사됩니다)`)) {
      const newComp = await duplicatePackagingComponent(id);
      if (newComp) {
        alert("성공적으로 복제되었습니다.");
      }
    }
  };

  const getContainerLabel = (code) => {
    return CONTAINER_TYPE_MAP.find(c => c.code === code)?.label || code || '-';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">포장재 마스터 관리</h1>
          <p className="text-sm text-slate-500 mt-1">제품 BOM에 사용할 부자재를 사전에 등록하고 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsGuideModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-600 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors shadow-sm"
          >
            <Upload size={16} /> 엑셀 일괄 업로드
          </button>
          
          {selectedComponentIds.length > 0 && (
            <>
              <button
                onClick={handleUngroupSelected}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                title="선택된 자재들의 세트 그룹핑을 해제합니다"
              >
                <Unlink size={16} /> 세트 해제 ({selectedComponentIds.length})
              </button>
              <button
                onClick={handleGroupSelected}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-300 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm"
                title="선택된 자재들을 하나의 평가 세트로 묶습니다"
              >
                <Link size={16} /> 선택 자재를 세트로 묶기 ({selectedComponentIds.length})
              </button>
            </>
          )}

          <button
            onClick={() => handleOpenForm(null)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:shadow-md"
            style={{ background: 'linear-gradient(90deg,#10b981,#06b6d4)' }}
          >
            <Plus size={16} /> 새 포장재 등록
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 items-center justify-between">
        <div className="flex gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
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
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 cursor-pointer"
            >
              <option value="all">전체 포장형태</option>
              {DEFAULT_PART_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowOnlySubComponents(!showOnlySubComponents)}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border transition-all shadow-sm ${
            showOnlySubComponents
              ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-100'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers size={15} />
          <span>복합구성만 보기</span>
          {showOnlySubComponents && <span className="ml-1 text-xs bg-white text-emerald-700 px-1.5 py-0.2 rounded-full font-bold">ON</span>}
        </button>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 select-none">
              <tr>
                <th className="px-4 py-3 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                    checked={sortedComponents.length > 0 && selectedComponentIds.length === sortedComponents.length}
                    onChange={handleToggleSelectAll}
                  />
                </th>
                <th 
                  onClick={() => handleSort('regNo')}
                  className="px-4 py-3 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>등록번호</span>
                    {renderSortIcon('regNo')}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('code')}
                  className="px-4 py-3 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>코드</span>
                    {renderSortIcon('code')}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('name')}
                  className="px-4 py-3 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>부재료명</span>
                    {renderSortIcon('name')}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('partType')}
                  className="px-4 py-3 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>포장형태</span>
                    {renderSortIcon('partType')}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('material')}
                  className="px-4 py-3 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>재질</span>
                    {renderSortIcon('material')}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('weightPerUnit')}
                  className="px-4 py-3 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>개당 중량(g)</span>
                    {renderSortIcon('weightPerUnit')}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('containerType')}
                  className="px-4 py-3 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>용기형태 (EPR)</span>
                    {renderSortIcon('containerType')}
                  </div>
                </th>

                <th className="px-4 py-3 font-semibold text-slate-600 text-center">성적서</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>EPR 평가결과 연동</span>
                  </div>
                </th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-center">관리</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {sortedComponents.length > 0 ? (
                sortedComponents.map((comp) => (
                  <tr key={comp.id} className={`hover:bg-slate-50 transition-colors ${selectedComponentIds.includes(comp.id) ? 'bg-emerald-50/50' : ''}`}>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                        checked={selectedComponentIds.includes(comp.id)}
                        onChange={() => handleToggleSelect(comp.id)}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs align-top">
                      <div className="flex items-center gap-1">
                        {comp.eprSetId && <Link size={12} className="text-indigo-500" title="평가 세트로 묶인 자재입니다" />}
                        {comp.regNo || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-emerald-700 font-medium font-mono text-xs align-top">{comp.code}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-slate-800">{comp.name}</div>
                      {comp.spec && <div className="text-[11px] text-slate-400 mt-0.5">{comp.spec}</div>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                        {comp.partType || '-'}
                      </span>
                    </td>
                    
                    <td className="px-4 py-3 text-slate-600 align-top">
                      {comp.subComponents && comp.subComponents.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {comp.subComponents.map((sub, idx) => (
                            <div key={idx} className="text-xs whitespace-nowrap">
                              <span className="font-medium text-slate-800">
                                {sub.name ? `${sub.name}: ` : ''}{sub.material || '-'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span>{comp.material || '-'}</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-700 font-medium align-top">
                      {Number(comp.weightPerUnit || 0).toFixed(2)}g
                      {comp.subComponents?.length > 0 && (
                        <span className="ml-1 text-[10px] text-emerald-600 font-normal">({comp.subComponents.length}개 부품)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs truncate max-w-[150px] align-top" title={getContainerLabel(comp.containerType)}>
                      {getContainerLabel(comp.containerType)}
                    </td>
                    <td className="px-4 py-3 text-center align-top">
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
                    <td className="px-4 py-3 text-center align-top">
                      {(() => {
                        const linkedEval = eprEvaluations.find(e => (e.componentIds || []).includes(comp.id));
                        
                        if (linkedEval) {
                          const grade = linkedEval.evalGrade;
                          const badgeClass = grade.includes('어려움') ? 'bg-red-50 text-red-700 border-red-200' :
                                            grade.includes('우수') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            grade === '대상제외' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                            'bg-blue-50 text-blue-700 border-blue-200';
                          return (
                            <div className="flex flex-col items-center gap-1">
                              <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeClass}`}>
                                {grade}
                              </span>
                              <span className="text-[10px] text-indigo-500 font-mono flex items-center gap-0.5">
                                <Link size={10} /> {linkedEval.certNo}
                              </span>
                            </div>
                          );
                        } else {
                          return <span className="text-[11px] text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">미연결</span>;
                        }
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center align-top">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleDuplicate(comp.id, comp.name)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="복제 (Clone)"
                        >
                          <Copy size={16} />
                        </button>
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
                  <td colSpan="11" className="px-4 py-16 text-center text-slate-400">
                    <Package size={32} className="mx-auto mb-3 opacity-30" />
                    등록된 포장재가 없거나 검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="bg-slate-50 border-t border-slate-200 p-3 text-xs text-slate-500 flex justify-between">
          <span>총 <strong>{sortedComponents.length}</strong>건의 포장재 마스터</span>
          <span>부자재 목록을 체계적으로 관리하세요.</span>
        </div>
      </div>
      
      <PackagingComponentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveComponent}
        editData={editingComponent}
      />
      
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