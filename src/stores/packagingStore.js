/**
 * packagingStore.js
 * ─────────────────────────────────────
 * 포장재 & 완제품 데이터 관리 스토어
 * 포장재 코드, 완제품 코드, BOM(부품표) 데이터를 관리합니다
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../utils/constants';

const usePackagingStore = create(
  persist(
    (set, get) => ({
      // ─── 포장재 목록 ───
      packagingComponents: [],

      // ─── 완제품 목록 ───
      finishedProducts: [],

      // ─── 현재 선택된 완제품 ID ───
      selectedProductId: null,

      // ─── 포장재 등록 ───
      addPackagingComponent: (component) => {
        const newComponent = {
          id: generateId(),
          ...component,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          packagingComponents: [...state.packagingComponents, newComponent],
        }));
        return newComponent;
      },

      // ─── 포장재 수정 ───
      updatePackagingComponent: (id, updates) => {
        set((state) => ({
          packagingComponents: state.packagingComponents.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      // ─── 포장재 삭제 ───
      deletePackagingComponent: (id) => {
        set((state) => ({
          packagingComponents: state.packagingComponents.filter((c) => c.id !== id),
        }));
      },

      // ─── 완제품 등록 ───
      addFinishedProduct: (product) => {
        const newProduct = {
          id: generateId(),
          ...product,
          versions: [
            {
              version: '1.0',
              bomItems: [],
              createdAt: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          finishedProducts: [...state.finishedProducts, newProduct],
        }));
        return newProduct;
      },

      // ─── 완제품 수정 ───
      updateFinishedProduct: (id, updates) => {
        set((state) => ({
          finishedProducts: state.finishedProducts.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      // ─── 완제품 삭제 ───
      deleteFinishedProduct: (id) => {
        set((state) => ({
          finishedProducts: state.finishedProducts.filter((p) => p.id !== id),
          selectedProductId: state.selectedProductId === id ? null : state.selectedProductId,
        }));
      },

      // ─── 완제품 선택 ───
      setSelectedProduct: (id) => {
        set({ selectedProductId: id });
      },

      // ─── BOM에 포장재 추가 ───
      addBomItem: (productId, versionIndex, bomItem) => {
        set((state) => ({
          finishedProducts: state.finishedProducts.map((p) => {
            if (p.id !== productId) return p;
            const newVersions = [...p.versions];
            const version = { ...newVersions[versionIndex] };
            version.bomItems = [
              ...version.bomItems,
              { id: generateId(), ...bomItem, qty: bomItem.qty || 1 },
            ];
            newVersions[versionIndex] = version;
            return { ...p, versions: newVersions };
          }),
        }));
      },

      // ─── BOM에서 포장재 제거 ───
      removeBomItem: (productId, versionIndex, bomItemId) => {
        set((state) => ({
          finishedProducts: state.finishedProducts.map((p) => {
            if (p.id !== productId) return p;
            const newVersions = [...p.versions];
            const version = { ...newVersions[versionIndex] };
            version.bomItems = version.bomItems.filter((b) => b.id !== bomItemId);
            newVersions[versionIndex] = version;
            return { ...p, versions: newVersions };
          }),
        }));
      },

      // ─── BOM 포장재 수정 ───
      updateBomItem: (productId, versionIndex, bomItemId, updates) => {
        set((state) => ({
          finishedProducts: state.finishedProducts.map((p) => {
            if (p.id !== productId) return p;
            const newVersions = [...p.versions];
            const version = { ...newVersions[versionIndex] };
            version.bomItems = version.bomItems.map((b) =>
              b.id === bomItemId ? { ...b, ...updates } : b
            );
            newVersions[versionIndex] = version;
            return { ...p, versions: newVersions };
          }),
        }));
      },

      // ─── 새 버전 생성 ───
      createNewVersion: (productId) => {
        set((state) => ({
          finishedProducts: state.finishedProducts.map((p) => {
            if (p.id !== productId) return p;
            const lastVersion = p.versions[p.versions.length - 1];
            const lastNum = parseFloat(lastVersion.version);
            const newVersion = {
              version: (lastNum + 0.1).toFixed(1),
              bomItems: lastVersion.bomItems.map((b) => ({ ...b, id: generateId() })),
              createdAt: new Date().toISOString(),
            };
            return { ...p, versions: [...p.versions, newVersion] };
          }),
        }));
      },

      // ─── 선택된 완제품 정보 가져오기 ───
      getSelectedProduct: () => {
        const { finishedProducts, selectedProductId } = get();
        return finishedProducts.find((p) => p.id === selectedProductId) || null;
      },
    }),
    {
      name: 'janytree-packaging-store',
    }
  )
);

export default usePackagingStore;
