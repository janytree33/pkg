import React, { useState } from 'react';
import { Package, FileText, ClipboardList, Settings } from 'lucide-react';
import SplitWorkspace from '../components/layout/SplitWorkspace';
import TabGroup from '../components/common/TabGroup';
import ProductListPanel from '../components/items/ProductListPanel';
import ProductInfoTab from '../components/items/ProductInfoTab';
import BomTab from '../components/items/BomTab';
import usePackagingStore from '../stores/packagingStore';

export default function ItemManagement() {
  const [activeTab, setActiveTab] = useState('info');
  // Zustand 스토어에서 선택된 제품 ID를 가져옵니다.
  const { selectedProductId } = usePackagingStore();

  // 상단 탭 정의 (아이콘과 함께 구성)
  const tabs = [
    { id: 'info', label: '품목기본정보', icon: <Package size={18} /> },
    { id: 'bom', label: '포장재 등록(BOM)', icon: <Settings size={18} /> },
    { id: 'doc', label: '문서발행', icon: <FileText size={18} /> },
    { id: 'epr', label: 'EPR 신고취합', icon: <ClipboardList size={18} /> },
  ];

  // 탭 변경에 따른 콘텐츠 렌더링 함수
  const renderTabContent = () => {
    // 제품이 선택되지 않은 경우 안내 메시지 출력
    if (!selectedProductId) {
      return (
        <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
          좌측에서 제품을 선택하세요
        </div>
      );
    }

    switch (activeTab) {
      case 'info':
        return <ProductInfoTab />;
      case 'bom':
        return <BomTab />;
      case 'doc':
        return (
          <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
            문서발행 관리 페이지에서 진행하세요
          </div>
        );
      case 'epr':
        return (
          <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
            EPR 실적신고 관리 페이지에서 진행하세요
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <SplitWorkspace
      leftPanel={<ProductListPanel />}
      rightPanel={
        <div className="flex h-full flex-col bg-white  rounded-lg shadow">
          {/* 탭 그룹 공통 컴포넌트 */}
          <TabGroup tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
          {/* 탭 내용 표시 영역 */}
          <div className="flex-1 p-4 overflow-y-auto">
            {renderTabContent()}
          </div>
        </div>
      }
    />
  );
}
