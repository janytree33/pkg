import React, { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import { CONTAINER_TYPE_MAP, MATERIAL_OPTIONS, PACKAGING_CATEGORIES } from '../../utils/constants';
import { Upload, Download } from 'lucide-react';
import usePackagingStore from '../../stores/packagingStore';
import { parseExcelFile, formatComponentsFromExcel, downloadComponentTemplateExcel } from '../../utils/excelParser';

export default function PackagingComponentForm({ isOpen, onClose, onSave, editData }) {
  const { uploadComponentsFromExcel } = usePackagingStore();
  const fileInputRef = useRef(null);

  // 포장재 정보 폼 상태 관리
  const [formData, setFormData] = useState({
    regNo: '',
    code: '',
    name: '',
    spec: '',
    category: PACKAGING_CATEGORIES[0]?.value || '',
    type: '포장부자재', // 충진부자재, 포장부자재 구분
    containerType: '',
    specFiles: [],          // 새로 추가된 다중 파일 배열 (File 객체)
    existingSpecFiles: []   // 기존에 업로드되었던 파일 배열 ({name, data})
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editData) {
      let parsedFiles = [];
      try {
        if (editData.specFiles && typeof editData.specFiles === 'string') {
          parsedFiles = JSON.parse(editData.specFiles);
        } else if (Array.isArray(editData.specFiles)) {
          parsedFiles = editData.specFiles;
        } else if (editData.specFile) {
          // 과거 단일 파일 문자열 호환성
          if (editData.specFile.startsWith('[')) {
            parsedFiles = JSON.parse(editData.specFile);
          }
        }
      } catch(e) {
        // 무시 (일반 문자열일 경우)
      }

      setFormData({
        regNo: editData.regNo || '',
        code: editData.code || '',
        name: editData.name || '',
        spec: editData.spec || '',
        category: editData.category || PACKAGING_CATEGORIES[0]?.value || '',
        type: editData.type || '포장부자재',
        containerType: editData.containerType || '',
        material: editData.material || '',
        weightPerUnit: editData.weightPerUnit || '',
        remark: editData.remark || '',
        specFiles: [],
        existingSpecFiles: parsedFiles
      });
    } else {
      setFormData({
        regNo: '',
        code: '',
        name: '',
        spec: '',
        category: PACKAGING_CATEGORIES[0]?.value || '',
        type: '포장부자재',
        containerType: '',
        material: '',
        weightPerUnit: '',
        remark: '',
        specFiles: [],
        existingSpecFiles: []
      });
    }
  }, [editData, isOpen]);

  // 저장 버튼 클릭 시 호출 (파일 있으면 Base64로 변환)
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      // 1. 새 파일들을 Base64로 변환
      const newFilesEncoded = await Promise.all(
        formData.specFiles.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({
              name: file.name,
              size: file.size,
              data: e.target.result // Base64
            });
            reader.readAsDataURL(file);
          });
        })
      );

      // 2. 기존 파일과 새 파일을 합침
      const combinedFiles = [...formData.existingSpecFiles, ...newFilesEncoded];

      // 부모 컴포넌트의 저장 로직 호출을 기다림
      await onSave({
        ...formData,
        weightPerUnit: parseFloat(formData.weightPerUnit) || 0,
        specFiles: combinedFiles, // DB 저장을 위해 넘김
      });
    } catch (error) {
      console.error("저장 중 에러 발생:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // 객체 맵핑을 배열로 변환하여 드롭다운에서 사용하기 쉽게 만듭니다. (이제 상수가 이미 배열임)
  const containerOptions = CONTAINER_TYPE_MAP;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? '포장재 수정' : '새 포장재 등록'} size="lg">

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">등록번호</label>
            <input 
              type="text" 
              value={formData.regNo} 
              onChange={e => setFormData({...formData, regNo: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300  rounded-md  dark:text-white"
              placeholder="예: S000001154"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">부재료코드</label>
            <input 
              type="text" 
              value={formData.code} 
              onChange={e => setFormData({...formData, code: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300  rounded-md  dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">부재료명</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300  rounded-md  dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">규격</label>
            <input 
              type="text" 
              value={formData.spec} 
              onChange={e => setFormData({...formData, spec: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300  rounded-md  dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">종류(구분)</label>
            <select 
              value={formData.type} 
              onChange={e => setFormData({...formData, type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300  rounded-md  dark:text-white"
            >
              <option value="충진부자재">충진부자재</option>
              <option value="포장부자재">포장부자재</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">구분 (1차/2차)</label>
            <select 
              value={formData.category} 
              onChange={e => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300  rounded-md  dark:text-white"
            >
              {PACKAGING_CATEGORIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">용기 형태</label>
            <select 
              value={formData.containerType} 
              onChange={e => setFormData({...formData, containerType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300  rounded-md  dark:text-white"
            >
              <option value="">선택</option>
              {containerOptions.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">재질</label>
            <select 
              value={formData.material} 
              onChange={e => setFormData({...formData, material: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300  rounded-md  dark:text-white"
            >
              <option value="">선택</option>
              {MATERIAL_OPTIONS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">개당 중량(g)</label>
            <input 
              type="number" 
              step="0.000001"
              value={formData.weightPerUnit} 
              onChange={e => setFormData({...formData, weightPerUnit: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300  rounded-md  dark:text-white"
              placeholder="예: 12.3456"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700  mb-1">비고/분리여부</label>
          <input 
            type="text" 
            value={formData.remark} 
            onChange={e => setFormData({...formData, remark: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300  rounded-md  dark:text-white"
            placeholder="특이사항이나 분리배출 표시 여부 등 기록"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📎 성적서 / 사양서 파일 <span className="text-xs text-slate-400 font-normal">(PDF, 이미지 다중 첨부가능 · 최대 5MB)</span>
          </label>

          <div className="space-y-2 mb-3">
            {/* 기존 첨부 파일 표시 */}
            {formData.existingSpecFiles.map((file, idx) => (
              <div key={`existing-${idx}`} className="flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                <div className="flex items-center gap-2">
                  <span>📄</span>
                  <a
                    href={file.data || '#'}
                    download={file.name}
                    className="font-medium truncate max-w-[200px] hover:underline cursor-pointer"
                    title={`${file.name} 다운로드`}
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

            {/* 신규 첨부 파일 표시 */}
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

          {/* 파일 선택 영역 */}
          <div
            className="border-2 border-dashed border-slate-200 rounded-lg px-4 py-3 hover:border-emerald-300 transition-colors cursor-pointer bg-slate-50 flex items-center justify-center"
            onClick={() => document.getElementById('specFileInput').click()}
          >
            <div className="text-center text-slate-400 text-xs py-1">
              <div className="text-lg mb-0.5">📂</div>
              <span className="text-emerald-600 font-medium">클릭</span>하여 추가할 파일을 선택하세요 (여러 개 선택 가능)
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
              
              // 용량 초과 파일 거르기
              const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
              if (validFiles.length < files.length) {
                alert(`5MB를 초과하는 파일이 제외되었습니다.`);
              }
              
              setFormData(prev => ({
                ...prev,
                specFiles: [...prev.specFiles, ...validFiles]
              }));
              // 같은 파일을 다시 선택할 수 있도록 input 초기화
              e.target.value = null;
            }}
          />
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
