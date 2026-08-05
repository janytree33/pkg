/**
 * CompanyInfoForm.jsx
 * ─────────────────────────────────────
 * 회사 정보 설정 화면 ⭐
 * 미리보기 카드 로고/직인 레이아웃 황금비율 최적화!
 */
import { useState, useRef } from 'react';
import { Save, Upload, Trash2, Building2, Image } from 'lucide-react';
import useSettingsStore from '../../stores/settingsStore';

// 입력 필드 컴포넌트
const InputField = ({ label, field, placeholder, type = 'text', form, handleChange }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">
      {label}
    </label>
    <input
      type={type}
      value={form[field] || ''}
      onChange={(e) => handleChange(field, e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg border border-slate-300  
                 bg-white text-slate-900  
                 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                 text-sm transition-all"
    />
  </div>
);

// 이미지 업로드 영역 컴포넌트
const ImageUploadArea = ({ label, field, inputRef, description, form, handleImageUpload, handleImageDelete, isUploading }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label}
    </label>
    <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">{description}</p>
    <div className="flex flex-col gap-3">
      {/* 미리보기 영역 */}
      <div className="w-full h-28 rounded-lg border-2 border-dashed border-slate-300  
                      flex items-center justify-center bg-slate-50 overflow-hidden">
        {form[field] ? (
          <img src={form[field]} alt={label} className="max-w-full max-h-full object-contain p-1" />
        ) : (
          <div className="text-center text-slate-400">
            <Image size={24} className="mx-auto mb-1" />
            <span className="text-xs">미등록</span>
          </div>
        )}
      </div>
      {/* 버튼 영역 */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageUpload(field, e.target.files[0])}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            isUploading 
              ? 'text-slate-400 bg-slate-200 cursor-wait' 
              : 'text-brand-600 bg-brand-50 hover:bg-brand-100 dark:hover:bg-brand-900/50'
          }`}
        >
          <Upload size={12} />
          {isUploading ? '업로드 중...' : form[field] ? '교체' : '업로드'}
        </button>
        {form[field] && !isUploading && (
          <button
            onClick={() => handleImageDelete(field)}
            className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-danger-600 
                       bg-danger-50 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
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
  const { companyInfo, updateCompanyInfo, uploadCompanyImage } = useSettingsStore();

  const [form, setForm] = useState({ ...companyInfo });
  const [saved, setSaved] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);

  const logoInputRef = useRef(null);
  const stampInputRef = useRef(null);
  const stampEnInputRef = useRef(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleImageUpload = async (field, file) => {
    if (!file) return;
    
    try {
      setUploadingField(field);
      const publicUrl = await uploadCompanyImage(file, field);
      
      if (publicUrl) {
        handleChange(field, publicUrl);
      }
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
    } finally {
      setUploadingField(null);
      if (field === 'logo' && logoInputRef.current) logoInputRef.current.value = '';
      if (field === 'stamp' && stampInputRef.current) stampInputRef.current.value = '';
      if (field === 'stampEn' && stampEnInputRef.current) stampEnInputRef.current.value = '';
    }
  };

  const handleImageDelete = (field) => {
    handleChange(field, null);
  };

  const handleSave = () => {
    updateCompanyInfo(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ─── 좌측: 입력 폼 ─── */}
      <div className="lg:col-span-2 space-y-6">
        {/* 기본 정보 카드 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
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

        {/* 이미지 업로드 카드 (3컬럼 구조) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Image size={20} className="text-brand-500" />
            로고 및 직인
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <ImageUploadArea
              label="회사 로고"
              field="logo"
              inputRef={logoInputRef}
              description="사양서 헤더 우측 상단 표시 (PNG 권장)"
              form={form} 
              handleImageUpload={handleImageUpload} 
              handleImageDelete={handleImageDelete}
              isUploading={uploadingField === 'logo'}
            />
            <ImageUploadArea
              label="공식 직인 (국문)"
              field="stamp"
              inputRef={stampInputRef}
              description="국문 사양서 서명란 오버레이 (PNG 투명배경)"
              form={form} 
              handleImageUpload={handleImageUpload} 
              handleImageDelete={handleImageDelete}
              isUploading={uploadingField === 'stamp'}
            />
            <ImageUploadArea
              label="공식 직인 (영문)"
              field="stampEn"
              inputRef={stampEnInputRef}
              description="영문/수출용 사양서 서명란 오버레이 (PNG 투명배경)"
              form={form} 
              handleImageUpload={handleImageUpload} 
              handleImageDelete={handleImageDelete}
              isUploading={uploadingField === 'stampEn'}
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
            <span className="text-sm text-success-600 animate-fade-in">
              ✅ 저장되었습니다
            </span>
          )}
        </div>
      </div>

      {/* ─── 우측: 미리보기 카드 ─── */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card sticky top-6">
          <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">
            미리보기
          </h3>
          
          {/* 상단 로고 미리보기 (헤더 조합 정렬) */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-700 min-h-[44px]">
            <span className="text-base font-bold text-slate-800 dark:text-white truncate mr-2">
              {form.nameEn || 'JANYTREE'}
            </span>
            {form.logo ? (
              <img src={form.logo} alt="Logo" className="h-8 max-w-[120px] object-contain shrink-0" />
            ) : (
              <span className="text-xs text-slate-400 border border-dashed border-slate-300 px-2 py-1 rounded shrink-0">
                LOGO
              </span>
            )}
          </div>

          {/* 회사 정보 미리보기 */}
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-2">
              {form.nameKo || '(회사명 미입력)'}
            </p>
            <p className="leading-relaxed">{form.addressKo || '(주소 미입력)'}</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">{form.addressEn || ''}</p>
            <p className="pt-1">
              Tel: {form.phone || '-'} | Fax: {form.fax || '-'}
            </p>
            <p>Email: {form.email || '-'}</p>
            {form.businessNo && <p>사업자번호: {form.businessNo}</p>}
            {form.ceoName && <p>대표자: {form.ceoName}</p>}
          </div>
          
          {/* 하단 직인 미리보기 (황금 밸런스 균등배치) */}
          {(form.stamp || form.stampEn) && (
            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 items-end">
              <div className="text-center">
                {form.stamp ? (
                  <>
                    <span className="text-[10px] text-slate-400 block mb-1">국문 직인</span>
                    <div className="h-16 flex items-center justify-center">
                      <img src={form.stamp} alt="국문직인" className="max-h-16 max-w-full object-contain opacity-90" />
                    </div>
                  </>
                ) : (
                  <div className="h-16" />
                )}
              </div>
              <div className="text-center">
                {form.stampEn ? (
                  <>
                    <span className="text-[10px] text-slate-400 block mb-1">영문 직인</span>
                    <div className="h-16 flex items-center justify-center">
                      <img src={form.stampEn} alt="영문직인" className="max-h-16 max-w-full object-contain opacity-90" />
                    </div>
                  </>
                ) : (
                  <div className="h-16" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}