/**
 * eprStore.js
 * ─────────────────────────────────────
 * EPR 실적신고 데이터 관리 스토어
 * 생산실적 업로드, 제품 매핑, 신고 취합 결과 관리
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../utils/constants';

const useEprStore = create(
  persist(
    (set, get) => ({
      // ─── 업로드된 생산실적 데이터 ───
      productionReports: [],

      // ─── EPR 신고 취합 결과 ───
      eprSubmissions: [],

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

      // ─── EPR 신고 제출 기록 추가 ───
      addEprSubmission: (submission) => {
        const newSubmission = {
          id: generateId(),
          ...submission,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          eprSubmissions: [...state.eprSubmissions, newSubmission],
        }));
        return newSubmission;
      },

      // ─── EPR 신고 제출 기록 삭제 ───
      deleteEprSubmission: (id) => {
        set((state) => ({
          eprSubmissions: state.eprSubmissions.filter((s) => s.id !== id),
        }));
      },
    }),
    {
      name: 'janytree-epr-store',
    }
  )
);

export default useEprStore;
