import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, AlertCircle, Ban, Filter, Search } from 'lucide-react';
import useEprStore from '../../stores/eprStore';
import usePackagingStore from '../../stores/packagingStore';

/**
 * ProductMappingTable.jsx
 * ─────────────────────────────────────
 * 2단계: 제품 매핑 테이블
 * 업로드된 엑셀 데이터의 상품명을 시스템에 등록된 완제품과 매핑합니다.
 * 타사 브랜드 제품은 EPR 신고 대상에서 제외됨을 시각적으로 표시합니다.
 */
export default function ProductMappingTable() {
  const reports = useEprStore(state => state.productionReports);
  const updateProductionReport = useEprStore(state => state.updateProductionReport);
  const finishedProducts = usePackagingStore(state => state.finishedProducts);

  // 가장 최근 업로드된 보고서 사용
  const currentReport = reports.length > 0 ? reports[reports.length - 1] : null;

  const [mappings, setMappings] = useState([]);
  const [showOnlyOwnBrand, setShowOnlyOwnBrand] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const calculateEprResult = useEprStore(state => state.calculateEprResult);

  // 1. 초기 로드 시 자동 매핑 시도
  useEffect(() => {
    if (currentReport && currentReport.data && mappings.length === 0) {
      // 엑셀에서 추출한 생산실적보고 데이터를 calculateEprResult에 넘겨 매핑 결과를 받음
      const { results } = calculateEprResult(currentReport.data, finishedProducts);
      
      const initialMappings = results.map((res, index) => {
        // 매칭된 제품 객체 찾기
        const matchedProduct = finishedProducts.find(p => p.code === res.matchedCode);
        
        return {
          id: `row_${index}`,
          originalName: res.prodReportName,
          originalQty: res.quantity,
          matchedProductId: matchedProduct ? matchedProduct.id : '',
          // 매핑 상태: 'mapped', 'excluded' (타사), 'unmapped'
          status: matchedProduct ? (matchedProduct.brandType === '타사' ? 'excluded' : 'mapped') : 'unmapped',
          excelRow: currentReport.data[index]
        };
      });
      setMappings(initialMappings);
    }
  }, [currentReport, finishedProducts, mappings.length, calculateEprResult]);

  // 2. 수동 매핑 변경 핸들러
  const handleMappingChange = (rowId, productId) => {
    setMappings(prev => prev.map(m => {
      if (m.id === rowId) {
        const product = finishedProducts.find(p => p.id === productId);
        return {
          ...m,
          matchedProductId: productId,
          status: productId ? (product.brandType === '타사' ? 'excluded' : 'mapped') : 'unmapped'
        };
      }
      return m;
    }));
  };

  // 3. 수량 변경 핸들러
  const handleQtyChange = (rowId, newQty) => {
    const qty = parseInt(newQty, 10);
    setMappings(prev => prev.map(m => {
      if (m.id === rowId) {
        return { ...m, originalQty: isNaN(qty) ? 0 : qty };
      }
      return m;
    }));
  };

  // 4. 데이터 필터링
  const filteredMappings = useMemo(() => {
    return mappings.filter(m => {
      // 검색어 필터
      if (searchTerm && !m.originalName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      // 자사 브랜드 필터
      if (showOnlyOwnBrand && m.status === 'excluded') {
        return false;
      }
      return true;
    });
  }, [mappings, showOnlyOwnBrand, searchTerm]);

  // 5. 진행률 계산
  const progress = useMemo(() => {
    if (mappings.length === 0) return 0;
    const completed = mappings.filter(m => m.status !== 'unmapped').length;
    return Math.round((completed / mappings.length) * 100);
  }, [mappings]);

  // 6. 스토어에 매핑 결과 저장 (실제로는 버튼을 누를 때 저장하거나 자동 저장할 수 있음)
  useEffect(() => {
    if (currentReport && mappings.length > 0) {
      updateProductionReport(currentReport.id, { 
        mappings, 
        mappingStatus: progress === 100 ? 'complete' : 'partial' 
      });
    }
  }, [mappings, progress, currentReport, updateProductionReport]);

  if (!currentReport) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        먼저 1단계에서 생산실적 엑셀 파일을 업로드해주세요.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-[600px]">
      {/* 헤더 및 컨트롤 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">제품 매핑</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              엑셀의 상품명과 시스템의 완제품을 연결합니다.
            </p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* 검색바 */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="엑셀 상품명 검색..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 dark:text-white"
              />
            </div>
            
            {/* 자사 브랜드 필터 토글 */}
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 select-none shrink-0">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only"
                  checked={showOnlyOwnBrand}
                  onChange={(e) => setShowOnlyOwnBrand(e.target.checked)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${showOnlyOwnBrand ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showOnlyOwnBrand ? 'transform translate-x-4' : ''}`}></div>
              </div>
              <Filter className="w-4 h-4" />
              <span>자사 브랜드만 표시</span>
            </label>
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>매핑 진행률</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">{progress}% 완료</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 테이블 본문 */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 relative">
          <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">엑셀 상품명</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/3">시스템 완제품 매핑</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">연간출고량</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredMappings.map((row) => (
              <tr key={row.id} className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${row.status === 'excluded' ? 'bg-gray-50 dark:bg-gray-800/80' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {row.status === 'mapped' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      자사·신고대상
                    </span>
                  )}
                  {row.status === 'excluded' && (
                    <span 
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 cursor-help"
                      title="상표권자가 신고 (자원재활용법 시행령 제18조)"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      타사·제외
                    </span>
                  )}
                  {row.status === 'unmapped' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      미매핑
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm ${row.status === 'excluded' ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-gray-200 font-medium'}`}>
                    {row.originalName}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={row.matchedProductId}
                    onChange={(e) => handleMappingChange(row.id, e.target.value)}
                    className={`block w-full text-sm rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white
                      ${row.status === 'excluded' ? 'opacity-70' : ''}
                    `}
                  >
                    <option value="">-- 완제품 선택 --</option>
                    {finishedProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.name} ({p.brandType})
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 text-right">
                  <input
                    type="number"
                    value={row.originalQty}
                    onChange={(e) => handleQtyChange(row.id, e.target.value)}
                    className="w-24 text-right text-sm rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={row.status === 'excluded'}
                  />
                </td>
              </tr>
            ))}
            {filteredMappings.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  표시할 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
