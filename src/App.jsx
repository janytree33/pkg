import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import useSettingsStore from './stores/settingsStore';
import usePackagingStore from './stores/packagingStore';
import useDocumentStore from './stores/documentStore';
import useEprStore from './stores/eprStore';
import SplitWorkspace from './components/layout/SplitWorkspace';

// 페이지들
import Dashboard from './pages/Dashboard';
import ItemManagement from './pages/ItemManagement';
import DocumentManagement from './pages/DocumentManagement';
import EprReporting from './pages/EprReporting';
import Settings from './pages/Settings';
import PackagingMaster from './pages/PackagingMaster';
import { SIDEBAR_MENUS } from './utils/constants';

function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden transition-theme"
      style={{ background: 'linear-gradient(145deg, #e8fdf5 0%, #f0fdfb 25%, #f7fffe 50%, #fdfff7 75%, #fffef0 100%)' }}
    >
      {/* 상단 헤더 */}
      <Header />

      {/* 하단 바디 (좌측 사이드바 + 우측 메인) */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

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
    fetchSettingsData(); // 설정/계정 데이터 로드
    fetchPackagingData(); // 포장재/BOM 데이터 로드
    fetchDocumentData(); // 사양서 문서 로드
    fetchEprData(); // EPR 데이터 로드
  }, [initTheme, fetchSettingsData, fetchPackagingData, fetchDocumentData, fetchEprData]);

  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
