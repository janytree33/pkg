/**
 * AccountManagementTable.jsx
 * ─────────────────────────────────────
 * EPR 관련 사이트 계정 관리 테이블
 * 비밀번호는 AES 암호화되어 localStorage에 저장됩니다
 */
import { useState } from 'react';
import { Plus, Copy, ExternalLink, Eye, EyeOff, Trash2, Edit2, Check, X, KeyRound } from 'lucide-react';
import useSettingsStore from '../../stores/settingsStore';

export default function AccountManagementTable() {
  const { eprAccounts, addEprAccount, updateEprAccount, deleteEprAccount, getDecryptedPassword } = useSettingsStore();

  // 편집 중인 계정 ID
  const [editingId, setEditingId] = useState(null);
  // 편집 폼 데이터
  const [editForm, setEditForm] = useState({});
  // 비밀번호 표시 여부 (계정 ID별)
  const [showPassword, setShowPassword] = useState({});
  // 새 계정 추가 모드
  const [isAdding, setIsAdding] = useState(false);
  // 새 계정 폼
  const [newForm, setNewForm] = useState({
    siteName: '', url: '', loginId: '', password: '', notes: '',
  });
  // 복사 완료 알림
  const [copiedField, setCopiedField] = useState(null);

  // 클립보드 복사
  const copyToClipboard = (text, fieldId) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // 비밀번호 토글
  const togglePasswordVisibility = (id) => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 편집 시작
  const startEditing = (account) => {
    setEditingId(account.id);
    setEditForm({
      ...account,
      password: getDecryptedPassword(account.id),
    });
  };

  // 편집 저장
  const saveEdit = () => {
    updateEprAccount(editingId, editForm);
    setEditingId(null);
    setEditForm({});
  };

  // 편집 취소
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // 새 계정 저장
  const saveNew = () => {
    if (!newForm.siteName) return;
    addEprAccount(newForm);
    setNewForm({ siteName: '', url: '', loginId: '', password: '', notes: '' });
    setIsAdding(false);
  };

  // 삭제
  const handleDelete = (id) => {
    if (window.confirm('이 계정 정보를 삭제하시겠습니까?')) {
      deleteEprAccount(id);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound size={20} className="text-brand-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            EPR 관련 사이트 계정
          </h3>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white 
                     bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
        >
          <Plus size={14} />
          계정 추가
        </button>
      </div>

      {/* 보안 안내 */}
      <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800 
                      rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300">
        🔒 비밀번호는 AES 암호화되어 브라우저에 저장됩니다. 공용 PC에서는 사용에 주의하세요.
      </div>

      {/* 계정 테이블 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">사이트명</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">URL</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">로그인 ID</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">비밀번호</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">비고</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 w-24">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {eprAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  {editingId === account.id ? (
                    /* 편집 모드 */
                    <>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.siteName || ''}
                          onChange={(e) => setEditForm({ ...editForm, siteName: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.url || ''}
                          onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.loginId || ''}
                          onChange={(e) => setEditForm({ ...editForm, loginId: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editForm.password || ''}
                          onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.notes || ''}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded">
                            <Check size={14} />
                          </button>
                          <button onClick={cancelEdit} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    /* 보기 모드 */
                    <>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {account.siteName}
                      </td>
                      <td className="px-4 py-3">
                        {account.url ? (
                          <div className="flex items-center gap-1">
                            <a
                              href={account.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-600 dark:text-brand-400 hover:underline truncate max-w-[200px]"
                            >
                              {account.url.replace(/^https?:\/\//, '')}
                            </a>
                            <button
                              onClick={() => copyToClipboard(account.url, `url-${account.id}`)}
                              className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              title="URL 복사"
                            >
                              {copiedField === `url-${account.id}` ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                            </button>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {account.loginId ? (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-700 dark:text-slate-300">{account.loginId}</span>
                            <button
                              onClick={() => copyToClipboard(account.loginId, `id-${account.id}`)}
                              className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              title="ID 복사"
                            >
                              {copiedField === `id-${account.id}` ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">미입력</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {account.password ? (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-700 dark:text-slate-300 font-mono text-xs">
                              {showPassword[account.id] ? getDecryptedPassword(account.id) : '••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(account.id)}
                              className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              title={showPassword[account.id] ? '숨기기' : '보기'}
                            >
                              {showPassword[account.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(getDecryptedPassword(account.id), `pw-${account.id}`)}
                              className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              title="비밀번호 복사"
                            >
                              {copiedField === `pw-${account.id}` ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">미입력</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                        {account.notes || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => startEditing(account)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded transition-colors"
                            title="수정"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(account.id)}
                            className="p-1.5 text-slate-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="삭제"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {/* 새 계정 추가 행 */}
              {isAdding && (
                <tr className="bg-brand-50/30 dark:bg-brand-900/10">
                  <td className="px-4 py-2">
                    <input
                      value={newForm.siteName}
                      onChange={(e) => setNewForm({ ...newForm, siteName: e.target.value })}
                      placeholder="사이트명"
                      className="w-full px-2 py-1 border rounded text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={newForm.url}
                      onChange={(e) => setNewForm({ ...newForm, url: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-2 py-1 border rounded text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={newForm.loginId}
                      onChange={(e) => setNewForm({ ...newForm, loginId: e.target.value })}
                      placeholder="ID"
                      className="w-full px-2 py-1 border rounded text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={newForm.password}
                      onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
                      placeholder="비밀번호"
                      type="text"
                      className="w-full px-2 py-1 border rounded text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={newForm.notes}
                      onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                      placeholder="비고"
                      className="w-full px-2 py-1 border rounded text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={saveNew} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setIsAdding(false)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
