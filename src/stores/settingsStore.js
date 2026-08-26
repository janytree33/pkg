/**
 * settingsStore.js
 * ─────────────────────────────────────
 * 기준관리 & 계정 관리 스토어
 * 영문 직인(stampEn) 항목 추가 완료!
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId, DEFAULT_EPR_SITES, DEFAULT_PART_TYPES } from '../utils/constants';
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
        ceoNameEn: '',    // 💡 [추가] 대표자 영문명
        logo: null,       // Supabase Storage Public URL
        stamp: null,      // 국문 직인 URL
        stampEn: null,    // 💡 [추가] 영문 직인 URL
      },

      // ─── 회사 로고/직인 스토리지 업로드 ───
      uploadCompanyImage: async (file, type) => {
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${type}_${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('company_assets')
            .upload(fileName, file, { upsert: true });

          if (uploadError) {
            console.error("스토리지 업로드 에러:", uploadError);
            throw uploadError;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('company_assets')
            .getPublicUrl(fileName);

          // 💡 영문 직인(stampEn) 대응 로직 반영
          if (type === 'logo') {
            await get().updateCompanyInfo({ logo: publicUrl });
          } else if (type === 'stamp') {
            await get().updateCompanyInfo({ stamp: publicUrl });
          } else if (type === 'stampEn') {
            await get().updateCompanyInfo({ stampEn: publicUrl });
          }

          return publicUrl;
        } catch (error) {
          console.error("이미지 처리 중 에러 발생:", error);
          alert("이미지 업로드 중 오류가 발생했습니다.");
          return null;
        }
      },

      // ─── EPR 관련 사이트 계정 ───
      eprAccounts: DEFAULT_EPR_SITES.map((site) => ({
        id: generateId(),
        ...site,
        loginId: '',
        password: '',
      })),

      // ─── 포장형태 관리 (DB 연동) ───
      packagingTypes: [],

      
      addPackagingType: async (name, nameEn) => {
        const payload = { name, name_en: nameEn };
        const { data, error } = await supabase.from('packaging_types').insert([payload]).select().single();
        if (data) {
          set((state) => ({ packagingTypes: [...state.packagingTypes, { id: data.id, name: data.name, nameEn: data.name_en, createdAt: data.created_at }] }));
        }
      },
      
      updatePackagingType: async (id, name, nameEn) => {
        const payload = { name, name_en: nameEn, updated_at: new Date().toISOString() };
        const { error } = await supabase.from('packaging_types').update(payload).eq('id', id);
        if (!error) {
          set((state) => ({
            packagingTypes: state.packagingTypes.map(pt => pt.id === id ? { ...pt, name, nameEn } : pt)
          }));
        }
      },
      
      deletePackagingType: async (id) => {
        const { error } = await supabase.from('packaging_types').delete().eq('id', id);
        if (!error) {
          set((state) => ({ packagingTypes: state.packagingTypes.filter(pt => pt.id !== id) }));
        }
      },

      // ─── 테마 (라이트/다크) ───
      theme: 'light',

      // ─── 데이터베이스 연동 상태 ───
      isLoaded: false,

      // ─── 데이터 초기 로드 (Supabase) ───
      fetchData: async () => {
        try {
          const { data: companyData } = await supabase
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
              ceoNameEn: companyData.ceo_name_en || '',
              addressKo: companyData.address_ko,
              addressEn: companyData.address_en,
              phone: companyData.phone,
              fax: companyData.fax,
              email: companyData.email,
              logo: companyData.logo,
              stamp: companyData.stamp,
              stampEn: companyData.stamp_en || null, // 💡 [추가] 영문 직인 불러오기
            } });
          }

          const { data: accountsData } = await supabase
            .from('accounts')
            .select('*');

          const { data: typesData } = await supabase
            .from('packaging_types')
            .select('*')
            .order('created_at', { ascending: true });

          if (typesData) {
            set({ packagingTypes: typesData.map(t => ({
              id: t.id,
              name: t.name,
              nameEn: t.name_en,
              createdAt: t.created_at
            })) });
          }

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
        set((state) => ({
          companyInfo: { ...state.companyInfo, ...updates },
        }));

        const { companyInfo } = get();
        const payload = {
          name_ko: companyInfo.nameKo,
          name_en: companyInfo.nameEn,
          business_no: companyInfo.businessNo,
          ceo_name: companyInfo.ceoName,
          ceo_name_en: companyInfo.ceoNameEn,
          address_ko: companyInfo.addressKo,
          address_en: companyInfo.addressEn,
          phone: companyInfo.phone,
          fax: companyInfo.fax,
          email: companyInfo.email,
          logo: companyInfo.logo,
          stamp: companyInfo.stamp,
          stamp_en: companyInfo.stampEn, // 💡 [추가] DB에 영문 직인 필드 저장
          updated_at: new Date().toISOString()
        };

        if (companyInfo.id) {
          const { error } = await supabase.from('company_info').update(payload).eq('id', companyInfo.id);
          if (error) {
            console.error("Update Error:", error);
            alert("저장 중 오류가 발생했습니다: " + error.message);
          } else {
            alert("회사 정보가 성공적으로 저장되었습니다.");
          }
        } else {
          const { data, error } = await supabase.from('company_info').insert([payload]).select().single();
          if (error) {
            console.error("Insert Error:", error);
            alert("저장 중 오류가 발생했습니다: " + (error.message || JSON.stringify(error)));
          }
          if (data) {
            set((state) => ({ companyInfo: { ...state.companyInfo, id: data.id } }));
            alert("회사 정보가 성공적으로 저장되었습니다.");
          }
        }
      },

      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { theme: newTheme };
        });
      },

      initTheme: () => {
        const { theme } = get();
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

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

      deleteEprAccount: async (id) => {
        set((state) => ({
          eprAccounts: state.eprAccounts.filter((a) => a.id !== id),
        }));
        await supabase.from('accounts').delete().eq('id', id);
      },

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