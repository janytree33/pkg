/**
 * settingsStore.js
 * ─────────────────────────────────────
 * 기준관리 & 계정 관리 스토어
 * 회사 정보, EPR 사이트 계정, 테마 설정 관리
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId, DEFAULT_EPR_SITES } from '../utils/constants';
import { encrypt, decrypt } from '../utils/encryption';
import { supabase } from '../lib/supabase';

const useSettingsStore = create(
  persist(
    (set, get) => ({
      // ─── 회사 정보 ───
      companyInfo: {
        nameKo: '주식회사 제니트리',
        nameEn: 'Janytree Inc.',
        businessNo: '',
        addressKo: '서울시 금천구 가산디지털2로 67, 1403호, 2001호, B105호 (에이스하이엔드타워 7차)',
        addressEn: '#1403, #2001, Ace High-end Tower, 67, Gasan digital 2-ro, Geumcheon-gu, Seoul, Republic of Korea.',
        phone: '82-2-868-1921',
        fax: '02.868.1920',
        email: 'global@janytree.com',
        ceoName: '',
        logo: null,    // Base64 이미지 데이터
        stamp: null,   // Base64 이미지 데이터
      },

      // ─── EPR 관련 사이트 계정 ───
      eprAccounts: DEFAULT_EPR_SITES.map((site) => ({
        id: generateId(),
        ...site,
        loginId: '',
        password: '',  // AES 암호화된 상태로 저장
      })),

      // ─── 테마 (라이트/다크) ───
      theme: 'light',

      // ─── 데이터베이스 연동 상태 ───
      isLoaded: false,

      // ─── 데이터 초기 로드 (Supabase) ───
      fetchData: async () => {
        try {
          // 회사 정보 로드 (단일 로우 가정)
          const { data: companyData, error: companyError } = await supabase
            .from('company_info')
            .select('*')
            .limit(1)
            .maybeSingle();
            
          if (companyData) {
            set({ companyInfo: {
              id: companyData.id,
              nameKo: companyData.name_ko,
              nameEn: companyData.name_en,
              businessNo: companyData.business_no,
              ceoName: companyData.ceo_name,
              addressKo: companyData.address_ko,
              addressEn: companyData.address_en,
              phone: companyData.phone,
              fax: companyData.fax,
              email: companyData.email,
              logo: companyData.logo,
              stamp: companyData.stamp,
            } });
          }

          // 연동 계정 로드
          const { data: accountsData } = await supabase
            .from('accounts')
            .select('*');

          if (accountsData && accountsData.length > 0) {
            set({ eprAccounts: accountsData.map(a => ({
              id: a.id,
              name: a.site_name,
              url: a.site_url,
              type: a.type,
              loginId: a.username,
              password: a.password,
              description: a.notes,
            })) });
          }

          set({ isLoaded: true });
        } catch (error) {
          console.error("Supabase 로드 에러:", error);
        }
      },

      // ─── 회사 정보 업데이트 (Supabase 동기화) ───
      updateCompanyInfo: async (updates) => {
        // 로컬 상태 즉시 업데이트 (Optimistic Update)
        set((state) => ({
          companyInfo: { ...state.companyInfo, ...updates },
        }));

        const { companyInfo } = get();
        const payload = {
          name_ko: companyInfo.nameKo,
          name_en: companyInfo.nameEn,
          business_no: companyInfo.businessNo,
          ceo_name: companyInfo.ceoName,
          address_ko: companyInfo.addressKo,
          address_en: companyInfo.addressEn,
          phone: companyInfo.phone,
          fax: companyInfo.fax,
          email: companyInfo.email,
          logo: companyInfo.logo,
          stamp: companyInfo.stamp,
          updated_at: new Date().toISOString()
        };

        if (companyInfo.id) {
          // 기존 정보 수정
          await supabase.from('company_info').update(payload).eq('id', companyInfo.id);
        } else {
          // 새 정보 등록
          const { data } = await supabase.from('company_info').insert([payload]).select().single();
          if (data) {
            set((state) => ({ companyInfo: { ...state.companyInfo, id: data.id } }));
          }
        }
      },

      // ─── 테마 토글 ───
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          // HTML에 dark 클래스 적용
          if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { theme: newTheme };
        });
      },

      // ─── 테마 초기화 (앱 로드 시) ───
      initTheme: () => {
        const { theme } = get();
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      // ─── 계정 추가 (Supabase 동기화) ───
      addEprAccount: async (account) => {
        const encryptedPassword = account.password ? encrypt(account.password) : '';
        const payload = {
          type: account.type || 'EPR',
          site_name: account.name,
          site_url: account.url,
          username: account.loginId || '',
          password: encryptedPassword,
          notes: account.description || ''
        };

        const { data } = await supabase.from('accounts').insert([payload]).select().single();

        if (data) {
          const newAccount = {
            id: data.id,
            ...account,
            password: encryptedPassword,
          };
          set((state) => ({
            eprAccounts: [...state.eprAccounts, newAccount],
          }));
        }
      },

      // ─── 계정 수정 (Supabase 동기화) ───
      updateEprAccount: async (id, updates) => {
        let encryptedPassword = updates.password;
        
        set((state) => ({
          eprAccounts: state.eprAccounts.map((a) => {
            if (a.id !== id) return a;
            const updated = { ...a, ...updates };
            if (updates.password !== undefined && updates.password !== a.password) {
              encryptedPassword = encrypt(updates.password);
              updated.password = encryptedPassword;
            } else {
              encryptedPassword = a.password;
            }
            return updated;
          }),
        }));

        const account = get().eprAccounts.find(a => a.id === id);
        if (account) {
          await supabase.from('accounts').update({
            site_name: account.name,
            site_url: account.url,
            username: account.loginId,
            password: account.password,
            notes: account.description,
            updated_at: new Date().toISOString()
          }).eq('id', id);
        }
      },

      // ─── 계정 삭제 (Supabase 동기화) ───
      deleteEprAccount: async (id) => {
        set((state) => ({
          eprAccounts: state.eprAccounts.filter((a) => a.id !== id),
        }));
        await supabase.from('accounts').delete().eq('id', id);
      },

      // ─── 비밀번호 복호화 조회 ───
      getDecryptedPassword: (id) => {
        const account = get().eprAccounts.find((a) => a.id === id);
        if (!account) return '';
        return decrypt(account.password);
      },
    }),
    {
      name: 'janytree-settings-store',
    }
  )
);

export default useSettingsStore;
