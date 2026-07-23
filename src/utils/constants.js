/**
 * constants.js
 * ─────────────────────────────────────
 * JANYTREE PKG Portal 공용 상수 정의
 * 화장품 용기별 EPR 품목코드 매핑, 재질 목록, 기본값 등
 */

// ─── 화장품 용기 형태 → EPR 품목코드 매핑 ───
// 사용자(연구원/관리자)에게 친숙한 이름으로 드롭다운을 보여주고,
// 내부적으로 EPR 공식 품목코드로 자동 변환합니다.
export const CONTAINER_TYPE_MAP = [
  { label: '플라스틱병(PET-무색)', code: '0410', desc: '투명 PET 병 (스킨, 로션)' },
  { label: '플라스틱병(PET-유색)', code: '0411', desc: '유색 PET 병' },
  { label: '플라스틱병(PET-복합)', code: '0412', desc: 'PET 복합재질' },
  { label: '플라스틱 용기/단지(PE/PP/ABS 단일)', code: '0450', desc: '크림 단지, 단일재질 용기' },
  { label: '튜브/필름(복합재질)', code: '0460', desc: '복합재질 튜브, 알루미늄 튜브' },
  { label: '유리병(뚜껑일체형)', code: '0210', desc: '앰플, 에센스 유리' },
  { label: '유리병(뚜껑분리형)', code: '0220', desc: '뚜껑 분리 유리' },
  { label: '일반팩(단상자 등)', code: '0120', desc: '종이 단상자, 2차 포장' },
];

// ─── 포장재 재질 목록 ───
export const MATERIAL_OPTIONS = [
  'PET', 'PP', 'PE', 'ABS', 'PS', 'PVC',
  'Glass (유리병)', 'Aluminium', 'Steel', 
  'Paper (단상자/제외)', 'Paper Pack (종이팩)', 
  'Film/Sheet (필름/수축비닐)', 'PP/PE', 'PE/EVA/AL', '기타',
];

// ─── 플라스틱/합성수지 재질 목록 (EPR 중량 합산 대상) ───
// 유리나 금속은 제외, 플라스틱/합성수지만 EPR 중량에 포함
export const PLASTIC_MATERIALS = [
  'PET', 'PP', 'PE', 'ABS', 'PS', 'PVC',
  'PP/PE', 'PE/EVA/AL', 'Film/Sheet (필름/수축비닐)'
];

// 법령 기준 타겟 그룹
export const GLASS_MATERIALS = ['Glass (유리병)'];
export const METAL_MATERIALS = ['Aluminium', 'Steel'];

// ─── 포장 구분 ───
export const PACKAGING_CATEGORIES = [
  { value: '1차', label: '1차 포장 (용기 본체, 캡, 속마개 등)' },
  { value: '2차', label: '2차 포장 (단상자, 라벨 등)' },
];

// ─── 자사/타사 구분 ───
export const BRAND_TYPES = [
  { value: '자사', label: '자사 브랜드 (자사 상표)', description: 'EPR 신고 대상' },
  { value: '타사', label: '타사 브랜드 (OEM/사입/유통)', description: 'EPR 신고 제외' },
];

// ─── 제조/수입 구분 ───
export const MFG_TYPES = [
  { value: '제조', label: '제조' },
  { value: '수입', label: '수입' },
];

// ─── EPR 면제 조건 ───
export const EPR_EXEMPTION_CONDITIONS = [
  {
    title: '사업장 매출(수입)액 기준 면제',
    condition: '제조업자 매출액 10억원 미만\n수입업자 수입액 3억원 미만',
    result: '모든 포장재 분담금 100% 면제',
    icon: '🏢',
  },
  {
    title: '합성수지류/필름류 출고량 기준',
    condition: '연간 출고량 4톤(4,000kg) 미만',
    result: '해당 재질 분담금 면제',
    icon: '🧪',
  },
  {
    title: '유리병 출고량 기준',
    condition: '연간 출고량 10톤(10,000kg) 미만',
    result: '해당 재질 분담금 면제',
    icon: '🍾',
  },
  {
    title: '종이팩/금속캔 출고량 기준',
    condition: '연간 출고량 4톤(4,000kg) 미만',
    result: '해당 재질 분담금 면제',
    icon: '🥫',
  },
  {
    title: '일반 종이 단상자 / 택배박스',
    condition: 'EPR 신고 대상 아님',
    result: '자동 제외 (0g 처리)',
    icon: '📦',
  }
];

// ─── 기본 EPR 관련 사이트 ───
export const DEFAULT_EPR_SITES = [
  {
    siteName: '자원순환통합징수포털',
    url: 'https://pub.keco.or.kr',
    notes: 'EPR 출고실적 신고, 분담금 납부',
  },
  {
    siteName: 'KPRC 포장재재활용사업공제조합',
    url: 'https://www.kprc.or.kr',
    notes: '포장재 분담금 공제조합',
  },
  {
    siteName: '한국환경공단',
    url: 'https://www.keco.or.kr',
    notes: 'EPR 제도 안내, 가이드북 다운로드',
  },
  {
    siteName: '한국화장품협회',
    url: 'https://www.kcia.or.kr',
    notes: '화장품 업종 생산실적 보고',
  },
];

// ─── EPR 엑셀 컬럼 정의 ───
export const EPR_EXCEL_COLUMNS = {
  // 필수 (A~F)
  required: [
    { key: 'itemCode', header: '품목코드', col: 'A' },
    { key: 'productName', header: '상품명및규격', col: 'B' },
    { key: 'mfgType', header: '제조수입구분', col: 'C' },
    { key: 'annualVolume', header: '연간출고수입량(개)', col: 'D' },
    { key: 'unitWeight', header: '개당무게', col: 'E' },
    { key: 'brandType', header: '자사구분', col: 'F' },
  ],
  // 선택 (G~K) - 대부분 공란
  optional: [
    { key: 'otherCompanyCode', header: '타사업체코드\n(자사구분이 타사일때만 입력)', col: 'G' },
    { key: 'filmType', header: '필름구분\n(품목코드0460일때만 입력)', col: 'H' },
    { key: 'evalResult', header: '포장재 평가결과', col: 'I' },
    { key: 'evalException', header: '평가결과표시예외', col: 'J' },
    { key: 'recycledAmount', header: '재활용원료사용량', col: 'K' },
  ],
};

// ─── 사이드바 메뉴 ───
export const SIDEBAR_MENUS = [
  { id: 'dashboard', label: '대시보드', path: '/', icon: 'LayoutDashboard' },
  { id: 'items', label: '품목 및 포장재 관리', path: '/items', icon: 'Package' },
  { id: 'documents', label: '문서발행 관리', path: '/documents', icon: 'FileText' },
  { id: 'epr', label: 'EPR 실적신고 관리', path: '/epr', icon: 'BarChart3' },
  { id: 'settings', label: '기준 및 계정관리', path: '/settings', icon: 'Settings' },
];

// ─── 날짜 포맷 (사양서용) ───
const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                     'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export function formatDateForSpec(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

// ─── ID 생성 유틸 ───
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
