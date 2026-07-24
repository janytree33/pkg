import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, AlertCircle, Ban, Filter, Search, FlaskConical, RefreshCw, Leaf, Settings2, PlusCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useEprStore from '../../stores/eprStore';
import usePackagingStore from '../../stores/packagingStore';
import { BRAND_TYPES, MFG_TYPES, COSMETICS_TYPES } from '../../utils/constants';

/**
 * ProductMappingTable.jsx (개선버전)
 * ─────────────────────────────────────
 * 2단계: 제품 매핑 테이블
 * - 엑셀에서 읽어온 견본품(S)/한방(H)/리필(R)/맞춤형(C) 플래그 표시
 * - 매핑 화면에서 플래그 수동 토글 가능
 * - EPR 집계 시 견본품 제외, 리필 별도 표시 처리
 */

// 플래그 뱃지 정의
const FLAG_BADGES = [
  {
    key: 'isSample',
    label: '견본품',
    code: 'S',
    tooltip: '판촉용 견본품 - EPR 포함 여부 확인 필요 (회사 정책에 따라 제외 가능)',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    activeColor: 'bg-orange-500 text-white border-orange-500',
    icon: FlaskConical,
  },
  {
    key: 'isHerbal',
    label: '한방제품',
    code: 'H',
    tooltip: '한방 원료 함유 화장품 - EPR 일반 신고 동일 처리',
    color: 'bg-green-100 text-green-700 border-green-200',
    activeColor: 'bg-green-500 text-white border-green-500',
    icon: Leaf,
  },
  {
    key: 'isRefill',
    label: '리필제품',
    code: 'R',
    tooltip: '리필 포장 제품 - EPR 집계 시 별도 분류됩니다',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    activeColor: 'bg-blue-500 text-white border-blue-500',
    icon: RefreshCw,
  },
  {
    key: 'isCustom',
    label: '맞춤형',
    code: 'C',
    tooltip: '맞춤형화장품 (혼합용C1/소분용C2) - EPR 신고 대상 확인 필요',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    activeColor: 'bg-purple-500 text-white border-purple-500',
    icon: Settings2,
  },
];

export default function ProductMappingTable({ onNextStep }) {
  const reports = useEprStore(state => state.productionReports);
  const updateProductionReport = useEprStore(state => state.updateProductionReport);
  const finishedProducts = usePackagingStore(state => state.finishedProducts);
  const addFinishedProduct = usePackagingStore(state => state.addFinishedProduct);
  const setSelectedProduct = usePackagingStore(state => state.setSelectedProduct);
  const navigate = useNavigate();

  const currentReport = reports.length > 0 ? reports[reports.length - 1] : null;

  const [mappings, setMappings] = useState([]);
  const [showOnlyOwnBrand, setShowOnlyOwnBrand] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [flagFilter, setFlagFilter] = useState('all'); // 'all' | 'sample' | 'refill' | 'herbal'

  // ★ 빠른 등록 모달 상태
  const [quickRegRow, setQuickRegRow] = useState(null);
  const [quickRegForm, setQuickRegForm] = useState({});
  const [quickRegLoading, setQuickRegLoading] = useState(false);
  const [quickRegDone, setQuickRegDone] = useState(null);

  const calculateEprResult = useEprStore(state => state.calculateEprResult);

  // 1. 초기 로드 시 자동 매핑 + 플래그 적용
  useEffect(() => {
    if (currentReport && currentReport.data && mappings.length === 0) {
      const { results } = calculateEprResult(currentReport.data, finishedProducts);

      const initialMappings = results.map((res, index) => {
        const matchedProduct = finishedProducts.find(p => p.code === res.matchedCode);
        const excelRow = currentReport.data[index];

        return {
          id: `row_${index}`,
          originalName: res.prodReportName,
          originalQty: res.quantity,
          matchedProductId: matchedProduct ? matchedProduct.id : '',
          status: matchedProduct
            ? (matchedProduct.brandType === '타사' ? 'excluded' : 'mapped')
            : 'unmapped',
          excelRow,
          // ★ 엑셀에서 읽어온 플래그 (수동 토글 가능)
          isSample: excelRow?.isSample || false,
          isHerbal:  excelRow?.isHerbal  || false,
          isRefill:  excelRow?.isRefill  || false,
          isCustom:  excelRow?.isCustom  || false,
        };
      });
      setMappings(initialMappings);
    }
  }, [currentReport, finishedProducts, mappings.length, calculateEprResult]);

  // 2. 매핑 변경
  const handleMappingChange = (rowId, productId) => {
    setMappings(prev => prev.map(m => {
      if (m.id !== rowId) return m;
      const product = finishedProducts.find(p => p.id === productId);
      return {
        ...m,
        matchedProductId: productId,
        status: productId
          ? (product?.brandType === '타사' ? 'excluded' : 'mapped')
          : 'unmapped',
      };
    }));
  };

  // 3. 수량 변경
  const handleQtyChange = (rowId, newQty) => {
    const qty = parseInt(newQty, 10);
    setMappings(prev => prev.map(m =>
      m.id === rowId ? { ...m, originalQty: isNaN(qty) ? 0 : qty } : m
    ));
  };

  // 4. ★ 플래그 토글
  const handleFlagToggle = (rowId, flagKey) => {
    setMappings(prev => prev.map(m =>
      m.id === rowId ? { ...m, [flagKey]: !m[flagKey] } : m
    ));
  };

  // 5. ★ 빠른 등록 모달 열기 (엑셀 데이터 자동입력)
  const openQuickReg = (row) => {
    const excelRow = row.excelRow || {};
    setQuickRegRow(row);
    setQuickRegDone(null);
    setQuickRegForm({
      code:           '',
      name:           row.originalName || '',
      prodReportName: row.originalName || '', // 실적보고 매칭용 (동일하게 세팅)
      spec:           excelRow.capacity ? `${excelRow.capacity}${excelRow.unit || ''}` : '',
      cosmeticsType:  '일반화장품',
      brandType:      '자사',
      mfgType:        '제조',
      nameEn:         '',
      weight:         0,
    });
  };

  // 6. ★ 빠른 등록 실행
  const handleQuickReg = async () => {
    if (!quickRegForm.code || !quickRegForm.name) {
      alert('완제품코드와 제품명은 필수입니다.');
      return;
    }
    setQuickRegLoading(true);
    try {
      const newProduct = await addFinishedProduct(quickRegForm);
      if (newProduct) {
        setMappings(prev => prev.map(m =>
          m.id === quickRegRow.id
            ? { ...m, matchedProductId: newProduct.id, status: 'mapped' }
            : m
        ));
        setQuickRegDone(newProduct.id);
      }
    } catch (e) {
      alert('등록 중 오류가 발생했습니다.');
    } finally {
      setQuickRegLoading(false);
    }
  };

  // 7. ★ 등록 후 BOM 등록하러 이동
  const handleGoToBom = () => {
    if (quickRegDone) {
      setSelectedProduct(quickRegDone);
      navigate('/items');
    }
    setQuickRegRow(null);
  };

  // 5. 필터링
  const filteredMappings = useMemo(() => {
    return mappings.filter(m => {
      if (searchTerm && !String(m.originalName || '').toLowerCase().includes(searchTerm.toLowerCase())) return false;
      // 자사만 필터가 켜져 있으면, '매핑 완료(자사대상)' 상태가 아닌 모든 항목(미매핑, 제외)을 숨김
      if (showOnlyOwnBrand && m.status !== 'mapped') return false;
      
      if (flagFilter === 'sample' && !m.isSample) return false;
      if (flagFilter === 'refill' && !m.isRefill) return false;
      if (flagFilter === 'herbal' && !m.isHerbal) return false;
      if (flagFilter === 'custom' && !m.isCustom) return false;
      return true;
    });
  }, [mappings, showOnlyOwnBrand, searchTerm, flagFilter]);

  // 6. 진행률
  const progress = useMemo(() => {
    if (mappings.length === 0) return 0;
    const completed = mappings.filter(m => m.status !== 'unmapped').length;
    return Math.round((completed / mappings.length) * 100);
  }, [mappings]);

  // 7. 플래그 집계
  const flagCounts = useMemo(() => ({
    sample: mappings.filter(m => m.isSample).length,
    herbal:  mappings.filter(m => m.isHerbal).length,
    refill:  mappings.filter(m => m.isRefill).length,
    custom:  mappings.filter(m => m.isCustom).length,
  }), [mappings]);

  // 8. 스토어 자동 저장 (무한루프 방지를 위해 currentReport 대신 id만 의존성에 추가)
  const currentReportId = currentReport?.id;
  useEffect(() => {
    if (currentReportId && mappings.length > 0) {
      updateProductionReport(currentReportId, {
        mappings,
        mappingStatus: progress === 100 ? 'complete' : 'partial',
      });
    }
  }, [mappings, progress, currentReportId, updateProductionReport]);

  if (!currentReport) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-100">
        먼저 1단계에서 생산실적 엑셀 파일을 업로드해 주세요.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">

      {/* ─── 헤더 & 컨트롤 ─── */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800">제품 매핑</h2>
            <p className="text-xs text-slate-500">엑셀 상품명과 시스템 완제품을 연결합니다.</p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* 검색 */}
            <div className="relative flex-1 md:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="상품명 검색..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-slate-50"
              />
            </div>

            {/* 자사 필터 토글 */}
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 select-none shrink-0">
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={showOnlyOwnBrand} onChange={e => setShowOnlyOwnBrand(e.target.checked)} />
                <div className={`block w-8 h-5 rounded-full transition-colors ${showOnlyOwnBrand ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <div className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${showOnlyOwnBrand ? 'translate-x-3' : ''}`} />
              </div>
              <Filter size={13} />
              자사만
            </label>
          </div>
        </div>

        {/* ★ 플래그 필터 탭 + 집계 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 shrink-0">특수제품 필터:</span>
          {[
            { id: 'all', label: '전체', count: mappings.length },
            { id: 'sample', label: '견본품(S)', count: flagCounts.sample, color: 'orange' },
            { id: 'refill',  label: '리필(R)',   count: flagCounts.refill,  color: 'blue' },
            { id: 'herbal',  label: '한방(H)',   count: flagCounts.herbal,  color: 'green' },
            { id: 'custom',  label: '맞춤형(C)', count: flagCounts.custom,  color: 'purple' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFlagFilter(tab.id)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                flagFilter === tab.id
                  ? 'bg-slate-700 text-white border-slate-700'
                  : 'text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1 px-1 py-0.5 rounded-full text-[10px] font-bold ${flagFilter === tab.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}

          {/* 견본품 안내 */}
          {flagCounts.sample > 0 && (
            <span className="text-[10px] text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
              ⚠️ 견본품 {flagCounts.sample}건 — EPR 포함 여부를 확인하세요
            </span>
          )}
        </div>

        {/* 진행률 */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>매핑 진행률</span>
            <span className="font-semibold text-emerald-600">{progress}% 완료</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#10b981,#06b6d4)' }}
            />
          </div>
        </div>
      </div>

      {/* ─── 테이블 ─── */}
      <div className="overflow-auto" style={{ maxHeight: '520px' }}>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">상태</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">엑셀 상품명</th>
              {/* ★ 특수제품 플래그 컬럼 */}
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 whitespace-nowrap">
                특수제품 <span className="text-slate-400 font-normal">(클릭 토글)</span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">시스템 완제품 매핑</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 whitespace-nowrap">연간출고량(개)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredMappings.map(row => (
              <tr
                key={row.id}
                className={`hover:bg-slate-50 transition-colors ${row.status === 'excluded' ? 'opacity-60' : ''}`}
              >
                {/* 매핑 상태 */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {row.status === 'mapped' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-100 text-emerald-700">
                      <CheckCircle2 size={11} /> 자사·대상
                    </span>
                  )}
                  {row.status === 'excluded' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500" title="상표권자가 신고 (자원재활용법 시행령 제18조)">
                      <Ban size={11} /> 타사·제외
                    </span>
                  )}
                  {row.status === 'unmapped' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-100 text-amber-700">
                      <AlertCircle size={11} /> 미매핑
                    </span>
                  )}
                </td>

                {/* 상품명 */}
                <td className="px-4 py-3">
                  <span className={`text-sm ${row.status === 'excluded' ? 'text-slate-400 line-through' : 'text-slate-800 font-medium'}`}>
                    {row.originalName}
                  </span>
                </td>

                {/* ★ 특수 플래그 토글 버튼 */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-center flex-wrap">
                    {FLAG_BADGES.map(flag => {
                      const isActive = row[flag.key];
                      const Icon = flag.icon;
                      return (
                        <button
                          key={flag.key}
                          onClick={() => handleFlagToggle(row.id, flag.key)}
                          title={flag.tooltip}
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[10px] font-bold transition-all ${
                            isActive ? flag.activeColor : 'bg-white text-slate-300 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Icon size={9} />
                          {flag.code}
                        </button>
                      );
                    })}
                  </div>
                </td>

                {/* 완제품 매핑 select */}
                <td className="px-4 py-3">
                  <select
                    value={row.matchedProductId}
                    onChange={e => handleMappingChange(row.id, e.target.value)}
                    className="block w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                  >
                    <option value="">-- 완제품 선택 --</option>
                    {finishedProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.name} ({p.brandType})
                      </option>
                    ))}
                  </select>
                  {/* ★ 미매핑 시 "\uc774 \uc81c\ud488 \ub4f1\ub85d\ud558\uae30" 버\ud2bc */}
                  {row.status === 'unmapped' && (
                    <button
                      onClick={() => openQuickReg(row)}
                      className="mt-1.5 w-full flex items-center justify-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <PlusCircle size={12} />
                      이 제품 바로 등록하기
                    </button>
                  )}
                </td>

                {/* 연간 출고량 */}
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    value={row.originalQty}
                    onChange={e => handleQtyChange(row.id, e.target.value)}
                    className="w-28 text-right text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    disabled={row.status === 'excluded'}
                  />
                </td>
              </tr>
            ))}

            {filteredMappings.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">
                  표시할 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ─── 하단 요약 ─── */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 text-xs text-slate-500">
        <span>전체 <strong className="text-slate-700">{mappings.length}건</strong></span>
        <span>|</span>
        <span className="text-emerald-600">자사·대상 <strong>{mappings.filter(m => m.status === 'mapped').length}건</strong></span>
        <span className="text-orange-600">견본품(S) <strong>{flagCounts.sample}건</strong></span>
        <span className="text-blue-600">리필(R) <strong>{flagCounts.refill}건</strong></span>
        <span className="text-green-600">한방(H) <strong>{flagCounts.herbal}건</strong></span>
        <span className="text-purple-600">맞춤형(C) <strong>{flagCounts.custom}건</strong></span>
      </div>
      {/* ─── ★ 빠른 등록 모달 ─── */}
      {quickRegRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setQuickRegRow(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 z-10">

            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-800">새 제품 등록</h2>
                <p className="text-xs text-slate-400 mt-0.5">생산실적보고 데이터가 자동 입력되었습니다. 확인 후 등록하세요.</p>
              </div>
              <button onClick={() => setQuickRegRow(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100">
                ✕
              </button>
            </div>

            {/* 모달 바디 */}
            {!quickRegDone ? (
              <div className="p-6 space-y-4">
                {/* 엑셀 원본명 표시 */}
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                  포의 엑셀 상품명: <strong>{quickRegRow.originalName}</strong> &nbsp;|
                  연간출고량: <strong>{quickRegRow.originalQty?.toLocaleString()}개</strong>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">완제품코드 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={quickRegForm.code}
                      onChange={e => setQuickRegForm({...quickRegForm, code: e.target.value})}
                      placeholder="예: PROD-001"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">화장품유형</label>
                    <select value={quickRegForm.cosmeticsType} onChange={e => setQuickRegForm({...quickRegForm, cosmeticsType: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
                      {COSMETICS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">제품명 (국문) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={quickRegForm.name}
                    onChange={e => setQuickRegForm({...quickRegForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">생산실적보고 매칭명 <span className="text-amber-500">⭐ 중요</span></label>
                  <input
                    type="text"
                    value={quickRegForm.prodReportName}
                    onChange={e => setQuickRegForm({...quickRegForm, prodReportName: e.target.value})}
                    className="w-full px-3 py-2 border border-amber-200 bg-amber-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <p className="text-[10px] text-amber-600 mt-1">엑셀 제품명과 딩어쓰기까지 이 같아야 자동 매칭됩니다.</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">규격</label>
                    <input type="text" value={quickRegForm.spec} onChange={e => setQuickRegForm({...quickRegForm, spec: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">자사/타사</label>
                    <select value={quickRegForm.brandType} onChange={e => setQuickRegForm({...quickRegForm, brandType: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
                      {BRAND_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">제조/수입</label>
                    <select value={quickRegForm.mfgType} onChange={e => setQuickRegForm({...quickRegForm, mfgType: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
                      {MFG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => setQuickRegRow(null)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">취소</button>
                  <button
                    onClick={handleQuickReg}
                    disabled={quickRegLoading}
                    className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:shadow-md disabled:opacity-60"
                    style={{ background: 'linear-gradient(90deg,#10b981,#06b6d4)' }}
                  >
                    {quickRegLoading ? '등록 중...' : '완제품 등록'}
                  </button>
                </div>
              </div>
            ) : (
              /* 등록 성공 화면 */
              <div className="p-8 text-center space-y-4">
                <div className="text-5xl">✅</div>
                <p className="text-base font-bold text-slate-800">등록 완료!</p>
                <p className="text-sm text-slate-500">이제 포장재(BOM)를 등록하리로 이동하세요.</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setQuickRegRow(null)} className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50">
                    더 등록하기
                  </button>
                  <button
                    onClick={handleGoToBom}
                    className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white rounded-lg"
                    style={{ background: 'linear-gradient(90deg,#10b981,#06b6d4)' }}
                  >
                    BOM 등록하러 가기 <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 하단 다음 단계 버튼 ─── */}
      <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50 rounded-b-xl mt-4">
        <button
          onClick={() => onNextStep && onNextStep()}
          className="flex items-center gap-2 px-8 py-3 text-sm font-bold text-white rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(90deg, #10b981, #0ea5e9)' }}
        >
          저장 및 다음 단계로 (EPR 신고 취합) <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
