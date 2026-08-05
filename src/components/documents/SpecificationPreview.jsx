import React, { forwardRef, useMemo } from 'react';
import useSettingsStore from '../../stores/settingsStore';
import usePackagingStore from '../../stores/packagingStore';
import { formatDateForSpec, EPR_MATERIAL_GROUPS, EPR_EXCLUDED_MATERIALS } from '../../utils/constants';

/**
 * SpecificationPreview.jsx (Phase 0 개선)
 * ─────────────────────────────────────
 * PDF 및 인쇄를 위한 A4 사양서 미리보기 컴포넌트입니다.
 * html2pdf.js가 화면을 정확히 PDF로 변환할 수 있도록
 * 모든 디자인 요소는 '인라인 스타일(Inline Style)'로 엄격하게 작성되었습니다.
 *
 * ═══ Phase 0 수정사항 ═══
 * [Bug-1] 다부속 부자재(subComponents) 재질 개별 인식
 *   - 기존: comp.material만 검사 → 다부속은 재질이 ''이므로 무조건 비대상으로 빠짐
 *   - 수정: comp.subComponents 배열을 순회하여 각 부속의 material/weight를 독립 판별
 *
 * [Bug-2] 재질 그룹별(합성수지/유리/금속/필름 등) 독립 테이블 분리 출력
 *   - 기존: PLASTIC_MATERIALS 기준으로 대상/비대상 2분류 → 유리·금속이 비대상으로 빠짐
 *   - 수정: EPR_MATERIAL_GROUPS(6개 재질 그룹) 기준으로 각각 독립 섹션+테이블 렌더링
 */

// ─── 헬퍼 함수: 로컬/원격 이미지 안전 처리 (CORS 및 캐시 버스터) ───
const getSafeImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) {
    return url;
  }
  return url + (url.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
};

const getSafeCrossOrigin = (url) => {
  if (!url) return undefined;
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) {
    return undefined;
  }
  return "anonymous";
};

// ─── 재질 그룹별 사양서 섹션 디자인 설정 ───
// 각 그룹(합성수지, 유리, 금속 등)마다 타이틀 텍스트, 합계 라벨, 좌측 포인트 색상을 정의합니다.
// 해당 그룹에 아이템이 없으면 해당 섹션은 자동으로 숨겨집니다.
const SECTION_CONFIG = {
  plastic:   { title: 'TARGET — SYNTHETIC RESIN (합성수지류)',  totalLabel: 'TOTAL PLASTIC WEIGHT',    borderColor: '#111827' },
  film:      { title: 'TARGET — FILM / SHEET (필름·시트)',      totalLabel: 'TOTAL FILM WEIGHT',        borderColor: '#06b6d4' },
  glass:     { title: 'TARGET — GLASS (유리병)',                totalLabel: 'TOTAL GLASS WEIGHT',       borderColor: '#3b82f6' },
  metal:     { title: 'TARGET — METAL CAN (금속캔)',            totalLabel: 'TOTAL METAL WEIGHT',       borderColor: '#64748b' },
  paperpack: { title: 'TARGET — PAPER PACK (종이팩)',           totalLabel: 'TOTAL PAPER PACK WEIGHT',  borderColor: '#f59e0b' },
  foam:      { title: 'TARGET — FOAM (발포합성수지)',           totalLabel: 'TOTAL FOAM WEIGHT',        borderColor: '#8b5cf6' },
};

const SpecificationPreview = forwardRef(({ product, versionIndex, certNo, remark, issueDate, showEvalResult, showFinalGrade, docLanguage }, ref) => {
  // ─── 스토어에서 회사 정보와 포장재 마스터 데이터를 불러옵니다 ───
  const { companyInfo } = useSettingsStore();
  const { packagingComponents } = usePackagingStore();

  const isKo = docLanguage === 'ko';

  // 선택된 제품 정보가 없다면 화면을 그리지 않습니다.
  if (!product) return null;

  // 선택된 제품의 버전 정보를 가져옵니다. (기본값 처리 포함)
  const version = product.versions && product.versions.length > 0
    ? product.versions[versionIndex] || product.versions[0]
    : { version: '1.0', bomItems: [] };

  // ═══════════════════════════════════════════════════════════════
  // 핵심 로직: BOM 아이템을 재질 그룹별로 분류합니다.
  //
  // [다부속 부자재 처리 방식]
  // 예) "튜브 세트"라는 부자재 1개가 BOM에 등록되어 있고,
  //     subComponents = [{ name: '본체', material: 'PE', weight: 3.5 },
  //                      { name: '캡',   material: 'PP', weight: 1.2 }]
  //     인 경우:
  //     → "튜브 세트 → 본체" (PE, 3.5g)를 합성수지 테이블에 배치
  //     → "튜브 세트 → 캡"   (PP, 1.2g)를 합성수지 테이블에 배치
  //
  // [단일 재질 부자재 처리]
  // 예) "단상자"라는 부자재의 material='Paper (단상자/제외)'
  //     → EPR_EXCLUDED_MATERIALS에 해당 → 비대상(EXEMPT) 테이블에 배치
  // ═══════════════════════════════════════════════════════════════
  const { groupedItems, exemptItems } = useMemo(() => {
    // 각 재질 그룹 ID를 키(key)로 하는 빈 배열 맵을 초기화합니다.
    // 예: { plastic: [], film: [], glass: [], metal: [], ... }
    const grouped = {};
    EPR_MATERIAL_GROUPS.forEach(g => { grouped[g.id] = []; });
    const exempt = [];

    /**
     * classifyItem — 하나의 "표시용 아이템"을 적절한 재질 그룹(또는 비대상)에 배치합니다.
     * @param {string} material - 해당 부품의 재질명 (예: 'PE', 'Glass (유리병)')
     * @param {string} containerType - 용기형태 (예: '0450', '신고제외')
     * @param {object} displayItem - 테이블에 실제로 표시할 아이템 객체 { bItem, comp }
     */
    const classifyItem = (material, containerType, displayItem) => {
      // (1) EPR 완전 제외 재질(종이 단상자 등)이면 → 무조건 비대상
      if (EPR_EXCLUDED_MATERIALS.includes(material)) {
        exempt.push(displayItem);
        return;
      }
      // (2) 6대 재질 그룹 중 어디에 속하는지 찾습니다
      const group = EPR_MATERIAL_GROUPS.find(g => g.materials.includes(material));
      if (group) {
        // 용기형태가 '신고제외'로 시작하면 → 비대상
        if (containerType && containerType.startsWith('신고제외')) {
          exempt.push(displayItem);
        } else {
          // ★ 해당 재질 그룹의 배열에 추가 (정상 신고 대상)
          grouped[group.id].push(displayItem);
        }
      } else {
        // (3) 어떤 그룹에도 매칭되지 않는 재질 → 비대상으로 분류
        exempt.push(displayItem);
      }
    };

    // ─── BOM 아이템 순회 ───
    (version.bomItems || []).forEach(bItem => {
      // 포장재 마스터에서 해당 부자재의 최신 정보를 찾습니다.
      const comp = packagingComponents.find(c => c.id === (bItem.componentId || bItem.component_id));
      if (!comp) return;

      const qty = Number(bItem.qty) || 1;

      // ════════════════════════════════════════
      // Case A: 다부속 부자재 (subComponents가 존재)
      // ════════════════════════════════════════
      // 예: 튜브 세트 = 본체(PE) + 캡(PP) + 중관(EVOH)
      // → 각 부속을 독립 아이템으로 풀어서 해당 재질 그룹에 각각 배치합니다.
      if (comp.subComponents && comp.subComponents.length > 0) {
        comp.subComponents.forEach((sub, subIdx) => {
          const subMaterial = sub.material || '';
          const subWeight = Number(sub.weight) || 0;
          const subContainerType = sub.containerType || comp.containerType || '';

          // 화면에 표시할 아이템 객체를 만듭니다.
          // 이름: "부모명 → 부속명" 형태로 구분하여 어떤 부품의 어떤 부속인지 명확히 표시
          const displayItem = {
            bItem,
            comp: {
              ...comp,
              name: `${comp.name} → ${sub.name || '부속' + (subIdx + 1)}`,
              material: subMaterial,
              weightPerUnit: subWeight,
              containerType: subContainerType,
            },
            isSubComponent: true,
          };

          classifyItem(subMaterial, subContainerType, displayItem);
        });
      }
      // ════════════════════════════════════════
      // Case B: 단일 재질 부자재 (기존 방식)
      // ════════════════════════════════════════
      else {
        const material = comp.material || '';
        const containerType = comp.containerType || '';
        const displayItem = { bItem, comp, isSubComponent: false };
        classifyItem(material, containerType, displayItem);
      }
    });

    return { groupedItems: grouped, exemptItems: exempt };
  }, [version.bomItems, packagingComponents]);

  // ─── 완제품 최종 재활용 등급 산출 로직 ───
  const getGradeRank = (grade) => {
    if (!grade || grade.includes('미평가')) return 99;
    if (grade.includes('최우수')) return 1;
    if (grade.includes('우수')) return 2;
    if (grade.includes('보통') || grade.includes('용이')) return 3;
    if (grade.includes('어려움')) return 4;
    return 99;
  };

  const calculateFinalGrade = () => {
    if (!version?.bomItems || version.bomItems.length === 0) return '-';
    
    let maxRank = 0;
    let hasUnevaluated = false;

    for (const item of version.bomItems) {
      const comp = packagingComponents.find(c => String(c.id) === String(item.componentId || item.component_id));
      const grade = comp?.materialEvalResult || '미평가';
      
      if (grade.includes('미평가')) {
        hasUnevaluated = true;
        break;
      }
      
      const rank = getGradeRank(grade);
      if (rank > maxRank) maxRank = rank;
    }

    if (hasUnevaluated) return isKo ? '평가 진행중(미평가)' : 'Pending (Not Evaluated)';
    
    switch(maxRank) {
      case 1: return isKo ? '최우수 (Best)' : 'Best';
      case 2: return isKo ? '우수 (Excellent)' : 'Excellent';
      case 3: return isKo ? '보통 (Normal)' : 'Normal';
      case 4: return isKo ? '어려움 (Difficult)' : 'Difficult';
      default: return isKo ? '평가 진행중(미평가)' : 'Pending (Not Evaluated)';
    }
  };

  const finalGrade = calculateFinalGrade();


  /**
   * calculateGroupTotal — 특정 아이템 배열의 총 중량(g)을 계산합니다.
   * 계산식: Σ (개당중량 × BOM 수량)
   * @param {Array} items - { bItem, comp } 배열
   * @returns {number} 총 중량 (g)
   */
  const calculateGroupTotal = (items) => {
    let total = 0;
    items.forEach(({ bItem, comp }) => {
      total += (Number(comp.weightPerUnit) || 0) * (Number(bItem.qty) || 1);
    });
    return total;
  };

  /**
   * renderRows — 아이템 배열을 테이블 행(tr) 배열로 변환합니다.
   * BOM 항목의 processType('충진'/'포장')으로 섹션을 구분합니다.
   * @param {Array} items - { bItem, comp } 배열
   * @param {string} prefixKey - React key 중복 방지를 위한 접두사
   */
  const renderRows = (items, prefixKey) => {
    // processType(공정구분)으로 충진/포장을 나눕니다.
    const filling = items.filter(i => i.bItem.processType === '충진');
    const packaging = items.filter(i => i.bItem.processType !== '충진');

    let rows = [];
    let globalNo = 1;
    
    // 개별 행 생성 함수
    const createRow = ({ bItem, comp }, idx, groupName) => {
      const weight = Number(comp.weightPerUnit) || 0;
      const quantity = Number(bItem.qty) || 1;
      const totalWeight = weight * quantity;
      return (
        <tr key={`${prefixKey}-${groupName}-${idx}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
          <td style={{ padding: '5px 4px', textAlign: 'center', color: '#6b7280', fontSize: '10px' }}>{globalNo++}</td>
          <td style={{ padding: '5px 4px', fontWeight: '500', wordBreak: 'break-all', fontSize: '10px' }}>{comp.name}</td>
          <td style={{ padding: '5px 4px', color: '#4b5563', wordBreak: 'break-all', fontSize: '10px' }}>{comp.material || '-'}</td>
          {showEvalResult && <td style={{ padding: '5px 4px', color: '#3b82f6', fontWeight: '600', wordBreak: 'break-all', fontSize: '10px' }}>
            {isKo 
              ? (comp.materialEvalResult || '미평가')
              : (comp.materialEvalResult === '재활용 최우수' ? 'Best' :
                 comp.materialEvalResult === '재활용 우수' ? 'Excellent' :
                 comp.materialEvalResult === '재활용 보통' ? 'Normal' :
                 comp.materialEvalResult === '재활용 어려움' ? 'Difficult' : 'Pending')}
          </td>}
          <td style={{ padding: '5px 4px', color: '#6b7280', wordBreak: 'break-all', fontSize: '10px' }}>{comp.code || '-'}</td>
          <td style={{ padding: '5px 4px', color: '#6b7280', wordBreak: 'break-all', fontSize: '10px' }}>{comp.remark || comp.description || '-'}</td>
          <td style={{ padding: '5px 4px', textAlign: 'right', fontSize: '10px' }}>{weight.toFixed(6)}</td>
          <td style={{ padding: '5px 4px', textAlign: 'center', fontSize: '10px' }}>{quantity}</td>
          <td style={{ padding: '5px 4px', textAlign: 'right', fontSize: '10px' }}>{totalWeight.toFixed(6)}</td>
        </tr>
      );
    };

    // 충진 부자재 섹션 헤더 + 행
    if (filling.length > 0) {
      rows.push(
        <tr key={`${prefixKey}-hdr-fill`} style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
          <td colSpan={showEvalResult ? "9" : "8"} style={{ padding: '4px 12px', fontWeight: 'bold', color: '#374151', fontSize: '10px', letterSpacing: '0.5px' }}>
            {isKo ? '[ 충진 부자재 ]' : '[ Filling Components ]'}
          </td>
        </tr>
      );
      filling.forEach((item, idx) => rows.push(createRow(item, idx, 'fill')));
    }

    // 포장 부자재 섹션 헤더 + 행
    if (packaging.length > 0) {
      rows.push(
        <tr key={`${prefixKey}-hdr-pkg`} style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
          <td colSpan={showEvalResult ? "9" : "8"} style={{ padding: '4px 12px', fontWeight: 'bold', color: '#374151', fontSize: '10px', letterSpacing: '0.5px' }}>
            {isKo ? '[ 포장 부자재 ]' : '[ Packaging Components ]'}
          </td>
        </tr>
      );
      packaging.forEach((item, idx) => rows.push(createRow(item, idx, 'pkg')));
    }

    // 둘 다 없으면 "없음" 메시지
    if (rows.length === 0) {
      rows.push(
        <tr key={`${prefixKey}-empty`}>
          <td colSpan={showEvalResult ? "9" : "8"} style={{ padding: '14px 8px', textAlign: 'center', color: '#9ca3af', borderBottom: '1px solid #e5e7eb', fontSize: '10px' }}>
            {isKo ? '해당 부품이 없습니다.' : 'No components found.'}
          </td>
        </tr>
      );
    }
    return rows;
  };

  /**
   * renderMaterialSection — 하나의 재질 그룹을 완전한 섹션(타이틀 + 테이블 + 합계)으로 렌더링합니다.
   * 해당 그룹에 아이템이 없으면 아무것도 렌더링하지 않습니다(null 반환).
   */
  const renderMaterialSection = (groupId, items) => {
    if (!items || items.length === 0) return null;

    const config = SECTION_CONFIG[groupId];
    if (!config) return null;

    const totalWeight = calculateGroupTotal(items);
    
    // 타이틀 한국어 파싱 (예: "TARGET — SYNTHETIC RESIN (합성수지류)" -> "합성수지류 (SYNTHETIC RESIN)")
    const titleMatch = config.title.match(/TARGET — (.*) \((.*)\)/);
    const displayTitle = isKo && titleMatch ? `${titleMatch[2]} (${titleMatch[1]})` : config.title;
    
    const displayTotalLabel = isKo ? config.totalLabel.replace('TOTAL', '총').replace('WEIGHT', '중량') : config.totalLabel;

    return (
      <div key={groupId} style={{ marginBottom: '10px' }}>
        {/* 섹션 타이틀 (좌측 색상 포인트 바 포함) */}
        <div style={{
          fontSize: '12px',
          fontWeight: '700',
          marginBottom: '5px',
          borderLeft: `3px solid ${config.borderColor}`,
          paddingLeft: '8px',
          color: config.borderColor,
          textTransform: 'uppercase',
        }}>
          {displayTitle}
        </div>

        {/* 데이터 테이블 */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', tableLayout: 'fixed' }}>
          <thead>
            {showEvalResult ? (
              <tr style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db' }}>
                <th style={{ padding: '6px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'center', width: '4%' }}>No</th>
                <th style={{ padding: '6px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'left', width: '18%' }}>{isKo ? '부품명' : 'Component Name'}</th>
                <th style={{ padding: '6px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'left', width: '13%' }}>{isKo ? '재질' : 'Material'}</th>
                <th style={{ padding: '6px 4px', fontWeight: '600', color: '#3b82f6', textAlign: 'left', width: '12%' }}>{isKo ? '재질·구조 평가' : 'Recyclability Assessment'}</th>
                <th style={{ padding: '6px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'left', width: '12%' }}>{isKo ? 'ERP 코드' : 'ERP Code'}</th>
                <th style={{ padding: '6px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'left', width: '12%' }}>{isKo ? '비고' : 'Remark'}</th>
                <th style={{ padding: '6px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'right', width: '10%' }}>{isKo ? '중량(g)' : 'Weight(g)'}</th>
                <th style={{ padding: '6px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'center', width: '6%' }}>{isKo ? '수량' : 'Qty'}</th>
                <th style={{ padding: '6px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'right', width: '13%' }}>{isKo ? '총계(g)' : 'Total(g)'}</th>
              </tr>
            ) : (
              <tr style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db' }}>
                <th style={{ padding: '6px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'center', width: '5%' }}>No</th>
                <th style={{ padding: '6px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'left', width: '22%' }}>{isKo ? '부품명' : 'Component Name'}</th>
                <th style={{ padding: '6px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'left', width: '15%' }}>{isKo ? '재질' : 'Material'}</th>
                <th style={{ padding: '6px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'left', width: '13%' }}>{isKo ? 'ERP 코드' : 'ERP Code'}</th>
                <th style={{ padding: '6px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'left', width: '15%' }}>{isKo ? '비고' : 'Remark'}</th>
                <th style={{ padding: '6px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'right', width: '11%' }}>{isKo ? '중량(g)' : 'Weight(g)'}</th>
                <th style={{ padding: '6px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'center', width: '7%' }}>{isKo ? '수량' : 'Qty'}</th>
                <th style={{ padding: '6px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'right', width: '12%' }}>{isKo ? '총계(g)' : 'Total(g)'}</th>
              </tr>
            )}
          </thead>
          <tbody>
            {renderRows(items, `target-${groupId}`)}
            {/* 합계 행 */}
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #d1d5db' }}>
              <td colSpan={showEvalResult ? "8" : "7"} style={{ padding: '10px 8px', fontWeight: 'bold', color: config.borderColor, textAlign: 'center', letterSpacing: '1px', fontSize: '10px' }}>
                {displayTotalLabel}
              </td>
              <td style={{ padding: '10px 8px', fontWeight: 'bold', color: config.borderColor, textAlign: 'right', fontSize: '10px' }}>
                {totalWeight.toFixed(6)} g
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // ─── 아이템이 있는 재질 그룹만 추려냅니다 (빈 그룹은 사양서에 표시하지 않음) ───
  const activeGroups = EPR_MATERIAL_GROUPS.filter(g => groupedItems[g.id] && groupedItems[g.id].length > 0);

  // ─── 전체 신고 대상 중량 합계 (재질 그룹이 2개 이상일 때 GRAND TOTAL 표시용) ───
  const totalTargetWeight = activeGroups.reduce((sum, g) => sum + calculateGroupTotal(groupedItems[g.id]), 0);

  // ═══════════════════════════════════════
  // 렌더링 시작
  // ═══════════════════════════════════════
  return (
    <div
      ref={ref}
      className="a4-preview"
      style={{
        width: '210mm',
        padding: '12mm 15mm',
        backgroundColor: '#ffffff',
        fontFamily: '"Inter", "Pretendard", "Malgun Gothic", sans-serif',
        color: '#1f2937',
        boxSizing: 'border-box'
      }}
    >
      {/* ═══ 1. 상단 헤더: 회사 로고 및 문서 제목 ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          {companyInfo.logo ? (
            <div style={{ height: '50px', marginBottom: '8px' }}>
              <img
                crossOrigin={getSafeCrossOrigin(companyInfo.logo)}
                src={getSafeImageUrl(companyInfo.logo)}
                alt="Logo"
                style={{ height: '50px', display: 'block' }}
              />
            </div>
          ) : (
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#1f2937', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '24px', marginBottom: '8px' }}>J</div>
          )}
          <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px' }}>{companyInfo.nameKo || 'JANYTREE'}</div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#111827' }}>
            {isKo ? '용기 재질 및 중량 사양서' : 'Certificate of Specification'}
          </div>
          <div style={{ fontSize: '16px', color: '#6b7280', marginTop: '4px' }}>
            {isKo ? 'Packaging Specification' : '용기 재질 및 중량 사양서'}
          </div>
        </div>
      </div>

      {/* ═══ 2. 제품 메타 정보 테이블 ═══ */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '11px', borderTop: '2px solid #111827', borderBottom: '1px solid #e5e7eb', tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 6px', color: '#6b7280', width: '20%' }}>{isKo ? '품명' : 'Product Name'}</td>
            <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 6px', width: '30%', fontWeight: '500', wordBreak: 'break-all' }}>{isKo ? product.name : (product.nameEn || product.name)}</td>
            <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 6px', color: '#6b7280', width: '20%' }}>{isKo ? '버전' : 'Version'}</td>
            <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 6px', width: '30%', fontWeight: '500', wordBreak: 'break-all' }}>{version.version}</td>
          </tr>
          <tr>
            <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 6px', color: '#6b7280' }}>{isKo ? '코드' : 'Code'}</td>
            <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 6px', fontWeight: '500', wordBreak: 'break-all' }}>{product.code} v{version.version}</td>
            <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 6px', color: '#6b7280' }}>{isKo ? '인증번호' : 'Certificate No.'}</td>
            <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 6px', fontWeight: '500', wordBreak: 'break-all' }}>{certNo || '-'}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 6px', color: '#6b7280' }}>{isKo ? '비고' : 'Remark'}</td>
            <td style={{ padding: '8px 6px', fontWeight: '500', wordBreak: 'break-all' }}>{remark || '-'}</td>
            <td style={{ padding: '8px 6px', color: '#6b7280' }}>{isKo ? '발행일' : 'Date of Issue'}</td>
            <td style={{ padding: '8px 6px', fontWeight: '500', wordBreak: 'break-all' }}>{formatDateForSpec(issueDate)}</td>
          </tr>
          {showFinalGrade && (
            <tr>
              <td style={{ borderTop: '1px solid #e5e7eb', padding: '8px 6px', color: '#1e3a8a', fontWeight: 'bold' }}>
                {isKo ? '포장재 재활용 용이성 등급' : 'Recyclability Grade'}
              </td>
              <td colSpan="3" style={{ borderTop: '1px solid #e5e7eb', padding: '8px 6px', fontWeight: 'bold', color: finalGrade.includes('어려움') || finalGrade.includes('Difficult') ? '#dc2626' : '#2563eb' }}>
                {finalGrade}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ═══ 3. 재질 그룹별 신고 대상 테이블 (해당 그룹만 표시) ═══ */}
      {/* 예: 합성수지 아이템이 있으면 합성수지 테이블, 유리 아이템이 있으면 유리 테이블 */}
      {activeGroups.map(g => renderMaterialSection(g.id, groupedItems[g.id]))}

      {/* ═══ 4. 전체 신고 대상 총합 (재질 그룹이 2개 이상일 때만 표시) ═══ */}
      {/* 재질이 1종류뿐이면 그 테이블의 합계로 충분하므로 GRAND TOTAL은 숨깁니다 */}
      {activeGroups.length > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 12px',
          marginBottom: '12px',
          backgroundColor: '#111827',
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: 'bold',
          letterSpacing: '1px',
          borderRadius: '2px',
        }}>
          <span>GRAND TOTAL — ALL TARGET MATERIALS (전체 신고 대상 합계)</span>
          <span>{totalTargetWeight.toFixed(6)} g</span>
        </div>
      )}

      {/* ═══ 5. 비대상 부자재 테이블 (종이 단상자, 미분류 재질 등) ═══ */}
      {exemptItems.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '700',
            marginBottom: '5px',
            borderLeft: '3px solid #9ca3af',
            paddingLeft: '8px',
            color: '#6b7280',
            textTransform: 'uppercase',
          }}>
            EXEMPT COMPONENTS (비대상 부자재)
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', tableLayout: 'fixed' }}>
            <thead>
              {showEvalResult ? (
                <tr style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '6px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'center', width: '4%' }}>No</th>
                  <th style={{ padding: '6px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'left', width: '18%' }}>{isKo ? '부품명' : 'Component Name'}</th>
                  <th style={{ padding: '6px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'left', width: '13%' }}>{isKo ? '재질' : 'Material'}</th>
                  <th style={{ padding: '6px 4px', fontWeight: '600', color: '#3b82f6', textAlign: 'left', width: '12%' }}>{isKo ? '재질·구조 평가' : 'Recyclability Assessment'}</th>
                  <th style={{ padding: '6px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'left', width: '12%' }}>{isKo ? 'ERP 코드' : 'ERP Code'}</th>
                  <th style={{ padding: '6px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'left', width: '12%' }}>{isKo ? '비고' : 'Remark'}</th>
                  <th style={{ padding: '6px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'right', width: '10%' }}>{isKo ? '중량(g)' : 'Weight(g)'}</th>
                  <th style={{ padding: '6px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'center', width: '6%' }}>{isKo ? '수량' : 'Qty'}</th>
                  <th style={{ padding: '6px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'right', width: '13%' }}>{isKo ? '총계(g)' : 'Total(g)'}</th>
                </tr>
              ) : (
                <tr style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '6px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'center', width: '5%' }}>No</th>
                  <th style={{ padding: '6px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'left', width: '22%' }}>{isKo ? '부품명' : 'Component Name'}</th>
                  <th style={{ padding: '6px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'left', width: '15%' }}>{isKo ? '재질' : 'Material'}</th>
                  <th style={{ padding: '6px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'left', width: '13%' }}>{isKo ? 'ERP 코드' : 'ERP Code'}</th>
                  <th style={{ padding: '6px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'left', width: '15%' }}>{isKo ? '비고' : 'Remark'}</th>
                  <th style={{ padding: '6px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'right', width: '11%' }}>{isKo ? '중량(g)' : 'Weight(g)'}</th>
                  <th style={{ padding: '6px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'center', width: '7%' }}>{isKo ? '수량' : 'Qty'}</th>
                  <th style={{ padding: '6px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'right', width: '12%' }}>{isKo ? '총계(g)' : 'Total(g)'}</th>
                </tr>
              )}
            </thead>
            <tbody>
              {renderRows(exemptItems, 'exempt')}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ 6. 하단 푸터 (회사 주소, 연락처, 서명 및 도장) ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '10px', color: '#6b7280', paddingTop: '20px', paddingBottom: '20px' }}>

        {/* 좌측: 회사 정보 */}
        <div style={{ lineHeight: '1.6' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#374151', marginBottom: '6px' }}>
            {companyInfo.nameKo} | {companyInfo.nameEn}
          </div>
          <div>{isKo ? companyInfo.addressKo : (companyInfo.addressEn || companyInfo.addressKo)}</div>
          <div>
            Tel: {companyInfo.phone} &nbsp;&nbsp;&nbsp; {companyInfo.email} &nbsp;&nbsp;&nbsp; Fax: {companyInfo.fax}
          </div>
        </div>

        {/* 우측: 서명 및 도장 란 */}
        <div style={{ textAlign: 'center', width: '320px', position: 'relative' }}>
          {(isKo ? companyInfo.stamp : (companyInfo.stampEn || companyInfo.stamp)) ? (
            <div style={{ height: '105px', marginBottom: '6px', textAlign: 'center' }}>
              <img
                crossOrigin={getSafeCrossOrigin(isKo ? companyInfo.stamp : (companyInfo.stampEn || companyInfo.stamp))}
                src={getSafeImageUrl(isKo ? companyInfo.stamp : (companyInfo.stampEn || companyInfo.stamp))}
                alt="Stamp"
                style={{ height: '105px', display: 'inline-block', opacity: '0.9' }}
              />
            </div>
          ) : (
            <div style={{ height: '105px', marginBottom: '6px' }}></div>
          )}
          {/* 서명 밑줄을 부모 블록의 최하단으로 설정하여 좌측 Tel 라인과 완벽히 일치시킴 */}
          <div style={{ borderBottom: '1px solid #9ca3af', width: '100%' }}></div>
          {/* 텍스트는 선 밑으로 absolute 띄움 */}
          <div style={{ position: 'absolute', top: '100%', left: '0', width: '100%', color: '#6b7280', fontSize: '11px', letterSpacing: '0.5px', paddingTop: '6px' }}>( Signature / Date . )</div>
        </div>
      </div>

      {/* ═══ 7. 페이지 번호 ═══ */}
      <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '10px', color: '#666' }}>
        Page: 1/1
      </div>
    </div>
  );
});

export default SpecificationPreview;