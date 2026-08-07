import React, { useState, useEffect } from 'react';
import usePackagingStore from '../../stores/packagingStore';
import { BRAND_TYPES, MFG_TYPES, EPR_MATERIAL_GROUPS } from '../../utils/constants';

export default function ProductInfoTab() {
  const { finishedProducts, selectedProductId, updateFinishedProduct, deleteFinishedProduct, setSelectedProduct, packagingComponents } = usePackagingStore();
  
  // 선택된 제품 객체를 찾습니다.
  const product = finishedProducts.find(p => p.id === selectedProductId);
  
  // 폼 상태 관리
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    prodReportName: '',
    weight: '',
    brandType: '',
    mfgType: ''
  });

  // 선택된 제품이 바뀔 때마다 폼 데이터를 동기화합니다.
  useEffect(() => {
    if (product) {
      setFormData({
        code: product.code || '',
        name: product.name || '',
        prodReportName: product.prodReportName || '',
        weight: product.weight || '',
        brandType: product.brandType || (BRAND_TYPES[0]?.code || 'OWN'),
        mfgType: product.mfgType || (MFG_TYPES[0]?.code || 'MFG')
      });
    }
  }, [product]);

  // 제품이 선택되지 않았을 때는 렌더링하지 않습니다.
  if (!product) return null;

  // ─── 완제품 재활용 등급 산출 로직 ───
  const getGradeRank = (grade) => {
    if (!grade || grade.includes('미평가')) return 99;
    if (grade.includes('최우수')) return 1;
    if (grade.includes('우수')) return 2;
    if (grade.includes('보통') || grade.includes('용이')) return 3;
    if (grade.includes('어려움')) return 4;
    return 99;
  };

  const calculateFinalGrade = () => {
    const currentVersion = product.versions && product.versions.length > 0 ? product.versions[0] : null;
    if (!currentVersion || !currentVersion.bomItems || currentVersion.bomItems.length === 0) return '등록된 부자재 없음';
    
    let maxRank = 0;
    let hasUnevaluated = false;
    let hasTargetItems = false;

    for (const item of currentVersion.bomItems) {
      const comp = packagingComponents.find(c => String(c.id) === String(item.componentId || item.component_id));
      if (!comp) continue;

      const checkIsTarget = (material, containerType) => {
        const group = EPR_MATERIAL_GROUPS.find(g => g.materials.includes(material));
        if (group && containerType && !containerType.startsWith('신고제외')) {
          return true; 
        }
        return false; 
      };

      let isTarget = false;
      if (comp.subComponents && comp.subComponents.length > 0) {
        isTarget = comp.subComponents.some(sub => 
          checkIsTarget(sub.material || '', sub.containerType || comp.containerType || '')
        );
      } else {
        isTarget = checkIsTarget(comp.material || '', comp.containerType || '');
      }

      if (!isTarget) continue;

      hasTargetItems = true;
      const grade = comp.materialEvalResult || '미평가';
      
      if (grade.includes('미평가')) {
        hasUnevaluated = true;
      } else {
        const rank = getGradeRank(grade);
        if (rank > maxRank) maxRank = rank;
      }
    }

    if (!hasTargetItems) return '-';
    if (hasUnevaluated) return '평가 진행중(미평가)';
    
    switch(maxRank) {
      case 1: return '재활용 최우수';
      case 2: return '재활용 우수';
      case 3: return '재활용 용이(보통)';
      case 4: return '재활용 어려움';
      default: return '평가 진행중(미평가)';
    }
  };

  const finalProductGrade = calculateFinalGrade();

  // 등급에 따른 배지 스타일 설정
  const getGradeStyle = (grade) => {
    if (grade.includes('어려움')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800';
    if (grade.includes('우수') || grade.includes('보통') || grade.includes('용이')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700'; // 미평가, 없음 등
  };

  // 수정 내용 저장
  const handleSave = () => {
    updateFinishedProduct(selectedProductId, formData);
    alert('저장되었습니다.');
  };

  // 제품 삭제 (사전 동의 확인)
  const handleDelete = () => {
    if (window.confirm('정말로 이 제품을 삭제하시겠습니까? 관련 BOM 정보도 함께 삭제됩니다.')) {
      deleteFinishedProduct(selectedProductId);
      setSelectedProduct(null);
    }
  };

  const isEprTarget = formData.brandType === '자사';

  return (
    <div className="max-w-3xl space-y-6">
      {/* 헤더 및 액션 버튼 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">품목기본정보</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50   rounded-md hover:bg-red-100 dark:hover:bg-red-900/40"
          >
            삭제
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-400 text-white font-bold tracking-wide shadow-sm hover:shadow-md rounded-md hover:bg-brand-500"
          >
            저장
          </button>
        </div>
      </div>

      {/* 정보 입력 폼 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700  mb-1">완제품코드</label>
          <input 
            type="text" 
            value={formData.code} 
            onChange={e => setFormData({...formData, code: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300  rounded-md  dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700  mb-1">상품명 및 규격</label>
          <input 
            type="text" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300  rounded-md  dark:text-white"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700  mb-1">생산실적보고 매칭 제품명 (중요)</label>
          <input 
            type="text" 
            value={formData.prodReportName} 
            onChange={e => setFormData({...formData, prodReportName: e.target.value})}
            placeholder="생산실적보고서 엑셀의 '제품명'과 정확히 일치해야 합니다."
            className="w-full px-3 py-2 border border-brand-200  bg-brand-50/30  rounded-md  focus:ring-brand-400 focus:border-brand-400"
          />
          <p className="mt-1 text-xs text-gray-500">이 이름이 실적보고서의 제품명과 일치해야 포장재 사용량이 자동 계산됩니다.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700  mb-1">용량 (ml)</label>
          <input 
            type="number" 
            value={formData.weight} 
            onChange={e => setFormData({...formData, weight: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300  rounded-md  dark:text-white"
          />
        </div>
        
        {/* EPR 신고 대상 상태 표시 */}
        <div className="flex flex-col gap-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">상태 및 평가 등급</label>
          <div className="flex gap-2">
            <div className={`px-4 py-2 rounded-md text-sm font-medium w-1/2 text-center ${isEprTarget ? 'bg-green-100 text-green-800  dark:text-green-300' : 'bg-gray-100 text-gray-800  dark:text-gray-300'}`}>
              {isEprTarget ? 'EPR 신고 대상 제품입니다' : 'EPR 신고 제외 대상입니다'}
            </div>
            <div className={`px-4 py-2 rounded-md text-sm font-medium w-1/2 text-center ${getGradeStyle(finalProductGrade)}`}>
              {finalProductGrade}
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700  mb-1">자사/타사 구분</label>
          <select 
            value={formData.brandType} 
            onChange={e => setFormData({...formData, brandType: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300  rounded-md  dark:text-white"
          >
            {BRAND_TYPES.map(t => (
              <option key={t.code} value={t.code}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700  mb-1">제조/수입 구분</label>
          <select 
            value={formData.mfgType} 
            onChange={e => setFormData({...formData, mfgType: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300  rounded-md  dark:text-white"
          >
            {MFG_TYPES.map(t => (
              <option key={t.code} value={t.code}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
