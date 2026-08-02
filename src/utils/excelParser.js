/**
 * excelParser.js
 * ─────────────────────────────────────
 * 엑셀 파일 다운로드 및 업로드 파싱 유틸리티
 * 포장재 마스터, 완제품, 생산실적 엑셀 일괄 등록 지원
 */
import * as XLSX from 'xlsx';

// ─── 공통: 업로드된 엑셀 읽기 ───
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        // 엑셀 시트를 JSON 배열로 변환
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

// ==========================================
// 1. 포장재 (Packaging Components) 관련 로직
// ==========================================
export const downloadComponentTemplateExcel = () => {
  // 1행: 열 이름
  const headers = [
    "등록번호", "부재료코드", "부재료명", "규격", 
    "포장형태", "용기형태", "재질", "개당중량(g)", "비고"
  ];
  
  // 2행: 필수 여부 안내
  const requiredRow = [
    "[선택]", "[★필수]", "[★필수]", "[선택]", 
    "[선택]", "[★필수]", "[선택]", "[선택]", "[선택]"
  ];

  // 3행: 설명 안내
  const descRow = [
    "고유 식별번호 (자동발급 대체가능)", "내부 관리 부재료 코드", "포장재명 (또는 부재료명)", "사이즈 및 용량 규격", 
    "용기, 캡, 단상자 등", "EPR 신고 용기 코드 (0410, 0450 등)", "PET, PP, PE, 유리 등", "부자재 단위 총 중량 (숫자만)", "기타 특이사항"
  ];
  
  // 4행: 샘플 데이터
  const sampleData = [
    "S000001154", "PKG-001", "제니트리 수분크림 용기", "100ml", 
    "용기", "0410", "PET", "12.5", "투명 용기"
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, requiredRow, descRow, sampleData]);
  
  // 엑셀 열 너비 깔끔하게 조정
  ws['!cols'] = [
    { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 18 }, 
    { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 20 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "포장재등록양식");
  XLSX.writeFile(wb, "포장재마스터_일괄등록_양식.xlsx");
};

export const formatComponentsFromExcel = (data) => {
  return data.map(row => {
    // 🚨 똑똑한 필터링: 엑셀의 2, 3행(안내용 문구)은 DB에 저장되지 않도록 걸러냅니다.
    if (row['부재료코드'] === '[★필수]' || row['부재료코드'] === '내부 관리 부재료 코드') {
      return null; 
    }

    return {
      regNo: row['등록번호'] || '',
      code: row['부재료코드'] || '',
      name: row['부재료명'] || '',
      spec: row['규격'] || '',
      partType: row['포장형태'] || '기타',
      containerType: row['용기형태'] || '',
      material: row['재질'] || '',
      weightPerUnit: parseFloat(row['개당중량(g)']) || 0,
      remark: row['비고'] || '',
      subComponents: [] 
    };
  }).filter(comp => comp && comp.code && comp.name); // null 값과 필수값 누락된 행 제거
};


// ==========================================
// 2. 완제품 (Finished Products) 관련 로직
// ==========================================
export const downloadProductTemplateExcel = () => {
  const headers = [
    "완제품코드", "완제품명", "영문명", "화장품유형",
    "규격", "자사/타사", "내용물중량(g)", "생산실적보고명"
  ];

  const requiredRow = [
    "[★필수]", "[★필수]", "[선택]", "[선택]", 
    "[선택]", "[선택]", "[선택]", "[선택]"
  ];

  const descRow = [
    "내부 관리 완제품 코드", "완제품명(국문)", "완제품명(영문)", "일반화장품, 기능성화장품 등",
    "사이즈 및 용량 규격", "자사 또는 타사 입력", "내용물 순수 중량(숫자만)", "생산실적보고용 공식 명칭"
  ];
  
  const sampleData = [
    "PRD-0001", "제니트리 모이스처라이징 크림", "Janytree Moisturizing Cream", "일반화장품",
    "50ml", "자사", "50.5", "제니트리 모이스처라이징 크림(50ml)"
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, requiredRow, descRow, sampleData]);
  ws['!cols'] = [
    { wch: 18 }, { wch: 30 }, { wch: 30 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 30 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "완제품등록양식");
  XLSX.writeFile(wb, "완제품_일괄등록_양식.xlsx");
};

export const formatProductsFromExcel = (data) => {
  return data.map(row => {
    // 🚨 완제품 안내용 행 필터링
    if (row['완제품코드'] === '[★필수]' || row['완제품코드'] === '내부 관리 완제품 코드') {
      return null;
    }

    return {
      code: row['완제품코드'] || '',
      name: row['완제품명'] || '',
      nameEn: row['영문명'] || '',
      cosmeticsType: row['화장품유형'] || '일반화장품',
      spec: row['규격'] || '',
      brandType: row['자사/타사'] || '자사',
      weight: parseFloat(row['내용물중량(g)']) || 0,
      prodReportName: row['생산실적보고명'] || ''
    };
  }).filter(prod => prod && prod.code && prod.name);
};


// ==========================================
// 3. 생산실적 보고 (Production Report) 관련 로직
// ==========================================
export const formatProductionReportFromExcel = (data) => {
  return data.map(row => ({
    ...row 
  }));
};

export const downloadProductionReportTemplateExcel = () => {
  console.log("생산실적 엑셀 양식 다운로드");
};