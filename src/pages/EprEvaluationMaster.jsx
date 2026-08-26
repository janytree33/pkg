import React, { useState } from 'react';
import useEprEvaluationStore from '../stores/eprEvaluationStore';
import usePackagingStore from '../stores/packagingStore';
import PageBanner from '../components/common/PageBanner';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import DynamicKecoEvaluator from '../components/items/DynamicKecoEvaluator';
import FileUpload from '../components/common/FileUpload';
import { Plus, Edit2, Trash2, Search, PackageOpen, Link, Loader2, Link2, Upload as UploadIcon, FileText, X, CheckCircle, ClipboardCheck } from 'lucide-react';
import { uploadFileToStorage } from '../utils/storageUpload';

export default function EprEvaluationMaster() {
  const { evaluations, addEvaluation, updateEvaluation, deleteEvaluation } = useEprEvaluationStore();
  const packagingComponents = usePackagingStore((state) => state.packagingComponents);
  const finishedProducts = usePackagingStore((state) => state.finishedProducts);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    id: null,
    certNo: '',
    evalName: '',
    evalGrade: '미평가',
    resultPdfUrl: '',
    componentIds: [],
    representativeImageUrl: '',
    vendorDocs: [],
    kecoTypeCode: '',
    kecoEvaluationData: { body: null, label: null, cap: null }
  });
  
  const [componentSearchTerm, setComponentSearchTerm] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isUploadingVendor, setIsUploadingVendor] = useState(false);
  const [inputModes, setInputModes] = useState({
    image: 'upload',
    pdf: 'upload',
    vendor: 'upload'
  });

  const filteredEvaluations = evaluations.filter(e => 
    (e.certNo || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (e.evalName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openNewModal = () => {
    setFormData({
      id: null,
      certNo: '',
      evalName: '',
      evalGrade: '미평가',
      resultPdfUrl: '',
      componentIds: [],
      representativeImageUrl: '',
      vendorDocs: [],
      kecoTypeCode: '',
      kecoEvaluationData: { body: null, label: null, cap: null }
    });
    setComponentSearchTerm('');
    setIsEditMode(false);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const openViewModal = (evalRecord) => {
    setFormData({
      id: evalRecord.id,
      certNo: evalRecord.certNo || '',
      evalName: evalRecord.evalName || '',
      evalGrade: evalRecord.evalGrade || '미평가',
      resultPdfUrl: evalRecord.resultPdfUrl || '',
      componentIds: evalRecord.componentIds || [],
      representativeImageUrl: evalRecord.representativeImageUrl || '',
      vendorDocs: evalRecord.vendorDocs || [],
      kecoTypeCode: evalRecord.kecoEvaluationData?.kecoTypeCode || '',
      kecoEvaluationData: evalRecord.kecoEvaluationData || { body: null, label: null, cap: null }
    });
    setIsViewMode(true);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (evalRecord) => {
    setFormData({
      id: evalRecord.id,
      certNo: evalRecord.certNo || '',
      evalName: evalRecord.evalName || '',
      evalGrade: evalRecord.evalGrade || '미평가',
      resultPdfUrl: evalRecord.resultPdfUrl || '',
      componentIds: evalRecord.componentIds || [],
      representativeImageUrl: evalRecord.representativeImageUrl || '',
      vendorDocs: evalRecord.vendorDocs || [],
      kecoTypeCode: evalRecord.kecoEvaluationData?.kecoTypeCode || '',
      kecoEvaluationData: evalRecord.kecoEvaluationData || { body: null, label: null, cap: null }
    });
    setComponentSearchTerm('');
    setIsEditMode(true);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.certNo || !formData.evalName) {
      alert('평가결과서 번호와 대표명을 입력해주세요.');
      return;
    }

    const payload = {
      ...formData,
      kecoEvaluationData: {
        ...formData.kecoEvaluationData,
        kecoTypeCode: formData.kecoTypeCode
      }
    };

    if (isEditMode) {
      await updateEvaluation(formData.id, payload);
    } else {
      await addEvaluation(payload);
    }
    setIsModalOpen(false);
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    try {
      if (Array.isArray(file)) {
        // Multi-file upload
        if (type === 'vendor') setIsUploadingVendor(true);
        const docs = await Promise.all(file.map(async f => {
          const url = await uploadFileToStorage(f, 'epr_documents');
          return { name: f.name, url, type: '기타 증빙' };
        }));
        if (type === 'vendor') setFormData(prev => ({ ...prev, vendorDocs: [...prev.vendorDocs, ...docs] }));
        alert(`${docs.length}개 파일 업로드 완료되었습니다.`);
      } else {
        // Single file upload
        if (type === 'image') setIsUploadingImage(true);
        if (type === 'pdf') setIsUploadingPdf(true);
        if (type === 'vendor') setIsUploadingVendor(true);

        const url = await uploadFileToStorage(file, 'epr_documents');

        if (type === 'image') setFormData(prev => ({ ...prev, representativeImageUrl: url }));
        if (type === 'pdf') setFormData(prev => ({ ...prev, resultPdfUrl: url }));
        if (type === 'vendor') setFormData(prev => ({ ...prev, vendorDocs: [...prev.vendorDocs, url] }));
        
        alert('업로드 완료되었습니다.');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsUploadingImage(false);
      setIsUploadingPdf(false);
      setIsUploadingVendor(false);
    }
  };

  const toggleInputMode = (type) => {
    setInputModes(prev => ({
      ...prev,
      [type]: prev[type] === 'upload' ? 'url' : 'upload'
    }));
  };

  const handleDelete = async (id) => {
    if (window.confirm('정말 삭제하시겠습니까? 연동된 BOM에서도 해당 정보가 해제될 수 있습니다.')) {
      await deleteEvaluation(id);
    }
  };

  const columns = [
    { 
      label: '평가결과서 번호', 
      render: (_, row) => (
        <button 
          onClick={() => openViewModal(row)}
          className="font-mono text-sm font-semibold text-emerald-600 hover:text-emerald-800 hover:underline transition-colors text-left"
        >
          {row.certNo}
        </button>
      )
    },
    { label: '평가 대표명', render: (_, row) => row.evalName },
    { 
      label: '최종 등급', 
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
    { label: '매핑된 부자재', render: (_, row) => `${(row.componentIds || []).length}건` },
    { label: '등록일자', render: (_, row) => new Date(row.createdAt).toLocaleDateString() },
    { 
      label: '관리', 
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEditModal(row)} className="text-blue-500 hover:text-blue-700">
            <Edit2 size={16} />
          </button>
          <button onClick={() => handleDelete(row.id)} className="text-red-400 hover:text-red-600">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-20">
      <PageBanner
        title="EPR 재질·구조 평가 관리"
        description="환경공단에서 발급받은 재질·구조 평가결과서 정보를 관리합니다."
        icon={PackageOpen}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="평가번호 또는 대표명 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Plus size={16} />
            신규 평가결과서 등록
          </button>
        </div>

        <DataTable
          columns={columns}
          data={filteredEvaluations}
          emptyMessage="등록된 EPR 평가결과서가 없습니다."
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isViewMode ? "EPR 평가결과서 상세조회" : (isEditMode ? "EPR 평가결과서 수정" : "신규 EPR 평가결과서 등록")} size="6xl">
        <div className="space-y-6 p-1 h-[75vh] overflow-y-auto custom-scrollbar">
          {isViewMode ? (
            <div className="space-y-6">
              <div className="relative p-8 rounded-2xl bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                {/* 상단 그라데이션 바 */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
                {/* 배경 장식 */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
                
                <div className="relative flex justify-between items-start z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">평가결과서 번호</span>
                      <span className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-md">{formData.certNo}</span>
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">{formData.evalName}</h3>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">최종 등급</span>
                    <span className={`px-5 py-2.5 rounded-xl text-base font-extrabold shadow-sm border ${
                      formData.evalGrade.includes('어려움') ? 'bg-red-50 text-red-600 border-red-100' :
                      formData.evalGrade.includes('우수') ? 'bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 border-emerald-100' :
                      formData.evalGrade === '미평가' ? 'bg-slate-50 text-slate-500 border-slate-200' :
                      'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {formData.evalGrade}
                    </span>
                  </div>
                </div>
                
                {(formData.representativeImageUrl || formData.resultPdfUrl) && (
                  <div className="relative z-10 grid grid-cols-2 gap-6 mt-8 pt-6 border-t border-slate-100">
                     {formData.representativeImageUrl && (
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">대표 사진</p>
                          <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm inline-block">
                            <img src={formData.representativeImageUrl} className="max-h-40 rounded-lg object-contain" alt="대표 제품사진" />
                          </div>
                        </div>
                     )}
                     {formData.resultPdfUrl && (
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">결과서 문서</p>
                          <a href={formData.resultPdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all hover:shadow-md group">
                             <FileText className="text-red-500 group-hover:scale-110 transition-transform" /> 
                             <span>공단결과서 PDF 보기</span>
                          </a>
                        </div>
                     )}
                  </div>
                )}
              </div>

              {formData.componentIds.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                    <PackageOpen size={18} className="text-indigo-500" />
                    매핑된 부자재 <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-xs">{formData.componentIds.length}개</span>
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {formData.componentIds.map(id => {
                      const comp = packagingComponents.find(c => c.id === id);
                      return comp ? (
                        <span key={id} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm">
                          {comp.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <ClipboardCheck size={18} className="text-emerald-500" />
                    상세 재질구조 평가 항목
                  </h4>
                </div>
                <div className="p-4">
                  <DynamicKecoEvaluator
                     kecoTypeCode={formData.kecoTypeCode}
                     kecoEvaluationData={formData.kecoEvaluationData}
                     onChangeCode={() => {}}
                     onChangeData={() => {}}
                     onResultCalculated={() => {}}
                     readOnly={true}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 pb-2">
                <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all font-bold shadow-md hover:shadow-lg">
                  닫기
                </button>
              </div>
            </div>
          ) : (
            <React.Fragment>
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">평가결과서 번호 *</label>
              <input
                type="text"
                value={formData.certNo}
                onChange={e => setFormData({ ...formData, certNo: e.target.value })}
                placeholder="예: 20260731020002"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">평가 대표명 (필수)</label>
              <select
                value={formData.evalName}
                onChange={e => setFormData(prev => ({ ...prev, evalName: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                required
              >
                <option value="">-- 생산실적보고 명칭 선택 --</option>
                {finishedProducts.map(p => {
                  const displayName = p.prodReportName || p.name;
                  return (
                    <option key={p.id} value={displayName}>
                      {displayName} {p.code ? `(${p.code})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">최종 평가등급</label>
              <select
                value={formData.evalGrade}
                onChange={e => setFormData({ ...formData, evalGrade: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="미평가">미평가</option>
                <option value="재활용 최우수">재활용 최우수</option>
                <option value="재활용 우수">재활용 우수</option>
                <option value="재활용 보통">재활용 보통</option>
                <option value="재활용 어려움">재활용 어려움</option>
                <option value="대상제외">대상제외</option>
              </select>
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">매핑 부자재 (포장재 마스터 선택)</label>
              
              {/* 선택된 부자재 영역 (분리됨) */}
              {formData.componentIds.length > 0 && (
                <div className="mb-3 p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-emerald-500" /> 
                      선택된 부자재 ({formData.componentIds.length}개)
                    </div>
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, componentIds: [] })}
                      className="text-[11px] text-emerald-600 hover:text-emerald-800 underline"
                    >
                      전체 해제
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.componentIds.map(id => {
                      const c = packagingComponents.find(pc => pc.id === id);
                      if (!c) return null;
                      return (
                        <div key={id} className="flex items-center gap-1.5 px-2.5 py-1 bg-white text-emerald-900 rounded border border-emerald-300 shadow-sm text-sm font-medium">
                          <span>[{c.code}] {c.name}</span>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, componentIds: formData.componentIds.filter(cid => cid !== id) })}
                            className="text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded p-0.5 transition-colors"
                            title="해제"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 검색 및 미선택 목록 영역 */}
              <div className="border border-slate-300 rounded-lg overflow-hidden flex flex-col bg-slate-50">
                <div className="p-2 border-b border-slate-300 bg-white">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="추가할 자재명 또는 코드로 검색"
                      value={componentSearchTerm}
                      onChange={(e) => setComponentSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-300 text-sm"
                    />
                  </div>
                </div>
                <div className="h-40 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {packagingComponents
                    .filter(c => !formData.componentIds.includes(c.id)) // 선택된 항목 제외
                    .filter(c => 
                      (c.name || '').toLowerCase().includes(componentSearchTerm.toLowerCase()) || 
                      (c.code || '').toLowerCase().includes(componentSearchTerm.toLowerCase())
                    )
                    .map(c => {
                      return (
                        <label key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all border bg-transparent border-transparent hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, componentIds: [...formData.componentIds, c.id] });
                              }
                            }}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <span className="text-sm flex-1 text-slate-700 font-medium">[{c.code}] {c.name}</span>
                          {c.materialEvalResult && c.materialEvalResult !== '미평가' && (
                            <span className="ml-auto text-xs text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              기존: {c.materialEvalResult}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  {packagingComponents.filter(c => !formData.componentIds.includes(c.id)).length === 0 && (
                    <div className="text-sm text-center text-slate-500 py-4">
                      {packagingComponents.length === 0 ? '포장재 마스터가 없습니다.' : '모든 부자재가 선택되었습니다.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 에셋 업로드 */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-3">증빙 서류 및 에셋</h4>
            <div className="grid grid-cols-1 gap-6">
              
              {/* 대표 제품사진 */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-semibold text-slate-700">대표 제품사진</label>
                  <button 
                    type="button" 
                    onClick={() => toggleInputMode('image')}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white px-2 py-1 border border-slate-200 rounded shadow-sm hover:bg-slate-100"
                  >
                    {inputModes.image === 'upload' ? <Link2 size={14} /> : <UploadIcon size={14} />}
                    {inputModes.image === 'upload' ? 'URL 직접 입력' : '파일 업로드로 변경'}
                  </button>
                </div>
                {inputModes.image === 'upload' ? (
                  <div className="relative">
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-lg">
                        <Loader2 className="animate-spin text-emerald-500" />
                      </div>
                    )}
                    <FileUpload 
                      onFileSelect={(file) => handleFileUpload(file, 'image')}
                      accept=".jpg,.jpeg,.png,.webp"
                      label="제품 사진을 선택하거나 드롭하세요"
                    />
                    {formData.representativeImageUrl && (
                      <div className="mt-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm relative group w-max">
                        <img 
                          src={formData.representativeImageUrl} 
                          alt="대표 제품사진" 
                          className="max-h-40 max-w-full rounded object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, representativeImageUrl: '' })}
                          className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1 shadow hover:bg-red-50 border border-slate-200 transition-colors"
                          title="사진 삭제"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.representativeImageUrl}
                    onChange={e => setFormData({ ...formData, representativeImageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                )}
              </div>

              {/* 공단 평가결과서 PDF */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-semibold text-slate-700">공단 평가결과서 (PDF)</label>
                  <button 
                    type="button" 
                    onClick={() => toggleInputMode('pdf')}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white px-2 py-1 border border-slate-200 rounded shadow-sm hover:bg-slate-100"
                  >
                    {inputModes.pdf === 'upload' ? <Link2 size={14} /> : <UploadIcon size={14} />}
                    {inputModes.pdf === 'upload' ? 'URL 직접 입력' : '파일 업로드로 변경'}
                  </button>
                </div>
                {inputModes.pdf === 'upload' ? (
                  <div className="relative">
                    {isUploadingPdf && (
                      <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-lg">
                        <Loader2 className="animate-spin text-emerald-500" />
                      </div>
                    )}
                    <FileUpload 
                      onFileSelect={(file) => handleFileUpload(file, 'pdf')}
                      accept=".pdf"
                      label="PDF 결과서를 선택하거나 드롭하세요"
                    />
                    {formData.resultPdfUrl && (
                      <div className="mt-3 flex items-center gap-3">
                        <a 
                          href={formData.resultPdfUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                          <FileText size={16} className="text-red-500" /> 
                          업로드된 결과서 보기
                        </a>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, resultPdfUrl: '' })}
                          className="text-xs text-slate-400 hover:text-red-500 underline"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.resultPdfUrl}
                    onChange={e => setFormData({ ...formData, resultPdfUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                )}
              </div>

            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 동적 평가 시뮬레이터 */}
          <DynamicKecoEvaluator
             kecoTypeCode={formData.kecoTypeCode}
             kecoEvaluationData={formData.kecoEvaluationData}
             onChangeCode={(code) => setFormData(prev => ({ ...prev, kecoTypeCode: code }))}
             onChangeData={(data) => {
               if (typeof data === 'function') {
                 setFormData(prev => ({ ...prev, kecoEvaluationData: data(prev.kecoEvaluationData) }));
               } else {
                 setFormData(prev => ({ ...prev, kecoEvaluationData: data }));
               }
             }}
             onResultCalculated={(grade) => {
               setFormData(prev => ({ ...prev, evalGrade: grade }));
             }}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
              {isEditMode ? '수정 내용 저장' : '등록 완료'}
            </button>
          </div>
        </React.Fragment>
        )}
      </div>
    </Modal>
    </div>
  );
}
