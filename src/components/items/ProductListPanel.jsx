/**
 * ProductListPanel.jsx
 * ─────────────────────────────────────
 * 좌측 제품 목록 패널 (개선버전)
 * - 엑셀 업로드 클릭 시 컬럼 안내 팝업 표시
 * - 카드 디자인 개선, BOM 등록 현황 뱃지
 */
import React, { useState, useRef } from 'react';
import { Plus, Upload, Download, Search, AlertCircle, Package, ChevronRight, Layers } from 'lucide-react';
import usePackagingStore from '../../stores/packagingStore';
import Modal from '../common/Modal';
import { BRAND_TYPES, MFG_TYPES } from '../../utils/constants';
import { parseExcelFile, formatProductsFromExcel, downloadProductTemplateExcel } from '../../utils/excelParser';

// ─── 엑셀 컬럼 안내 데이터 ───
const PRODUCT_EXCEL_COLUMNS = [
  { name: '제품코드',              required: true,  important: false, desc: 'ERP 제품 관리 코드',          example: 'PROD-001' },
  { name: '제품명',                required: true,  important: false, desc: '한글 상품명 및 규격',          example: '수분크림 100ml' },
  { name: '생산실적보고_제품명',    required: false, important: true,  desc: '생산실적보고서 파일의 제품명과 정확히 일치해야 자동 매칭됩니다', example: '수분크림 100ml' },
  { name: '화장품유형',            required: false, important: false, desc: '화장품 분류',                  example: '기초화장용' },
  { name: '규격',                  required: false, important: false, desc: '용량/규격 표시',               example: '100ml / 50g' },
  { name: '생산실적보고_용량(숫자)', required: false, important: false, desc: '숫자만 입력 (단위 제외)',      example: '100' },
  { name: '용도구분',              required: false, important: false, desc: '자사 브랜드 여부',             example: '자사 또는 타사' },
];

export default function ProductListPanel() {
  const {
    finishedProducts,
    selectedProductId,
    setSelectedProduct,
    addFinishedProduct,
    uploadProductsFromExcel,
    packagingComponents
  } = usePackagingStore();

  const fileInputRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false); // ★ 컬럼 안내 팝업

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameEn: '',
    cosmeticsType: '일반화장품',
    spec: '',
    volume: '',
    weight: 0,
    brandType: BRAND_TYPES[0]?.value || '자사',  // ✅ .value 사용
    mfgType: MFG_TYPES[0]?.value || '제조',       // ✅ .value 사용
  });

  const filteredProducts = finishedProducts.filter(p => {
    const matchesSearch = p.name?.includes(searchTerm) || p.code?.includes(searchTerm);
    const matchesBrand = brandFilter === 'all' || p.brandType === brandFilter;
    return matchesSearch && matchesBrand;
  });

  // ★ 엑셀 업로드: 클릭 시 안내 팝업을 먼저 보여줌
  const handleExcelButtonClick = () => {
    setIsGuideModalOpen(true);
  };

  // 안내 팝업에서 '업로드 진행' 버튼 클릭 시 파일 선택창 열기
  const handleProceedToUpload = () => {
    setIsGuideModalOpen(false);
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const rawData = await parseExcelFile(file);
      const formattedData = formatProductsFromExcel(rawData);
      if (formattedData.length > 0) {
        const success = await uploadProductsFromExcel(formattedData);
        if (success) {
          alert(`총 ${formattedData.length}건의 완제품이 성공적으로 업로드되었습니다.`);
        } else {
          alert('엑셀 업로드 중 오류가 발생했습니다.');
        }
      } else {
        alert('업로드할 데이터가 없거나 양식이 잘못되었습니다. 열 이름을 다시 확인해주세요.');
      }
    } catch (error) {
      console.error(error);
      alert('엑셀 파일 파싱 중 오류가 발생했습니다.');
    } finally {
      e.target.value = null;
    }
  };

  const handleAddProduct = () => {
    if (!formData.code || !formData.name) {
      alert('제품코드와 상품명은 필수 입력 항목입니다.');
      return;
    }
    addFinishedProduct({
      ...formData,
      id: Date.now().toString(),
      versions: [{ version: 'v1.0', bomItems: [], createdAt: new Date().toISOString() }],
      createdAt: new Date().toISOString()
    });
    setIsAddModalOpen(false);
    setFormData({ code: '', name: '', nameEn: '', cosmeticsType: '일반화장품', spec: '', volume: '', weight: 0, brandType: '자사', mfgType: '제조' }); // ✅ 값 수정
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-100">

      {/* ─── 헤더 ─── */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-800">제품 목록</h2>
          <div className="flex gap-1.5">
            {/* 새 제품 등록 */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white rounded-lg transition-all hover:shadow-md"
              style={{ background: 'linear-gradient(90deg,#10b981,#06b6d4)' }}
              title="새 제품 등록"
            >
              <Plus size={14} /> 등록
            </button>

            {/* 엑셀 업로드 (안내 팝업 먼저) */}
            <input type="file" ref={fileInputRef} onChange={handleExcelUpload} accept=".xlsx,.xls" className="hidden" />
            <button
              onClick={handleExcelButtonClick}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              title="엑셀 일괄 업로드"
            >
              <Upload size={14} /> 엑셀 업로드
            </button>

            {/* 양식 다운로드 */}
            <button
              onClick={downloadProductTemplateExcel}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              title="완제품 등록 양식 다운로드"
            >
              <Download size={14} /> 양식
            </button>
          </div>
        </div>

        {/* 검색 */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="제품코드, 상품명 검색"
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-slate-50"
          />
        </div>

        {/* 자사/타사 필터 */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setBrandFilter('all')}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${brandFilter === 'all' ? 'bg-emerald-500 text-white border-emerald-500' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}
          >
            전체
          </button>
          {BRAND_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setBrandFilter(type.value)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${brandFilter === type.value ? 'bg-emerald-500 text-white border-emerald-500' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 제품 목록 ─── */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredProducts.map(product => {
          const isSelected = selectedProductId === product.id;
          // ✅ '자사' 또는 'OWN' 둘 다 자사로 인식 (기존 데이터 호환)
          const isOwnBrand = product.brandType === '자사' || product.brandType === 'OWN';
          const latestVersion = product.versions?.[product.versions.length - 1]?.version || 'v1.0';
          const bomCount = product.versions?.[product.versions.length - 1]?.bomItems?.length || 0;

          return (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product.id)}
              className={`p-3 rounded-xl cursor-pointer border transition-all ${
                isSelected
                  ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                  : 'border-slate-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/30 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-mono text-slate-400">{product.code}</span>
                <div className="flex items-center gap-1">
                  {/* BOM 등록 현황 뱃지 */}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                    bomCount > 0 ? 'bg-cyan-50 text-cyan-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Layers size={9} /> {bomCount}개
                  </span>
                  {/* 자사/타사 뱃지 */}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    isOwnBrand ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {/* ✅ .value로 찾되, 'OWN'→자사 레거시 호환 */}
                    {BRAND_TYPES.find(t => t.value === product.brandType)?.label || (isOwnBrand ? '자사' : '타사')}
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-slate-800 leading-snug mb-1">{product.name}</h3>

              {product.nameEn && (
                <div className="text-[10px] text-slate-400 mb-1 truncate">{product.nameEn}</div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex gap-1 flex-wrap">
                  {product.cosmeticsType && (
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{product.cosmeticsType}</span>
                  )}
                  {product.spec && (
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{product.spec}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{latestVersion}</span>
                  {isSelected && <ChevronRight size={12} className="text-emerald-500" />}
                </div>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">
            <Package size={32} className="mx-auto mb-2 opacity-30" />
            등록된 제품이 없습니다.
          </div>
        )}
      </div>

      {/* ─── 새 제품 등록 모달 ─── */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="새 제품 등록">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                완제품코드 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                placeholder="예: PROD-001"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">화장품유형</label>
              <input
                type="text"
                value={formData.cosmeticsType}
                onChange={e => setFormData({ ...formData, cosmeticsType: e.target.value })}
                placeholder="기초화장용"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              상품명 (국문) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="예: 수분크림 100ml"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              생산실적보고 매칭 제품명
              <span className="ml-1 text-amber-600">⭐ 중요</span>
            </label>
            <input
              type="text"
              value={formData.prodReportName || ''}
              onChange={e => setFormData({ ...formData, prodReportName: e.target.value })}
              placeholder="생산실적보고서 엑셀의 제품명과 정확히 동일하게 입력"
              className="w-full px-3 py-2 border border-amber-200 bg-amber-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <p className="text-[11px] text-amber-600 mt-1">이 이름이 생산실적보고 엑셀과 일치해야 자동 매칭됩니다.</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">규격</label>
              <input type="text" value={formData.spec} onChange={e => setFormData({ ...formData, spec: e.target.value })} placeholder="100ml" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">자사/타사</label>
              <select value={formData.brandType} onChange={e => setFormData({ ...formData, brandType: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                {BRAND_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">제조/수입</label>
              <select value={formData.mfgType} onChange={e => setFormData({ ...formData, mfgType: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                {MFG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {formData.brandType === '타사' && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs">
              <AlertCircle size={14} /> 타사 브랜드 제품은 EPR 신고 대상에서 자동 제외됩니다.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">취소</button>
            <button
              onClick={handleAddProduct}
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:shadow-md"
              style={{ background: 'linear-gradient(90deg,#10b981,#06b6d4)' }}
            >
              등록
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── 엑셀 컬럼 안내 팝업 ★ 핵심 기능 ─── */}
      <Modal isOpen={isGuideModalOpen} onClose={() => setIsGuideModalOpen(false)} title="📋 완제품 엑셀 업로드 - 열 이름 안내" size="2xl">
        <div className="space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
            엑셀 파일의 <strong>첫 번째 행(1행)</strong>을 아래 열 이름으로 작성해야 정상적으로 업로드됩니다.<br />
            양식을 직접 만들기 어려우시면 <strong>「양식 다운로드」</strong> 버튼으로 샘플 파일을 받으세요.
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">열 이름 (1행에 입력)</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">필수</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">설명</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">예시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PRODUCT_EXCEL_COLUMNS.map((col, i) => (
                  <tr key={i} className={col.important ? 'bg-amber-50' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-3">
                      <code className="text-sm font-mono font-bold text-slate-800">{col.name}</code>
                      {col.important && <span className="ml-2 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">⭐ 중요</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {col.required
                        ? <span className="text-[11px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">필수</span>
                        : <span className="text-[11px] text-slate-400">선택</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{col.desc}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">{col.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
            💡 <strong>생산실적보고_제품명</strong>은 나중에 EPR 신고 시 생산실적보고서와 자동 매칭되는 핵심 필드입니다.<br />
            생산실적보고서 엑셀의 "제품명" 열과 <strong>띄어쓰기까지 정확히 동일하게</strong> 입력해야 합니다.
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <button
              onClick={downloadProductTemplateExcel}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Download size={14} /> 샘플 양식 다운로드
            </button>
            <div className="flex gap-2">
              <button onClick={() => setIsGuideModalOpen(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">취소</button>
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
