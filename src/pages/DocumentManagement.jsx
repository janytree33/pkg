import React, { useState } from 'react';
import SplitWorkspace from '../components/layout/SplitWorkspace';
import SearchBar from '../components/common/SearchBar';
import DocumentTab from '../components/documents/DocumentTab';
import usePackagingStore from '../stores/packagingStore';
import { Package, FileText, ChevronRight } from 'lucide-react';

/**
 * 문서발행 관리(Module B)의 핵심 메인 페이지입니다.
 * SplitWorkspace를 사용하여 화면을 좌/우로 나누어 사용성을 높입니다.
 */
const DocumentManagement = () => {
  // 패키징 스토어에서 완제품 목록과 제품 선택 기능을 가져옵니다.
  const { finishedProducts, selectedProductId, setSelectedProduct, getSelectedProduct } = usePackagingStore();
  
  // 좌측 패널 상단에서 제품을 검색하기 위한 검색어 상태입니다.
  const [searchTerm, setSearchTerm] = useState('');

  // 제품명 또는 제품코드에 검색어가 포함된 제품만 필터링하여 목록에 보여줍니다.
  const filteredProducts = finishedProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 현재 선택된 완제품 데이터를 스토어에서 가져옵니다.
  const selectedProduct = getSelectedProduct();

  /**
   * [좌측 영역] - 문서를 발행할 '완제품 목록'을 검색하고 선택하는 UI입니다.
   */
  const renderLeftPanel = () => (
    <div className="flex flex-col h-full bg-white">
      {/* 1. 타이틀 및 검색 바 */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 flex items-center mb-4">
          <FileText className="mr-2 h-5 w-5 text-brand-500" />
          문서발행 대상 제품
        </h2>
        <SearchBar 
          placeholder="제품명 또는 코드 검색..." 
          value={searchTerm} 
          onChange={setSearchTerm} 
        />
      </div>

      {/* 2. 제품 카드 리스트 */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product.id)}
              className={`p-4 mb-3 rounded-lg cursor-pointer border transition-colors flex items-center justify-between ${
                // 현재 클릭하여 선택된 제품일 경우 배경색과 파란색 테두리를 주어 강조합니다.
                selectedProductId === product.id 
                  ? 'bg-brand-50 border-brand-300 shadow-sm' 
                  : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <Package className={`mt-1 mr-3 h-5 w-5 ${selectedProductId === product.id ? 'text-brand-500' : 'text-gray-400'}`} />
                <div>
                  <div className="font-bold text-gray-800">{product.name}</div>
                  <div className="text-sm text-gray-500">코드: {product.code}</div>
                  <div className="text-xs text-brand-500 mt-1 font-medium">
                    버전 수: {product.versions?.length || 0}개
                  </div>
                </div>
              </div>
              <ChevronRight className={`h-5 w-5 ${selectedProductId === product.id ? 'text-brand-500' : 'text-gray-300'}`} />
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">
            검색된 제품이 없습니다.
          </div>
        )}
      </div>
    </div>
  );

  /**
   * [우측 영역] - 선택된 제품에 대해 사양서를 폼을 통해 설정하고 발행하는 UI입니다.
   */
  const renderRightPanel = () => {
    // 아직 제품을 선택하지 않은 상태에서는 친절한 안내 문구를 화면 중앙에 보여줍니다.
    if (!selectedProduct) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-500 p-8 text-center">
          <FileText className="h-16 w-16 mb-4 text-gray-300" />
          <h3 className="text-xl font-bold mb-2 text-gray-700">발행할 제품을 선택해주세요</h3>
          <p className="text-sm text-gray-500 max-w-md leading-relaxed">
            좌측 목록에서 문서를 발행할 완제품을 클릭하시면,<br/>
            이곳에 사양서 발행을 위한 입력 폼과 미리보기 화면이 나타납니다.
          </p>
        </div>
      );
    }

    // 제품이 선택되었다면, DocumentTab 컴포넌트에 해당 제품 데이터를 전달하여 화면에 그립니다.
    return <DocumentTab product={selectedProduct} />;
  };

  return (
    // 공용 레이아웃 컴포넌트인 SplitWorkspace를 사용하여 화면 비율을 30% : 70%로 나눕니다.
    <SplitWorkspace 
      leftPanel={renderLeftPanel()}
      rightPanel={renderRightPanel()}
      defaultLeftWidth={320}
    />
  );
};

export default DocumentManagement;
