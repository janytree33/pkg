/**
 * eprStore.js
 * ─────────────────────────────────────
 * EPR 실적신고 데이터 관리 스토어
 * 생산실적 업로드, 제품 매핑, 신고 취합 결과 관리
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../utils/constants';
import { supabase } from '../lib/supabase';

const useEprStore = create(
  persist(
    (set, get) => ({
      // ─── 업로드된 생산실적 데이터 ───
      productionReports: [],

      // ─── EPR 신고 취합 결과 ───
      eprSubmissions: [],

      // ─── 데이터 초기 로드 (Supabase) ───
      fetchData: async () => {
        const { data } = await supabase.from('epr_reports').select('*');
        if (data) {
          set({ eprSubmissions: data.map(r => ({
            id: r.id,
            reportYear: r.report_year,
            fileName: r.file_name,
            fileUrl: r.file_url,
            status: r.status,
            uploadedBy: r.uploaded_by,
            createdAt: r.created_at
          })) });
        }
      },

      // ─── 생산실적 보고서 추가 ───
      addProductionReport: (report) => {
        const newReport = {
          id: generateId(),
          ...report,
          uploadDate: new Date().toISOString(),
          mappingStatus: 'pending', // pending, partial, complete
        };
        set((state) => ({
          productionReports: [...state.productionReports, newReport],
        }));
        return newReport;
      },

      // ─── 생산실적 보고서 업데이트 ───
      updateProductionReport: (id, updates) => {
        set((state) => ({
          productionReports: state.productionReports.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        }));
      },

      // ─── 생산실적 보고서 삭제 ───
      deleteProductionReport: (id) => {
        set((state) => ({
          productionReports: state.productionReports.filter((r) => r.id !== id),
        }));
      },

      // ─── EPR 신고 제출 기록 추가 (Supabase 동기화) ───
      addEprSubmission: async (submission) => {
        const payload = {
          report_year: submission.reportYear,
          file_name: submission.fileName || '',
          file_url: submission.fileUrl || '',
          status: submission.status || 'pending',
          uploaded_by: submission.uploadedBy || ''
        };
        const { data } = await supabase.from('epr_reports').insert([payload]).select().single();

        if (data) {
          const newSubmission = {
            id: data.id,
            ...submission,
            createdAt: data.created_at,
          };
          set((state) => ({
            eprSubmissions: [...state.eprSubmissions, newSubmission],
          }));
          return newSubmission;
        }
        return null;
      },

      // ─── EPR 신고 제출 기록 삭제 (Supabase 동기화) ───
      deleteEprSubmission: async (id) => {
        set((state) => ({
          eprSubmissions: state.eprSubmissions.filter((s) => s.id !== id),
        }));
        await supabase.from('epr_reports').delete().eq('id', id);
      },
    }),
    {
      name: 'janytree-epr-store',
    }
  )
);

export default useEprStore;
