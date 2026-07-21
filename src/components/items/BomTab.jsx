import React, { useState } from 'react';
import usePackagingStore from '../../stores/packagingStore';
import DataTable from '../common/DataTable';
import PackagingComponentForm from './PackagingComponentForm';
import { Plus, Copy, Trash2 } from 'lucide-react';
import { PLASTIC_MATERIALS } from '../../utils/constants';

export default function BomTab() {
  // 포장재 관련 스토어 함수 및 상태들을 가져옵니다.
  const { 
    finishedProducts, 
    selectedProductId, 
    addBomItem, 
    removeBomItem, 
    updateBomItem, 
    createNewVersion,
    addPackagingComponent,
    packagingComponents
  } = usePackagingStore();

  const product = finishedProducts.find(p => p.id === selectedProductId);
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  if (!product) return null;

  // 버전 히스토리 가져오기. 새 버전이 생기면 항상 최신 인덱스가 유효하도록 처리합니다.
  const versions = product.versions || [];
  const currentVersionIdx = Math.min(selectedVersionIdx, Math.max(0, versions.length - 1));
  const currentVersion = versions[currentVersionIdx];

  // 기존 버전을 복사해 새 버전을 만드는 함수
  const handleCreateNewVersion = () => {
    createNewVersion(product.id);
    setSelectedVersionIdx(versions.length); // 새롭게 추가된 버전 탭으로 자동 이동
  };

  // 모달 폼에서 포장재를 저장했을 때의 처리
  const handleSaveComponent = (data) => {
    // 1. 공용 포장재(DB) 목록에 신규 데이터 추가
    const newComponentId = Date.now().toString();
    const componentData = { ...data, id: newComponentId, createdAt: new Date().toISOString() };
    addPackagingComponent(componentData);
    
    // 2. 현재 선택된 제품 버전의 BOM(부품 구성표)에 방금 만든 포장재를 1개 수량으로 추가
    addBomItem(product.id, currentVersionIdx, {
      componentId: newComponentId,
      qty: 1
    });
    
    // 모달 닫기
    setIsFormOpen(false);
  };

  // BOM에 등록된 포장재 중 플라스틱(합성수지) 재질의 중량만 합산하여 하단에 표시하기 위한 계산 로직
  const totalPlasticWeight = currentVersion?.bomItems.reduce((sum, item) => {
    // BOM에 등록된 부품의 상세 정보를 전체 포장재 목록에서 찾습니다.
    const component = packagingComponents.find(c => c.id === item.componentId);
    
    // 합성수지 재질 목록에 속하는지 체크
    if (component && PLASTIC_MATERIALS.includes(component.material)) {
      return sum + (component.weightPerUnit * item.qty);
    }
    return sum;
  }, 0) || 0;

  // 데이터 테이블 구성을 위한 컬럼 정의
  const columns = [
    { header: 'No', accessor: (row, idx) => idx + 1 },
    { 
      header: '부품명', 
      accessor: row => packagingComponents.find(c => c.id === row.componentId)?.name || '알 수 없음'
    },
    { 
      header: '재질', 
      accessor: row => packagingComponents.find(c => c.id === row.componentId)?.material || '-'
    },
    { 
      header: '포장재코드(ERP)', 
      accessor: row => packagingComponents.find(c => c.id === row.componentId)?.code || '-'
    },
    { 
      header: '비고/분리여부', 
      accessor: row => packagingComponents.find(c => c.id === row.componentId)?.remark || '-'
    },
    { 
      header: '개당 중량(g)', 
      accessor: row => (packagingComponents.find(c => c.id === row.componentId)?.weightPerUnit || 0).toFixed(6)
    },
    {
      header: '수량',
      accessor: (row) => (
        <input 
          type="number" 
          value={row.qty} 
          min="1"
          onChange={e => updateBomItem(product.id, currentVersionIdx, row.componentId, { qty: parseInt(e.target.value) || 1 })}
          className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center dark:bg-gray-700 dark:text-white"
        />
      )
    },
    { 
      header: '총 중량(g)', 
      accessor: row => {
        const component = packagingComponents.find(c => c.id === row.componentId);
        const weight = component ? component.weightPerUnit : 0;
        return (weight * row.qty).toFixed(6);
      }
    },
    {
      header: '관리',
      accessor: row => (
        <button 
          onClick={() => removeBomItem(product.id, currentVersionIdx, row.componentId)}
          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          title="삭제"
        >
          <Trash2 size={16} />
        </button>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 헤더 부분: 버전 선택 및 버튼들 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">BOM 목록</h2>
          
          {/* 버전 선택 드롭다운 */}
          <select 
            value={currentVersionIdx} 
            onChange={e => setSelectedVersionIdx(parseInt(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
          >
            {versions.map((v, idx) => (
              <option key={idx} value={idx}>{v.version}</option>
            ))}
          </select>
        </div>
        
        <div className="flex gap-2">
          {/* 새 버전 만들기 버튼 */}
          <button 
            onClick={handleCreateNewVersion}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Copy size={16} />
            <span>새 버전 만들기</span>
          </button>
          
          {/* 포장재 추가 모달 열기 버튼 */}
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            <span>포장재 추가</span>
          </button>
        </div>
      </div>

      {/* BOM 리스트 데이터 테이블 영역 */}
      <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <DataTable 
          columns={columns} 
          data={currentVersion?.bomItems || []} 
          emptyMessage="BOM에 등록된 포장재가 없습니다. '포장재 추가' 버튼을 눌러 부품을 추가해주세요."
        />
      </div>

      {/* 하단 요약 패널: 합성수지 총 중량 합계 */}
      <div className="flex justify-end p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mt-4">
        <div className="text-right">
          <span className="text-sm text-gray-600 dark:text-gray-400 mr-4">합성수지 총 중량 합계:</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">{totalPlasticWeight.toFixed(6)} g</span>
        </div>
      </div>

      {/* 포장재 추가/수정용 모달 폼 */}
      <PackagingComponentForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleSaveComponent}
      />
    </div>
  );
}
