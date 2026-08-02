/**
 * Settings.jsx
 * ─────────────────────────────────────
 * 기준 및 계정관리 메인 페이지
 * 회사 정보 설정, EPR 면제조건 안내, EPR 사이트 계정 관리, 포장형태 관리
 */
import { useState } from 'react';
import { Building2, Shield, KeyRound, PackageSearch, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import CompanyInfoForm from '../components/settings/CompanyInfoForm';
import AccountManagementTable from '../components/settings/AccountManagementTable';
import EprExemptionPanel from '../components/settings/EprExemptionPanel';
import PageBanner from '../components/common/PageBanner';
import useSettingsStore from '../stores/settingsStore';

// ─── 포장형태 관리를 위한 미니 화면 컴포넌트 ───
function PackagingTypeManagement() {
  const { packagingTypes, addPackagingType, updatePackagingType, deletePackagingType } = useSettingsStore();
  
  const [newValue, setNewValue] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = () => {
    if (!newValue.trim()) return;
    addPackagingType(newValue.trim());
    setNewValue('');
  };

  const handleEditStart = (type) => {
    setEditingId(type.id);
    setEditValue(type.name);
  };

  const handleEditSave = (id) => {
    if (!editValue.trim()) return;
    updatePackagingType(id, editValue.trim());
    setEditingId(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  // 🚨 [추가된 부분] 삭제 전 확인 팝업 띄우기
  const handleDelete = (id, name) => {
    if (window.confirm(`'${name}' 항목을 정말 삭제하시겠습니까?\n(이미 사용 중인 포장형태인 경우 문제가 발생할 수 있습니다.)`)) {
      deletePackagingType(id);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 animate-fade-in">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">포장형태 관리</h3>
        <p className="text-sm text-slate-500">
          제품 등록 시 사용할 포장형태(부자재)의 종류를 관리합니다. (예: 용기, 캡/뚜껑, 단상자 등)
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <input 
          type="text"
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          placeholder="새로운 포장형태 입력"
          className="flex-1 px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button 
          onClick={handleAdd}
          className="flex items-center gap-1 bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700 transition"
        >
          <Plus size={16} />
          추가
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">포장형태명</th>
              <th className="px-4 py-3 font-medium text-right w-32">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {packagingTypes?.map((type) => (
              <tr key={type.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                  {editingId === type.id ? (
                    <input 
                      type="text"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="w-full px-2 py-1 border rounded dark:bg-slate-900 dark:border-slate-600"
                      onKeyDown={(e) => e.key === 'Enter' && handleEditSave(type.id)}
                      autoFocus
                    />
                  ) : (
                    type.name
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingId === type.id ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEditSave(type.id)} className="text-green-600 hover:text-green-700 p-1 bg-green-50 rounded dark:bg-green-900/30">
                        <Check size={16} />
                      </button>
                      <button onClick={handleEditCancel} className="text-slate-500 hover:text-slate-700 p-1 bg-slate-100 rounded dark:bg-slate-700">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEditStart(type)} className="text-slate-400 hover:text-brand-500 p-1 transition">
                        <Edit2 size={16} />
                      </button>
                      {/* 🚨 [추가된 부분] 삭제 버튼 클릭 시 handleDelete 함수 실행 */}
                      <button onClick={() => handleDelete(type.id, type.name)} className="text-slate-400 hover:text-red-500 p-1 transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {(!packagingTypes || packagingTypes.length === 0) && (
              <tr>
                <td colSpan="2" className="px-4 py-8 text-center text-slate-500">
                  등록된 포장형태가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 전체 메인 설정 페이지 ───
export default function Settings() {
  const [activeSection, setActiveSection] = useState('company');

  const sections = [
    { id: 'company', label: '회사 정보 설정', icon: Building2 },
    { id: 'exemption', label: 'EPR 면제조건 및 안내', icon: Shield },
    { id: 'accounts', label: 'EPR 사이트 계정 관리', icon: KeyRound },
    { id: 'packaging', label: '포장형태 관리', icon: PackageSearch },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <PageBanner 
        title="기준 및 계정관리" 
        description="회사 기본 정보와 EPR 신고용 접속 계정을 관리합니다."
      />

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700  dark:hover:text-slate-300'
              }`}
            >
              <Icon size={16} />
              {section.label}
            </button>
          );
        })}
      </div>

      <div className="animate-fade-in">
        {activeSection === 'company' && <CompanyInfoForm />}
        {activeSection === 'exemption' && <EprExemptionPanel />}
        {activeSection === 'accounts' && <AccountManagementTable />}
        {activeSection === 'packaging' && <PackagingTypeManagement />}
      </div>
    </div>
  );
}