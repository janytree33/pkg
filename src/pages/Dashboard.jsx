/**
 * Dashboard.jsx
 * ─────────────────────────────────────
 * 대시보드 메인 페이지
 * 등록된 완제품, 포장재, 문서, EPR 현황 요약 제공
 */
import { Package, Layers, FileText, BarChart3, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import usePackagingStore from '../stores/packagingStore';
import useDocumentStore from '../stores/documentStore';
import useEprStore from '../stores/eprStore';

import PageBanner from '../components/common/PageBanner';

export default function Dashboard() {
  const navigate = useNavigate();

  // 스토어 데이터
  const finishedProducts = usePackagingStore((state) => state.finishedProducts);
  const packagingComponents = usePackagingStore((state) => state.packagingComponents);
  const documents = useDocumentStore((state) => state.documents);
  const productionReports = useEprStore((state) => state.productionReports);

  // 요약 데이터 계산
  const totalProducts = finishedProducts.length;
  const ownBrandProducts = finishedProducts.filter((p) => p.brandType === '자사').length;
  const otherBrandProducts = totalProducts - ownBrandProducts;
  const totalPackaging = packagingComponents.length;
  const totalDocs = documents.length;
  const totalReports = productionReports.length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageBanner 
        title="대시보드" 
        description="JANYTREE 포장재 및 EPR 관리 포털에 오신 것을 환영합니다."
      />

      {/* 요약 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 완제품 요약 */}
        <div className="bg-white  rounded-xl p-5 border border-slate-200  shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">등록된 완제품</p>
              <h3 className="text-2xl font-bold text-slate-900  mt-1">{totalProducts}건</h3>
            </div>
            <div className="p-2 bg-brand-50  rounded-lg text-brand-500 dark:text-brand-400">
              <Package size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>자사 브랜드: {ownBrandProducts}건</span>
            <span>타사(OEM): {otherBrandProducts}건</span>
          </div>
        </div>

        {/* 포장재 요약 */}
        <div className="bg-white  rounded-xl p-5 border border-slate-200  shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">등록된 포장재</p>
              <h3 className="text-2xl font-bold text-slate-900  mt-1">{totalPackaging}건</h3>
            </div>
            <div className="p-2 bg-purple-50  rounded-lg text-purple-600 dark:text-purple-400">
              <Layers size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            <span>최근 등록: {packagingComponents.length > 0 ? new Date(packagingComponents[packagingComponents.length - 1].createdAt).toLocaleDateString() : '없음'}</span>
          </div>
        </div>

        {/* 문서 발행 요약 */}
        <div className="bg-white  rounded-xl p-5 border border-slate-200  shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">발행된 사양서</p>
              <h3 className="text-2xl font-bold text-slate-900  mt-1">{totalDocs}건</h3>
            </div>
            <div className="p-2 bg-green-50  rounded-lg text-green-600 dark:text-green-400">
              <FileText size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            <span>최근 발행: {documents.length > 0 ? new Date(documents[documents.length - 1].createdAt).toLocaleDateString() : '없음'}</span>
          </div>
        </div>

        {/* EPR 요약 */}
        <div className="bg-white  rounded-xl p-5 border border-slate-200  shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">EPR 실적 업로드</p>
              <h3 className="text-2xl font-bold text-slate-900  mt-1">{totalReports}건</h3>
            </div>
            <div className="p-2 bg-orange-50  rounded-lg text-orange-600 dark:text-orange-400">
              <BarChart3 size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            <span>최근 업로드: {productionReports.length > 0 ? new Date(productionReports[productionReports.length - 1].uploadDate).toLocaleDateString() : '없음'}</span>
          </div>
        </div>
      </div>

      {/* 퀵 액션 */}
      <div className="bg-white  rounded-xl border border-slate-200  shadow-card p-6">
        <h3 className="text-lg font-semibold text-slate-900  mb-4">빠른 작업 시작</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/items')}
            className="flex items-center justify-between p-4 rounded-lg border border-slate-200  hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-100  rounded-lg text-brand-600  group-hover:scale-110 transition-transform">
                <Package size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">품목 및 포장재 등록</p>
                <p className="text-xs text-slate-500  mt-0.5">신규 제품이나 BOM을 구성합니다</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => navigate('/documents')}
            className="flex items-center justify-between p-4 rounded-lg border border-slate-200  hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-100  rounded-lg text-brand-600  group-hover:scale-110 transition-transform">
                <FileText size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">용기 사양서 발행</p>
                <p className="text-xs text-slate-500  mt-0.5">PDF 사양서를 자동 생성합니다</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => navigate('/epr')}
            className="flex items-center justify-between p-4 rounded-lg border border-slate-200  hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-100  rounded-lg text-brand-600  group-hover:scale-110 transition-transform">
                <BarChart3 size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">EPR 엑셀 자동 생성</p>
                <p className="text-xs text-slate-500  mt-0.5">신고용 중량산출 엑셀을 만듭니다</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
