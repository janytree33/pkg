import React, { useMemo } from 'react';
import { Download, Info, ShieldCheck, Calculator } from 'lucide-react';
import useEprStore from '../../stores/eprStore';
import usePackagingStore from '../../stores/packagingStore';
import { PLASTIC_MATERIALS, CONTAINER_TYPE_MAP } from '../../utils/constants';
import { generateEprExcel } from '../../utils/eprExcelGenerator';

/**
 * EprAggregationTab.jsx
 * ─────────────────────────────────────
 * 3단계: EPR 신고 취합 탭
 * 자사 브랜드 제품만 필터링하여 총 플라스틱 배출량을 계산하고
 * EPR 공식 신고 양식(엑셀)을 다운로드하는 기능 제공.
 */
export default function EprAggregationTab() {
  const reports = useEprStore(state => state.productionReports);
  const finishedProducts = usePackagingStore(state => state.finishedProducts);
  const packagingComponents = usePackagingStore(state => state.packagingComponents);

  const currentReport = reports.length > 0 ? reports[reports.length - 1] : null;

  // 1. 매핑 완료된 '자사' 제품만 필터링하여 집계 데이터 생성
  const aggregationData = useMemo(() => {
    if (!currentReport || !currentReport.mappings) return [];

    const result = [];

    currentReport.mappings.forEach(mapping => {
      // 매핑 완료되고(자사), 출고량이 있는 경우만
      if (mapping.status === 'mapped' && mapping.matchedProductId && mapping.originalQty > 0) {
        const product = finishedProducts.find(p => p.id === mapping.matchedProductId);
        if (!product) return;

        // 최신 버전의 BOM 가져오기
        const latestVersion = product.versions && product.versions.length > 0 
          ? product.versions[product.versions.length - 1] 
          : { bomItems: [] };

        let totalPlasticWeightPerUnit = 0;
        let eprItemCode = ''; // 주 용기의 EPR 품목코드

        // BOM을 순회하며 플라스틱 중량 합산
        latestVersion.bomItems.forEach(bomItem => {
          // 플라스틱 재질인 경우만 합산
          if (PLASTIC_MATERIALS.includes(bomItem.material)) {
            totalPlasticWeightPerUnit += (bomItem.weight || 0) * (bomItem.qty || 1);
          }
          
          // 1차 포장(용기 본체)인 경우 EPR 품목코드 결정
          if (bomItem.type === '1차포장' && !eprItemCode) {
            // 여기서는 단순화하여 기본값 사용
            eprItemCode = '0450';
          }
        });

        // 엑셀 생성을 위한 데이터 포맷팅
        result.push({
          id: mapping.id,
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          mfgType: product.mfgType || '제조',
          brandType: product.brandType || '자사',
          annualVolume: mapping.originalQty,
          unitWeight: totalPlasticWeightPerUnit,
          totalWeight: totalPlasticWeightPerUnit * mapping.originalQty,
          itemCode: eprItemCode || '0450', // 기본값: 단일재질 용기
          filmType: eprItemCode === '0460' ? '포장재' : ''
        });
      }
    });

    return result;
  }, [currentReport, finishedProducts, packagingComponents]);

  // 2. 전체 통계 계산
  const stats = useMemo(() => {
    let totalItems = aggregationData.length;
    let totalWeightGrams = 0;

    aggregationData.forEach(item => {
      totalWeightGrams += item.totalWeight;
    });

    const totalWeightKg = totalWeightGrams / 1000;
    const totalWeightTon = totalWeightKg / 1000;
    
    // 4톤 미만이면 면제
    const isExempt = totalWeightTon < 4;

    return { totalItems, totalWeightKg, totalWeightTon, isExempt };
  }, [aggregationData]);

  // 3. 엑셀 다운로드 핸들러
  const handleDownloadExcel = () => {
    const year = currentReport?.year || new Date().getFullYear();
    generateEprExcel(aggregationData, year);
  };

  if (!currentReport || !currentReport.mappings || currentReport.mappings.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500  bg-white  rounded-lg border border-gray-200 dark:border-gray-700">
        이전 단계에서 제품 매핑을 완료해주세요.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 안내 배너 */}
      <div className="bg-brand-50  border border-blue-200  rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-brand-500  shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">자사 브랜드 제품만 EPR 신고 대상입니다.</h4>
          <p className="text-sm text-blue-700  mt-1">
            법적 근거: 자원재활용법 시행령 제18조에 따라, 타사 상표가 부착된 제품(OEM/사입 등)은 상표권자가 직접 신고해야 하므로 본 시스템의 신고 취합 목록에서 자동 제외되었습니다.
          </p>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white  p-5 rounded-lg border border-gray-200  shadow-sm flex flex-col justify-center">
          <div className="text-sm font-medium text-gray-500  mb-1">신고 대상 제품 수</div>
          <div className="text-3xl font-bold text-gray-900  flex items-baseline gap-2">
            {stats.totalItems} <span className="text-sm font-normal text-gray-500">개 품목</span>
          </div>
        </div>

        <div className="bg-white  p-5 rounded-lg border border-gray-200  shadow-sm flex flex-col justify-center">
          <div className="text-sm font-medium text-gray-500  mb-1">총 플라스틱 배출량</div>
          <div className="text-3xl font-bold text-gray-900  flex items-baseline gap-2">
            {stats.totalWeightKg.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-sm font-normal text-gray-500">kg</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">(= {stats.totalWeightTon.toFixed(3)} 톤)</div>
        </div>

        <div className={`p-5 rounded-lg border shadow-sm flex flex-col justify-center relative overflow-hidden ${stats.isExempt ? 'bg-green-50  border-green-200 dark:border-green-800' : 'bg-yellow-50  border-yellow-200 dark:border-yellow-800'}`}>
          <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 ${stats.isExempt ? 'text-green-600' : 'text-yellow-600'}`}>
            <ShieldCheck className="w-full h-full transform translate-x-4 -translate-y-4" />
          </div>
          <div className="text-sm font-medium text-gray-500  mb-1">분담금 면제 여부 판단</div>
          <div className={`text-2xl font-bold flex items-center gap-2 ${stats.isExempt ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
            {stats.isExempt ? '면제 대상' : '납부 대상'}
          </div>
          <div className="text-xs text-gray-500  mt-2">
            기준: 연간 출고량 4톤 {stats.isExempt ? '미만 (충족)' : '이상 (초과)'}
          </div>
        </div>
      </div>

      {/* 테이블 & 다운로드 버튼 */}
      <div className="bg-white  rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200  flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-bold text-gray-900  flex items-center gap-2">
            <Calculator className="w-5 h-5 text-gray-400" />
            신고 대상 제품 상세 목록
          </h3>
          <button
            onClick={handleDownloadExcel}
            disabled={aggregationData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            EPR 신고 엑셀 다운로드
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  uppercase tracking-wider">제품코드</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  uppercase tracking-wider">상품명</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500  uppercase tracking-wider">EPR 품목코드</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500  uppercase tracking-wider">연간출고량 (개)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500  uppercase tracking-wider">개당 플라스틱(g)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500  uppercase tracking-wider">총 중량 (kg)</th>
              </tr>
            </thead>
            <tbody className="bg-white  divide-y divide-gray-200 dark:divide-gray-700">
              {aggregationData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                    {item.productCode}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {item.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800  dark:text-gray-300">
                      {item.itemCode}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-200">
                    {item.annualVolume.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-200">
                    {item.unitWeight.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-brand-500 dark:text-brand-400">
                    {(item.totalWeight / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {aggregationData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    신고 대상 데이터가 없습니다. (매핑이 완료되었는지 확인해주세요.)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
