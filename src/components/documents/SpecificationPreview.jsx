import React, { forwardRef } from 'react';
import useSettingsStore from '../../stores/settingsStore';
import { formatDateForSpec, PLASTIC_MATERIALS } from '../../utils/constants';

/**
 * PDF 및 인쇄를 위한 A4 사양서 미리보기 컴포넌트입니다.
 * html2pdf.js가 화면을 정확히 PDF로 변환할 수 있도록 모든 디자인 요소는 
 * Tailwind CSS 클래스가 아닌 '인라인 스타일(Inline Style)'로 엄격하게 작성되었습니다.
 */
const SpecificationPreview = forwardRef(({ product, versionIndex, certNo, remark, issueDate }, ref) => {
  // 설정 스토어에서 회사 정보(이름, 주소, 연락처, 로고, 도장 등)를 불러옵니다.
  const { companyInfo } = useSettingsStore();

  // 선택된 제품 정보가 없다면 화면을 그리지 않습니다.
  if (!product) return null;

  // 선택된 제품의 버전 정보를 가져옵니다. (기본값 처리 포함)
  const version = product.versions && product.versions.length > 0 
    ? product.versions[versionIndex] || product.versions[0] 
    : { version: '1.0', components: [] };

  /**
   * 버전에 포함된 부품들 중 '플라스틱 재질'에 해당하는 것들의 총 중량을 계산합니다.
   */
  const calculateTotalPlastic = () => {
    let total = 0;
    version.components.forEach(comp => {
      // PLASTIC_MATERIALS 목록에 포함된 재질인지 검사
      if (PLASTIC_MATERIALS.includes(comp.material)) {
        // 개당 중량(weight) x 수량(quantity)
        total += (Number(comp.weight) || 0) * (Number(comp.quantity) || 1);
      }
    });
    // 소수점 6자리까지 정확하게 표기합니다.
    return total.toFixed(6);
  };

  return (
    <div 
      ref={ref} 
      className="a4-preview"
      style={{
        width: '210mm',
        minHeight: '297mm', // A4 세로 규격
        padding: '20mm',
        backgroundColor: '#ffffff',
        fontFamily: 'Pretendard, "Malgun Gothic", sans-serif',
        color: '#000000',
        boxSizing: 'border-box'
      }}
    >
      {/* 1. 상단 헤더: 회사 로고 및 이름 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>JANYTREE</div>
        <div>
          {companyInfo.logo ? (
            <img src={companyInfo.logo} alt="Logo" style={{ height: '40px', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: '14px', color: '#666' }}>JANYTREE LOGO</span>
          )}
        </div>
      </div>

      {/* 2. 사양서 제목 영역 */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '600' }}>Certificate of Packaging Specification</div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '5px' }}>용기 재질 및 중량 사양서</div>
      </div>

      {/* 구분선 */}
      <div style={{ borderTop: '2px solid black', marginBottom: '20px' }}></div>

      {/* 3. 제품 메타 정보 테이블 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f5f5f5', width: '20%', fontWeight: 'bold', textAlign: 'center' }}>제품명 (Product)</td>
            <td style={{ border: '1px solid black', padding: '8px', width: '30%' }}>{product.name}</td>
            <td style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f5f5f5', width: '20%', fontWeight: 'bold', textAlign: 'center' }}>버전 (Version)</td>
            <td style={{ border: '1px solid black', padding: '8px', width: '30%' }}>{version.version}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f5f5f5', fontWeight: 'bold', textAlign: 'center' }}>제품코드 (Code)</td>
            <td style={{ border: '1px solid black', padding: '8px' }}>{product.code} v{version.version}</td>
            <td style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f5f5f5', fontWeight: 'bold', textAlign: 'center' }}>인증번호 (No.)</td>
            <td style={{ border: '1px solid black', padding: '8px' }}>{certNo || ''}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f5f5f5', fontWeight: 'bold', textAlign: 'center' }}>비고 (Remark)</td>
            <td style={{ border: '1px solid black', padding: '8px' }}>{remark}</td>
            <td style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f5f5f5', fontWeight: 'bold', textAlign: 'center' }}>발행일 (Date)</td>
            <td style={{ border: '1px solid black', padding: '8px' }}>{formatDateForSpec(issueDate)}</td>
          </tr>
        </tbody>
      </table>

      {/* 구분선 */}
      <div style={{ borderTop: '1px solid black', marginBottom: '20px' }}></div>

      {/* 4. 부품 및 재질 배합 정보 타이틀 */}
      <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
        PACKAGING COMPONENTS (용기 부품 및 재질 배합 정보)
      </div>

      {/* 5. BOM(자재명세서) 데이터 테이블 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', fontSize: '11px', textAlign: 'center' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ border: '1px solid black', padding: '8px' }}>No</th>
            <th style={{ border: '1px solid black', padding: '8px' }}>부품명 (Component)</th>
            <th style={{ border: '1px solid black', padding: '8px' }}>재질 (Material)</th>
            <th style={{ border: '1px solid black', padding: '8px' }}>ERP코드</th>
            <th style={{ border: '1px solid black', padding: '8px' }}>비고 / 분리여부</th>
            <th style={{ border: '1px solid black', padding: '8px' }}>개당 중량(g)</th>
            <th style={{ border: '1px solid black', padding: '8px' }}>수량</th>
            <th style={{ border: '1px solid black', padding: '8px' }}>총 중량(g)</th>
          </tr>
        </thead>
        <tbody>
          {/* 부품 목록을 순회하며 테이블 행(tr)을 생성합니다. */}
          {version.components && version.components.map((comp, idx) => {
            const weight = Number(comp.weight) || 0;
            const quantity = Number(comp.quantity) || 1;
            const totalWeight = weight * quantity;
            return (
              <tr key={idx}>
                <td style={{ border: '1px solid black', padding: '6px' }}>{idx + 1}</td>
                <td style={{ border: '1px solid black', padding: '6px' }}>{comp.name}</td>
                <td style={{ border: '1px solid black', padding: '6px' }}>{comp.material}</td>
                <td style={{ border: '1px solid black', padding: '6px' }}>{comp.erpCode || '-'}</td>
                <td style={{ border: '1px solid black', padding: '6px' }}>{comp.remark || '-'}</td>
                <td style={{ border: '1px solid black', padding: '6px', textAlign: 'right' }}>{weight.toFixed(6)}</td>
                <td style={{ border: '1px solid black', padding: '6px' }}>{quantity}</td>
                <td style={{ border: '1px solid black', padding: '6px', textAlign: 'right' }}>{totalWeight.toFixed(6)}</td>
              </tr>
            );
          })}
          {/* 하단 플라스틱 총합 행 */}
          <tr>
            <td colSpan="7" style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold', backgroundColor: '#fffbe6' }}>
              TOTAL PLASTIC
            </td>
            <td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold', backgroundColor: '#fffbe6', textAlign: 'right', color: 'red' }}>
              {calculateTotalPlastic()} g
            </td>
          </tr>
        </tbody>
      </table>

      {/* 이중선 구분 */}
      <div style={{ borderTop: '3px double black', margin: '30px 0' }}></div>

      {/* 6. 하단 푸터 (회사 주소, 연락처, 서명 및 도장) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '12px' }}>
        
        {/* 좌측: 회사 정보 */}
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>
            {companyInfo.nameKo} | {companyInfo.nameEn}
          </div>
          <div>{companyInfo.addressKo}</div>
          <div>{companyInfo.addressEn}</div>
          <div style={{ marginTop: '5px' }}>
            Tel: {companyInfo.phone} | Fax: {companyInfo.fax} | Email: {companyInfo.email}
          </div>
        </div>
        
        {/* 우측: 서명 및 도장 란 */}
        <div style={{ textAlign: 'right', position: 'relative', width: '200px' }}>
          <div style={{ marginBottom: '10px' }}>(Signature/Date)</div>
          {companyInfo.stamp && (
            <img 
              src={companyInfo.stamp} 
              alt="Stamp" 
              style={{ position: 'absolute', right: '0', bottom: '0', width: '60px', opacity: '0.9' }} 
            />
          )}
          {/* 서명 밑줄 */}
          <div style={{ borderBottom: '1px solid black', width: '100%', height: '30px' }}></div>
        </div>
      </div>

      {/* 페이지 번호 (A4 단일 페이지 기준) */}
      <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '10px', color: '#666' }}>
        Page: 1/1
      </div>
    </div>
  );
});

export default SpecificationPreview;
