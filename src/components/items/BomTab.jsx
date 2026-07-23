/**
 * BomTab.jsx
 * ─────────────────────────────────────
 * BOM(부품 구성표) 탭 컴포넌트
 * - 포장부자재 / 충진부자재 목록 표시
 * - 생산수량 입력 시 각 부자재의 총 필요 중량(g) 자동 계산
 * - 합성수지 총 중량 합계 표시 (EPR 신고용)
 */
import React, { useState } from 'react';
import usePackagingStore from '../../stores/packagingStore';
import DataTable from '../common/DataTable';
import PackagingComponentForm from './PackagingComponentForm';
import { Plus, Copy, Trash2, FlaskConical } from 'lucide-react';
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

  // ★ 생산수량 상태 (기본값 1개 - 이 숫자를 바꾸면 총 필요량이 자동으로 바뀜)
  const [productionQty, setProductionQty] = useState(1);

  if (!product) return null;

  // 버전 히스토리 가져오기
  const versions = product.versions || [];
  const currentVersionIdx = Math.min(selectedVersionIdx, Math.max(0, versions.length - 1));
  const currentVersion = versions[currentVersionIdx];

  // 기존 버전을 복사해 새 버전을 만드는 함수
  const handleCreateNewVersion = () => {
    createNewVersion(product.id);
    setSelectedVersionIdx(versions.length);
  };

  // 모달 폼에서 포장재를 저장했을 때의 처리
  const handleSaveComponent = (data) => {
    const newComponentId = Date.now().toString();
    const componentData = { ...data, id: newComponentId, createdAt: new Date().toISOString() };
    addPackagingComponent(componentData);
    addBomItem(product.id, currentVersionIdx, {
      componentId: newComponentId,
      qty: 1
    });
    setIsFormOpen(false);
  };

  // 합성수지(플라스틱) 총 중량 합산 (1개 기준)
  const totalPlasticWeightPerUnit = currentVersion?.bomItems.reduce((sum, item) => {
    const component = packagingComponents.find(c => c.id === item.componentId);
    if (component && PLASTIC_MATERIALS.includes(component.material)) {
      return sum + (component.weightPerUnit * item.qty);
    }
    return sum;
  }, 0) || 0;

  // ★ 생산수량을 곱한 합성수지 총 중량
  const totalPlasticWeightByProduction = totalPlasticWeightPerUnit * productionQty;

  // 충진부자재 vs 포장부자재 분리
  const chargingItems = currentVersion?.bomItems.filter(item => {
    const comp = packagingComponents.find(c => c.id === item.componentId);
    return comp && comp.type === '충진부자재';
  }) || [];

  const packagingItems = currentVersion?.bomItems.filter(item => {
    const comp = packagingComponents.find(c => c.id === item.componentId);
    return !comp || comp.type !== '충진부자재';
  }) || [];

  // ─── 테이블 컬럼 정의 ───
  const columns = [
    { header: '선택', accessor: () => <input type="checkbox" className="rounded" /> },
    {
      header: '부재료등록번호',
      accessor: row => packagingComponents.find(c => c.id === row.componentId)?.regNo || '-'
    },
    {
      header: '부재료코드',
      accessor: row => packagingComponents.find(c => c.id === row.componentId)?.code || '-'
    },
    {
      header: '부재료명',
      accessor: row => packagingComponents.find(c => c.id === row.componentId)?.name || '알 수 없음'
    },
    {
      header: '재질',
      accessor: row => {
        const comp = packagingComponents.find(c => c.id === row.componentId);
        const mat = comp?.material || '-';
        // 합성수지(플라스틱)이면 민트색 뱃지로 강조
        const isPlastic = PLASTIC_MATERIALS.includes(mat);
        return isPlastic
          ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">{mat}</span>
          : <span className="text-slate-600 text-sm">{mat}</span>;
      }
    },
    {
      header: '개당 중량(g)',
      accessor: row => {
        const component = packagingComponents.find(c => c.id === row.componentId);
        const w = component?.weightPerUnit || 0;
        return (
          <span className="font-mono text-sm text-slate-700">
            {w.toFixed(4)} g
          </span>
        );
      }
    },
    {
      header: '제품당 수량(ea)',
      accessor: (row) => (
        <input
          type="number"
          value={row.qty}
          min="1"
          onChange={e => updateBomItem(product.id, currentVersionIdx, row.componentId, { qty: parseInt(e.target.value) || 1 })}
          className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
      )
    },
    {
      header: '총 중량 /1개(g)',
      accessor: row => {
        const component = packagingComponents.find(c => c.id === row.componentId);
        const weight = component ? (component.weightPerUnit * row.qty) : 0;
        return <span className="font-mono text-sm text-slate-600">{weight.toFixed(4)}</span>;
      }
    },
    {
      // ★ 핵심: 생산수량 입력 시 자동으로 총 필요량 계산
      header: `총 필요량 (×${productionQty.toLocaleString()}개)(g)`,
      accessor: row => {
        const component = packagingComponents.find(c => c.id === row.componentId);
        const totalWeight = component ? (component.weightPerUnit * row.qty * productionQty) : 0;
        return (
          <span className="font-mono text-sm font-semibold text-emerald-700">
            {totalWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </span>
        );
      }
    },
    {
      header: '관리',
      accessor: row => (
        <button
          onClick={() => removeBomItem(product.id, currentVersionIdx, row.componentId)}
          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="삭제"
        >
          <Trash2 size={15} />
        </button>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full space-y-4">

      {/* ─── 헤더 영역 ─── */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        {/* 버전 선택 */}
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800">BOM 목록</h2>
          <select
            value={currentVersionIdx}
            onChange={e => setSelectedVersionIdx(parseInt(e.target.value))}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-300 focus:outline-none"
          >
            {versions.map((v, idx) => (
              <option key={idx} value={idx}>{v.version}</option>
            ))}
          </select>
        </div>

        {/* 버튼 그룹 */}
        <div className="flex gap-2">
          <button
            onClick={handleCreateNewVersion}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Copy size={15} />
            <span>새 버전 만들기</span>
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-all hover:shadow-md"
            style={{ background: 'linear-gradient(90deg, #10b981, #06b6d4)' }}
          >
            <Plus size={15} />
            <span>포장재 추가</span>
          </button>
        </div>
      </div>

      {/* ★ 생산수량 입력 박스 (핵심 기능) */}
      <div
        className="flex items-center gap-4 p-4 rounded-xl border border-emerald-100"
        style={{ background: 'linear-gradient(90deg, #f0fdf9 0%, #ecfeff 100%)' }}
      >
        <FlaskConical size={18} className="text-emerald-500 shrink-0" />
        <span className="text-sm font-semibold text-emerald-800">생산수량 기반 자동 계산</span>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">생산수량</label>
          <input
            type="number"
            value={productionQty}
            min="1"
            onChange={e => setProductionQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-28 px-3 py-1.5 border border-emerald-200 rounded-lg text-sm text-center font-mono font-bold text-emerald-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <span className="text-sm text-slate-500">개</span>
        </div>
        <div className="ml-auto text-sm text-slate-500">
          ▶ 오른쪽 <span className="font-semibold text-emerald-700">「총 필요량」</span> 컬럼에 자동 반영됩니다
        </div>
      </div>

      {/* BOM 리스트 영역 */}
      <div className="flex-1 overflow-auto space-y-5">

        {/* 충진부자재 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 bg-emerald-400 rounded-full" />
            <h3 className="font-semibold text-slate-700 text-sm">
              충진부자재
              <span className="ml-2 text-xs font-normal text-slate-400">(총 {chargingItems.length}개)</span>
            </h3>
          </div>
          <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
            <DataTable
              columns={columns}
              data={chargingItems}
              emptyMessage="충진부자재가 없습니다. '포장재 추가' 버튼을 눌러 추가해주세요."
            />
          </div>
        </div>

        {/* 포장부자재 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 bg-cyan-400 rounded-full" />
            <h3 className="font-semibold text-slate-700 text-sm">
              포장부자재
              <span className="ml-2 text-xs font-normal text-slate-400">(총 {packagingItems.length}개)</span>
            </h3>
          </div>
          <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
            <DataTable
              columns={columns}
              data={packagingItems}
              emptyMessage="포장부자재가 없습니다. '포장재 추가' 버튼을 눌러 추가해주세요."
            />
          </div>
        </div>
      </div>

      {/* ─── 하단 합계 패널 ─── */}
      <div
        className="flex flex-wrap justify-between items-center p-4 rounded-xl border border-emerald-100 gap-4"
        style={{ background: 'linear-gradient(90deg, #f0fdf9 0%, #ecfeff 100%)' }}
      >
        {/* 1개당 합성수지 중량 */}
        <div className="text-right">
          <div className="text-xs text-slate-500 mb-1">합성수지 중량 / 제품 1개</div>
          <div className="text-lg font-bold text-slate-800 font-mono">
            {totalPlasticWeightPerUnit.toFixed(4)}
            <span className="text-sm font-normal text-slate-500 ml-1">g</span>
          </div>
        </div>

        {/* 화살표 */}
        <div className="text-slate-300 text-xl">×</div>

        {/* 생산수량 */}
        <div className="text-right">
          <div className="text-xs text-slate-500 mb-1">생산수량</div>
          <div className="text-lg font-bold text-slate-800 font-mono">
            {productionQty.toLocaleString()}
            <span className="text-sm font-normal text-slate-500 ml-1">개</span>
          </div>
        </div>

        {/* = */}
        <div className="text-slate-300 text-xl">=</div>

        {/* 합성수지 총 중량 */}
        <div className="text-right">
          <div className="text-xs text-emerald-600 font-medium mb-1">합성수지 총 배출 중량 (EPR 신고용)</div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            {totalPlasticWeightByProduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-base font-normal ml-1">g</span>
            <span className="text-sm font-normal text-slate-500 ml-2">
              ({(totalPlasticWeightByProduction / 1000).toFixed(4)} kg)
            </span>
          </div>
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
