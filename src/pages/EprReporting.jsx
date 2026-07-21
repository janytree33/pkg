import React, { useState } from 'react';
import { FileSpreadsheet, Link as LinkIcon, BarChart3, ChevronRight } from 'lucide-react';

import ExcelUpload from '../components/epr/ExcelUpload';
import ProductMappingTable from '../components/epr/ProductMappingTable';
import EprAggregationTab from '../components/epr/EprAggregationTab';
import PageBanner from '../components/common/PageBanner';

/**
 * EprReporting.jsx
 * ─────────────────────────────────────
 * EPR 실적신고 관리 메인 페이지
 * 3단계 탭 구조(업로드 -> 매핑 -> 취합/다운로드)를 제공합니다.
 */
export default function EprReporting() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'mapping', 'aggregation'

  const tabs = [
    { id: 'upload', label: '1. 생산실적 업로드', icon: FileSpreadsheet },
    { id: 'mapping', label: '2. 제품 매핑', icon: LinkIcon },
    { id: 'aggregation', label: '3. EPR 신고 취합', icon: BarChart3 }
  ];

  const handleNextStep = () => {
    if (activeTab === 'upload') setActiveTab('mapping');
    else if (activeTab === 'mapping') setActiveTab('aggregation');
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <PageBanner 
        title="EPR 실적신고 관리" 
        description="한국환경공단 제출용 실적 데이터를 집계하고 엑셀로 자동 변환합니다."
      />

      {/* 단계별 탭 내비게이션 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2">
        <nav className="flex flex-col sm:flex-row gap-2">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <React.Fragment key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
                {index < tabs.length - 1 && (
                  <div className="hidden sm:flex items-center justify-center text-gray-400">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* 탭 콘텐츠 영역 */}
      <div className="mt-6">
        {activeTab === 'upload' && <ExcelUpload onNextStep={handleNextStep} />}
        {activeTab === 'mapping' && <ProductMappingTable />}
        {activeTab === 'aggregation' && <EprAggregationTab />}
      </div>
    </div>
  );
}
