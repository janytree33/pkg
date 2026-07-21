/**
 * Settings.jsx
 * ─────────────────────────────────────
 * 기준 및 계정관리 메인 페이지
 * 회사 정보 설정, EPR 면제조건 안내, EPR 사이트 계정 관리
 */
import { useState } from 'react';
import { Building2, Shield, KeyRound } from 'lucide-react';
import CompanyInfoForm from '../components/settings/CompanyInfoForm';
import AccountManagementTable from '../components/settings/AccountManagementTable';
import EprExemptionPanel from '../components/settings/EprExemptionPanel';
import PageBanner from '../components/common/PageBanner';

export default function Settings() {
  // 현재 활성화된 섹션 탭
  const [activeSection, setActiveSection] = useState('company');

  // 섹션 메뉴 정의
  const sections = [
    { id: 'company', label: '회사 정보 설정', icon: Building2 },
    { id: 'exemption', label: 'EPR 면제조건 및 안내', icon: Shield },
    { id: 'accounts', label: 'EPR 사이트 계정 관리', icon: KeyRound },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <PageBanner 
        title="기준 및 계정관리" 
        description="회사 기본 정보와 EPR 신고용 접속 계정을 관리합니다."
      />

      {/* 섹션 탭 */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                isActive
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={16} />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* 섹션 내용 */}
      <div className="animate-fade-in">
        {activeSection === 'company' && <CompanyInfoForm />}
        {activeSection === 'exemption' && <EprExemptionPanel />}
        {activeSection === 'accounts' && <AccountManagementTable />}
      </div>
    </div>
  );
}
