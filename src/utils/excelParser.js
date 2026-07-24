/**
 * excelParser.js
 * ─────────────────────────────────────
 * 엑셀(XLSX) 파일을 읽어서 JSON 객체 배열로 변환하는 유틸리티
 */
import * as XLSX from 'xlsx';

export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // 첫 번째 시트만 읽기
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 시트 데이터를 JSON 배열로 변환
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    // 파일을 바이너리 문자열로 읽기
    reader.readAsBinaryString(file);
  });
};

/**
 * 완제품 엑셀 데이터를 스토어 규격에 맞게 변환
 */
export const formatProductsFromExcel = (rows) => {
  return rows.map(row => ({
    cosmeticsType: row['화장품유형'] || row['cosmetics_type'] || '',
    code: row['제품코드'] || row['code'] || '',
    name: row['ERP_제품한글명'] || row['제품한글명'] || row['제품명'] || row['name'] || '',
    nameEn: row['ERP_제품영문명'] || row['제품영문명'] || row['name_en'] || '',
    spec: row['규격'] || row['spec'] || '',
    prodReportName: row['생산실적보고_제품명'] || row['prod_report_name'] || '',
    brandType: (row['용도구분'] && row['용도구분'].includes('타사')) ? '타사' : '자사',
    weight: Number(row['생산실적보고_용량(숫자)']) || 0
  })).filter(item => item.code && item.name); // 필수값 검증
};

/**
 * 부재료 엑셀 데이터를 스토어 규격에 맞게 변환
 */
export const formatComponentsFromExcel = (rows) => {
  return rows.map(row => ({
    regNo: row['등록번호'] || row['부재료등록번호'] || row['reg_no'] || '',
    code: row['부재료코드'] || row['코드'] || row['code'] || '',
    name: row['부재료명'] || row['name'] || '',
    spec: row['규격'] || row['spec'] || '',
    type: row['종류'] || row['종류(구분)'] || '포장부자재',
    category: row['구분'] || row['구분(1차/2차)'] || '',
    containerType: row['용기형태'] || '',
    material: row['재질'] || '',
    weightPerUnit: Number(row['개당중량(g)'] || row['개당 중량(g)'] || row['weight']) || 0,
    remark: row['비고'] || row['비고/분리여부'] || ''
  })).filter(item => item.code && item.name);
};

/**
 * 생산실적보고서 엑셀 데이터를 규격에 맞게 변환
 * H열(견본품 S), I열(한방제품 H), J열(리필제품 R), K열(맞온형 C1/C2) 자동 파싱
 */
export const formatProductionReportFromExcel = (rows) => {
  return rows.map(row => {
    // 엑셀의 모든 헤더 키를 찾아서 공백/줄바꿈을 제거한 정규화된 맵 생성
    const normalizedRow = {};
    Object.keys(row).forEach(key => {
      const cleanKey = key.replace(/\s+/g, '').toLowerCase();
      normalizedRow[cleanKey] = row[key];
    });

    // 수량(Quantity) 찾기: '생산량', '출고량', '수량', 'quantity', 'qty'가 포함된 키
    const qtyKey = Object.keys(normalizedRow).find(k => k.includes('생산량') || k.includes('출고량') || k.includes('수량') || k.includes('quantity') || k.includes('qty'));
    const rawQty = qtyKey ? normalizedRow[qtyKey] : '0';
    
    // 단가(Price) 찾기: '단가', 'price'가 포함된 키
    const priceKey = Object.keys(normalizedRow).find(k => k.includes('단가') || k.includes('price'));
    const rawPrice = priceKey ? normalizedRow[priceKey] : '0';

    return {
      no: normalizedRow['순번'] || normalizedRow['no'] || '',
      prodReportName: normalizedRow['제품명(국문)'] || normalizedRow['제품명'] || normalizedRow['prodreportname'] || '',
      manufacturer: normalizedRow['제조업자(국문)'] || normalizedRow['제조업자'] || normalizedRow['manufacturer'] || '',
      capacity: normalizedRow['용량(숫자)'] || normalizedRow['용량'] || normalizedRow['capacity'] || 0,
      unit: normalizedRow['단위'] || normalizedRow['unit'] || '',
      quantity: Number(String(rawQty).replace(/,/g, '')) || 0,
      unitPrice: Number(String(rawPrice).replace(/,/g, '')) || 0,
      
      // 특수 플래그
      isSample:  !!(normalizedRow['견본품(\'s\'표시)'] || normalizedRow['견본품'] || normalizedRow['issample'] || '').toString().trim(),
      isHerbal:  !!(normalizedRow['한방제품(\'h\'표시)'] || normalizedRow['한방제품'] || normalizedRow['isherbal'] || '').toString().trim(),
      isRefill:  !!(normalizedRow['리필제품(\'r\'표시)'] || normalizedRow['리필제품'] || normalizedRow['isrefill'] || '').toString().trim(),
      isCustom:  !!(normalizedRow['맞춤형내용물'] || normalizedRow['맞춤형'] || normalizedRow['iscustom'] || '').toString().trim(),
    };
  }).filter(item => !!item.prodReportName); // 제품명이 있는 행만 추출
};

/**
 * 완제품 일괄 등록 엑셀 양식 다운로드
 */
export const downloadProductTemplateExcel = () => {
  // 양식 헤더 및 예시 데이터
  const templateData = [
    {
      '제품코드': 'PROD-001',
      '제품명': '제니트리 수분크림',
      '생산실적보고_제품명': '제니트리 수분크림 100ml',
      '화장품유형': '기초화장용',
      '규격': '100ml',
      '생산실적보고_용량(숫자)': 100,
      '용도구분': '자사'
    },
    {
      '제품코드': 'PROD-002',
      '제품명': '제니트리 선크림 (타사예시)',
      '생산실적보고_제품명': '제니트리 선크림 50g',
      '화장품유형': '자외선차단용',
      '규격': '50g',
      '생산실적보고_용량(숫자)': 50,
      '용도구분': '타사'
    }
  ];

  // 워크시트 생성
  const ws = XLSX.utils.json_to_sheet(templateData);

  // 컬럼 너비 조정
  const wscols = [
    { wch: 15 }, // 제품코드
    { wch: 25 }, // 제품명
    { wch: 30 }, // 생산실적보고_제품명
    { wch: 15 }, // 화장품유형
    { wch: 10 }, // 규격
    { wch: 20 }, // 생산실적보고_용량(숫자)
    { wch: 10 }  // 용도구분
  ];
  ws['!cols'] = wscols;

  // 워크북 생성 및 파일 다운로드
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '완제품등록양식');
  XLSX.writeFile(wb, '완제품_일괄등록_양식.xlsx');
};

/**
 * 포장재 일괄 등록 엑셀 양식 다운로드
 */
export const downloadComponentTemplateExcel = () => {
  // 양식 헤더 및 예시 데이터
  const templateData = [
    {
      '등록번호': 'S000001154',
      '부재료코드': 'PKG-001',
      '부재료명': '제니트리 수분크림 용기',
      '규격': '100ml',
      '종류(구분)': '포장부자재',
      '구분(1차/2차)': '1차',
      '용기형태': '0410',
      '재질': 'PET',
      '개당중량(g)': 12.5,
      '비고': '투명 용기'
    },
    {
      '등록번호': 'S000001155',
      '부재료코드': 'PKG-002',
      '부재료명': '제니트리 수분크림 캡',
      '규격': '파이30',
      '종류(구분)': '포장부자재',
      '구분(1차/2차)': '1차',
      '용기형태': '0410',
      '재질': 'PP',
      '개당중량(g)': 3.2,
      '비고': '흰색 캡'
    }
  ];

  // 워크시트 생성
  const ws = XLSX.utils.json_to_sheet(templateData);

  // 컬럼 너비 조정
  const wscols = [
    { wch: 15 }, // 등록번호
    { wch: 15 }, // 부재료코드
    { wch: 30 }, // 부재료명
    { wch: 15 }, // 규격
    { wch: 15 }, // 종류(구분)
    { wch: 15 }, // 구분(1차/2차)
    { wch: 15 }, // 용기형태
    { wch: 15 }, // 재질
    { wch: 15 }, // 개당중량(g)
    { wch: 20 }  // 비고
  ];
  ws['!cols'] = wscols;

  // 워크북 생성 및 파일 다운로드
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '포장재등록양식');
  XLSX.writeFile(wb, '포장재_일괄등록_양식.xlsx');
};
