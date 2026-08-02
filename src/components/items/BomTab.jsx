/**
 * BomTab.jsx
 * ─────────────────────────────────────
 * BOM(부품 구성표) 탭 컴포넌트
 * - 사용자가 등록한 공정(충진/포장) 100% 엄격 보존
 */
import React, { useState } from 'react';
import usePackagingStore from '../../stores/packagingStore';
import DataTable from '../common/DataTable';
import PackagingComponentForm from './PackagingComponentForm';
import BomComponentSelector from './BomComponentSelector';
import { Plus, Copy, Trash2, FlaskConical, Lock, Unlock, CheckCircle2 } from 'lucide-react';
import { PLASTIC_MATERIALS } from '../../utils/constants';

export default function BomTab() {
  const {
    finishedProducts,
    selectedProductId,
    addBomItem,
    removeBomItem,
    updateBomItem,
    createNewVersion,
    addPackagingComponent,
    packagingComponents,
    toggleVersionConfirm
  } = usePackagingStore();

  const product = finishedProducts.find(p => String(p.id) === String(selectedProductId));
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [activeProcessType, setActiveProcessType] = useState('충진');
  const [productionQty, setProductionQty] = useState(1);

  if (!product) return null;

  const versions = product.versions || [];
  const currentVersionIdx = Math.min(selectedVersionIdx, Math.max(0, versions.length - 1));
  const currentVersion = versions[currentVersionIdx];
  const isConfirmed = currentVersion?.isConfirmed || false;

  const handleCreateNewVersion = () => {
    createNewVersion(product.id);
    setSelectedVersionIdx(versions.length);
  };

  const handleSaveComponent = async (data) => {
    const newComponent = await addPackagingComponent(data);
    if (newComponent && newComponent.id) {
      await addBomItem(product.id, currentVersionIdx, {
        componentId: newComponent.id,
        qty: 1,
        processType: activeProcessType, 
        partType: data.partType || '' 
      });
    }
    setIsFormOpen(false);
  };

  const handleSelectComponents = async (selectedIds, processType) => {
    const targetProcess = processType || activeProcessType;

    for (const id of selectedIds) {
      const comp = packagingComponents.find(c => String(c.id) === String(id));
      const realComponentId = comp ? comp.id : id;

      const exists = (currentVersion?.bomItems || []).some(
        item => String(item.componentId) === String(realComponentId) && item.processType === targetProcess
      );

      if (!exists) {
        await addBomItem(product.id, currentVersionIdx, {
          componentId: realComponentId,
          qty: 1,
          processType: targetProcess, 
          partType: comp?.partType || '' 
        });
      }
    }
    setIsSelectorOpen(false);
  };

  const totalPlasticWeightPerUnit = (currentVersion?.bomItems || []).reduce((sum, item) => {
    const component = packagingComponents.find(c => String(c.id) === String(item.componentId));
    if (!component) return sum;

    let plasticWeight = 0;
    if (component.subComponents && component.subComponents.length > 0) {
      component.subComponents.forEach(sub => {
        if (PLASTIC_MATERIALS.includes(sub.material)) {
          plasticWeight += Number(sub.weight || 0);
        }
      });
      if (plasticWeight === 0 && PLASTIC_MATERIALS.includes(component.material)) {
        plasticWeight = Number(component.weightPerUnit || component.weight || 0);
      }
    } else if (PLASTIC_MATERIALS.includes(component.material)) {
      plasticWeight = Number(component.weightPerUnit || component.weight || 0);
    }

    const qty = Number(item.qty || 1);
    return sum + (plasticWeight * qty);
  }, 0);

  const totalPlasticWeightByProduction = totalPlasticWeightPerUnit * productionQty;

  // 🌟 [핵심 수정] 대표님이 정하신 공정값을 100% 그대로 반영 (자동 키워드 재분류 완전 제거)
  const chargingItems = (currentVersion?.bomItems || []).filter(item => (item.processType || '충진') === '충진');
  const packagingItems = (currentVersion?.bomItems || []).filter(item => item.processType === '포장');

  const columns = [
    { label: '선택', render: () => <input type="checkbox" disabled={isConfirmed} className="rounded disabled:opacity-50" /> },
    {
      label: '공정',
      render: (_, row) => {
        const proc = row.processType || '충진';
        return (
          <select
            value={proc}
            disabled={isConfirmed}
            onChange={e => updateBomItem(product.id, currentVersionIdx, row.id, { processType: e.target.value })}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer border-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-50 ${
              proc === '충진' ? 'bg-emerald-100 text-emerald-700' : 'bg-cyan-100 text-cyan-700'
            }`}
          >
            <option value="충진">충진</option>
            <option value="포장">포장</option>
          </select>
        );
      }
    },
    {
      label: '부품유형',
      render: (_, row) => (
        <input
          type="text"
          value={row.partType || ''}
          placeholder="예: 용기"
          disabled={isConfirmed}
          onChange={e => updateBomItem(product.id, currentVersionIdx, row.id, { partType: e.target.value })}
          className="w-20 px-2 py-1 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:bg-slate-100 disabled:text-slate-400"
        />
      )
    },
    {
      label: '부재료코드',
      render: (_, row) => packagingComponents.find(c => String(c.id) === String(row.componentId))?.code || '-'
    },
    {
      label: '부재료명',
      render: (_, row) => packagingComponents.find(c => String(c.id) === String(row.componentId))?.name || '알 수 없음'
    },
    {
      label: '재질',
      render: (_, row) => {
        const comp = packagingComponents.find(c => String(c.id) === String(row.componentId));
        if (!comp) return '-';

        if (comp.subComponents && comp.subComponents.length > 0) {
          return (
            <div className="flex flex-col gap-0.5">
              {comp.subComponents.map((sub, idx) => (
                <div key={idx} className="text-xs whitespace-nowrap">
                  <span className="font-medium text-slate-800">
                    {sub.name ? `${sub.name}: ` : ''}{sub.material || '-'}
                  </span>
                </div>
              ))}
            </div>
          );
        }

        const mat = comp.material || '-';
        const isPlastic = PLASTIC_MATERIALS.includes(mat);
        return isPlastic
          ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">{mat}</span>
          : <span className="text-slate-600 text-sm">{mat}</span>;
      }
    },
    {
      label: '개당 중량(g)',
      render: (_, row) => {
        const component = packagingComponents.find(c => String(c.id) === String(row.componentId));
        const w = Number(component?.weightPerUnit || component?.weight || 0);
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
          disabled={isConfirmed}
          onChange={e => updateBomItem(product.id, currentVersionIdx, row.id, { qty: parseInt(e.target.value) || 1 })}
          className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:bg-slate-100 disabled:text-slate-400"
        />
      )
    },
    {
      label: '총 중량 /1개(g)',
      render: (_, row) => {
        const component = packagingComponents.find(c => String(c.id) === String(row.componentId));
        const unitWeight = Number(component?.weightPerUnit || component?.weight || 0);
        const weight = unitWeight * (row.qty || 1);
        return <span className="font-mono text-sm text-slate-600">{weight.toFixed(4)}</span>;
      }
    },
    {
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
      label: '관리',
      render: (_, row) => (
        <button
          onClick={() => removeBomItem(product.id, currentVersionIdx, row.id)}
          disabled={isConfirmed}
          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          title={isConfirmed ? "확정된 BOM은 삭제할 수 없습니다" : "삭제"}
        >
          <Trash2 size={15} />
        </button>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800">BOM 목록</h2>
          <div className="flex items-center gap-2">
            <select
              value={currentVersionIdx}
              onChange={e => setSelectedVersionIdx(parseInt(e.target.value))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-300 focus:outline-none"
            >
              {versions.map((v, idx) => (
                <option key={idx} value={idx}>{v.version} {v.isConfirmed ? '(확정완료)' : ''}</option>
              ))}
            </select>

            {isConfirmed ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 rounded-full">
                <CheckCircle2 size={13} />
                <span>확정 완료</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full">
                <Unlock size={13} />
                <span>작성 중</span>
              </span>
            )}

            {versions.length > 1 && !isConfirmed && (
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

        <div className="flex gap-2">
          <button
            onClick={() => toggleVersionConfirm(product.id, currentVersionIdx)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all shadow-sm ${
              isConfirmed
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isConfirmed ? <Unlock size={15} /> : <Lock size={15} />}
            <span>{isConfirmed ? '확정 해제 (수정 허용)' : 'BOM 확정하기'}</span>
          </button>

          <button
            onClick={handleCreateNewVersion}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Copy size={15} />
            <span>새 버전 만들기</span>
          </button>

          <button
            onClick={() => {
              if (isConfirmed) {
                alert("🔒 이미 확정된 BOM 버전입니다. 수정하려면 [확정 해제] 후 진행해 주세요.");
                return;
              }
              setActiveProcessType('충진');
              setIsSelectorOpen(true);
            }}
            disabled={isConfirmed}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-all hover:shadow-md bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <Plus size={15} />
            <span>충진부자재 추가</span>
          </button>

          <button
            onClick={() => {
              if (isConfirmed) {
                alert("🔒 이미 확정된 BOM 버전입니다. 수정하려면 [확정 해제] 후 진행해 주세요.");
                return;
              }
              setActiveProcessType('포장');
              setIsSelectorOpen(true);
            }}
            disabled={isConfirmed}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-all hover:shadow-md bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <Plus size={15} />
            <span>포장부자재 추가</span>
          </button>
        </div>
      </div>

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

      <div className="flex-1 overflow-auto space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 bg-emerald-400 rounded-full" />
            <h3 className="font-semibold text-slate-700 text-sm">
              충진 공정
              <span className="ml-2 text-xs font-normal text-slate-400">(총 {chargingItems.length}개)</span>
            </h3>
          </div>
          <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
            <DataTable
              columns={columns}
              data={chargingItems}
              emptyMessage="충진 공정에 등록된 부자재가 없습니다. '[+ 충진부자재 추가]' 버튼을 눌러주세요."
            />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 bg-cyan-400 rounded-full" />
            <h3 className="font-semibold text-slate-700 text-sm">
              포장 공정
              <span className="ml-2 text-xs font-normal text-slate-400">(총 {packagingItems.length}개)</span>
            </h3>
          </div>
          <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
            <DataTable
              columns={columns}
              data={packagingItems}
              emptyMessage="포장 공정에 등록된 부자재가 없습니다. '[+ 포장부자재 추가]' 버튼을 눌러주세요."
            />
          </div>
        </div>
      </div>

      <div
        className="flex flex-wrap justify-between items-center p-4 rounded-xl border border-emerald-100 gap-4"
        style={{ background: 'linear-gradient(90deg, #f0fdf9 0%, #ecfeff 100%)' }}
      >
        <div className="text-right">
          <div className="text-xs text-slate-500 mb-1">합성수지 중량 / 제품 1개</div>
          <div className="text-lg font-bold text-slate-800 font-mono">
            {totalPlasticWeightPerUnit.toFixed(4)}
            <span className="text-sm font-normal text-slate-500 ml-1">g</span>
          </div>
        </div>
        <div className="text-slate-300 text-xl">×</div>
        <div className="text-right">
          <div className="text-xs text-slate-500 mb-1">생산수량</div>
          <div className="text-lg font-bold text-slate-800 font-mono">
            {productionQty.toLocaleString()}
            <span className="text-sm font-normal text-slate-500 ml-1">개</span>
          </div>
        </div>
        <div className="text-slate-300 text-xl">=</div>
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

      <PackagingComponentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveComponent}
      />
      
      <BomComponentSelector
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={handleSelectComponents}
        onOpenNewForm={() => setIsFormOpen(true)}
        processType={activeProcessType} 
      />
    </div>
  );
}