import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { CONTAINER_TYPE_MAP, MATERIAL_OPTIONS, PACKAGING_CATEGORIES } from '../../utils/constants';

export default function PackagingComponentForm({ isOpen, onClose, onSave, editData }) {
  // 포장재 정보 폼 상태 관리
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: PACKAGING_CATEGORIES[0]?.code || '',
    containerType: '',
    material: '',
    weightPerUnit: '',
    remark: '',
    specFile: null // 사양서 파일 저장을 위한 상태
  });

  // 수정 모드일 경우 기존 데이터로 폼을 채우고, 등록일 경우 빈 폼으로 초기화합니다.
  useEffect(() => {
    if (editData) {
      setFormData({
        code: editData.code || '',
        name: editData.name || '',
        category: editData.category || PACKAGING_CATEGORIES[0]?.code || '',
        containerType: editData.containerType || '',
        material: editData.material || '',
        weightPerUnit: editData.weightPerUnit || '',
        remark: editData.remark || '',
        specFile: null 
      });
    } else {
      setFormData({
        code: '',
        name: '',
        category: PACKAGING_CATEGORIES[0]?.code || '',
        containerType: '',
        material: '',
        weightPerUnit: '',
        remark: '',
        specFile: null
      });
    }
  }, [editData, isOpen]);

  // 저장 버튼 클릭 시 호출
  const handleSave = () => {
    onSave({
      ...formData,
      // 텍스트로 된 중량을 숫자형으로 확실하게 변환
      weightPerUnit: parseFloat(formData.weightPerUnit) || 0
    });
  };

  // 객체 맵핑을 배열로 변환하여 드롭다운에서 사용하기 쉽게 만듭니다.
  const containerOptions = Object.entries(CONTAINER_TYPE_MAP).map(([code, label]) => ({ code, label }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? '포장재 수정' : '새 포장재 등록'} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">포장재코드</label>
            <input 
              type="text" 
              value={formData.code} 
              onChange={e => setFormData({...formData, code: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">포장재명</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">구분 (1차/2차)</label>
            <select 
              value={formData.category} 
              onChange={e => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              {PACKAGING_CATEGORIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">용기 형태</label>
            <select 
              value={formData.containerType} 
              onChange={e => setFormData({...formData, containerType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="">선택</option>
              {containerOptions.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">재질</label>
            <select 
              value={formData.material} 
              onChange={e => setFormData({...formData, material: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="">선택</option>
              {MATERIAL_OPTIONS.map(m => (
                <option key={m.code} value={m.code}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">개당 중량(g)</label>
            <input 
              type="number" 
              step="0.000001"
              value={formData.weightPerUnit} 
              onChange={e => setFormData({...formData, weightPerUnit: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="예: 12.3456"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">비고/분리여부</label>
          <input 
            type="text" 
            value={formData.remark} 
            onChange={e => setFormData({...formData, remark: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            placeholder="특이사항이나 분리배출 표시 여부 등 기록"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">사양서 파일</label>
          <input 
            type="file" 
            onChange={e => setFormData({...formData, specFile: e.target.files[0]})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            취소
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            저장
          </button>
        </div>
      </div>
    </Modal>
  );
}
