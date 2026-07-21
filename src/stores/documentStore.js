/**
 * documentStore.js
 * ─────────────────────────────────────
 * 문서(사양서) 발행 데이터 관리 스토어
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../utils/constants';
import { supabase } from '../lib/supabase';

const useDocumentStore = create(
  persist(
    (set, get) => ({
      // ─── 발행된 문서 목록 ───
      documents: [],
      
      // ─── 데이터 초기 로드 (Supabase) ───
      fetchData: async () => {
        const { data } = await supabase.from('documents').select('*');
        if (data) {
          set({ documents: data.map(d => ({
            id: d.id,
            docNo: d.doc_no,
            type: d.type,
            productId: d.product_id,
            versionId: d.version_id,
            issueDate: d.issue_date,
            issuer: d.issuer,
            fileUrl: d.file_url,
            status: 'issued',
            createdAt: d.created_at
          })) });
        }
      },

      // ─── 문서 발행 (Supabase 동기화) ───
      addDocument: async (doc) => {
        const payload = {
          doc_no: doc.docNo,
          type: doc.type,
          product_id: doc.productId,
          version_id: doc.versionId,
          issue_date: doc.issueDate,
          issuer: doc.issuer,
          file_url: doc.fileUrl || ''
        };

        const { data } = await supabase.from('documents').insert([payload]).select().single();
        
        if (data) {
          const newDoc = {
            id: data.id,
            ...doc,
            status: 'issued',
            createdAt: data.created_at,
          };
          set((state) => ({
            documents: [...state.documents, newDoc],
          }));
          return newDoc;
        }
        return null;
      },

      // ─── 문서 수정 ───
      updateDocument: (id, updates) => {
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }));
      },

      // ─── 문서 삭제 (Supabase 동기화) ───
      deleteDocument: async (id) => {
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        }));
        await supabase.from('documents').delete().eq('id', id);
      },

      // ─── 특정 완제품의 문서 조회 ───
      getDocumentsForProduct: (productId) => {
        return get().documents.filter((d) => d.productId === productId);
      },
    }),
    {
      name: 'janytree-document-store',
    }
  )
);

export default useDocumentStore;
