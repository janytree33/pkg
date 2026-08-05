/**
 * EprAggregationTab.jsx (Phase 0 개선)
 * ─────────────────────────────────────
 * EPR 신고 취합 탭
 *
 * 법령 기준(『자원재활용법 시행령』 별표 4) 적용:
 * - 재질 그룹별(합성수지/유리/금속/필름/종이팩/발포) 중량 분리 집계
 * - 각 재질별 면제 기준(톤)과 비교하여 면제/납부 자동 판정
 * - 매출액 기준 전체 면제 조건 안내
 * - 종이 단상자 자동 0g 처리 (부속 플라스틱은 합성수지로 계산)
 *
 * ═══ Phase 0 수정사항 ═══
 * [Bug-1] 다부속 부자재(subComponents) 재질/중량 분개 집계
 *   - 기존: component.material + component.weightPerUnit만 사용 → 다부속 재질 누락
 *   - 수정: subComponents가 있으면 각 부속의 material/weight로 개별 그룹 분개
 *
 * [Bug-2] 상세 테이블에 금속 컬럼 추가
 *   - 기존: 합성수지/필름/유리 3개 컬럼만 존재
 *   - 수정: 금속(g/개) 컬럼 추가
 */
import React, { useMemo, useState } from 'react';
import { Download, Info, ShieldCheck, AlertTriangle } from 'lucide-react';
import useEprStore from '../../stores/eprStore';
import usePackagingStore from '../../stores/packagingStore';
import { EPR_MATERIAL_GROUPS, EPR_EXCLUDED_MATERIALS } from '../../utils/constants';
import { generateEprExcel } from '../../utils/eprExcelGenerator';

export default function EprAggregationTab() {
  const reports = useEprStore(state => state.productionReports);
  const finishedProducts = usePackagingStore(state => state.finishedProducts);
  const packagingComponents = usePackagingStore(state => state.packagingComponents);

  const currentReport = reports.length > 0 ? reports[reports.length - 1] : null;

  // 상세 내역 펼침 상태
  const [expandedGroup, setExpandedGroup] = useState(null);

  // ═══════════════════════════════════════════════════════════
  // 1. 재질 그룹별 중량 집계 (다부속 분개 적용)
  //
  // [핵심 변경] 다부속 부자재 처리 방식:
  //   기존: component.material 하나만 확인 → 다부속(material='')이면 어떤 그룹에도 안 잡힘
  //   수정: component.subComponents가 있으면 각 부속의 material/weight로 개별 분개
  //
  // 예) 튜브 세트 (subComponents: [본체 PE 3.5g, 캡 PP 1.2g])
  //   → 합성수지 그룹에 3.5 + 1.2 = 4.7g 합산
  //
  // 예) 유리앰플+금속캡 세트 (subComponents: [유리 Glass 15g, 캡 Aluminium 2g])
  //   → 유리병 그룹에 15g, 금속캔 그룹에 2g 분개
  // ═══════════════════════════════════════════════════════════
  const { groupResults, productRows } = useMemo(() => {
    if (!currentReport || !currentReport.mappings) {
      return { groupResults: [], productRows: [] };
    }

    // 재질 그룹별 전체 중량 누적 맵 (g 단위)
    const groupWeights = {};
    EPR_MATERIAL_GROUPS.forEach(g => { groupWeights[g.id] = 0; });

    const productRows = [];

    currentReport.mappings.forEach(mapping => {
      if (mapping.status !== 'mapped' || !mapping.matchedProductId || mapping.originalQty <= 0) return;

      // ★ 견본품(S)은 EPR 신고에서 제외 (별도 라인 표시만)
      if (mapping.isSample) {
        productRows.push({
          id: mapping.id,
          code: '--',
          name: mapping.originalName,
          mfgType: '견본품',
          brandType: '자사',
          annualQty: mapping.originalQty,
          perUnitGrams: 0,
          totalGrams: 0,
          byGroup: {},
          isSample: true,
          isRefill: false,
          isHerbal: mapping.isHerbal || false,
          excludeReason: '견본품(S) — EPR 신고 제외 적용',
        });
        return; // 견본품은 중량 합산 제외
      }

      const product = finishedProducts.find(p => p.id === mapping.matchedProductId);
      if (!product) return;

      const latestVersion = product.versions?.length > 0
        ? product.versions[product.versions.length - 1]
        : { bomItems: [] };

      // 이 제품의 1개당 재질 그룹별 중량을 집계합니다.
      const perUnitByGroup = {};
      EPR_MATERIAL_GROUPS.forEach(g => { perUnitByGroup[g.id] = 0; });

      latestVersion.bomItems.forEach(bomItem => {
        const component = packagingComponents.find(c => c.id === bomItem.componentId);
        if (!component) return;

        const qty = Number(bomItem.qty) || 1;

        // ════════════════════════════════════════════════
        // ★ Phase 0 핵심 수정: 다부속 부자재 분개 처리
        // ════════════════════════════════════════════════
        if (component.subComponents && component.subComponents.length > 0) {
          // 다부속 부자재: 각 부속의 재질/중량을 개별적으로 해당 그룹에 분개합니다.
          // 예: 튜브세트의 본체(PE, 3.5g) → 합성수지 그룹에 3.5 × qty
          //     튜브세트의 캡(PP, 1.2g)  → 합성수지 그룹에 1.2 × qty
          component.subComponents.forEach(sub => {
            const subMaterial = sub.material || '';
            const subWeight = Number(sub.weight) || 0;

            // 제외 재질(종이 단상자 등)은 건너뜁니다.
            if (EPR_EXCLUDED_MATERIALS.includes(subMaterial)) return;

            // 해당 부속의 재질이 어느 그룹에 속하는지 찾습니다.
            const group = EPR_MATERIAL_GROUPS.find(g => g.materials.includes(subMaterial));
            if (group) {
              perUnitByGroup[group.id] += subWeight * qty;
            }
          });
        } else {
          // 단일 재질 부자재: 기존 로직 그대로 사용합니다.
          const material = component.material || '';
          const weightPerUnit = Number(component.weightPerUnit) || 0;
          const itemWeight = weightPerUnit * qty;

          // 제외 재질 건너뛰기
          if (EPR_EXCLUDED_MATERIALS.includes(material)) return;

          const group = EPR_MATERIAL_GROUPS.find(g => g.materials.includes(material));
          if (group) {
            perUnitByGroup[group.id] += itemWeight;
          }
        }
      });

      // 연간 출고량 × 개당 중량 = 해당 제품의 연간 총 배출량
      Object.keys(perUnitByGroup).forEach(groupId => {
        groupWeights[groupId] += perUnitByGroup[groupId] * mapping.originalQty;
      });

      const totalPerUnitGrams = Object.values(perUnitByGroup).reduce((a, b) => a + b, 0);
      productRows.push({
        id: mapping.id,
        code: product.code,
        name: product.name,
        mfgType: product.mfgType || '제조',
        brandType: product.brandType || '자사',
        annualQty: mapping.originalQty,
        perUnitGrams: totalPerUnitGrams,
        totalGrams: totalPerUnitGrams * mapping.originalQty,
        byGroup: perUnitByGroup,
        isSample: false,
        isRefill:  mapping.isRefill  || false,
        isHerbal:  mapping.isHerbal  || false,
        isCustom:  mapping.isCustom  || false,
        itemCode: '0450',
      });
    });

    // 각 재질 그룹의 합계 → 톤 변환 → 면제 기준 비교
    const groupResults = EPR_MATERIAL_GROUPS.map(group => {
      const totalGrams = groupWeights[group.id] || 0;
      const totalKg = totalGrams / 1000;
      const totalTon = totalKg / 1000;
      const isExempt = totalTon < group.exemptionTonnes;
      const progressPct = Math.min(100, (totalTon / group.exemptionTonnes) * 100);
      return { ...group, totalGrams, totalKg, totalTon, isExempt, progressPct };
    });

    return { groupResults, productRows };
  }, [currentReport, finishedProducts, packagingComponents]);

  // 2. 전체 합계
  const totalTons = groupResults.reduce((s, g) => s + g.totalTon, 0);
  const anyDue = groupResults.some(g => g.totalGrams > 0 && !g.isExempt);
  const allExempt = groupResults.every(g => g.totalGrams === 0 || g.isExempt);

  // 3. 엑셀 다운로드
  const handleDownloadExcel = () => {
    const year = currentReport?.year || new Date().getFullYear();
    generateEprExcel(productRows, year);
  };

  // ─── 데이터가 없을 때의 안내 화면 ───
  if (!currentReport || !currentReport.mappings || currentReport.mappings.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-100">
        <ShieldCheck size={40} className="mx-auto mb-3 opacity-30" />
        이전 단계에서 제품 매핑을 완료해 주세요.
      </div>
    );
  }

  // ═══════════════════════════════════════
  // 렌더링 시작
  // ═══════════════════════════════════════
  return (
    <div className="space-y-5">

      {/* ─── 상단 안내 배너 ─── */}
      <div
        className="flex gap-3 p-4 rounded-xl border border-emerald-100"
        style={{ background: 'linear-gradient(90deg,#f0fdf9,#ecfeff)' }}
      >
        <Info size={18} className="text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-emerald-800 mb-1">재질별 분리 집계 & 면제 자동 판정</p>
          <p className="text-emerald-700 text-xs leading-relaxed">
            • <strong>종이 단상자</strong>는 자동 0g 제외. 단, 본 단상자의 <strong>PET 창문 · 수축 비닐</strong>은 합성수지로 등록 필요.<br />
            • <strong>다부속 부자재</strong>(튜브 등)는 각 부속의 재질별로 <strong>자동 분개</strong> 집계됩니다.<br />
            • <strong>견본품(S)</strong>는 신고량에서 차감되어 집계에서 <strong>자동 제외</strong>됩니다 (아래 표에 별도 표시).<br />
            • <strong>리필제품(R)</strong>은 신고 대상에 포함되나 별도 표시되어 확인이 용이합니다.
          </p>
        </div>
      </div>

      {/* ─── 매출액 기준 전체 면제 안내 ─── */}
      <div className="flex gap-3 p-4 rounded-xl border border-amber-100 bg-amber-50">
        <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <p className="font-semibold mb-1">📌 매출액 기준 전체 면제 먼저 확인하세요!</p>
          <div className="flex flex-wrap gap-4">
            <span>🏭 <strong>국내 제조업자</strong>: 전년도 총매출액 <strong>10억원 미만</strong> → 모든 재질 100% 면제</span>
            <span>🛳️ <strong>수입업자</strong>: 전년도 총수입액(CIF) <strong>3억원 미만</strong> → 모든 재질 100% 면제</span>
          </div>
          <p className="mt-1 text-amber-600">위 기준에 해당하면 아래 재질별 계산과 무관하게 전체 면제입니다. 기준 및 계정관리 → 재무정보에서 매출액을 관리하세요.</p>
        </div>
      </div>

      {/* ─── 재질 그룹별 면제 판정 카드 ─── */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3">📊 재질별 연간 배출량 & 면제 기준 비교</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {groupResults.map(group => (
            <div
              key={group.id}
              className="rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md"
              style={{ background: group.bgColor, borderColor: group.borderColor }}
              onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{group.icon}</span>
                  <span className="text-sm font-semibold" style={{ color: group.color }}>
                    {group.label}
                  </span>
                </div>
                {/* 면제/납부 뱃지 */}
                {group.totalGrams === 0 ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 font-medium">해당없음</span>
                ) : group.isExempt ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">✅ 면제</span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">💰 납부대상</span>
                )}
              </div>

              {/* 배출량 수치 */}
              <div className="mb-2">
                <span className="text-2xl font-bold text-slate-800">
                  {group.totalTon.toFixed(3)}
                </span>
                <span className="text-xs text-slate-500 ml-1">톤</span>
                <span className="text-xs text-slate-400 ml-2">
                  ({group.totalKg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg)
                </span>
              </div>

              {/* 진행바 (면제 기준 대비 비율) */}
              <div className="mb-1">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>면제 기준: {group.exemptionTonnes}톤 미만</span>
                  <span>{group.progressPct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-white rounded-full overflow-hidden border border-white/50">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${group.progressPct}%`,
                      backgroundColor: group.isExempt ? group.color : '#ef4444',
                    }}
                  />
                </div>
              </div>

              {/* 예시 설명 */}
              <div className="flex items-center justify-end mt-1">
                <span className="text-[10px] text-slate-400">{group.examples}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 종합 면제 판정 요약 ─── */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border"
        style={allExempt
          ? { background: '#f0fdf4', borderColor: '#bbf7d0' }
          : { background: '#fef9f0', borderColor: '#fed7aa' }
        }
      >
        <div className="flex items-center gap-3">
          <ShieldCheck
            size={32}
            className={allExempt ? 'text-emerald-500' : 'textorange-500'}
          />
          <div>
            <div className="text-sm font-bold text-slate-800">
              {allExempt ? '✅ 전체 재질 면제 대상입니다' : '⚠️ 일부 재질 분담금 납부 대상입니다'}
            </div>
            <div className="text-xs text-slate-500">
              전체 총 배출량: <strong>{totalTons.toFixed(3)}톤</strong>
              {anyDue && (
                <span className="ml-2 text-orange-600">
                  — 납부 대상 재질: {groupResults.filter(g => !g.isExempt && g.totalGrams > 0).map(g => g.shortLabel).join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 엑셀 다운로드 버튼 */}
        <button
          onClick={handleDownloadExcel}
          disabled={productRows.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:shadow-md disabled:opacity-40"
          style={{ background: 'linear-gradient(90deg,#10b981,#06b6d4)' }}
        >
          <Download size={16} />
          EPR 신고 엑셀 다운로드
        </button>
      </div>

      {/* ─── 제품별 상세 테이블 (금속 컬럼 추가) ─── */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-700">신고 대상 제품 상세 목록</h4>
          <span className="text-xs text-slate-400">총 {productRows.length}개 품목</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">제품코드</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">상품명</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500">제조/수입</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500">연간출고량(개)</th>
                {/* ★ 재질 그룹별 개당중량 컬럼 */}
                <th className="px-3 py-3 text-right text-xs font-semibold text-emerald-600">합성수지(g)</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-cyan-600">필름(g)</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-blue-600">유리(g)</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500">금속(g)</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-slate-700">합계배출(kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {productRows.map((row) => (
                <tr key={row.id} className={`hover:bg-slate-50 transition-colors ${
                  row.isSample ? 'bg-orange-50/60' : row.isRefill ? 'bg-blue-50/40' : ''
                }`}>
                  {/* 제품코드 */}
                  <td className="px-3 py-3 text-xs font-mono text-slate-500">
                    {row.isSample ? (
                      <span className="text-orange-400 text-[10px] font-bold">견본품(S)</span>
                    ) : row.code}
                  </td>
                  {/* 상품명 + 플래그 뱃지 */}
                  <td className="px-3 py-3 text-sm text-slate-800 font-medium">
                    <span>{row.name}</span>
                    {row.isRefill && <span className="ml-1 text-[10px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded">R리필</span>}
                    {row.isHerbal && <span className="ml-1 text-[10px] bg-green-100 text-green-600 px-1 py-0.5 rounded">H한방</span>}
                    {row.isSample && <span className="ml-1 text-[10px] bg-orange-100 text-orange-600 px-1 py-0.5 rounded">EPR 제외</span>}
                  </td>
                  {/* 제조/수입 */}
                  <td className="px-3 py-3 text-center">
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">{row.mfgType}</span>
                  </td>
                  {/* 연간출고량 */}
                  <td className="px-3 py-3 text-right text-sm font-mono text-slate-700">
                    {row.annualQty.toLocaleString()}
                  </td>
                  {/* 합성수지(g/개) */}
                  <td className="px-3 py-3 text-right text-xs font-mono text-emerald-700">
                    {row.isSample ? <span className="text-orange-300">제외</span> : (row.byGroup?.plastic || 0).toFixed(4)}
                  </td>
                  {/* 필름(g/개) */}
                  <td className="px-3 py-3 text-right text-xs font-mono text-cyan-700">
                    {row.isSample ? '—' : (row.byGroup?.film || 0).toFixed(4)}
                  </td>
                  {/* 유리(g/개) */}
                  <td className="px-3 py-3 text-right text-xs font-mono text-blue-700">
                    {row.isSample ? '—' : (row.byGroup?.glass || 0).toFixed(4)}
                  </td>
                  {/* ★ 금속(g/개) — 신규 추가 */}
                  <td className="px-3 py-3 text-right text-xs font-mono text-slate-600">
                    {row.isSample ? '—' : (row.byGroup?.metal || 0).toFixed(4)}
                  </td>
                  {/* 합계배출(kg) */}
                  <td className="px-3 py-3 text-right text-sm font-bold text-slate-800">
                    {row.isSample
                      ? <span className="text-orange-400 text-xs">제외</span>
                      : (row.totalGrams / 1000).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })
                    }
                  </td>
                </tr>
              ))}
              {productRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-400 text-sm">
                    신고 대상 데이터가 없습니다. 이전 단계에서 제품 매핑을 완료해 주세요.
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