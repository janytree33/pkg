import React, { useState } from 'react';
import { Upload, X, Loader2, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { KECO_SCHEMAS, JUDGMENT_METHODS, GRADE_ORDER, KECO_TYPES } from '../../constants/kecoSchemas';
import { uploadFileToStorage } from '../../utils/storageUpload';

export default function DynamicKecoEvaluator({ 
  kecoTypeCode, 
  onChangeCode, 
  kecoEvaluationData, 
  onChangeData,
  onResultCalculated,
  readOnly = false
}) {
  const schema = KECO_SCHEMAS[kecoTypeCode];
  const hasCategories = schema?.parts.some(p => p.categories.length > 1) ?? true;
  const [uploadingPart, setUploadingPart] = useState(null);
  const lastCalculatedGrade = React.useRef(null);

  // Initialize data structure if empty
  React.useEffect(() => {
    if (kecoTypeCode && schema && (!kecoEvaluationData || Object.keys(kecoEvaluationData).length === 0)) {
      const initialData = {};
      schema.parts.forEach(p => {
        initialData[p.id] = {
          selectedIds: [],
          methods: [],
          methodOtherText: '',
          docs: []
        };
      });
      onChangeData(initialData);
    }
  }, [kecoTypeCode, schema, kecoEvaluationData]);

  // Calculate grade whenever kecoEvaluationData changes
  React.useEffect(() => {
    if (!schema || !kecoEvaluationData || !onResultCalculated) return;
    
    let worstGrade = '미평가';
    let hasSelections = false;

    // Grades weight for worst-grade calculation
    const gradeWeight = {
      '재활용 어려움': 3,
      '재활용 보통': 2,
      '재활용 최우수/우수': 1
    };

    let currentMaxWeight = 0;

    schema.parts.forEach(p => {
      const selectedIds = kecoEvaluationData[p.id]?.selectedIds || [];
      if (selectedIds.length > 0) hasSelections = true;

      p.categories.forEach(cat => {
        Object.entries(cat.grades).forEach(([gradeName, criteriaList]) => {
          const matchingCriteria = criteriaList.filter(c => selectedIds.includes(c.id));
          if (matchingCriteria.length > 0) {
            const weight = gradeWeight[gradeName] || 0;
            if (weight > currentMaxWeight) {
              currentMaxWeight = weight;
              worstGrade = gradeName === '재활용 최우수/우수' ? '재활용 우수' : gradeName;
            }
          }
        });
      });
    });

    const finalGrade = hasSelections ? worstGrade : '미평가';
    if (lastCalculatedGrade.current !== finalGrade) {
      lastCalculatedGrade.current = finalGrade;
      onResultCalculated(finalGrade);
    }
  }, [kecoEvaluationData, schema, onResultCalculated]);

  if (!kecoTypeCode) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <label className="block text-sm font-semibold text-slate-700 mb-2">포장재 종류 (KECO 코드)</label>
        <select
          value={kecoTypeCode}
          onChange={(e) => onChangeCode(e.target.value)}
          disabled={readOnly}
          className={`w-full px-3 py-2 border rounded-lg text-sm ${readOnly ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300 focus:ring-2 focus:ring-emerald-500'}`}
        >
          <option value="">-- KECO 포장재 종류 선택 --</option>
          {KECO_TYPES.map(t => (
            <option key={t.code} value={t.code}>[{t.code}] {t.name}</option>
          ))}
        </select>
        <div className="mt-8 text-center text-slate-400 py-8 text-sm">
          포장재 종류를 선택하시면 상세 평가 항목이 표시됩니다.
        </div>
      </div>
    );
  }

  const handleFileUpload = async (e, partId) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setUploadingPart(partId);
    try {
      const uploadedDocs = await Promise.all(files.map(async f => {
        const url = await uploadFileToStorage(f, 'epr_documents');
        return { name: f.name, url, type: '증빙 서류' };
      }));

      onChangeData(prev => ({
        ...prev,
        [partId]: {
          ...prev[partId],
          docs: [...(prev[partId]?.docs || []), ...uploadedDocs]
        }
      }));
    } catch (error) {
      console.error(error);
      alert('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingPart(null);
      e.target.value = '';
    }
  };

  const toggleCriteria = (partId, criteriaId) => {
    onChangeData(prev => {
      const partData = prev[partId] || { selectedIds: [], methods: [], docs: [] };
      const currentIds = partData.selectedIds || [];
      const newIds = currentIds.includes(criteriaId)
        ? currentIds.filter(id => id !== criteriaId)
        : [...currentIds, criteriaId];
        
      return { ...prev, [partId]: { ...partData, selectedIds: newIds } };
    });
  };

  const toggleMethod = (partId, method) => {
    onChangeData(prev => {
      const partData = prev[partId] || { selectedIds: [], methods: [], docs: [] };
      const currentMethods = partData.methods || [];
      const newMethods = currentMethods.includes(method)
        ? currentMethods.filter(m => m !== method)
        : [...currentMethods, method];
        
      return { ...prev, [partId]: { ...partData, methods: newMethods } };
    });
  };

  const removeDoc = (partId, docIndex) => {
    onChangeData(prev => {
      const partData = prev[partId] || { docs: [] };
      const newDocs = [...(partData.docs || [])];
      newDocs.splice(docIndex, 1);
      return { ...prev, [partId]: { ...partData, docs: newDocs } };
    });
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
      <div className="p-4 bg-white border-b border-slate-200">
        <label className="block text-sm font-semibold text-slate-700 mb-2">포장재 종류 (KECO 코드)</label>
        <select
          value={kecoTypeCode}
          onChange={(e) => onChangeCode(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">-- KECO 포장재 종류 선택 --</option>
          {KECO_TYPES.map(t => (
            <option key={t.code} value={t.code}>[{t.code}] {t.name}</option>
          ))}
        </select>
      </div>

      {schema ? (
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[1000px]">
            <thead className="bg-slate-100 text-slate-600 font-semibold text-center border-b border-slate-200">
              <tr>
                <th className="p-2 border-r border-slate-200 w-24">구성</th>
                <th className="p-2 border-r border-slate-200" colSpan={hasCategories ? 4 : 3}>재질구조 평가 기준</th>
                <th className="p-2 border-r border-slate-200 w-32">판정방법</th>
                <th className="p-2 w-48">증빙서류</th>
              </tr>
              <tr className="bg-slate-50 border-t border-slate-200 text-slate-500">
                <th className="p-2 border-r border-slate-200 font-normal">파트</th>
                {hasCategories && <th className="p-2 border-r border-slate-200 font-normal w-32">재질 구분</th>}
                <th className="p-2 border-r border-slate-200 font-medium text-emerald-600">재활용 최우수/우수</th>
                <th className="p-2 border-r border-slate-200 font-medium text-red-500">재활용 어려움</th>
                <th className="p-2 border-r border-slate-200 font-medium text-amber-500">재활용 보통</th>
                <th className="p-2 border-r border-slate-200"></th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {schema.parts.map((part, pIndex) => {
                const partData = kecoEvaluationData?.[part.id] || { selectedIds: [], methods: [], docs: [] };
                return part.categories.map((cat, cIndex) => (
                  <tr key={cat.id} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/50">
                    {/* Part Name Column - rowspan for all categories */}
                    {cIndex === 0 && (
                      <td className="p-3 border-r border-slate-200 font-semibold text-slate-800 text-center align-middle" rowSpan={part.categories.length}>
                        {part.name}
                      </td>
                    )}

                    {/* Category Column */}
                    {hasCategories && (
                      <td className="p-3 border-r border-slate-200 font-medium text-slate-700 bg-slate-50/30">
                        {cat.name}
                      </td>
                    )}

                    {/* Grades Columns */}
                    {['재활용 최우수/우수', '재활용 어려움', '재활용 보통'].map((gradeName) => (
                      <td key={gradeName} className="p-3 border-r border-slate-200 align-top">
                        <div className="flex flex-col gap-2">
                          {(cat.grades[gradeName] || []).map(criteria => {
                            const isChecked = partData.selectedIds?.includes(criteria.id);
                            return (
                              <label key={criteria.id} className={`flex items-start gap-2 group ${readOnly ? '' : 'cursor-pointer'}`}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => !readOnly && toggleCriteria(part.id, criteria.id)}
                                  disabled={readOnly}
                                  className={`mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 ${readOnly ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                                />
                                <span className={`flex-1 leading-snug transition-colors ${isChecked ? 'text-emerald-700 font-medium' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                  {criteria.text}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </td>
                    ))}

                    {/* Methods & Docs Columns - rowspan for all categories */}
                    {cIndex === 0 && (
                      <td className="p-3 border-r border-slate-200 align-top bg-slate-50/20" rowSpan={part.categories.length}>
                        <div className="flex flex-col gap-2">
                          {JUDGMENT_METHODS.map(method => (
                            <label key={method} className={`flex items-center gap-2 text-slate-700 ${readOnly ? '' : 'cursor-pointer'}`}>
                              <input
                                type="checkbox"
                                checked={partData.methods?.includes(method)}
                                onChange={() => !readOnly && toggleMethod(part.id, method)}
                                disabled={readOnly}
                                className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${readOnly ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                              />
                              <span className="text-slate-700">{method}</span>
                            </label>
                          ))}
                          {partData.methods?.includes('기타') && (
                            <input
                              type="text"
                              value={partData.methodOtherText || ''}
                              onChange={(e) => !readOnly && onChangeData(prev => ({
                                ...prev,
                                [part.id]: { ...prev[part.id], methodOtherText: e.target.value }
                              }))}
                              disabled={readOnly}
                              placeholder="기타 사유 입력"
                              className={`mt-1 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none ${readOnly ? 'bg-slate-100' : ''}`}
                            />
                          )}
                        </div>
                      </td>
                    )}
                    {cIndex === 0 && (
                      <td className="p-3 align-top bg-slate-50/20" rowSpan={part.categories.length}>
                        <div className="flex flex-col gap-2">
                          {partData.docs?.map((doc, dIndex) => (
                            <div key={dIndex} className="flex items-start justify-between gap-1 p-1.5 bg-white border border-slate-200 rounded text-[11px]">
                              <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[120px]" title={doc.name}>
                                {doc.name}
                              </a>
                              {!readOnly && (
                                <button
                                  type="button"
                                  onClick={() => removeDoc(part.id, dIndex)}
                                  className="text-slate-400 hover:text-red-500 shrink-0"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          ))}
                          {!readOnly && (
                            <label className={`mt-2 flex items-center justify-center gap-1.5 px-2 py-1.5 border border-dashed rounded text-xs cursor-pointer transition-colors ${uploadingPart === part.id ? 'bg-slate-100 border-slate-300 text-slate-400' : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'}`}>
                              {uploadingPart === part.id ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                              {uploadingPart === part.id ? '업로드중..' : '파일 첨부 (다중)'}
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, part.id)}
                                disabled={uploadingPart === part.id}
                              />
                            </label>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-500">
          <AlertCircle className="mx-auto text-amber-500 mb-2" size={32} />
          <p>해당 KECO 코드({kecoTypeCode})에 대한 상세 테이블 서식이 아직 준비되지 않았습니다.</p>
          <p className="text-sm mt-1">추후 1:1 KECO 서식 업데이트를 통해 지원될 예정입니다.</p>
        </div>
      )}
    </div>
  );
}
