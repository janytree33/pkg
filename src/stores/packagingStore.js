/**
 * packagingStore.js
 * ─────────────────────────────────────
 * 포장재 & 완제품 데이터 관리 스토어
 * - 공정구분(process_type) DB 저장 및 연동
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const isValidUuid = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const usePackagingStore = create(
  (set, get) => ({
    packagingComponents: [],
    finishedProducts: [],
    selectedProductId: null,
    isLoaded: false,

    fetchData: async () => {
      try {
        const { data: componentsData } = await supabase.from('packaging_components').select('*');
        if (componentsData) {
          set({ packagingComponents: componentsData.map(c => ({
            id: c.id,
            regNo: c.reg_no,
            code: c.code,
            name: c.name,
            spec: c.spec,
            partType: c.part_type || '', 
            subComponents: c.sub_components || [], 
            material: c.material,
            weight: c.weight_g,
            weightPerUnit: c.weight_g, 
            containerType: c.container_type,
            supplier: c.supplier,
            specFile: c.supplier_spec_doc,
            specFileData: c.spec_file_data || null,
            specFileName: c.spec_file_name || null,
            description: c.notes,
            createdAt: c.created_at,
          })) });
        }

        const { data: productsData, error: prodError } = await supabase
          .from('finished_products')
          .select(`
            id, code, name, name_en, cosmetics_type, spec, brand_type, net_weight_g, prod_report_name, created_at,
            product_versions (
              id, version, is_confirmed, created_at,
              bom_items (
                id, component_id, qty, process_type
              )
            )
          `);
          
        if (prodError) console.error("완제품 데이터 로드 에러:", prodError);

        if (productsData) {
          const formattedProducts = productsData.map(p => {
            const rawVersions = (p.product_versions && p.product_versions.length > 0)
              ? p.product_versions
              : [{ id: `ver_${p.id}`, version: '1.0', created_at: p.created_at, bom_items: [] }];

            const sortedVersions = rawVersions.sort((a, b) => parseFloat(a.version || 1.0) - parseFloat(b.version || 1.0));
            
            return {
              id: p.id,
              code: p.code,
              name: p.name,
              nameEn: p.name_en,
              cosmeticsType: p.cosmetics_type,
              spec: p.spec,
              brandType: p.brand_type,
              weight: p.net_weight_g,
              prodReportName: p.prod_report_name || '',
              createdAt: p.created_at,
              versions: sortedVersions.map(v => ({
                id: v.id, 
                version: v.version || '1.0',
                isConfirmed: v.is_confirmed || false,
                createdAt: v.created_at,
                bomItems: (v.bom_items || []).map(b => {
                  const comp = componentsData?.find(c => String(c.id) === String(b.component_id));
                  return {
                    id: b.id, 
                    componentId: b.component_id, 
                    regNo: comp?.reg_no || '',
                    code: comp?.code || '',
                    name: comp?.name || '',
                    spec: comp?.spec || '',
                    partType: comp?.part_type || '', 
                    subComponents: comp?.sub_components || [], 
                    material: comp?.material || '',
                    weight: comp?.weight_g || 0,
                    qty: b.qty,
                    processType: b.process_type || '충진' // 🌟 DB에 저장된 지정 공정 사용
                  };
                })
              }))
            };
          });
          set({ finishedProducts: formattedProducts });
        }
        set({ isLoaded: true });
      } catch (error) {
        console.error("Supabase 데이터 로드 예외 발생:", error);
      }
    },

    addPackagingComponent: async (component) => {
      const { packagingComponents } = get();

      if (component.code && component.code.trim()) {
        const inputCode = component.code.trim().toLowerCase();
        if (packagingComponents.some(c => c.code && c.code.trim().toLowerCase() === inputCode)) {
          alert(`⚠️ 이미 등록되어 있는 포장재 코드입니다.\n[입력한 코드: ${component.code}]`);
          return null;
        }
      }

      const payload = {
        reg_no: component.regNo || '',
        code: component.code,
        name: component.name,
        spec: component.spec || '',
        part_type: component.partType || '기타',
        sub_components: component.subComponents || [],
        material: component.material,
        container_type: component.containerType || '',
        weight_g: component.weight || component.weightPerUnit || 0,
        supplier: component.supplier || '',
        supplier_spec_doc: component.specFiles ? JSON.stringify(component.specFiles) : (component.specFile || ''),
        notes: component.remark || component.description || ''
      };

      const { data, error } = await supabase.from('packaging_components').insert([payload]).select().single();
      if (error) {
        alert("데이터베이스 저장 오류: " + error.message);
        return null;
      }
      if (data) {
        const newComponent = { id: data.id, ...component, createdAt: data.created_at };
        set((state) => ({ packagingComponents: [...state.packagingComponents, newComponent] }));
        return newComponent;
      }
      return null;
    },

    addBomItem: async (productId, versionIndex, bomItem) => {
      const products = get().finishedProducts;
      let p = products.find(prod => String(prod.id) === String(productId));
      if (!p) return;

      let versions = p.versions || [];
      const safeIndex = Math.min(Math.max(0, versionIndex || 0), Math.max(0, versions.length - 1));
      let targetVersion = versions[safeIndex];

      if (!targetVersion || !targetVersion.id || String(targetVersion.id).startsWith('ver_')) {
        const { data: verData, error: verError } = await supabase.from('product_versions').insert([{
          product_id: p.id,
          version: targetVersion?.version || '1.0'
        }]).select().single();

        if (verError || !verData) {
          alert("DB에 버전을 생성하지 못했습니다.");
          return;
        }

        targetVersion = { id: verData.id, version: verData.version, isConfirmed: false, createdAt: verData.created_at, bomItems: targetVersion?.bomItems || [] };
        if (versions.length === 0) versions = [targetVersion];
        else versions[safeIndex] = targetVersion;
        p.versions = versions;
      }

      if (targetVersion.isConfirmed) {
        alert("🔒 확정된 BOM 버전입니다.");
        return;
      }

      const versionId = targetVersion.id;
      let componentId = bomItem.componentId || bomItem.id;
      const components = get().packagingComponents;
      let comp = components.find(c => String(c.id) === String(componentId));

      if (!isValidUuid(componentId)) {
        const payload = {
          reg_no: comp?.regNo || '',
          code: comp?.code || `C-${Date.now()}`,
          name: comp?.name || '신규 부자재',
          spec: comp?.spec || '',
          part_type: comp?.partType || bomItem.partType || '기타',
          sub_components: comp?.subComponents || [],
          material: comp?.material || 'PP',
          container_type: comp?.containerType || '마개/캡/부속품(플라스틱)',
          weight_g: comp?.weight || comp?.weightPerUnit || 0,
          notes: comp?.description || ''
        };

        const { data: newCompData, error: newCompErr } = await supabase.from('packaging_components').insert([payload]).select().single();
        if (newCompErr || !newCompData) {
          alert("부자재 DB 동기화 오류: " + newCompErr?.message);
          return;
        }
        componentId = newCompData.id;
        set((state) => ({
          packagingComponents: state.packagingComponents.map(c => 
            String(c.id) === String(bomItem.componentId || bomItem.id) ? { ...c, id: newCompData.id } : c
          )
        }));
      }

      const targetProcessType = bomItem.processType || '충진'; // 🌟 사용자가 누른 버튼의 공정 그대로 전달

      const { data: bomData, error: bomError } = await supabase.from('bom_items').insert([{
        version_id: versionId,
        component_id: componentId,
        qty: bomItem.qty || 1,
        process_type: targetProcessType
      }]).select().single();

      if (bomError) {
        alert("DB에 BOM 항목을 저장하지 못했습니다: " + bomError.message);
        return;
      }

      const newBomItem = {
        id: bomData.id,
        componentId: componentId,
        regNo: comp?.regNo || comp?.reg_no || '',
        code: comp?.code || '',
        name: comp?.name || '',
        spec: comp?.spec || '',
        partType: bomItem.partType || comp?.partType || '',
        subComponents: comp?.subComponents || [],
        material: comp?.material || '',
        weight: comp?.weight || comp?.weightPerUnit || 0,
        qty: bomItem.qty || 1,
        processType: targetProcessType
      };

      set((state) => ({
        finishedProducts: state.finishedProducts.map((prod) => {
          if (String(prod.id) !== String(productId)) return prod;
          const newVersions = [...(prod.versions || [])];
          newVersions[safeIndex] = {
            ...targetVersion,
            bomItems: [...(targetVersion.bomItems || []), newBomItem]
          };
          return { ...prod, versions: newVersions };
        }),
      }));
    },

    removeBomItem: async (productId, versionIndex, bomItemId) => {
      set((state) => ({
        finishedProducts: state.finishedProducts.map((p) => {
          if (String(p.id) !== String(productId)) return p;
          const newVersions = [...p.versions];
          const safeIndex = Math.min(Math.max(0, versionIndex || 0), newVersions.length - 1);
          const version = { ...newVersions[safeIndex] };
          if (version.bomItems) {
            version.bomItems = version.bomItems.filter((b) => String(b.id) !== String(bomItemId));
          }
          newVersions[safeIndex] = version;
          return { ...p, versions: newVersions };
        }),
      }));

      if (typeof bomItemId === 'string' && isValidUuid(bomItemId)) {
        await supabase.from('bom_items').delete().eq('id', bomItemId);
      }
    },

    updateBomItem: async (productId, versionIndex, bomItemId, updates) => {
      set((state) => ({
        finishedProducts: state.finishedProducts.map((p) => {
          if (String(p.id) !== String(productId)) return p;
          const newVersions = [...p.versions];
          const safeIndex = Math.min(Math.max(0, versionIndex || 0), newVersions.length - 1);
          const version = { ...newVersions[safeIndex] };
          if (version.bomItems) {
            version.bomItems = version.bomItems.map((b) =>
              String(b.id) === String(bomItemId) ? { ...b, ...updates } : b
            );
          }
          newVersions[safeIndex] = version;
          return { ...p, versions: newVersions };
        }),
      }));

      const dbUpdates = {};
      if (updates.qty !== undefined) dbUpdates.qty = updates.qty;
      if (updates.processType !== undefined) dbUpdates.process_type = updates.processType;

      if (Object.keys(dbUpdates).length > 0 && typeof bomItemId === 'string' && isValidUuid(bomItemId)) {
        await supabase.from('bom_items').update(dbUpdates).eq('id', bomItemId);
      }
    },

    toggleVersionConfirm: async (productId, versionIndex) => {
      const products = get().finishedProducts;
      const p = products.find(prod => String(prod.id) === String(productId));
      if (!p || !p.versions) return;

      const safeIndex = Math.min(Math.max(0, versionIndex || 0), p.versions.length - 1);
      const targetVersion = p.versions[safeIndex];
      if (!targetVersion) return;

      const nextConfirmedState = !targetVersion.isConfirmed;

      set((state) => ({
        finishedProducts: state.finishedProducts.map((prod) => {
          if (String(prod.id) !== String(productId)) return prod;
          const newVersions = [...prod.versions];
          newVersions[safeIndex] = {
            ...newVersions[safeIndex],
            isConfirmed: nextConfirmedState
          };
          return { ...prod, versions: newVersions };
        }),
      }));

      if (targetVersion.id && !String(targetVersion.id).startsWith('ver_')) {
        await supabase.from('product_versions').update({ is_confirmed: nextConfirmedState }).eq('id', targetVersion.id);
      }
    },

    createNewVersion: async (productId) => {
      const p = get().finishedProducts.find(prod => String(prod.id) === String(productId));
      if (!p || !p.versions || p.versions.length === 0) return;
      
      const lastVersion = p.versions[p.versions.length - 1];
      const lastNum = parseFloat(lastVersion.version || '1.0');
      const nextVerString = (lastNum + 0.1).toFixed(1);

      const { data: verData } = await supabase.from('product_versions').insert([{
        product_id: productId,
        version: nextVerString
      }]).select().single();

      if (verData) {
        const itemsToInsert = (lastVersion.bomItems || []).map(b => ({
          version_id: verData.id,
          component_id: b.componentId || b.id,
          qty: b.qty,
          process_type: b.processType || '충진'
        }));

        let insertedBomItems = [];
        if (itemsToInsert.length > 0) {
          const { data: bomData } = await supabase.from('bom_items').insert(itemsToInsert).select();
          insertedBomItems = bomData || [];
        }

        set((state) => ({
          finishedProducts: state.finishedProducts.map((prod) => {
            if (String(prod.id) !== String(productId)) return prod;
            const newVersion = {
              id: verData.id,
              version: nextVerString,
              isConfirmed: false,
              createdAt: verData.created_at,
              bomItems: (lastVersion.bomItems || []).map((b, idx) => ({
                ...b,
                id: insertedBomItems[idx]?.id || b.id,
              })),
            };
            return { ...prod, versions: [...prod.versions, newVersion] };
          }),
        }));
      }
    },

    deleteProductVersion: async (productId, versionId) => {
      set((state) => ({
        finishedProducts: state.finishedProducts.map((prod) => {
          if (String(prod.id) !== String(productId)) return prod;
          return {
            ...prod,
            versions: prod.versions.filter(v => String(v.id) !== String(versionId))
          };
        }),
      }));
      if (isValidUuid(versionId)) {
        await supabase.from('product_versions').delete().eq('id', versionId);
      }
    },

    getSelectedProduct: () => {
      const { finishedProducts, selectedProductId } = get();
      return finishedProducts.find((p) => String(p.id) === String(selectedProductId)) || null;
    },
  })
);

export default usePackagingStore;