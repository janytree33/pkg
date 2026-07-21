/**
 * documentStore.js
 * ─────────────────────────────────────
 * 문서(사양서) 발행 데이터 관리 스토어
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../utils/constants';

const useDocumentStore = create(
  persist(
    (set, get) => ({
      // ─── 발행된 문서 목록 ───
      documents: [],

      // ─── 문서 발행 ───
      addDocument: (doc) => {
        const newDoc = {
          id: generateId(),
          ...doc,
          status: 'issued',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          documents: [...state.documents, newDoc],
        }));
        return newDoc;
      },

      // ─── 문서 수정 ───
      updateDocument: (id, updates) => {
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }));
      },

      // ─── 문서 삭제 ───
      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        }));
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
