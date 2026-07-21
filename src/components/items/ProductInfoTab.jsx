import React, { useState, useEffect } from 'react';
import usePackagingStore from '../../stores/packagingStore';
import { BRAND_TYPES, MFG_TYPES } from '../../utils/constants';

export default function ProductInfoTab() {
  const { finishedProducts, selectedProductId, updateFinishedProduct, deleteFinishedProduct, setSelectedProduct } = usePackagingStore();
  
  // 선택된 제품 객체를 찾습니다.
  const product = finishedProducts.find(p => p.id === selectedProductId);
  
  // 폼 상태 관리
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    volume: '',
    brandType: '',
    mfgType: ''
  });

  // 선택된 제품이 바뀔 때마다 폼 데이터를 동기화합니다.
  useEffect(() => {
    if (product) {
      setFormData({
        code: product.code || '',
        name: product.name || '',
        volume: product.volume || '',
        brandType: product.brandType || (BRAND_TYPES[0]?.code || 'OWN'),
        mfgType: product.mfgType || (MFG_TYPES[0]?.code || 'MFG')
      });
    }
  }, [product]);

  // 제품이 선택되지 않았을 때는 렌더링하지 않습니다.
  if (!product) return null;

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

  const isEprTarget = formData.brandType === 'OWN';

  return (
    <div className="max-w-3xl space-y-6">
      {/* 헤더 및 액션 버튼 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">품목기본정보</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40"
          >
            삭제
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            저장
          </button>
        </div>
      </div>

      {/* 정보 입력 폼 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">완제품코드</label>
          <input 
            type="text" 
            value={formData.code} 
            onChange={e => setFormData({...formData, code: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">상품명 및 규격</label>
          <input 
            type="text" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">용량 (ml)</label>
          <input 
            type="number" 
            value={formData.volume} 
            onChange={e => setFormData({...formData, volume: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        {/* EPR 신고 대상 상태 표시 */}
        <div className="flex items-end">
          <div className={`px-4 py-2 rounded-md text-sm font-medium w-full text-center ${isEprTarget ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
            {isEprTarget ? 'EPR 신고 대상 제품입니다' : 'EPR 신고 제외 대상입니다'}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">자사/타사 구분</label>
          <select 
            value={formData.brandType} 
            onChange={e => setFormData({...formData, brandType: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          >
            {BRAND_TYPES.map(t => (
              <option key={t.code} value={t.code}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">제조/수입 구분</label>
          <select 
            value={formData.mfgType} 
            onChange={e => setFormData({...formData, mfgType: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
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
