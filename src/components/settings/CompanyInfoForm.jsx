/**
 * CompanyInfoForm.jsx
 * ─────────────────────────────────────
 * 회사 정보 설정 화면 ⭐
 * 로고, 직인, 회사명, 주소 등을 등록/수정할 수 있는 전용 관리 화면
 * 사양서 PDF에 자동으로 반영됩니다
 */
import { useState, useRef } from 'react';
import { Save, Upload, Trash2, Building2, Image } from 'lucide-react';
import useSettingsStore from '../../stores/settingsStore';

// 입력 필드 컴포넌트 (리렌더링 시 포커스 잃지 않도록 바깥으로 분리)
const InputField = ({ label, field, placeholder, type = 'text', form, handleChange }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
      {label}
    </label>
    <input
      type={type}
      value={form[field] || ''}
      onChange={(e) => handleChange(field, e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 
                 bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                 text-sm transition-all"
    />
  </div>
);

// 이미지 업로드 영역 컴포넌트
const ImageUploadArea = ({ label, field, inputRef, description, form, handleImageUpload, handleImageDelete }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label}
    </label>
    <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
    <div className="flex items-start gap-4">
      {/* 미리보기 */}
      <div className="w-40 h-28 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 
                      flex items-center justify-center bg-slate-50 dark:bg-slate-800 overflow-hidden">
        {form[field] ? (
          <img src={form[field]} alt={label} className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="text-center text-slate-400">
            <Image size={24} className="mx-auto mb-1" />
            <span className="text-xs">미등록</span>
          </div>
        )}
      </div>
      {/* 버튼 */}
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageUpload(field, e.target.files[0])}
        />
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand-600 
                     bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400
                     dark:hover:bg-brand-900/50 rounded-md transition-colors"
        >
          <Upload size={12} />
          {form[field] ? '교체' : '업로드'}
        </button>
        {form[field] && (
          <button
            onClick={() => handleImageDelete(field)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-danger-600 
                       bg-danger-50 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400
                       dark:hover:bg-red-900/50 rounded-md transition-colors"
          >
            <Trash2 size={12} />
            삭제
          </button>
        )}
      </div>
    </div>
  </div>
);

export default function CompanyInfoForm() {
  const { companyInfo, updateCompanyInfo } = useSettingsStore();

  // 폼 상태 (현재 companyInfo를 복사하여 편집)
  const [form, setForm] = useState({ ...companyInfo });
  const [saved, setSaved] = useState(false);

  // 파일 업로드용 ref
  const logoInputRef = useRef(null);
  const stampInputRef = useRef(null);

  // 입력 필드 변경 핸들러
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  // 이미지 업로드 핸들러 (Base64 변환)
  const handleImageUpload = (field, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      handleChange(field, reader.result);
    };
    reader.readAsDataURL(file);
  };

  // 이미지 삭제
  const handleImageDelete = (field) => {
    handleChange(field, null);
  };

  // 저장
  const handleSave = () => {
    updateCompanyInfo(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // (컴포넌트 정의는 바깥으로 분리됨)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ─── 좌측: 입력 폼 ─── */}
      <div className="lg:col-span-2 space-y-6">
        {/* 기본 정보 카드 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-card">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Building2 size={20} className="text-brand-500" />
            기본 정보
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="회사명 (국문)" field="nameKo" placeholder="주식회사 제니트리" form={form} handleChange={handleChange} />
            <InputField label="회사명 (영문)" field="nameEn" placeholder="Janytree Inc." form={form} handleChange={handleChange} />
            <InputField label="사업자등록번호" field="businessNo" placeholder="123-45-67890" form={form} handleChange={handleChange} />
            <InputField label="대표자명" field="ceoName" placeholder="대표자 성명" form={form} handleChange={handleChange} />
            <div className="md:col-span-2">
              <InputField label="주소 (국문)" field="addressKo" placeholder="서울시 금천구..." form={form} handleChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <InputField label="주소 (영문)" field="addressEn" placeholder="#1403, Ace High-end Tower..." form={form} handleChange={handleChange} />
            </div>
            <InputField label="전화번호" field="phone" placeholder="82-2-868-1921" form={form} handleChange={handleChange} />
            <InputField label="팩스번호" field="fax" placeholder="02.868.1920" form={form} handleChange={handleChange} />
            <InputField label="이메일" field="email" placeholder="global@janytree.com" type="email" form={form} handleChange={handleChange} />
          </div>
        </div>

        {/* 이미지 업로드 카드 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-card">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Image size={20} className="text-brand-500" />
            로고 및 직인
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUploadArea
              label="회사 로고"
              field="logo"
              inputRef={logoInputRef}
              description="사양서 헤더 우측 상단에 표시됩니다 (권장: PNG, 200×80px)"
              form={form} handleImageUpload={handleImageUpload} handleImageDelete={handleImageDelete}
            />
            <ImageUploadArea
              label="공식 직인"
              field="stamp"
              inputRef={stampInputRef}
              description="사양서 서명란에 오버레이됩니다 (권장: PNG 투명배경, 150×150px)"
              form={form} handleImageUpload={handleImageUpload} handleImageDelete={handleImageDelete}
            />
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 
                       text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            <Save size={16} />
            저장
          </button>
          {saved && (
            <span className="text-sm text-success-600 dark:text-green-400 animate-fade-in">
              ✅ 저장되었습니다
            </span>
          )}
        </div>
      </div>

      {/* ─── 우측: 미리보기 카드 ─── */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-card sticky top-6">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">
            미리보기
          </h3>
          {/* 로고 미리보기 */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {form.nameEn || 'JANYTREE'}
            </span>
            {form.logo ? (
              <img src={form.logo} alt="Logo" className="h-8 object-contain" />
            ) : (
              <span className="text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-600 px-2 py-1 rounded">
                LOGO
              </span>
            )}
          </div>
          {/* 회사 정보 미리보기 */}
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {form.nameKo || '(회사명 미입력)'}
            </p>
            <p>{form.addressKo || '(주소 미입력)'}</p>
            <p className="text-[11px] text-slate-400">{form.addressEn || ''}</p>
            <p>
              Tel: {form.phone || '-'} | Fax: {form.fax || '-'}
            </p>
            <p>Email: {form.email || '-'}</p>
            {form.businessNo && <p>사업자번호: {form.businessNo}</p>}
            {form.ceoName && <p>대표자: {form.ceoName}</p>}
          </div>
          {/* 직인 미리보기 */}
          {form.stamp && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <img src={form.stamp} alt="Stamp" className="h-16 object-contain opacity-80" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
