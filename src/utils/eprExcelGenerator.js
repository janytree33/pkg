import * as XLSX from 'xlsx';
import { CONTAINER_TYPE_MAP } from './constants';

/**
 * eprExcelGenerator.js
 * ─────────────────────────────────────
 * EPR 실적신고용 엑셀(중량산출기초자료)을 생성하는 유틸리티
 * 자사 브랜드 제품의 데이터만 필터링되어 전달됩니다.
 */
export function generateEprExcel(items, year = new Date().getFullYear()) {
  // 1. 워크북 생성
  const wb = XLSX.utils.book_new();

  // 2. '중량산출기초자료' 시트 데이터 구성
  const sheetData = [];
  
  // 헤더행 (A~K)
  const headers = [
    '품목코드', // A
    '상품명및규격', // B
    '제조수입구분', // C
    '연간출고수입량(개)', // D
    '개당무게', // E
    '자사구분', // F
    '타사업체코드\n(자사구분이 타사일때만 입력)', // G
    '필름구분\n(품목코드0460일때만 입력)', // H
    '포장재 평가결과', // I
    '평가결과표시예외', // J
    '재활용원료사용량' // K
  ];
  sheetData.push(headers);

  // 데이터행 추가
  items.forEach(item => {
    // 필수 필드 (A~F)
    const row = [
      item.itemCode || '',
      item.productName || '',
      item.mfgType || '제조',
      item.annualVolume || 0,
      item.unitWeight || 0,
      '자사', // 자사 브랜드만 신고하므로 고정
      '', // G: 타사업체코드 (공란)
      item.itemCode === '0460' ? '포장재' : '', // H: 필름구분 (0460일 경우 '포장재')
      '', // I: 포장재 평가결과 (공란)
      '', // J: 평가결과표시예외 (공란)
      ''  // K: 재활용원료사용량 (공란)
    ];
    sheetData.push(row);
  });

  // 데이터 시트 생성
  const wsData = XLSX.utils.aoa_to_sheet(sheetData);

  // 컬럼 너비 설정 (보기 좋게 조정)
  wsData['!cols'] = [
    { wch: 10 }, // A: 품목코드
    { wch: 30 }, // B: 상품명
    { wch: 12 }, // C: 제조수입구분
    { wch: 15 }, // D: 연간출고량
    { wch: 10 }, // E: 개당무게
    { wch: 10 }, // F: 자사구분
    { wch: 20 }, // G: 타사업체코드
    { wch: 15 }, // H: 필름구분
    { wch: 15 }, // I: 평가결과
    { wch: 15 }, // J: 예외
    { wch: 15 }  // K: 재활용원료
  ];

  XLSX.utils.book_append_sheet(wb, wsData, '중량산출기초자료');

  // 3. '주의사항' 참조 시트
  const notesData = [
    ['EPR 기초자료 작성 주의사항'],
    ['1. 자사 브랜드(상표권자) 제품만 신고 대상입니다. (OEM/사입 등 타사 브랜드 제외)'],
    ['2. [품목코드]는 품목정보 시트를 참조하여 정확히 입력하세요.'],
    ['3. [제조수입구분]은 "제조" 또는 "수입"으로 입력하세요.'],
    ['4. 품목코드가 0460인 경우 [필름구분] 열에 "포장재"를 입력해야 합니다.'],
  ];
  const wsNotes = XLSX.utils.aoa_to_sheet(notesData);
  XLSX.utils.book_append_sheet(wb, wsNotes, '주의사항');

  // 4. '품목정보' 참조 시트
  const codesData = [['품목코드', '용기형태/설명']];
  CONTAINER_TYPE_MAP.forEach(c => {
    codesData.push([c.code, `${c.label} - ${c.desc}`]);
  });
  const wsCodes = XLSX.utils.aoa_to_sheet(codesData);
  wsCodes['!cols'] = [{ wch: 10 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsCodes, '품목정보');

  // 5. 기타 참조 시트 (드롭다운/데이터 검증용 데이터)
  const wsMfg = XLSX.utils.aoa_to_sheet([['제조'], ['수입']]);
  XLSX.utils.book_append_sheet(wb, wsMfg, '제조수입구분');

  const wsBrand = XLSX.utils.aoa_to_sheet([['자사'], ['타사']]);
  XLSX.utils.book_append_sheet(wb, wsBrand, '자사타사구분');

  // 6. 파일 다운로드
  const filename = `EPR_중량산출기초자료_${year}.xlsx`;
  XLSX.writeFile(wb, filename);
}
