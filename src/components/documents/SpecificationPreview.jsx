import React, { forwardRef } from 'react';
import useSettingsStore from '../../stores/settingsStore';
import usePackagingStore from '../../stores/packagingStore';
import { formatDateForSpec, PLASTIC_MATERIALS } from '../../utils/constants';

/**
 * PDF 및 인쇄를 위한 A4 사양서 미리보기 컴포넌트입니다.
 * html2pdf.js가 화면을 정확히 PDF로 변환할 수 있도록 모든 디자인 요소는 
 * Tailwind CSS 클래스가 아닌 '인라인 스타일(Inline Style)'로 엄격하게 작성되었습니다.
 */
const SpecificationPreview = forwardRef(({ product, versionIndex, certNo, remark, issueDate }, ref) => {
  // 설정 스토어에서 회사 정보(이름, 주소, 연락처, 로고, 도장 등)를 불러옵니다.
  const { companyInfo } = useSettingsStore();

  // 패키징 스토어에서 전체 포장재 마스터 데이터를 불러옵니다. (BOM 아이템과 매핑하기 위함)
  const { packagingComponents } = usePackagingStore();

  // 선택된 제품 정보가 없다면 화면을 그리지 않습니다.
  if (!product) return null;

  // 선택된 제품의 버전 정보를 가져옵니다. (기본값 처리 포함)
  const version = product.versions && product.versions.length > 0 
    ? product.versions[versionIndex] || product.versions[0] 
    : { version: '1.0', bomItems: [] };

  // BOM 아이템들을 신고대상(Target)과 비대상(Exempt)으로 분리합니다.
  const targetItems = [];
  const exemptItems = [];

  (version.bomItems || []).forEach(bItem => {
    const comp = packagingComponents.find(c => c.id === (bItem.componentId || bItem.component_id));
    if (!comp) return;

    let isTarget = false;
    // 1. 플라스틱 재질이어야 함
    if (PLASTIC_MATERIALS.includes(comp.material)) {
      // 2. 용기형태가 '신고제외'가 아니어야 함
      if (!comp.containerType || !comp.containerType.startsWith('신고제외')) {
        isTarget = true;
      }
    }

    if (isTarget) {
      targetItems.push({ bItem, comp });
    } else {
      exemptItems.push({ bItem, comp });
    }
  });

  /**
   * 버전에 포함된 부품들 중 '신고 대상'에 해당하는 것들의 총 중량을 계산합니다.
   */
  const calculateTotalPlastic = () => {
    let total = 0;
    targetItems.forEach(({ bItem, comp }) => {
      total += (Number(comp.weightPerUnit) || 0) * (Number(bItem.qty) || 1);
    });
    return total.toFixed(6);
  };

  /**
   * BOM 리스트를 '충진부자재'와 '포장부자재'로 그룹핑하여 테이블 행(tr) 배열을 반환하는 헬퍼 함수입니다.
   */
  const renderGroupedRows = (items, prefixKey) => {
    const filling = items.filter(i => i.comp.type === '충진부자재');
    const packaging = items.filter(i => i.comp.type !== '충진부자재');
    
    let rows = [];
    let globalNo = 1;

    const createRow = ({ bItem, comp }, idx, groupName) => {
      const weight = Number(comp.weightPerUnit) || 0;
      const quantity = Number(bItem.qty) || 1;
      const totalWeight = weight * quantity;
      return (
        <tr key={`${prefixKey}-${groupName}-${idx}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
          <td style={{ padding: '6px 4px', textAlign: 'center', color: '#6b7280' }}>{globalNo++}</td>
          <td style={{ padding: '6px 4px', fontWeight: '500', wordBreak: 'break-all' }}>{comp.name}</td>
          <td style={{ padding: '6px 4px', color: '#4b5563', wordBreak: 'break-all' }}>{comp.material || '-'}</td>
          <td style={{ padding: '6px 4px', color: '#6b7280', wordBreak: 'break-all' }}>{comp.code || '-'}</td>
          <td style={{ padding: '6px 4px', color: '#6b7280', wordBreak: 'break-all' }}>{comp.remark || comp.description || '-'}</td>
          <td style={{ padding: '6px 4px', textAlign: 'right' }}>{weight.toFixed(6)}</td>
          <td style={{ padding: '6px 4px', textAlign: 'center' }}>{quantity}</td>
          <td style={{ padding: '6px 4px', textAlign: 'right' }}>{totalWeight.toFixed(6)}</td>
        </tr>
      );
    };

    if (filling.length > 0) {
      rows.push(
        <tr key={`${prefixKey}-header-filling`} style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
          <td colSpan="8" style={{ padding: '6px 12px', fontWeight: 'bold', color: '#374151', fontSize: '11px', letterSpacing: '0.5px' }}>
            [ 충진 부자재 ]
          </td>
        </tr>
      );
      filling.forEach((item, idx) => {
        rows.push(createRow(item, idx, 'filling'));
      });
    }

    if (packaging.length > 0) {
      rows.push(
        <tr key={`${prefixKey}-header-packaging`} style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
          <td colSpan="8" style={{ padding: '6px 12px', fontWeight: 'bold', color: '#374151', fontSize: '11px', letterSpacing: '0.5px' }}>
            [ 포장 부자재 ]
          </td>
        </tr>
      );
      packaging.forEach((item, idx) => {
        rows.push(createRow(item, idx, 'packaging'));
      });
    }

    if (rows.length === 0) {
      rows.push(
        <tr key={`${prefixKey}-empty`}>
          <td colSpan="8" style={{ padding: '20px 8px', textAlign: 'center', color: '#9ca3af', borderBottom: '1px solid #e5e7eb' }}>
            해당 부품이 없습니다.
          </td>
        </tr>
      );
    }
    return rows;
  };

  return (
    <div 
      ref={ref} 
      className="a4-preview"
      style={{
        width: '210mm',
        padding: '12mm 15mm', // 여백 대폭 축소 (한 페이지 안에 다 들어오도록)
        backgroundColor: '#ffffff',
        fontFamily: '"Inter", "Pretendard", "Malgun Gothic", sans-serif',
        color: '#1f2937', 
        boxSizing: 'border-box'
      }}
    >
      {/* 1. 상단 헤더: 회사 로고 및 제목 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          {companyInfo.logo ? (
            <img 
              src={companyInfo.logo} 
              alt="Logo" 
              style={{ width: '150px', height: '50px', objectFit: 'contain', objectPosition: 'left center', marginBottom: '8px', display: 'block' }} 
            />
          ) : (
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#1f2937', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '24px', marginBottom: '8px' }}>J</div>
          )}
          <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px' }}>{companyInfo.nameKo || 'JANYTREE'}</div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#111827' }}>Certificate of Specification</div>
          <div style={{ fontSize: '16px', color: '#6b7280', marginTop: '4px' }}>용기 재질 및 중량 사양서</div>
        </div>
      </div>

      {/* 2. 제품 메타 정보 테이블 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '11px', borderTop: '2px solid #111827', borderBottom: '1px solid #e5e7eb', tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 6px', color: '#6b7280', width: '20%' }}>Product Name</td>
            <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 6px', width: '30%', fontWeight: '500', wordBreak: 'break-all' }}>{product.name}</td>
            <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 6px', color: '#6b7280', width: '20%' }}>Version</td>
            <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 6px', width: '30%', fontWeight: '500', wordBreak: 'break-all' }}>{version.version}</td>
          </tr>
          <tr>
            <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 6px', color: '#6b7280' }}>Code</td>
            <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 6px', fontWeight: '500', wordBreak: 'break-all' }}>{product.code} v{version.version}</td>
            <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 6px', color: '#6b7280' }}>Certificate No.</td>
            <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 6px', fontWeight: '500', wordBreak: 'break-all' }}>{certNo || '-'}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 6px', color: '#6b7280' }}>Remark</td>
            <td style={{ padding: '8px 6px', fontWeight: '500', wordBreak: 'break-all' }}>{remark || '-'}</td>
            <td style={{ padding: '8px 6px', color: '#6b7280' }}>Date of Issue</td>
            <td style={{ padding: '8px 6px', fontWeight: '500', wordBreak: 'break-all' }}>{formatDateForSpec(issueDate)}</td>
          </tr>
        </tbody>
      </table>

      {/* 3. 부품 및 재질 배합 정보 타이틀 (신고 대상) */}
      <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px', borderLeft: '3px solid #111827', paddingLeft: '8px', color: '#111827', textTransform: 'uppercase' }}>
        TARGET PACKAGING COMPONENTS (신고 대상)
      </div>

      {/* 4. 신고 대상 BOM 데이터 테이블 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '10px', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db' }}>
            <th style={{ padding: '8px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'center', width: '5%' }}>No</th>
            <th style={{ padding: '8px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'left', width: '22%' }}>Component Name</th>
            <th style={{ padding: '8px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'left', width: '15%' }}>Material</th>
            <th style={{ padding: '8px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'left', width: '13%' }}>ERP Code</th>
            <th style={{ padding: '8px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'left', width: '15%' }}>Remark</th>
            <th style={{ padding: '8px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'right', width: '11%' }}>Weight(g)</th>
            <th style={{ padding: '8px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'center', width: '7%' }}>Qty</th>
            <th style={{ padding: '8px 4px', fontWeight: '600', color: '#4b5563', textAlign: 'right', width: '12%' }}>Total(g)</th>
          </tr>
        </thead>
        <tbody>
          {renderGroupedRows(targetItems, 'target')}
          
          {/* 하단 플라스틱 총합 행 */}
          <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #d1d5db' }}>
            <td colSpan="7" style={{ padding: '14px 8px', fontWeight: 'bold', color: '#111827', textAlign: 'center', letterSpacing: '1px' }}>
              TOTAL PLASTIC WEIGHT
            </td>
            <td style={{ padding: '14px 8px', fontWeight: 'bold', color: '#111827', textAlign: 'right' }}>
              {calculateTotalPlastic()} g
            </td>
          </tr>
        </tbody>
      </table>

      {/* 5. 비대상 부자재 타이틀 */}
      {exemptItems.length > 0 && (
        <>
          <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px', borderLeft: '3px solid #9ca3af', paddingLeft: '8px', color: '#6b7280', textTransform: 'uppercase' }}>
            EXEMPT COMPONENTS (비대상 부자재)
          </div>

          {/* 6. 비대상 BOM 데이터 테이블 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '10px', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '8px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'center', width: '5%' }}>No</th>
                <th style={{ padding: '8px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'left', width: '22%' }}>Component Name</th>
                <th style={{ padding: '8px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'left', width: '15%' }}>Material</th>
                <th style={{ padding: '8px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'left', width: '13%' }}>ERP Code</th>
                <th style={{ padding: '8px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'left', width: '15%' }}>Remark</th>
                <th style={{ padding: '8px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'right', width: '11%' }}>Weight(g)</th>
                <th style={{ padding: '8px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'center', width: '7%' }}>Qty</th>
                <th style={{ padding: '8px 4px', fontWeight: '600', color: '#9ca3af', textAlign: 'right', width: '12%' }}>Total(g)</th>
              </tr>
            </thead>
            <tbody>
              {renderGroupedRows(exemptItems, 'exempt')}
            </tbody>
          </table>
        </>
      )}

      {/* 5. 하단 푸터 (회사 주소, 연락처, 서명 및 도장) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '10px', color: '#6b7280', paddingTop: '20px', paddingBottom: '20px' }}>
        
        {/* 좌측: 회사 정보 */}
        <div style={{ lineHeight: '1.6' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#374151', marginBottom: '6px' }}>
            {companyInfo.nameKo} | {companyInfo.nameEn}
          </div>
          <div>{companyInfo.addressKo}</div>
          <div>{companyInfo.addressEn}</div>
          <div>
            Tel: {companyInfo.phone} &nbsp;&nbsp;&nbsp; {companyInfo.email} &nbsp;&nbsp;&nbsp; Fax: {companyInfo.fax}
          </div>
        </div>
        
        {/* 우측: 서명 및 도장 란 */}
        <div style={{ textAlign: 'center', width: '320px', position: 'relative' }}>
          {companyInfo.stamp ? (
            <img 
              src={companyInfo.stamp} 
              alt="Stamp" 
              style={{ width: '320px', height: '105px', objectFit: 'contain', margin: '0 auto 6px auto', display: 'block', opacity: '0.9' }} 
            />
          ) : (
            <div style={{ height: '105px', marginBottom: '6px' }}></div>
          )}
          {/* 서명 밑줄을 부모 블록의 최하단으로 설정하여 좌측 Tel 라인과 완벽히 일치시킴 */}
          <div style={{ borderBottom: '1px solid #9ca3af', width: '100%' }}></div>
          {/* 텍스트는 선 밑으로 absolute 띄움 */}
          <div style={{ position: 'absolute', top: '100%', left: '0', width: '100%', color: '#6b7280', fontSize: '11px', letterSpacing: '0.5px', paddingTop: '6px' }}>( Signature / Date . )</div>
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
