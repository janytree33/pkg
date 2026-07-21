/**
 * packagingStore.js
 * ─────────────────────────────────────
 * 포장재 & 완제품 데이터 관리 스토어
 * 포장재 코드, 완제품 코드, BOM(부품표) 데이터를 관리합니다
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../utils/constants';
import { supabase } from '../lib/supabase';

const usePackagingStore = create(
  persist(
    (set, get) => ({
      // ─── 포장재 목록 ───
      packagingComponents: [],

      // ─── 완제품 목록 ───
      finishedProducts: [],

      // ─── 현재 선택된 완제품 ID ───
      selectedProductId: null,

      // ─── 데이터베이스 연동 상태 ───
      isLoaded: false,

      // ─── 데이터 초기 로드 (Supabase) ───
      fetchData: async () => {
        try {
          // 1. 포장재 목록 로드
          const { data: componentsData } = await supabase.from('packaging_components').select('*');
          if (componentsData) {
            set({ packagingComponents: componentsData.map(c => ({
              id: c.id,
              regNo: c.reg_no,
              code: c.code,
              name: c.name,
              spec: c.spec,
              type: c.type,
              material: c.material,
              weight: c.weight_g,
              supplier: c.supplier,
              specFile: c.supplier_spec_doc,
              description: c.notes,
              createdAt: c.created_at,
            })) });
          }

          // 2. 완제품 및 버전, BOM 로드 (조인 활용)
          const { data: productsData } = await supabase
            .from('finished_products')
            .select(`
              id, code, name, name_en, cosmetics_type, spec, brand_type, net_weight_g, created_at,
              product_versions (
                id, version, created_at,
                bom_items (
                  id, component_id, qty
                )
              )
            `);
            
          if (productsData) {
            const formattedProducts = productsData.map(p => {
              // 버전을 오름차순 정렬
              const sortedVersions = (p.product_versions || []).sort((a, b) => parseFloat(a.version) - parseFloat(b.version));
              
              return {
                id: p.id,
                code: p.code,
                name: p.name,
                nameEn: p.name_en,
                cosmeticsType: p.cosmetics_type,
                spec: p.spec,
                brandType: p.brand_type,
                weight: p.net_weight_g,
                createdAt: p.created_at,
                versions: sortedVersions.map(v => {
                  return {
                    id: v.id, // 버전 테이블 ID 보관용
                    version: v.version,
                    createdAt: v.created_at,
                    bomItems: (v.bom_items || []).map(b => {
                      // component_id를 기반으로 스토어에 있는 포장재 정보와 합침
                      const comp = componentsData?.find(c => c.id === b.component_id);
                      return {
                        id: b.id, // bom_items 테이블 ID
                        componentId: b.component_id, // 매핑용 원본 ID
                        regNo: comp?.reg_no || '',
                        code: comp?.code || '',
                        name: comp?.name || '',
                        spec: comp?.spec || '',
                        type: comp?.type || '',
                        material: comp?.material || '',
                        weight: comp?.weight_g || 0,
                        qty: b.qty
                      };
                    })
                  };
                })
              };
            });
            set({ finishedProducts: formattedProducts });
          }
          set({ isLoaded: true });
        } catch (error) {
          console.error("Supabase 포장재 데이터 로드 에러:", error);
        }
      },

      // ─── 포장재 등록 (Supabase 동기화) ───
      addPackagingComponent: async (component) => {
        const payload = {
          reg_no: component.regNo || '',
          code: component.code,
          name: component.name,
          spec: component.spec || '',
          type: component.type,
          material: component.material,
          weight_g: component.weight || 0,
          supplier: component.supplier || '',
          supplier_spec_doc: component.specFile || '',
          notes: component.description || ''
        };
        const { data } = await supabase.from('packaging_components').insert([payload]).select().single();
        if (data) {
          const newComponent = {
            id: data.id,
            ...component,
            createdAt: data.created_at,
          };
          set((state) => ({
            packagingComponents: [...state.packagingComponents, newComponent],
          }));
          return newComponent;
        }
        return null;
      },

      // ─── 포장재 수정 (Supabase 동기화) ───
      updatePackagingComponent: async (id, updates) => {
        // Optimistic UI update
        set((state) => ({
          packagingComponents: state.packagingComponents.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
        
        await supabase.from('packaging_components').update({
          reg_no: updates.regNo,
          code: updates.code,
          name: updates.name,
          spec: updates.spec,
          type: updates.type,
          material: updates.material,
          weight_g: updates.weight,
          supplier: updates.supplier,
          supplier_spec_doc: updates.specFile,
          notes: updates.description,
          updated_at: new Date().toISOString()
        }).eq('id', id);
      },

      // ─── 포장재 삭제 (Supabase 동기화) ───
      deletePackagingComponent: async (id) => {
        set((state) => ({
          packagingComponents: state.packagingComponents.filter((c) => c.id !== id),
        }));
        await supabase.from('packaging_components').delete().eq('id', id);
      },

      // ─── 완제품 등록 (Supabase 동기화) ───
      addFinishedProduct: async (product) => {
        // 1. 완제품 정보 Insert
        const productPayload = {
          code: product.code,
          name: product.name,
          name_en: product.nameEn || '',
          cosmetics_type: product.cosmeticsType || '',
          spec: product.spec || '',
          brand_type: product.brandType || '',
          net_weight_g: product.weight || 0
        };
        const { data: prodData } = await supabase.from('finished_products').insert([productPayload]).select().single();
        
        if (prodData) {
          // 2. 초기 1.0 버전 Insert
          const { data: verData } = await supabase.from('product_versions').insert([{
            product_id: prodData.id,
            version: '1.0'
          }]).select().single();

          const newProduct = {
            id: prodData.id,
            ...product,
            versions: [
              {
                id: verData?.id,
                version: '1.0',
                bomItems: [],
                createdAt: verData?.created_at,
              },
            ],
            createdAt: prodData.created_at,
          };
          set((state) => ({
            finishedProducts: [...state.finishedProducts, newProduct],
          }));
          return newProduct;
        }
        return null;
      },

      // ─── 완제품 수정 (Supabase 동기화) ───
      updateFinishedProduct: async (id, updates) => {
        set((state) => ({
          finishedProducts: state.finishedProducts.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
        await supabase.from('finished_products').update({
          code: updates.code,
          name: updates.name,
          name_en: updates.nameEn,
          cosmetics_type: updates.cosmeticsType,
          spec: updates.spec,
          brand_type: updates.brandType,
          net_weight_g: updates.weight,
          updated_at: new Date().toISOString()
        }).eq('id', id);
      },

      // ─── 엑셀 일괄 업로드: 완제품 (Supabase Bulk Insert) ───
      uploadProductsFromExcel: async (products) => {
        const payload = products.map(p => ({
          code: p.code,
          name: p.name,
          name_en: p.nameEn || '',
          cosmetics_type: p.cosmeticsType || '',
          spec: p.spec || '',
          brand_type: p.brandType || '자사',
          net_weight_g: p.weight || 0
        }));

        const { data, error } = await supabase.from('finished_products').insert(payload).select();
        
        if (data && !error) {
          // 완제품별 1.0 버전도 함께 생성
          const versionsPayload = data.map(d => ({
            product_id: d.id,
            version: '1.0'
          }));
          await supabase.from('product_versions').insert(versionsPayload);
          
          // 새로 전체 데이터를 불러옴 (BOM 구조가 엮여있으므로 fetchData 호출이 안전함)
          await get().fetchData();
          return true;
        }
        return false;
      },

      // ─── 엑셀 일괄 업로드: 포장재 (Supabase Bulk Insert) ───
      uploadComponentsFromExcel: async (components) => {
        const payload = components.map(c => ({
          reg_no: c.regNo || '',
          code: c.code,
          name: c.name,
          spec: c.spec || '',
          type: c.type || '포장부자재',
          material: c.material || '',
          weight_g: c.weight || 0,
        }));

        const { data, error } = await supabase.from('packaging_components').insert(payload).select();
        if (data && !error) {
          await get().fetchData();
          return true;
        }
        return false;
      },

      // ─── 완제품 삭제 (Supabase 동기화) ───
      deleteFinishedProduct: async (id) => {
        set((state) => ({
          finishedProducts: state.finishedProducts.filter((p) => p.id !== id),
          selectedProductId: state.selectedProductId === id ? null : state.selectedProductId,
        }));
        await supabase.from('finished_products').delete().eq('id', id);
      },

      // ─── 완제품 선택 ───
      setSelectedProduct: (id) => {
        set({ selectedProductId: id });
      },

      // ─── BOM에 포장재 추가 (Supabase 동기화) ───
      addBomItem: async (productId, versionIndex, bomItem) => {
        const p = get().finishedProducts.find(p => p.id === productId);
        if (!p) return;
        const versionId = p.versions[versionIndex].id;
        
        // component_id는 원본 packaging_components의 id를 가리킴 (이전에 선택된 아이템의 id를 component_id로 사용)
        const componentId = bomItem.id; 
        
        const { data } = await supabase.from('bom_items').insert([{
          version_id: versionId,
          component_id: componentId,
          qty: bomItem.qty || 1
        }]).select().single();

        if (data) {
          set((state) => ({
            finishedProducts: state.finishedProducts.map((prod) => {
              if (prod.id !== productId) return prod;
              const newVersions = [...prod.versions];
              const version = { ...newVersions[versionIndex] };
              version.bomItems = [
                ...version.bomItems,
                { ...bomItem, id: data.id, componentId: componentId, qty: bomItem.qty || 1 },
              ];
              newVersions[versionIndex] = version;
              return { ...prod, versions: newVersions };
            }),
          }));
        }
      },

      // ─── BOM에서 포장재 제거 (Supabase 동기화) ───
      removeBomItem: async (productId, versionIndex, bomItemId) => {
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
        await supabase.from('bom_items').delete().eq('id', bomItemId);
      },

      // ─── BOM 포장재 수량 수정 (Supabase 동기화) ───
      updateBomItem: async (productId, versionIndex, bomItemId, updates) => {
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
        if (updates.qty !== undefined) {
          await supabase.from('bom_items').update({ qty: updates.qty }).eq('id', bomItemId);
        }
      },

      // ─── 새 버전 생성 (Supabase 동기화) ───
      createNewVersion: async (productId) => {
        const p = get().finishedProducts.find(prod => prod.id === productId);
        if (!p) return;
        const lastVersion = p.versions[p.versions.length - 1];
        const lastNum = parseFloat(lastVersion.version);
        const nextVerString = (lastNum + 0.1).toFixed(1);

        // 새 버전 레코드 생성
        const { data: verData } = await supabase.from('product_versions').insert([{
          product_id: productId,
          version: nextVerString
        }]).select().single();

        if (verData) {
          // 기존 버전의 BOM 아이템 복제
          const itemsToInsert = lastVersion.bomItems.map(b => ({
            version_id: verData.id,
            component_id: b.componentId || b.id, // 기존 데이터 호환
            qty: b.qty
          }));

          let insertedBomItems = [];
          if (itemsToInsert.length > 0) {
            const { data: bomData } = await supabase.from('bom_items').insert(itemsToInsert).select();
            insertedBomItems = bomData || [];
          }

          set((state) => ({
            finishedProducts: state.finishedProducts.map((prod) => {
              if (prod.id !== productId) return prod;
              const newVersion = {
                id: verData.id,
                version: nextVerString,
                createdAt: verData.created_at,
                bomItems: lastVersion.bomItems.map((b, idx) => ({
                  ...b,
                  id: insertedBomItems[idx]?.id || b.id, // 새 DB ID 할당
                })),
              };
              return { ...prod, versions: [...prod.versions, newVersion] };
            }),
          }));
        }
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
