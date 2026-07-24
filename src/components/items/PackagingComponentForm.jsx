import React, { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import { CONTAINER_TYPE_MAP, MATERIAL_OPTIONS, PACKAGING_CATEGORIES } from '../../utils/constants';
import { Upload } from 'lucide-react';
import usePackagingStore from '../../stores/packagingStore';
import { parseExcelFile, formatComponentsFromExcel } from '../../utils/excelParser';

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
    material: '',
    weightPerUnit: '',
    remark: '',
    specFile: null // 사양서 파일 저장을 위한 상태
  });

  // 수정 모드일 경우 기존 데이터로 폼을 채우고, 등록일 경우 빈 폼으로 초기화합니다.
  useEffect(() => {
    if (editData) {
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
        specFile: null 
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
        specFile: null
      });
    }
  }, [editData, isOpen]);

  // 엑셀 일괄 업로드
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const rawData = await parseExcelFile(file);
      const formattedData = formatComponentsFromExcel(rawData);
      
      if (formattedData.length > 0) {
        const success = await uploadComponentsFromExcel(formattedData);
        if (success) {
          alert(`총 ${formattedData.length}건의 부재료가 성공적으로 업로드되었습니다.`);
          onClose();
        } else {
          alert('엑셀 업로드 중 오류가 발생했습니다.');
        }
      } else {
        alert('업로드할 데이터가 없거나 양식이 잘못되었습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('엑셀 파일 파싱 중 오류가 발생했습니다.');
    } finally {
      e.target.value = null; // 초기화
    }
  };

  // 저장 버튼 클릭 시 호출 (파일 있으면 Base64로 변환)
  const handleSave = async () => {
    let specFileData = editData?.specFileData || null;
    let specFileName = editData?.specFileName || null;

    if (formData.specFile) {
      // 파일을 Base64 문자열로 변환 (브라우저에서 읽기)
      specFileData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result); // "data:application/pdf;base64,..."
        reader.readAsDataURL(formData.specFile);
      });
      specFileName = formData.specFile.name;
    }

    onSave({
      ...formData,
      weightPerUnit: parseFloat(formData.weightPerUnit) || 0,
      specFileData,   // Base64 데이터
      specFileName,   // 파일명 (표시용)
    });
  };

  // 객체 맵핑을 배열로 변환하여 드롭다운에서 사용하기 쉽게 만듭니다. (이제 상수가 이미 배열임)
  const containerOptions = CONTAINER_TYPE_MAP;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? '포장재 수정' : '새 포장재 등록'} size="lg">
      {!editData && (
        <div className="mb-6 p-4 bg-emerald-50  border border-emerald-200  rounded-lg flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">엑셀 일괄 업로드</h4>
            <p className="text-xs text-emerald-600  mt-1">대량의 부재료를 한 번에 등록하시려면 엑셀 파일을 업로드하세요.</p>
          </div>
          <div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleExcelUpload} 
              accept=".xlsx, .xls" 
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Upload size={16} /> 엑셀 업로드
            </button>
          </div>
        </div>
      )}

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
            📎 성적서 / 사양서 파일 <span className="text-xs text-slate-400 font-normal">(PDF, 이미지 · 최대 5MB)</span>
          </label>

          {/* 기존 첨부 파일 표시 */}
          {editData?.specFileName && !formData.specFile && (
            <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              <span>📄</span>
              <span className="font-medium">{editData.specFileName}</span>
              <span className="text-blue-400">(기존 첨부파일)</span>
            </div>
          )}

          {/* 파일 선택 영역 */}
          <div
            className="border-2 border-dashed border-slate-200 rounded-lg px-4 py-3 hover:border-emerald-300 transition-colors cursor-pointer bg-slate-50"
            onClick={() => document.getElementById('specFileInput').click()}
          >
            {formData.specFile ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <span>✅</span>
                  <span className="font-medium">{formData.specFile.name}</span>
                  <span className="text-slate-400">({(formData.specFile.size / 1024).toFixed(0)}KB)</span>
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setFormData({...formData, specFile: null}); }}
                  className="text-slate-400 hover:text-red-500 text-xs"
                >
                  ✕ 제거
                </button>
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs py-1">
                <div className="text-lg mb-0.5">📂</div>
                클릭하여 파일 선택 (PDF, PNG, JPG)
              </div>
            )}
          </div>

          <input
            id="specFileInput"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={e => {
              const file = e.target.files[0];
              if (!file) return;
              // 5MB 용량 제한 체크
              if (file.size > 5 * 1024 * 1024) {
                alert(`파일 크기가 너무 큽니다.\n최대 5MB까지 첨부 가능합니다.\n현재 파일: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
                e.target.value = null;
                return;
              }
              setFormData({...formData, specFile: file});
            }}
          />
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700  bg-white  border border-gray-300  rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            취소
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-400 text-white font-bold tracking-wide shadow-sm hover:shadow-md rounded-md hover:bg-brand-500"
          >
            저장
          </button>
        </div>
      </div>
    </Modal>
  );
}
