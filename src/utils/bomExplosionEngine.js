/**
 * bomExplosionEngine.js
 * ─────────────────────────────────────
 * BOM 기반 부자재 자동 산출 엔진 (EPR 실적신고 핵심 모듈)
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  이 파일이 하는 일 (쉽게 설명)                              │
 * │                                                         │
 * │  화장품 한 개(예: 딥모이스처카머)는 여러 부자재로 구성됩니다.  │
 * │  - 용기 본체 (PET, 12.5g)                                │
 * │  - 캡 (PP, 3.2g)                                        │
 * │  - 단상자 (종이, 15g → EPR 제외)                          │
 * │                                                         │
 * │  이 엔진은 완제품의 연간 출고량(예: 12,000개)을 받아서      │
 * │  각 부자재별로 "올해 총 몇 kg을 배출했는가?"를 자동 계산합니다.│
 * │                                                         │
 * │  [핵심 공식]                                              │
 * │  부자재별 총 배출량(kg)                                    │
 * │    = 연간출고량(개) × 부자재 개당중량(g) × BOM수량(EA)       │
 * │      ÷ 1000                                              │
 * │                                                         │
 * │  예) 12,000개 × 12.5g × 1EA ÷ 1000 = 150.0 kg           │
 * └─────────────────────────────────────────────────────────┘
 *
 * [데이터 흐름]
 * ProductMappingTable(2단계) → mappings 배열
 *   ↓
 * explodeBom() ← finishedProducts(완제품+BOM) + packagingComponents(부자재 마스터)
 *   ↓
 * { bomRows[], groupSummary[], totalTons } → EprAggregationTab(3단계) & KECO엑셀
 */

import {
  EPR_MATERIAL_GROUPS,
  EPR_EXCLUDED_MATERIALS,
  CONTAINER_TYPE_MAP,
} from './constants';


// ═══════════════════════════════════════════════════════════════════════
// ▸ 섹션 1: 재질 판별 헬퍼 함수들
// ═══════════════════════════════════════════════════════════════════════

/**
 * 주어진 재질이 EPR 신고에서 제외되는 재질인지 판별합니다.
 *
 * 제외 대상 예시:
 *   - 'Paper (단상자/제외)' → 종이 단상자는 EPR 플라스틱/유리 집계에서 제외
 *   - '종이' → 일반 종이 소재도 EPR 포장재 대상 아님
 *
 * ※ 단, 종이 단상자에 부착된 PET 투명창이나 수축비닐은
 *    별도 부자재로 등록되어야 하며, 그것은 합성수지로 집계됩니다.
 *
 * @param {string} material - 재질 문자열 (예: 'PET', 'Paper (단상자/제외)')
 * @returns {boolean} true = EPR 제외 대상 / false = EPR 신고 대상
 */
export function isExcludedMaterial(material) {
  // 재질 정보가 아예 없는 경우 → 집계 불가능이므로 제외 처리
  if (!material) return true;
  return EPR_EXCLUDED_MATERIALS.includes(material);
}


/**
 * 재질 문자열을 EPR 재질그룹(합성수지, 유리, 금속 등)으로 분류합니다.
 *
 * EPR 법령(자원재활용법 시행령 별표4)에 따라 포장재는 다음 6개 그룹으로 분류:
 *   1. 합성수지류(plastic) - PET, PP, PE, ABS 등
 *   2. 필름·시트(film) - 수축비닐, 필름 등
 *   3. 유리병(glass) - Glass 소재
 *   4. 금속캔(metal) - Aluminium, Steel
 *   5. 종이팩(paperpack) - 멸균팩 등
 *   6. 발포합성수지(foam) - 스티로폼 등
 *
 * @param {string} material - 재질 문자열
 * @returns {object|null} 매칭되는 EPR_MATERIAL_GROUPS 항목, 없으면 null
 */
export function classifyMaterialGroup(material) {
  if (!material) return null;

  // constants.js의 EPR_MATERIAL_GROUPS 배열에서
  // 해당 재질이 어느 그룹의 materials 배열에 포함되는지 찾습니다.
  return EPR_MATERIAL_GROUPS.find(group =>
    group.materials.includes(material)
  ) || null;
}


// ═══════════════════════════════════════════════════════════════════════
// ▸ 섹션 2: EPR 품목코드 결정
// ═══════════════════════════════════════════════════════════════════════

/**
 * 부자재의 EPR 품목코드(KECO 기준)를 결정합니다.
 *
 * KECO(한국환경공단)에 제출하는 '중량산출기초자료' 엑셀의 A열(품목코드)에
 * 들어갈 4자리 코드를 결정하는 함수입니다.
 *
 * 결정 우선순위:
 *   1순위: containerType이 4자리 숫자 코드인 경우 (예: "0450") → 바로 사용
 *   2순위: containerType이 CONTAINER_TYPE_MAP의 라벨과 일치 → 해당 코드 사용
 *   3순위: 재질(material) 기반으로 자동 추론
 *
 * @param {string} containerType - 용기형태 (라벨 또는 코드)
 * @param {string} material - 재질 문자열
 * @param {string} partType - 포장형태 (용기, 캡/뚜껑, 단상자, 수축필름 등)
 * @returns {string} EPR 품목코드 (예: '0410', '0450', 'EXEMPT')
 */
export function resolveItemCode(containerType, material, partType) {
  // ── 1순위: containerType이 4자리 숫자 코드 형태인 경우 ──
  // 사용자가 포장재 등록 시 직접 코드를 입력한 경우입니다.
  // 예: 엑셀 일괄등록에서 용기형태에 "0410"을 입력한 경우
  if (containerType && /^\d{4}$/.test(String(containerType).trim())) {
    return String(containerType).trim();
  }

  // ── 2순위: containerType이 라벨(한글 설명)인 경우 ──
  // 예: "플라스틱병(PET-무색)" → code: "0410"
  // 예: "유리병(뚜껑일체형)" → code: "0210"
  // 예: "신고제외(금속마개/기타)" → code: "EXEMPT"
  if (containerType) {
    const mapEntry = CONTAINER_TYPE_MAP.find(
      c => c.label === containerType || c.label === String(containerType).trim()
    );
    if (mapEntry) return mapEntry.code;
  }

  // ── 3순위: 재질(material) 기반 자동 추론 ──
  // containerType이 비어있거나 매칭되지 않는 경우 (다부속 부자재의 sub 등)
  if (!material) return '0450'; // 재질 정보 없으면 기본값

  // ① 유리 (Glass)
  if (material === 'Glass (유리병)') return '0210';

  // ② 금속
  if (material === 'Aluminium') return '0330'; // 알루미늄캔(뚜껑일체형)
  if (material === 'Steel')     return '0310'; // 철캔(뚜껑일체형)

  // ③ 필름/시트
  if (material === 'Film/Sheet (필름/수축비닐)') return '0460';

  // ④ 발포합성수지 (스티로폼 등)
  if (material === 'Foam (발포합성수지)') return '0420';

  // ⑤ 종이
  if (material === 'Paper Pack (종이팩)') return '0130'; // 멸균팩
  if (material === 'Paper (단상자/제외)' || material === '종이') return '0110';

  // ⑥ PET 계열 → 기본적으로 무색 PET병(0410)
  // ※ 유색(0411), 복합(0412) 구분이 필요하면 containerType으로 지정
  if (material === 'PET') return '0410';

  // ⑦ 포장형태(partType) 기반 세부 판별
  //    수축필름, 라벨, 리필파우치 같은 필름류는 0460으로 분류
  const filmPartTypes = ['수축필름', '라벨', '리필파우치'];
  if (partType && filmPartTypes.includes(partType)) return '0460';

  // ⑧ 나머지 합성수지 (PP, PE, ABS, PVC, 복합재질 등) → 0450
  // 0450 = "기타 합성수지 - 용기류·트레이 단일재질"
  return '0450';
}


// ═══════════════════════════════════════════════════════════════════════
// ▸ 섹션 3: 중량 계산
// ═══════════════════════════════════════════════════════════════════════

/**
 * 개별 부자재의 연간 총 배출량을 계산합니다. (결과 단위: kg)
 *
 * [공식]
 *   총 배출량(kg) = 연간출고량(개) × 부자재 개당중량(g) × BOM 수량(EA) ÷ 1000
 *
 * [예시]
 *   연간출고량 = 12,000개
 *   부자재 개당중량 = 12.5g (PET 용기 1개의 무게)
 *   BOM 수량 = 1EA (제품 1개당 용기 1개 사용)
 *   → 12,000 × 12.5 × 1 ÷ 1000 = 150.0 kg
 *
 * @param {number} weightG   - 부자재 1개의 중량 (그램, g)
 * @param {number} bomQty    - 제품 1개당 해당 부자재 사용 수량 (EA)
 * @param {number} annualQty - 완제품 연간 출고 수량 (개)
 * @returns {number} 연간 총 배출량 (킬로그램, kg)
 */
export function calculateComponentWeight(weightG, bomQty, annualQty) {
  return (Number(annualQty) * Number(weightG) * Number(bomQty)) / 1000;
}


// ═══════════════════════════════════════════════════════════════════════
// ▸ 섹션 4: 메인 BOM 폭발 함수 (★ 핵심 ★)
// ═══════════════════════════════════════════════════════════════════════

/**
 * 매핑된 완제품 목록에 대해 BOM 폭발(Explosion)을 수행합니다.
 *
 * "BOM 폭발"이란?
 *   완제품 1개 = 부자재 여러 개의 조합(BOM)이므로,
 *   완제품 단위의 출고량 데이터를 부자재 단위로 "폭발(분해)"하여
 *   각 부자재별 배출량을 개별적으로 계산하는 것입니다.
 *
 * @param {Array} mappings
 *   2단계(ProductMappingTable)에서 생성된 매핑 배열.
 *   각 항목: { id, originalName, originalQty, matchedProductId, status,
 *             isSample, isRefill, isHerbal, isCustom }
 *
 * @param {Array} finishedProducts
 *   packagingStore의 완제품 목록 (versions > bomItems 포함)
 *
 * @param {Array} packagingComponents
 *   packagingStore의 부자재 마스터 목록
 *
 * @returns {object} {
 *   bomRows: Array,       - 부자재 단위로 분해된 상세 행 목록
 *   groupSummary: Array,  - 재질그룹별 합계 및 면제 판정 결과
 *   totalTons: number     - 전체 재질 합산 배출량 (톤)
 * }
 */
export function explodeBom(mappings, finishedProducts, packagingComponents) {
  // 입력값이 없으면 빈 결과를 즉시 반환합니다.
  if (!mappings || !Array.isArray(mappings)) {
    return { bomRows: [], groupSummary: buildEmptyGroupSummary(), totalTons: 0 };
  }

  // 부자재 단위로 분해된 행(row)을 담을 배열
  const bomRows = [];
  // 행 고유번호 (순차 증가)
  let rowIndex = 0;

  // ──────────────────────────────────────────────────
  // 매핑된 완제품을 하나씩 순회하며 BOM 폭발 수행
  // ──────────────────────────────────────────────────
  mappings.forEach(mapping => {
    // ① 매핑 상태 확인: 매핑 완료(mapped)가 아니거나 수량이 0 이하면 건너뜁니다
    if (mapping.status !== 'mapped' || !mapping.matchedProductId) return;
    const annualQty = Number(mapping.originalQty) || 0;
    if (annualQty <= 0) return;

    // ② 견본품(S) 처리: 판촉용 견본품은 EPR 신고에서 제외합니다
    if (mapping.isSample) {
      bomRows.push(createSampleRow(rowIndex++, mapping, annualQty));
      return; // 이 제품은 더 이상 처리하지 않습니다
    }

    // ③ 매핑된 완제품(finished product)을 찾습니다
    const product = finishedProducts.find(
      p => String(p.id) === String(mapping.matchedProductId)
    );
    if (!product) return; // 완제품을 찾을 수 없으면 건너뜁니다

    // ④ 최신 BOM 버전의 부자재 목록을 가져옵니다
    //    완제품에는 여러 버전이 있을 수 있고, 가장 마지막(최신) 버전을 사용합니다
    const latestVersion = (product.versions && product.versions.length > 0)
      ? product.versions[product.versions.length - 1]
      : { bomItems: [] };

    const bomItems = latestVersion.bomItems || [];

    // ⑤ BOM이 비어있는 경우 → 경고 행 추가
    //    (부자재가 등록되지 않은 완제품입니다)
    if (bomItems.length === 0) {
      bomRows.push(createBomMissingRow(rowIndex++, product, mapping, annualQty));
      return;
    }

    // ⑥ 각 BOM 아이템에 대해 부자재 폭발을 수행합니다
    bomItems.forEach(bomItem => {
      // 부자재 마스터에서 상세 정보를 조회합니다
      // (bomItem에도 내장 데이터가 있지만, 마스터 데이터가 더 최신일 수 있음)
      const component = packagingComponents.find(
        c => String(c.id) === String(bomItem.componentId)
      );

      // 마스터에서 못 찾으면 bomItem에 내장된 데이터를 사용합니다 (안전장치)
      const compData = component || bomItem;
      const bomQty = Number(bomItem.qty) || 1;

      // 다부속(subComponents) 여부 확인
      const subs = compData.subComponents || [];

      if (subs.length > 0) {
        // ═══════════════════════════════════════════════════
        // [케이스 A] 다부속 부자재 → 각 부속을 개별 행으로 분개
        //
        // 예: "튜브 세트" = [본체 PE 3.5g] + [캡 PP 1.2g]
        //     → 2개의 행으로 분해되어 각각 집계됩니다
        //
        // 예: "유리앰플+금속캡 세트" = [유리 Glass 15g] + [캡 Aluminium 2g]
        //     → 유리병 그룹에 15g, 금속캔 그룹에 2g 각각 분개
        // ═══════════════════════════════════════════════════
        subs.forEach((sub, subIdx) => {
          const subMaterial = sub.material || '';
          const subWeight   = Number(sub.weight) || 0;
          const subName     = sub.name || `부속${subIdx + 1}`;

          // EPR 제외 재질(종이 등)인지 확인합니다
          const excluded = isExcludedMaterial(subMaterial);

          // EXEMPT 컨테이너 타입 확인 (신고제외 금속마개 등)
          const itemCode = excluded
            ? 'EXEMPT'
            : resolveItemCode('', subMaterial, compData.partType || '');

          // 'EXEMPT' 코드도 제외 대상으로 처리합니다
          const isExemptItem = itemCode === 'EXEMPT';
          const finalExcluded = excluded || isExemptItem;

          const group = finalExcluded ? null : classifyMaterialGroup(subMaterial);
          const totalKg = finalExcluded
            ? 0
            : calculateComponentWeight(subWeight, bomQty, annualQty);

          bomRows.push({
            // ── 행 식별 ──
            id: `bom_${rowIndex++}`,

            // ── 완제품 정보 ──
            productId: product.id,
            productCode: product.code,
            productName: product.name,
            mfgType: product.mfgType || '제조',
            brandType: product.brandType || '자사',
            annualQty,

            // ── 부자재 정보 (BOM 분해 결과) ──
            componentId: compData.id || bomItem.componentId,
            componentName: `${compData.name || bomItem.name || ''} > ${subName}`,
            componentCode: compData.code || bomItem.code || '',
            partType: compData.partType || bomItem.partType || '',
            material: subMaterial,
            materialGroup: group,
            materialGroupId: group?.id || null,

            // ── EPR 관련 ──
            itemCode,
            weightPerUnit: subWeight,             // 이 부속 1개의 중량 (g)
            bomQty,                                // 제품당 BOM 수량
            kecoWeightPerUnit: subWeight * bomQty,  // KECO 엑셀 E열용 (g/제품)
            totalWeightKg: totalKg,                // 연간 총 배출량 (kg)
            evalResult: compData.materialEvalResult || bomItem.materialEvalResult || '미평가',

            // ── 플래그 ──
            isSample: false,
            isRefill: mapping.isRefill || false,
            isHerbal: mapping.isHerbal || false,
            isCustom: mapping.isCustom || false,
            isExcluded: finalExcluded,
            excludeReason: finalExcluded
              ? `${subMaterial || '재질 미지정'} — EPR 비대상`
              : '',
            isBomMissing: false,
            isSubComponent: true,
            parentComponentName: compData.name || bomItem.name || '',

            // ── KECO 엑셀 전용 필드 ──
            filmType: itemCode === '0460' ? '포장재' : '',
          });
        });
      } else {
        // ═══════════════════════════════════════════════════
        // [케이스 B] 단일 재질 부자재 → 그대로 1개 행 생성
        //
        // 예: "PET 용기" (PET, 12.5g) → 합성수지 그룹에 12.5g 집계
        // ═══════════════════════════════════════════════════
        const material = compData.material || bomItem.material || '';
        // weightPerUnit과 weight는 같은 값 (weight_g 컬럼에서 온 것)
        const weightPerUnit = Number(
          compData.weightPerUnit || compData.weight || bomItem.weight
        ) || 0;

        const excluded = isExcludedMaterial(material);
        const containerType = compData.containerType || '';
        const partType = compData.partType || bomItem.partType || '';
        const itemCode = excluded
          ? 'EXEMPT'
          : resolveItemCode(containerType, material, partType);

        const isExemptItem = itemCode === 'EXEMPT';
        const finalExcluded = excluded || isExemptItem;

        const group = finalExcluded ? null : classifyMaterialGroup(material);
        const totalKg = finalExcluded
          ? 0
          : calculateComponentWeight(weightPerUnit, bomQty, annualQty);

        bomRows.push({
          // ── 행 식별 ──
          id: `bom_${rowIndex++}`,

          // ── 완제품 정보 ──
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          mfgType: product.mfgType || '제조',
          brandType: product.brandType || '자사',
          annualQty,

          // ── 부자재 정보 ──
          componentId: compData.id || bomItem.componentId,
          componentName: compData.name || bomItem.name || '',
          componentCode: compData.code || bomItem.code || '',
          partType,
          material,
          materialGroup: group,
          materialGroupId: group?.id || null,

          // ── EPR 관련 ──
          itemCode,
          weightPerUnit,                            // 부자재 1개 중량 (g)
          bomQty,                                    // BOM 수량
          kecoWeightPerUnit: weightPerUnit * bomQty,  // KECO 엑셀 E열 (g/제품)
          totalWeightKg: totalKg,                    // 연간 총 배출량 (kg)
          evalResult: compData.materialEvalResult || bomItem.materialEvalResult || '미평가',

          // ── 플래그 ──
          isSample: false,
          isRefill: mapping.isRefill || false,
          isHerbal: mapping.isHerbal || false,
          isCustom: mapping.isCustom || false,
          isExcluded: finalExcluded,
          excludeReason: finalExcluded
            ? `${material || '재질 미지정'} — EPR 비대상`
            : '',
          isBomMissing: false,
          isSubComponent: false,
          parentComponentName: '',

          // ── KECO 엑셀 전용 필드 ──
          filmType: itemCode === '0460' ? '포장재' : '',
        });
      }
    });
  });

  // ──────────────────────────────────────────────────
  // 재질그룹별 요약 집계 + 면제 판정 결과 생성
  // ──────────────────────────────────────────────────
  const groupSummary = summarizeByGroup(bomRows);
  const totalTons = groupSummary.reduce((sum, g) => sum + g.totalTon, 0);

  return { bomRows, groupSummary, totalTons };
}


// ═══════════════════════════════════════════════════════════════════════
// ▸ 섹션 5: 재질그룹별 요약 집계
// ═══════════════════════════════════════════════════════════════════════

/**
 * BOM 폭발 결과(bomRows)를 재질그룹별로 합산하고
 * 법적 면제 기준과 비교하여 면제/납부 여부를 자동 판정합니다.
 *
 * 면제 기준 (자원재활용법 시행령 별표 4):
 *   - 합성수지류: 연간 4톤 미만 → 면제
 *   - 유리병:     연간 10톤 미만 → 면제
 *   - 금속캔:     연간 4톤 미만 → 면제
 *   - 종이팩:     연간 4톤 미만 → 면제
 *   - 발포합성수지: 연간 0.8톤 미만 → 면제
 *
 * @param {Array} bomRows - explodeBom()이 반환한 부자재 행 배열
 * @returns {Array} EPR_MATERIAL_GROUPS에 계산 결과가 추가된 배열
 */
export function summarizeByGroup(bomRows) {
  // 각 그룹별 총 중량(g)을 누적할 맵을 초기화합니다
  const groupWeightsGrams = {};
  EPR_MATERIAL_GROUPS.forEach(g => { groupWeightsGrams[g.id] = 0; });

  // 제외되지 않은 행들의 kg 중량을 그램으로 변환하여 누적합니다
  bomRows.forEach(row => {
    // 제외 대상이거나 그룹이 없는 행은 건너뜁니다
    if (row.isExcluded || !row.materialGroupId) return;

    // kg → g 변환하여 누적 (기존 EprAggregationTab과 동일한 방식)
    const grams = (row.totalWeightKg || 0) * 1000;
    groupWeightsGrams[row.materialGroupId] =
      (groupWeightsGrams[row.materialGroupId] || 0) + grams;
  });

  // 각 그룹에 대해 톤 변환 → 면제 기준 비교 → 진행률 계산
  return EPR_MATERIAL_GROUPS.map(group => {
    const totalGrams = groupWeightsGrams[group.id] || 0;
    const totalKg    = totalGrams / 1000;         // g → kg
    const totalTon   = totalKg / 1000;            // kg → 톤
    const isExempt   = totalTon < group.exemptionTonnes;  // 면제 기준 비교
    const progressPct = group.exemptionTonnes > 0
      ? Math.min(100, (totalTon / group.exemptionTonnes) * 100)
      : 0;

    return {
      ...group,       // id, label, shortLabel, materials, exemptionTonnes, color 등
      totalGrams,      // 해당 그룹 총 중량 (g)
      totalKg,         // 해당 그룹 총 중량 (kg)
      totalTon,        // 해당 그룹 총 중량 (톤)
      isExempt,        // true = 면제, false = 납부대상
      progressPct,     // 면제 기준 대비 진행률 (%)
    };
  });
}


// ═══════════════════════════════════════════════════════════════════════
// ▸ 섹션 6: 헬퍼 함수들
// ═══════════════════════════════════════════════════════════════════════

/**
 * EPR 신고 대상 행만 필터링하여 반환합니다.
 * (제외/견본품/BOM미등록 행을 제거)
 *
 * KECO 엑셀 내보내기 시 이 함수로 필터링한 결과만 사용합니다.
 *
 * @param {Array} bomRows - explodeBom()이 반환한 전체 행 배열
 * @returns {Array} EPR 신고 대상 행만 남은 배열
 */
export function getActiveRows(bomRows) {
  return bomRows.filter(row =>
    !row.isExcluded && !row.isSample && !row.isBomMissing
  );
}


/**
 * bomRows를 완제품(productCode) 기준으로 그룹핑합니다.
 * UI에서 아코디언 형태로 표시할 때 사용합니다.
 *
 * @param {Array} bomRows - explodeBom()이 반환한 행 배열
 * @returns {Array} [{ productCode, productName, rows: [...], subtotalKg }]
 */
export function groupByProduct(bomRows) {
  const groupMap = new Map();

  bomRows.forEach(row => {
    const key = row.productId || row.productCode;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        productId: row.productId,
        productCode: row.productCode,
        productName: row.productName,
        annualQty: row.annualQty,
        mfgType: row.mfgType,
        brandType: row.brandType,
        isSample: row.isSample,
        rows: [],
        subtotalKg: 0,
      });
    }
    const group = groupMap.get(key);
    group.rows.push(row);
    // 제외되지 않은 행의 중량만 소계에 합산합니다
    if (!row.isExcluded) {
      group.subtotalKg += row.totalWeightKg || 0;
    }
  });

  return Array.from(groupMap.values());
}


// ═══════════════════════════════════════════════════════════════════════
// ▸ 내부 전용 헬퍼 (export 하지 않음)
// ═══════════════════════════════════════════════════════════════════════

/**
 * 빈 그룹 요약을 생성합니다.
 * (데이터가 없을 때 기본값으로 사용)
 */
function buildEmptyGroupSummary() {
  return EPR_MATERIAL_GROUPS.map(group => ({
    ...group,
    totalGrams: 0,
    totalKg: 0,
    totalTon: 0,
    isExempt: true,
    progressPct: 0,
  }));
}

/**
 * 견본품(S) 전용 행을 생성합니다.
 * EPR 신고에서 제외되지만, UI에서는 별도로 표시됩니다.
 */
function createSampleRow(index, mapping, annualQty) {
  return {
    id: `bom_${index}`,
    productId: null,
    productCode: '--',
    productName: mapping.originalName,
    mfgType: '견본품',
    brandType: '자사',
    annualQty,
    componentId: null,
    componentName: '(견본품 전체)',
    componentCode: '--',
    partType: '--',
    material: '--',
    materialGroup: null,
    materialGroupId: null,
    itemCode: '--',
    weightPerUnit: 0,
    bomQty: 0,
    kecoWeightPerUnit: 0,
    totalWeightKg: 0,
    evalResult: '--',
    isSample: true,
    isRefill: mapping.isRefill || false,
    isHerbal: mapping.isHerbal || false,
    isCustom: mapping.isCustom || false,
    isExcluded: true,
    excludeReason: '견본품(S) — EPR 신고 제외',
    isBomMissing: false,
    isSubComponent: false,
    parentComponentName: '',
    filmType: '',
  };
}

/**
 * BOM 미등록 완제품 전용 경고 행을 생성합니다.
 * UI에서 "⚠️ BOM 미등록" 경고와 함께 표시됩니다.
 */
function createBomMissingRow(index, product, mapping, annualQty) {
  return {
    id: `bom_${index}`,
    productId: product.id,
    productCode: product.code,
    productName: product.name,
    mfgType: product.mfgType || '제조',
    brandType: product.brandType || '자사',
    annualQty,
    componentId: null,
    componentName: '⚠️ BOM 미등록',
    componentCode: '--',
    partType: '--',
    material: '--',
    materialGroup: null,
    materialGroupId: null,
    itemCode: '--',
    weightPerUnit: 0,
    bomQty: 0,
    kecoWeightPerUnit: 0,
    totalWeightKg: 0,
    evalResult: '--',
    isSample: false,
    isRefill: mapping.isRefill || false,
    isHerbal: mapping.isHerbal || false,
    isCustom: mapping.isCustom || false,
    isExcluded: true,
    excludeReason: 'BOM 미등록 — 부자재 정보 없음',
    isBomMissing: true,
    isSubComponent: false,
    parentComponentName: '',
    filmType: '',
  };
}
