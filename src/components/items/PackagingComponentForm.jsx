import React, { useState, useEffect, useRef, useMemo } from 'react';
import Modal from '../common/Modal';
import { CONTAINER_TYPE_MAP, MATERIAL_OPTIONS, DEFAULT_PART_TYPES } from '../../utils/constants';
import { Upload, Download, Plus, Trash2, Layers, RefreshCw } from 'lucide-react';
import usePackagingStore from '../../stores/packagingStore';

export default function PackagingComponentForm({ isOpen, onClose, onSave, editData }) {
  const { packagingComponents, uploadComponentsFromExcel } = usePackagingStore();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    regNo: '',
    code: '',
    name: '',
    spec: '',
    partType: DEFAULT_PART_TYPES[0], 
    material: '',
    evalType: '미평가',
    materialEvalResult: '미평가',
    weightPerUnit: '',
    remark: '',
    subComponents: [], 
    specFiles: [],          
    existingSpecFiles: [],
    kecoTypeCode: '',
    kecoEvaluationData: {}
  });
  
  const [isSaving, setIsSaving] = useState(false);

  // 💡 기존에 '0450' 같은 숫자 코드로 저장된 데이터를 열었을 때 자동으로 라벨(글자)로 변환해주는 헬퍼 함수
  const getContainerLabel = (val) => {
    if (!val) return '';
    const match = CONTAINER_TYPE_MAP.find(c => c.label === val || c.code === val);
    return match ? match.label : val;
  };

  useEffect(() => {
    if (editData) {
      let parsedFiles = [];
      try {
        if (editData.specFiles && typeof editData.specFiles === 'string') {
          parsedFiles = JSON.parse(editData.specFiles);
        } else if (Array.isArray(editData.specFiles)) {
          parsedFiles = editData.specFiles;
        } else if (editData.specFile) {
          if (editData.specFile.startsWith('[')) {
            parsedFiles = JSON.parse(editData.specFile);
          }
        }
      } catch(e) {}

      let mappedEval = editData.materialEvalResult || '미평가';
      if (mappedEval.includes('비대상') || mappedEval.includes('제외')) {
        mappedEval = '대상제외';
      }

      setFormData({
        regNo: editData.regNo || '',
        code: editData.code || '',
        name: editData.name || '',
        nameEn: editData.nameEn || '',
        spec: editData.spec || '',
        partType: editData.partType || DEFAULT_PART_TYPES[0],
        containerType: getContainerLabel(editData.containerType),
        material: editData.material || '',
        evalType: editData.evalType || '미평가', // 기존 데이터 매핑
        materialEvalResult: mappedEval,
        weightPerUnit: editData.weightPerUnit || editData.weight || '',
        remark: editData.remark || '',
        subComponents: (editData.subComponents || []).map(sub => ({
          ...sub,
          containerType: getContainerLabel(sub.containerType)
        })),
        specFiles: [],
        existingSpecFiles: parsedFiles,
        kecoTypeCode: editData.kecoTypeCode || '',
        kecoEvaluationData: editData.kecoEvaluationData || {}
      });
    } else {
      setFormData({
        regNo: '',
        code: '',
        name: '',
        nameEn: '',
        spec: '',
        partType: DEFAULT_PART_TYPES[0],
        containerType: '',
        material: '',
        materialEvalResult: '미평가',
        weightPerUnit: '',
        remark: '',
        subComponents: [],
        specFiles: [],
        existingSpecFiles: [],
        kecoTypeCode: '',
        kecoEvaluationData: {}
      });
    }
  }, [editData, isOpen]);

  const handleSave = async () => {
    if (isSaving) return;
    
    if (!formData.containerType) {
      alert("용기 형태(EPR 품목코드)는 필수 입력값입니다. 꼭 선택해 주세요.");
      return;
    }
    
    setIsSaving(true);
    try {
      const newFilesEncoded = await Promise.all(
        formData.specFiles.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({
              name: file.name,
              size: file.size,
              data: e.target.result
            });
            reader.readAsDataURL(file);
          });
        })
      );
      
      const combinedFiles = [...formData.existingSpecFiles, ...newFilesEncoded];
      
      await onSave({
        ...formData,
        weightPerUnit: parseFloat(formData.weightPerUnit) || 0,
        specFiles: combinedFiles,
      });
    } catch (error) {
      console.error("저장 중 에러 발생:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubComponent = () => {
    setFormData(prev => ({
      ...prev,
      subComponents: [
        ...prev.subComponents, 
        { id: Date.now().toString(), name: '', material: '', weight: 0, containerType: '' }
      ]
    }));
  };

  const handleUpdateSubComponent = (id, field, value) => {
    setFormData(prev => {
      const updatedSubComponents = prev.subComponents.map(sub => 
        sub.id === id ? { ...sub, [field]: value } : sub
      );
      
      if (field === 'weight') {
        const totalWeight = updatedSubComponents.reduce((sum, sub) => sum + (parseFloat(sub.weight) || 0), 0);
        return { 
          ...prev, 
          subComponents: updatedSubComponents, 
          weightPerUnit: totalWeight > 0 ? totalWeight : prev.weightPerUnit 
        };
      }
      
      return { ...prev, subComponents: updatedSubComponents };
    });
  };

  const handleRemoveSubComponent = (id) => {
    setFormData(prev => {
      const updatedSubComponents = prev.subComponents.filter(sub => sub.id !== id);
      const totalWeight = updatedSubComponents.reduce((sum, sub) => sum + (parseFloat(sub.weight) || 0), 0);
      return { 
        ...prev, 
        subComponents: updatedSubComponents, 
        weightPerUnit: updatedSubComponents.length > 0 ? totalWeight : prev.weightPerUnit 
      };
    });
  };

  const containerOptions = CONTAINER_TYPE_MAP;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? '포장재 수정' : '새 포장재 등록'} size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">등록번호</label>
            <input 
              type="text" 
              value={formData.regNo} 
              onChange={e => setFormData({...formData, regNo: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="예: S000001154"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">부재료코드</label>
            <input 
              type="text" 
              value={formData.code} 
              onChange={e => setFormData({...formData, code: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">부자재명(국문)</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">부자재명(영문)</label>
            <input 
              type="text" 
              value={formData.nameEn || ''} 
              onChange={e => setFormData({...formData, nameEn: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ex) Cap"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">규격</label>
            <input 
              type="text" 
              value={formData.spec} 
              onChange={e => setFormData({...formData, spec: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">포장형태</label>
            <select 
              value={formData.partType} 
              onChange={e => setFormData({...formData, partType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {DEFAULT_PART_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-emerald-700 mb-1">용기 형태 (EPR 필수) *</label>
            <select 
              value={formData.containerType} 
              onChange={e => setFormData({...formData, containerType: e.target.value})}
              className="w-full px-3 py-2 border-2 border-emerald-400 bg-emerald-50 rounded-md"
            >
              <option value="">선택 (필수)</option>
              {containerOptions.map(c => (
                // ✅ value를 c.code에서 c.label로 변경 (고유값으로 저장하여 엉뚱한 값 선택 방지)
                <option key={c.label} value={c.label}>{c.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">재질</label>
            <select 
              value={formData.material} 
              onChange={e => setFormData({...formData, material: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">선택</option>
              {MATERIAL_OPTIONS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">총 개당 중량(g)</label>
            <input 
              type="number" 
              step="0.0001"
              value={formData.weightPerUnit} 
              onChange={e => setFormData({...formData, weightPerUnit: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-bold text-slate-800"
              placeholder="예: 12.34"
              readOnly={formData.subComponents.length > 0} 
              title={formData.subComponents.length > 0 ? "서브컴포넌트 중량의 합계가 자동 적용됩니다." : ""}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">비고/분리여부</label>
          <input 
            type="text" 
            value={formData.remark} 
            onChange={e => setFormData({...formData, remark: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="특이사항이나 분리배출 표시 여부 등 기록"
          />
        </div>
        
        <hr className="my-4 border-slate-200" />
        
        {/* 서브컴포넌트 관리 영역 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div>
              <label className="block text-sm font-bold text-slate-700">부속품 (서브컴포넌트) 상세</label>
              <p className="text-xs text-slate-500 mt-1">튜브 세트, 펌프 등 여러 재질로 분리되는 부속품을 등록합니다.</p>
            </div>
            <button
              onClick={handleAddSubComponent}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-600 rounded hover:bg-slate-50 flex items-center gap-1 transition-colors shadow-sm"
            >
              <Plus size={14} /> 부속품 추가
            </button>
          </div>
          
          <div className="mb-4 p-3 bg-sky-50 border border-sky-100 rounded-lg flex gap-2 items-start">
            <div className="text-sky-500 mt-0.5">💡</div>
            <div className="text-sm text-sky-800 leading-relaxed">
              <strong>[복합 부자재 입력 가이드]</strong><br/>
              드롭퍼, 펌프 등 여러 부품으로 구성된 자재는 상단 [재질]에 가장 비중이 큰 '대표 재질'을 선택해 주시고, 
              세부 부품별 재질과 중량은 아래 [부속품 상세]에 각각 분리하여 등록해 주세요.
            </div>
          </div>
          
          {formData.subComponents.length > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">부품명</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">재질</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">용기 형태</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">중량(g)</th>
                    <th className="px-3 py-2 text-center font-semibold text-slate-600 w-16">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.subComponents.map((sub) => (
                    <tr key={sub.id}>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={sub.name}
                          onChange={(e) => handleUpdateSubComponent(sub.id, 'name', e.target.value)}
                          placeholder="예: 펌프 헤드"
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <select
                          value={sub.material}
                          onChange={(e) => handleUpdateSubComponent(sub.id, 'material', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                        >
                          <option value="">선택</option>
                          {MATERIAL_OPTIONS.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <select
                          value={sub.containerType}
                          onChange={(e) => handleUpdateSubComponent(sub.id, 'containerType', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                        >
                          <option value="">선택</option>
                          {containerOptions.map(c => (
                            // ✅ 서브컴포넌트 드롭다운도 동일하게 value를 c.label로 변경
                            <option key={c.label} value={c.label}>{c.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          step="0.0001"
                          value={sub.weight}
                          onChange={(e) => handleUpdateSubComponent(sub.id, 'weight', e.target.value)}
                          placeholder="0.0"
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                        />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button
                          onClick={() => handleRemoveSubComponent(sub.id)}
                          className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                          title="부품 삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50 border border-slate-200 rounded-lg border-dashed">
              <span className="text-sm text-slate-400">등록된 부속품이 없습니다. 필요시 추가해 주세요.</span>
            </div>
          )}
        </div>
        
        <hr className="my-4 border-slate-200" />
        
        {/* 첨부파일 영역 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📎 성적서 / 사양서 파일 <span className="text-xs text-slate-400 font-normal">(PDF, 이미지 다중 첨부가능 · 최대 5MB)</span>
          </label>
          <div className="space-y-2 mb-3">
            {formData.existingSpecFiles.map((file, idx) => (
              <div key={`existing-${idx}`} className="flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                <div className="flex items-center gap-2">
                  <span>📄</span>
                  <a
                    href={file.data || '#'}
                    download={file.name}
                    className="font-medium truncate max-w-[200px] hover:underline cursor-pointer"
                  >
                    {file.name}
                  </a>
                  <span className="text-blue-400">(기존 파일)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      existingSpecFiles: prev.existingSpecFiles.filter((_, i) => i !== idx)
                    }));
                  }}
                  className="text-blue-400 hover:text-red-500 text-xs font-bold px-1"
                >
                  ✕
                </button>
              </div>
            ))}
            
            {formData.specFiles.map((file, idx) => (
              <div key={`new-${idx}`} className="flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
                <div className="flex items-center gap-2">
                  <span>✅</span>
                  <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                  <span className="text-emerald-400">({(file.size / 1024).toFixed(0)}KB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      specFiles: prev.specFiles.filter((_, i) => i !== idx)
                    }));
                  }}
                  className="text-emerald-400 hover:text-red-500 text-xs font-bold px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          
          <div
            className="border-2 border-dashed border-slate-200 rounded-lg px-4 py-3 hover:border-emerald-300 transition-colors cursor-pointer bg-slate-50 flex items-center justify-center"
            onClick={() => document.getElementById('specFileInput').click()}
          >
            <div className="text-center text-slate-400 text-xs py-1">
              <div className="text-lg mb-0.5">📂</div>
              <span className="text-emerald-600 font-medium">클릭</span>하여 추가할 파일을 선택하세요
            </div>
          </div>
          
          <input
            id="specFileInput"
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={e => {
              const files = Array.from(e.target.files);
              if (files.length === 0) return;
              
              const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
              if (validFiles.length < files.length) {
                alert(`5MB를 초과하는 파일이 제외되었습니다.`);
              }
              
              setFormData(prev => ({
                ...prev,
                specFiles: [...prev.specFiles, ...validFiles]
              }));
              e.target.value = null;
            }}
          />
        </div>
        
        {/* 하단 버튼 영역 */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            취소
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md tracking-wide shadow-sm transition-all ${
              isSaving 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-brand-400 hover:bg-brand-500 hover:shadow-md'
            }`}
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </Modal>
  );
}