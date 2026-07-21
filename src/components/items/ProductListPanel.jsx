import React, { useState, useRef } from 'react';
import { Plus, Search, ChevronRight, AlertCircle, Upload } from 'lucide-react';
import usePackagingStore from '../../stores/packagingStore';
import SearchBar from '../common/SearchBar';
import Modal from '../common/Modal';
import { BRAND_TYPES, MFG_TYPES } from '../../utils/constants';
import { parseExcelFile, formatProductsFromExcel, downloadProductTemplateExcel } from '../../utils/excelParser';

export default function ProductListPanel() {
  // 스토어에서 제품 목록 및 상태 변경 함수들을 가져옵니다.
  const { finishedProducts, selectedProductId, setSelectedProduct, addFinishedProduct, uploadProductsFromExcel } = usePackagingStore();
  
  const fileInputRef = useRef(null);
  
  // 상태 관리: 검색어, 브랜드 필터, 모달 열림 여부, 폼 데이터
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameEn: '',
    cosmeticsType: '일반화장품',
    spec: '',
    volume: '',
    weight: 0,
    brandType: BRAND_TYPES[0]?.code || 'OWN',
    mfgType: MFG_TYPES[0]?.code || 'MFG',
  });

  // 검색어와 브랜드 필터를 적용하여 제품 목록을 필터링합니다.
  const filteredProducts = finishedProducts.filter(p => {
    const matchesSearch = p.name.includes(searchTerm) || p.code.includes(searchTerm);
    const matchesBrand = brandFilter === 'all' || p.brandType === brandFilter;
    return matchesSearch && matchesBrand;
  });

  // 엑셀 업로드 처리 함수
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const rawData = await parseExcelFile(file);
      const formattedData = formatProductsFromExcel(rawData);
      
      if (formattedData.length > 0) {
        const success = await uploadProductsFromExcel(formattedData);
        if (success) {
          alert(`총 ${formattedData.length}건의 완제품이 성공적으로 업로드되었습니다.`);
        } else {
          alert('엑셀 업로드 중 오류가 발생했습니다.');
        }
      } else {
        alert('업로드할 데이터가 없거나 양식이 잘못되었습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('엑셀 파일 파싱 중 오류가 발생했습니다.');
    } finally {
      e.target.value = null; // 초기화
    }
  };

  // 새 제품을 등록하는 함수
  const handleAddProduct = () => {
    addFinishedProduct({
      ...formData,
      id: Date.now().toString(), // 고유 ID로 현재 시간 사용
      versions: [{ version: 'v1.0', bomItems: [], createdAt: new Date().toISOString() }], // 초기 버전 생성
      createdAt: new Date().toISOString()
    });
    
    // 모달 닫기 및 폼 초기화
    setIsModalOpen(false);
    setFormData({
      code: '', name: '', nameEn: '', cosmeticsType: '일반화장품', spec: '', volume: '', weight: 0,
      brandType: BRAND_TYPES[0]?.code || 'OWN', 
      mfgType: MFG_TYPES[0]?.code || 'MFG'
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50  border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200  space-y-4">
        {/* 헤더 및 버튼 영역 */}
        <div className="flex justify-between items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">제품 목록</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 bg-brand-400 text-white font-bold tracking-wide shadow-sm hover:shadow-md hover:bg-brand-500 text-white rounded-md transition-colors"
              title="새 제품 등록"
            >
              <Plus size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleExcelUpload} 
              accept=".xlsx, .xls" 
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-md transition-colors flex items-center gap-1"
              title="엑셀 일괄 업로드"
            >
              <Upload size={16} /> 엑셀
            </button>
            <button
              onClick={downloadProductTemplateExcel}
              className="px-3 py-1.5 bg-brand-100  text-blue-700  hover:bg-blue-200 dark:hover:bg-blue-800 text-sm rounded-md transition-colors flex items-center gap-1"
              title="완제품 일괄등록 양식 다운로드"
            >
              양식 다운로드
            </button>
          </div>
        </div>
        
        {/* 검색 바 */}
        <SearchBar 
          value={searchTerm} 
          onChange={setSearchTerm} 
          placeholder="제품코드, 상품명 검색" 
        />
        
        {/* 자사/타사 필터 토글 버튼 */}
        <div className="flex space-x-2">
          <button
            onClick={() => setBrandFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-full ${brandFilter === 'all' ? 'bg-gray-200  text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            전체
          </button>
          {BRAND_TYPES.map(type => (
            <button
              key={type.code}
              onClick={() => setBrandFilter(type.code)}
              className={`px-3 py-1.5 text-sm rounded-full ${brandFilter === type.code ? 'bg-gray-200  text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* 제품 목록 표시 영역 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredProducts.map(product => {
          const isSelected = selectedProductId === product.id;
          const isOwnBrand = product.brandType === 'OWN'; // 자사 제품 여부
          const latestVersion = product.versions[product.versions.length - 1]?.version || 'v1.0';

          return (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product.id)}
              className={`p-4 rounded-lg cursor-pointer border ${isSelected ? 'border-l-4 border-l-blue-600 border-gray-200  bg-white dark:bg-gray-800' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 bg-white  border-gray-100 dark:border-gray-700'} shadow-sm transition-all`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{product.code}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isOwnBrand ? 'bg-brand-100 text-blue-800  dark:text-blue-200' : 'bg-gray-100 text-gray-800  dark:text-gray-300'}`}>
                  {BRAND_TYPES.find(t => t.code === product.brandType)?.label || '타사'}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900  mb-1">{product.name}</h3>
              {product.nameEn && <div className="text-[10px] text-gray-400 mb-2">{product.nameEn}</div>}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {product.cosmeticsType && <span className="text-[10px] bg-gray-100  px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">{product.cosmeticsType}</span>}
                {product.spec && <span className="text-[10px] bg-gray-100  px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">{product.spec}</span>}
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>{product.volume}ml</span>
                <span className="flex items-center">
                  <span className="bg-gray-100  px-1.5 py-0.5 rounded text-[10px]">{latestVersion}</span>
                </span>
              </div>
            </div>
          );
        })}
        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500  text-sm">
            등록된 제품이 없습니다.
          </div>
        )}
      </div>

      {/* 새 제품 등록 모달 */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="새 제품 등록">
        <div className="space-y-4">
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
            <label className="block text-sm font-medium text-gray-700  mb-1">상품명</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300  rounded-md  dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">상품명(영문)</label>
            <input 
              type="text" 
              value={formData.nameEn} 
              onChange={e => setFormData({...formData, nameEn: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300  rounded-md  dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">화장품유형</label>
            <input 
              type="text" 
              value={formData.cosmeticsType} 
              onChange={e => setFormData({...formData, cosmeticsType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300  rounded-md  dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700  mb-1">규격</label>
              <input 
                type="text" 
                value={formData.spec} 
                onChange={e => setFormData({...formData, spec: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300  rounded-md  dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700  mb-1">용량/중량</label>
              <input 
                type="number" 
                value={formData.weight} 
                onChange={e => setFormData({...formData, weight: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300  rounded-md  dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          
          {/* 타사 선택 시 경고 표시 */}
          {formData.brandType !== 'OWN' && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50  text-yellow-800  rounded-md text-sm">
              <AlertCircle size={16} />
              <span>타사 브랜드는 EPR 신고 제외 대상입니다.</span>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700  bg-white  border border-gray-300  rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              취소
            </button>
            <button 
              onClick={handleAddProduct}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-400 text-white font-bold tracking-wide shadow-sm hover:shadow-md rounded-md hover:bg-brand-500"
            >
              등록
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
