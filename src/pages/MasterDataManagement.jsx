/**
 * MasterDataManagement.jsx
 * ─────────────────────────────────────────────────────────────
 * 기준관리 MDM (Master Data Management) 전용 페이지
 *
 * 탭 구성:
 *   ① 화장품 유형 분류  (master_cosmetic_types)
 *   ② 포장재 분류       (master_packaging_types)
 *   ③ 분리배출 표시     (master_recycle_marks)
 *   ④ 재활용 등급       (master_recyclability_grades)
 *   ⑤ 재질·구조 평가기준(master_keco_eval_rules)
 * ─────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import useMasterDataStore from '../stores/masterDataStore';

// ─────────────────────────────────────────────
// 탭 설정: 각 탭에 어떤 데이터와 액션을 쓸지 정의합니다.
// ─────────────────────────────────────────────
const TAB_CONFIG = [
  {
    id: 'cosmeticTypes',
    label: '화장품 유형 분류',
    stateKey: 'cosmeticTypes',
    fetchAction: 'fetchCosmeticTypes',
    addAction: 'addCosmeticTypesItem',
    updateAction: 'updateCosmeticTypesItem',
    deleteAction: 'deleteCosmeticTypesItem',
    description: '화장품의 유형(스킨케어, 색조 등)을 국문·영문으로 표준화합니다.',
    color: 'emerald',
  },
  {
    id: 'packagingTypes',
    label: '포장재 분류',
    stateKey: 'packagingTypes',
    fetchAction: 'fetchPackagingTypes',
    addAction: 'addPackagingTypesItem',
    updateAction: 'updatePackagingTypesItem',
    deleteAction: 'deletePackagingTypesItem',
    description: 'EPR 신고 및 포장재 마스터에서 사용하는 포장재 분류 기준입니다.',
    color: 'blue',
  },
  {
    id: 'recycleMarks',
    label: '분리배출 표시',
    stateKey: 'recycleMarks',
    fetchAction: 'fetchRecycleMarks',
    addAction: 'addRecycleMarksItem',
    updateAction: 'updateRecycleMarksItem',
    deleteAction: 'deleteRecycleMarksItem',
    description: '포장재에 표시되는 분리배출 기호 및 표기 기준을 관리합니다.',
    color: 'teal',
  },
  {
    id: 'recyclabilityGrades',
    label: '재활용 등급',
    stateKey: 'recyclabilityGrades',
    fetchAction: 'fetchRecyclabilityGrades',
    addAction: 'addRecyclabilityGradesItem',
    updateAction: 'updateRecyclabilityGradesItem',
    deleteAction: 'deleteRecyclabilityGradesItem',
    description: 'KECO 재활용 용이성 평가 등급 체계 (최우수/우수/보통/어려움)를 관리합니다.',
    color: 'violet',
  },
  {
    id: 'kecoEvalRules',
    label: '재질·구조 평가기준',
    stateKey: 'kecoEvalRules',
    fetchAction: 'fetchKecoEvalRules',
    addAction: 'addKecoEvalRulesItem',
    updateAction: 'updateKecoEvalRulesItem',
    deleteAction: 'deleteKecoEvalRulesItem',
    description: '한국환경공단(KECO) 포장재 재질·구조 개선 평가 세부 기준을 관리합니다.',
    color: 'amber',
  },
];

// ─────────────────────────────────────────────
// 색상 테마 매핑 (Tailwind 동적 클래스 방지용)
// ─────────────────────────────────────────────
const COLOR_THEME = {
  emerald: {
    tab: 'border-emerald-500 text-emerald-700 bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700',
    btn: 'bg-emerald-600 hover:bg-emerald-700',
    ring: 'focus:ring-emerald-300',
    icon: 'text-emerald-600',
    headerBg: 'from-emerald-50 to-teal-50',
    dot: 'bg-emerald-500',
  },
  blue: {
    tab: 'border-blue-500 text-blue-700 bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    btn: 'bg-blue-600 hover:bg-blue-700',
    ring: 'focus:ring-blue-300',
    icon: 'text-blue-600',
    headerBg: 'from-blue-50 to-indigo-50',
    dot: 'bg-blue-500',
  },
  teal: {
    tab: 'border-teal-500 text-teal-700 bg-teal-50',
    badge: 'bg-teal-100 text-teal-700',
    btn: 'bg-teal-600 hover:bg-teal-700',
    ring: 'focus:ring-teal-300',
    icon: 'text-teal-600',
    headerBg: 'from-teal-50 to-cyan-50',
    dot: 'bg-teal-500',
  },
  violet: {
    tab: 'border-violet-500 text-violet-700 bg-violet-50',
    badge: 'bg-violet-100 text-violet-700',
    btn: 'bg-violet-600 hover:bg-violet-700',
    ring: 'focus:ring-violet-300',
    icon: 'text-violet-600',
    headerBg: 'from-violet-50 to-purple-50',
    dot: 'bg-violet-500',
  },
  amber: {
    tab: 'border-amber-500 text-amber-700 bg-amber-50',
    badge: 'bg-amber-100 text-amber-700',
    btn: 'bg-amber-600 hover:bg-amber-700',
    ring: 'focus:ring-amber-300',
    icon: 'text-amber-600',
    headerBg: 'from-amber-50 to-orange-50',
    dot: 'bg-amber-500',
  },
};

// ─────────────────────────────────────────────
// 모달 컴포넌트: 추가/수정에 공통으로 사용합니다.
// ─────────────────────────────────────────────
function MasterDataModal({ isOpen, onClose, onSave, editItem, tabConfig }) {
  // 모달 폼 상태: 초기값은 빈 값 또는 수정할 항목의 기존 값
  const [form, setForm] = useState({
    nameKo: '',
    nameEn: '',
    description: '',
    sortOrder: 0,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const theme = COLOR_THEME[tabConfig?.color] || COLOR_THEME.emerald;
  const isEdit = !!editItem; // editItem이 있으면 수정 모드, 없으면 추가 모드

  // 모달이 열릴 때마다 폼 초기화
  useEffect(() => {
    if (isOpen) {
      setError('');
      if (isEdit) {
        // 수정 모드: 기존 데이터를 폼에 채웁니다
        setForm({
          nameKo: editItem.nameKo || '',
          nameEn: editItem.nameEn || '',
          description: editItem.description || '',
          sortOrder: editItem.sortOrder ?? 0,
          isActive: editItem.isActive ?? true,
        });
      } else {
        // 추가 모드: 폼을 비웁니다
        setForm({ nameKo: '', nameEn: '', description: '', sortOrder: 0, isActive: true });
      }
    }
  }, [isOpen, isEdit, editItem]);

  // 입력값 변경 핸들러 (모든 필드 공용)
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  // 저장 버튼 클릭
  const handleSave = async () => {
    // 국문명은 필수 입력
    if (!form.nameKo.trim()) {
      setError('국문명은 필수 입력 항목입니다.');
      return;
    }
    setSaving(true);
    const result = await onSave(form, isEdit ? editItem.id : null);
    setSaving(false);
    if (result?.success) {
      onClose();
    } else {
      setError(result?.message || '저장 중 오류가 발생했습니다.');
    }
  };

  // 모달 바깥 클릭 또는 Escape 키로 닫기
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-fade-in">
        {/* 모달 헤더 */}
        <div className={`px-6 py-4 bg-gradient-to-r ${theme.headerBg} border-b border-slate-100`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isEdit ? '항목 수정' : '새 항목 추가'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{tabConfig?.label}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/70 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 모달 본문: 입력 필드들 */}
        <div className="px-6 py-5 space-y-4">
          {/* 오류 메시지 표시 영역 */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              <AlertTriangle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          {/* 국문명 / 영문명 (2열 나란히 배치) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                국문명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nameKo}
                onChange={(e) => handleChange('nameKo', e.target.value)}
                placeholder="예: 스킨케어"
                className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition-all`}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                영문명
              </label>
              <input
                type="text"
                value={form.nameEn}
                onChange={(e) => handleChange('nameEn', e.target.value)}
                placeholder="예: Skin Care"
                className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition-all`}
              />
            </div>
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              설명
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="이 항목에 대한 상세 설명을 입력하세요 (선택사항)"
              rows={3}
              className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition-all resize-none`}
            />
          </div>

          {/* 정렬순서 / 활성여부 (2열 배치) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                정렬순서
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => handleChange('sortOrder', e.target.value)}
                min={0}
                className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition-all`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                활성 여부
              </label>
              <button
                type="button"
                onClick={() => handleChange('isActive', !form.isActive)}
                className={`w-full px-3 py-2 text-sm border rounded-lg flex items-center gap-2 font-medium transition-all ${
                  form.isActive
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                    form.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
                {form.isActive ? '활성' : '비활성'}
              </button>
            </div>
          </div>
        </div>

        {/* 모달 하단 버튼 */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg border border-slate-200 transition-all"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all ${theme.btn} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {saving ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {saving ? '저장 중...' : isEdit ? '수정 저장' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 삭제 확인 모달 컴포넌트
// ─────────────────────────────────────────────
function DeleteConfirmModal({ isOpen, onClose, onConfirm, itemName }) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-6 py-5 text-center">
          {/* 경고 아이콘 */}
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <Trash2 size={22} className="text-red-500" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">항목 삭제</h3>
          <p className="text-sm text-slate-500 mb-1">아래 항목을 삭제할까요?</p>
          <p className="text-sm font-semibold text-slate-700 bg-slate-50 rounded-lg px-3 py-2 mt-2">
            {itemName}
          </p>
          <p className="text-xs text-red-500 mt-2">삭제 후에는 복구할 수 없습니다.</p>
        </div>
        <div className="px-6 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {deleting ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 토스트 알림 컴포넌트 (성공/실패 메시지 표시)
// ─────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000); // 3초 후 자동 닫힘
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all animate-fade-in ${
        type === 'success'
          ? 'bg-emerald-600 text-white'
          : 'bg-red-500 text-white'
      }`}
    >
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      {message}
    </div>
  );
}

// ─────────────────────────────────────────────
// 개별 탭 내용: 데이터 테이블 + CRUD 조작
// ─────────────────────────────────────────────
function TabContent({ tabConfig }) {
  const store = useMasterDataStore();
  const data = store[tabConfig.stateKey] || [];         // 이 탭의 데이터 목록
  const isLoading = store.isLoading;
  const theme = COLOR_THEME[tabConfig.color];

  // 모달 표시 상태 관리
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);       // null이면 추가, 값이 있으면 수정
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });

  // 토스트 알림 상태
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // [+ 추가] 버튼 클릭 → 추가 모달 열기
  const handleAdd = () => {
    setEditItem(null);
    setModalOpen(true);
  };

  // [수정] 버튼 클릭 → 수정 모달 열기
  const handleEdit = (item) => {
    setEditItem(item);
    setModalOpen(true);
  };

  // 모달에서 저장 클릭 → 추가 또는 수정 실행
  const handleSave = async (formData, itemId) => {
    if (itemId) {
      // 수정 모드
      const result = await store[tabConfig.updateAction](itemId, formData);
      if (result?.success) showToast('항목이 수정되었습니다.');
      else showToast(result?.message || '수정 실패', 'error');
      return result;
    } else {
      // 추가 모드
      const result = await store[tabConfig.addAction](formData);
      if (result?.success) showToast('새 항목이 추가되었습니다.');
      else showToast(result?.message || '추가 실패', 'error');
      return result;
    }
  };

  // [삭제] 버튼 클릭 → 삭제 확인 모달 열기
  const handleDeleteClick = (item) => {
    setDeleteModal({ open: true, item });
  };

  // 삭제 확인 모달에서 확인 클릭 → 실제 삭제 실행
  const handleDeleteConfirm = async () => {
    if (!deleteModal.item) return;
    const result = await store[tabConfig.deleteAction](deleteModal.item.id);
    if (result?.success) showToast('항목이 삭제되었습니다.');
    else showToast(result?.message || '삭제 실패', 'error');
  };

  return (
    <div className="space-y-4">
      {/* 탭 상단 바: 설명 + [+ 추가] 버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${theme.badge}`}>
            총 {data.length}개 항목
          </span>
          <span className="text-xs text-slate-400">{tabConfig.description}</span>
        </div>
        <button
          onClick={handleAdd}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all shadow-sm hover:shadow-md ${theme.btn}`}
        >
          <Plus size={15} />
          추가
        </button>
      </div>

      {/* 데이터 테이블 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          // 로딩 중 스피너
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={22} className={`animate-spin ${theme.icon}`} />
            <span className="ml-2 text-sm text-slate-400">데이터를 불러오는 중...</span>
          </div>
        ) : data.length === 0 ? (
          // 데이터가 없을 때 빈 화면
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${theme.headerBg} flex items-center justify-center mb-3`}>
              <Database size={22} className={theme.icon} />
            </div>
            <p className="text-sm font-medium text-slate-600">등록된 항목이 없습니다</p>
            <p className="text-xs text-slate-400 mt-1">[추가] 버튼으로 첫 번째 항목을 등록해 보세요.</p>
          </div>
        ) : (
          // 실제 테이블
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-12">순서</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-48">국문명</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-48">영문명</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">설명</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 w-16">상태</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 w-24">관리</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group"
                  >
                    {/* 정렬순서 */}
                    <td className="px-4 py-3 text-center text-xs font-mono text-slate-400">
                      {item.sortOrder}
                    </td>
                    {/* 국문명 */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.dot}`} />
                        <span className="font-medium text-slate-800">{item.nameKo}</span>
                      </div>
                    </td>
                    {/* 영문명 */}
                    <td className="px-4 py-3 text-slate-500 font-medium">
                      {item.nameEn || <span className="text-slate-300 text-xs italic">미입력</span>}
                    </td>
                    {/* 설명 */}
                    <td className="px-4 py-3 text-slate-400 text-xs max-w-xs">
                      <span className="line-clamp-2">
                        {item.description || <span className="text-slate-300 italic">—</span>}
                      </span>
                    </td>
                    {/* 활성/비활성 뱃지 */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          item.isActive
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        {item.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    {/* 수정/삭제 버튼 */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          title="수정"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="삭제"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 추가/수정 모달 */}
      <MasterDataModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editItem={editItem}
        tabConfig={tabConfig}
      />

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, item: null })}
        onConfirm={handleDeleteConfirm}
        itemName={deleteModal.item?.nameKo || ''}
      />

      {/* 토스트 알림 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 메인 페이지 컴포넌트
// ─────────────────────────────────────────────
export default function MasterDataManagement() {
  const [activeTab, setActiveTab] = useState(0); // 현재 선택된 탭 인덱스
  const { fetchAllMasterData, isLoading } = useMasterDataStore();

  // 페이지 진입 시 전체 마스터 데이터 로드
  useEffect(() => {
    fetchAllMasterData();
  }, [fetchAllMasterData]);

  const currentTab = TAB_CONFIG[activeTab];

  return (
    <div className="min-h-full space-y-6">
      {/* ── 페이지 헤더 ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* 아이콘 배지 */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-md">
            <Database size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">기준관리 MDM</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Master Data Management — 국문/영문 기준정보 표준 관리
            </p>
          </div>
        </div>

        {/* 전체 새로고침 버튼 */}
        <button
          onClick={fetchAllMasterData}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          새로고침
        </button>
      </div>

      {/* ── 5개 탭 버튼 ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {TAB_CONFIG.map((tab, idx) => {
            const isActive = activeTab === idx;
            const theme = COLOR_THEME[tab.color];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(idx)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? `${theme.tab} border-b-2`
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {/* 활성 탭 번호 뱃지 */}
                <span
                  className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                    isActive ? theme.badge : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {idx + 1}
                </span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 탭 내용 */}
        <div className="p-5">
          <TabContent key={currentTab.id} tabConfig={currentTab} />
        </div>
      </div>

      {/* ── 연동 안내 카드 ── */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 mt-0.5">
            <Database size={14} className="text-slate-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">
              📌 EPR 생산실적보고 연동 안내
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              여기서 관리하는 기준정보(포장재 분류, 재활용 등급, 분리배출 표시)는{' '}
              <strong>포장재 마스터 관리</strong> 및 <strong>EPR 실적신고</strong> 화면에서
              드롭다운 기준값으로 연동될 예정입니다. 먼저 이 화면에서 국문/영문 기준정보를 완성해 두세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
