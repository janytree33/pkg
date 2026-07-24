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
import BomComponentSelector from './BomComponentSelector';
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
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

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

  // 모달 폼에서 포장재를 신규 등록했을 때의 처리
  const handleSaveComponent = async (data) => {
    // 1. 포장재 마스터에 저장 (비동기 대기)
    const newComponent = await addPackagingComponent(data);
    
    // 2. 저장이 성공하여 진짜 ID가 발급되었을 때만 BOM에 추가
    if (newComponent && newComponent.id) {
      addBomItem(product.id, currentVersionIdx, {
        componentId: newComponent.id,
        qty: 1
      });
    }
    setIsFormOpen(false);
  };

  // Selector에서 기존 포장재들을 선택했을 때의 처리
  const handleSelectComponents = async (selectedIds) => {
    for (const id of selectedIds) {
      // 이미 있는지 확인(중복 방지)
      const exists = currentVersion?.bomItems.some(item => item.componentId === id);
      if (!exists) {
        await addBomItem(product.id, currentVersionIdx, {
          componentId: id,
          qty: 1
        });
      }
    }
    setIsSelectorOpen(false);
  };

  // 합성수지(플라스틱) 총 중량 합산 (1개 기준)
  const totalPlasticWeightPerUnit = currentVersion?.bomItems.reduce((sum, item) => {
    const component = packagingComponents.find(c => c.id === item.componentId);
    if (component && PLASTIC_MATERIALS.includes(component.material)) {
      const weight = Number(component.weightPerUnit || component.weight || 0);
      const qty = Number(item.qty || 1);
      return sum + (weight * qty);
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
    { label: '선택', render: () => <input type="checkbox" className="rounded" /> },
    {
      label: '부재료등록번호',
      render: (_, row) => packagingComponents.find(c => c.id === row.componentId)?.regNo || '-'
    },
    {
      label: '부재료코드',
      render: (_, row) => packagingComponents.find(c => c.id === row.componentId)?.code || '-'
    },
    {
      label: '부재료명',
      render: (_, row) => packagingComponents.find(c => c.id === row.componentId)?.name || '알 수 없음'
    },
    {
      label: '재질',
      render: (_, row) => {
        const comp = packagingComponents.find(c => c.id === row.componentId);
        const mat = comp?.material || '-';
        const isPlastic = PLASTIC_MATERIALS.includes(mat);
        return isPlastic
          ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">{mat}</span>
          : <span className="text-slate-600 text-sm">{mat}</span>;
      }
    },
    {
      label: '개당 중량(g)',
      render: (_, row) => {
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
      label: '제품당 수량(ea)',
      render: (_, row) => (
        <input
          type="number"
          value={row.qty}
          min="1"
          onChange={e => updateBomItem(product.id, currentVersionIdx, row.id, { qty: parseInt(e.target.value) || 1 })}
          className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
      )
    },
    {
      label: '총 중량 /1개(g)',
      render: (_, row) => {
        const component = packagingComponents.find(c => c.id === row.componentId);
        const weight = component ? (component.weightPerUnit * row.qty) : 0;
        return <span className="font-mono text-sm text-slate-600">{weight.toFixed(4)}</span>;
      }
    },
    {
      // ★ 생산수량 입력 시 자동으로 총 필요 수량 계산
      label: `총 필요 수량(EA)`,
      render: (_, row) => {
        const totalQty = (row.qty || 1) * productionQty;
        return (
          <span className="font-mono text-sm font-semibold text-emerald-700">
            {totalQty.toLocaleString()} 개
          </span>
        );
      }
    },
    {
      // ★ 성적서/사양서 첨부 여부 표시
      label: '성적서',
      render: (_, row) => {
        const comp = packagingComponents.find(c => c.id === row.componentId);
        
        // 다중 파일(specFiles) 또는 단일 파일(specFile) 호환성 체크
        let fileCount = 0;
        try {
          if (comp?.specFile) {
            const parsed = JSON.parse(comp.specFile);
            if (Array.isArray(parsed)) fileCount = parsed.length;
          }
        } catch (e) {
          if (comp?.specFile) fileCount = 1;
        }

        if (fileCount > 0) {
          return (
            <button
              title="성적서 있음"
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200 rounded-full cursor-default"
            >
              📎 {fileCount}개
            </button>
          );
        }
        return <span className="text-[10px] text-slate-300">없음</span>;
      }
    },
    {
      label: '관리',
      render: (_, row) => (
        <button
          onClick={() => removeBomItem(product.id, currentVersionIdx, row.id)}
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
          <div className="flex items-center gap-1">
            <select
              value={currentVersionIdx}
              onChange={e => setSelectedVersionIdx(parseInt(e.target.value))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-300 focus:outline-none"
            >
              {versions.map((v, idx) => (
                <option key={idx} value={idx}>{v.version}</option>
              ))}
            </select>
            {versions.length > 1 && (
              <button
                onClick={() => {
                  if (window.confirm(`${currentVersion.version} 버전을 정말 삭제하시겠습니까?`)) {
                    usePackagingStore.getState().deleteProductVersion(product.id, currentVersion.id);
                    setSelectedVersionIdx(Math.max(0, currentVersionIdx - 1));
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="현재 버전 삭제"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
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
            onClick={() => setIsSelectorOpen(true)}
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

      {/* 포장재 선택 모달 */}
      <BomComponentSelector
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={handleSelectComponents}
        onOpenNewForm={() => setIsFormOpen(true)}
      />
    </div>
  );
}
