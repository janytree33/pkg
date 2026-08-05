import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import useSettingsStore from './stores/settingsStore';
import usePackagingStore from './stores/packagingStore';
import useDocumentStore from './stores/documentStore';
import useEprStore from './stores/eprStore';

// 페이지들
import Dashboard from './pages/Dashboard';
import ItemManagement from './pages/ItemManagement';
import DocumentManagement from './pages/DocumentManagement';
import EprReporting from './pages/EprReporting';
import Settings from './pages/Settings';
import PackagingMaster from './pages/PackagingMaster';

function Layout() {
  // PC용 사이드바 축소/확장 상태
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // 모바일/태블릿용 사이드바 열림/닫힘 상태
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 💡 전천후 스위치 로직: 화면 크기에 따라 알아서 PC용/모바일용 상태를 조작합니다.
  const handleMenuToggle = () => {
    if (window.innerWidth >= 1024) {
      // PC 해상도(lg 이상)에서는 사이드바를 접었다 폈다(축소) 합니다.
      setSidebarCollapsed(!sidebarCollapsed);
    } else {
      // 모바일 해상도에서는 사이드바를 화면 밖에서 꺼내고 넣습니다.
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden transition-theme relative"
      style={{ background: 'linear-gradient(145deg, #e8fdf5 0%, #f0fdfb 25%, #f7fffe 50%, #fdfff7 75%, #fffef0 100%)' }}
    >
      {/* 상단 헤더에 똑똑해진 스위치 함수를 연결합니다. */}
      <Header onMenuToggle={handleMenuToggle} />

      {/* 하단 바디 (좌측 사이드바 + 우측 메인) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* 모바일 환경에서 오버레이(배경 가림막) 추가 */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/40 z-20 lg:hidden transition-opacity" 
            onClick={() => setIsSidebarOpen(false)}
            title="클릭하여 메뉴 닫기"
          />
        )}
        
        {/* 사이드바에 PC용 상태와 모바일용 상태를 모두 전달합니다. */}
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
          isOpenMobile={isSidebarOpen}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/items" element={<ItemManagement />} />
            <Route path="/packaging" element={<PackagingMaster />} />
            <Route path="/documents" element={<DocumentManagement />} />
            <Route path="/epr" element={<EprReporting />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const initTheme = useSettingsStore((state) => state.initTheme);
  const fetchSettingsData = useSettingsStore((state) => state.fetchData);
  const fetchPackagingData = usePackagingStore((state) => state.fetchData);
  const fetchDocumentData = useDocumentStore((state) => state.fetchData);
  const fetchEprData = useEprStore((state) => state.fetchData);

  // 앱 로드 시 테마 초기화 및 데이터 로드
  useEffect(() => {
    initTheme();
    fetchSettingsData(); 
    fetchPackagingData(); 
    fetchDocumentData(); 
    fetchEprData(); 
  }, [initTheme, fetchSettingsData, fetchPackagingData, fetchDocumentData, fetchEprData]);

  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;