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
export const formatComponentsFromExcel = (rows, defaultType = '포장부자재') => {
  return rows.map(row => ({
    regNo: row['등록번호'] || row['부재료등록번호'] || row['reg_no'] || '',
    code: row['부재료코드'] || row['부재료코드'] || row['code'] || '',
    name: row['부재료명'] || row['name'] || '',
    spec: row['규격'] || row['spec'] || '',
    type: defaultType,
    material: '',
    weight: 0
  })).filter(item => item.code && item.name);
};

/**
 * 생산실적보고서 엑셀 데이터를 규격에 맞게 변환
 */
export const formatProductionReportFromExcel = (rows) => {
  return rows.map(row => ({
    no: row['순번'] || row['No'] || '',
    prodReportName: row['제품명(국문)'] || row['제품명'] || '',
    manufacturer: row['제조업자(국문)'] || '',
    capacity: row['용량(숫자)'] || 0,
    unit: row['단위'] || '',
    quantity: Number(row['생산량(개)']) || 0,
    unitPrice: Number(row['생산단가(원)']) || 0,
  })).filter(item => item.prodReportName); // 제품명이 있는 행만 추출
};
