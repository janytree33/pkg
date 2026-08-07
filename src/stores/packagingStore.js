/**
 * packagingStore.js
 * ─────────────────────────────────────
 * 포장재 & 완제품 데이터 관리 스토어 (이중 방어 로직 적용)
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

    // ─── 안전 데이터 로드 ───
    fetchData: async () => {
      try {
        const { data: componentsData, error: compErr } = await supabase.from('packaging_components').select('*');
        if (compErr) console.error("부자재 로드 경고:", compErr);

        const components = (componentsData || []).map(c => ({
          id: String(c.id),
          regNo: c.reg_no || '',
          code: c.code || '',
          name: c.name || '',
          spec: c.spec || '',
          partType: c.part_type || '', 
          subComponents: c.sub_components || [], 
          material: c.material || '',
          evalType: c.eval_type || '미평가',
          materialEvalResult: c.material_eval_result || '미평가',
          weight: c.weight_g || 0,
          weightPerUnit: c.weight_g || 0, 
          containerType: c.container_type || '',
          supplier: c.supplier || '',
          specFile: c.supplier_spec_doc || '',
          specFileData: c.spec_file_data || null,
          specFileName: c.spec_file_name || null,
          description: c.notes || '',
          createdAt: c.created_at,
        }));

        set({ packagingComponents: components });

        // 와일드카드(*) 조회를 통해 DB 스키마 변동에도 100% 안심 로드
        const { data: productsData, error: prodError } = await supabase
          .from('finished_products')
          .select(`
            *,
            product_versions (
              *,
              bom_items (
                *
              )
            )
          `);
          
        if (prodError) console.error("완제품 로드 경고:", prodError);

        const formattedProducts = (productsData || []).map(p => {
          const rawVersions = (p.product_versions && p.product_versions.length > 0)
            ? p.product_versions
            : [{ id: `ver_${p.id}`, version: '1.0', created_at: p.created_at, bom_items: [] }];

          const sortedVersions = rawVersions.sort((a, b) => parseFloat(a.version || 1.0) - parseFloat(b.version || 1.0));
          
          return {
            id: String(p.id),
            code: p.code || '',
            name: p.name || '',
            nameEn: p.name_en || '',
            cosmeticsType: p.cosmetics_type || '',
            spec: p.spec || '',
            brandType: p.brand_type || '',
            weight: p.net_weight_g || 0,
            prodReportName: p.prod_report_name || '',
            createdAt: p.created_at,
            versions: sortedVersions.map(v => ({
              id: String(v.id), 
              version: v.version || '1.0',
              isConfirmed: Boolean(v.is_confirmed),
              createdAt: v.created_at,
              bomItems: (v.bom_items || []).map(b => {
                const comp = components.find(c => String(c.id) === String(b.component_id));
                return {
                  id: String(b.id), 
                  componentId: String(b.component_id), 
                  regNo: comp?.regNo || '',
                  code: comp?.code || '',
                  name: comp?.name || '',
                  spec: comp?.spec || '',
                  partType: comp?.partType || '', 
                  subComponents: comp?.subComponents || [], 
                  material: comp?.material || '',
                  materialEvalResult: comp?.materialEvalResult || '미평가',
                  weight: comp?.weight || 0,
                  qty: b.qty || 1,
                  processType: b.process_type || '충진'
                };
              })
            }))
          };
        });

        set({ finishedProducts: formattedProducts });

        // 자동 선택 처리 (목록이 있고 현재 선택된 게 없으면 첫 번째 선택)
        const currentSelected = get().selectedProductId;
        const exists = formattedProducts.some(p => String(p.id) === String(currentSelected));
        if ((!currentSelected || !exists) && formattedProducts.length > 0) {
          set({ selectedProductId: String(formattedProducts[0].id) });
        }

        set({ isLoaded: true });
      } catch (error) {
        console.error("fetchData 예외 처리:", error);
        set({ isLoaded: true });
      }
    },

    setSelectedProduct: (id) => set({ selectedProductId: id ? String(id) : null }),

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
        eval_type: component.evalType || '미평가',
        material_eval_result: component.materialEvalResult || '미평가',
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
        const newComponent = { id: String(data.id), ...component, createdAt: data.created_at };
        set((state) => ({ packagingComponents: [...state.packagingComponents, newComponent] }));
        return newComponent;
      }
      return null;
    },

    updatePackagingComponent: async (id, updates) => {
      set((state) => ({
        packagingComponents: state.packagingComponents.map((c) =>
          String(c.id) === String(id) ? { ...c, ...updates } : c
        ),
      }));
      const { error } = await supabase.from('packaging_components').update({
        reg_no: updates.regNo,
        code: updates.code,
        name: updates.name,
        spec: updates.spec,
        part_type: updates.partType,
        sub_components: updates.subComponents || [],
        material: updates.material,
        eval_type: updates.evalType,
        material_eval_result: updates.materialEvalResult,
        container_type: updates.containerType,
        weight_g: updates.weightPerUnit || updates.weight,
        supplier: updates.supplier,
        supplier_spec_doc: updates.specFiles ? JSON.stringify(updates.specFiles) : (updates.specFile || ''),
        notes: updates.remark || updates.description,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      
      if (error) {
        console.error("업데이트 실패:", error);
        alert(`저장에 실패했습니다. DB 설정을 확인해 주세요.\n(에러: ${error.message})`);
        return false;
      }
      return true;
    },

    deletePackagingComponent: async (id) => {
      set((state) => ({
        packagingComponents: state.packagingComponents.filter((c) => String(c.id) !== String(id)),
      }));
      await supabase.from('packaging_components').delete().eq('id', id);
    },

    addFinishedProduct: async (product) => {
      const productPayload = {
        code: product.code,
        name: product.name,
        name_en: product.nameEn || '',
        cosmetics_type: product.cosmeticsType || '',
        spec: product.spec || '',
        brand_type: product.brandType || '',
        net_weight_g: product.weight || 0,
        prod_report_name: product.prodReportName || ''
      };
      const { data: prodData } = await supabase.from('finished_products').insert([productPayload]).select().single();
      
      if (prodData) {
        const { data: verData } = await supabase.from('product_versions').insert([{
          product_id: prodData.id,
          version: '1.0'
        }]).select().single();

        const newProduct = {
          id: String(prodData.id),
          ...product,
          versions: [{ id: String(verData?.id || `ver_${prodData.id}`), version: '1.0', isConfirmed: false, bomItems: [], createdAt: verData?.created_at }],
          createdAt: prodData.created_at,
        };
        set((state) => ({ finishedProducts: [...state.finishedProducts, newProduct] }));
        return newProduct;
      }
      return null;
    },

    updateFinishedProduct: async (id, updates) => {
      set((state) => ({
        finishedProducts: state.finishedProducts.map((p) => String(p.id) === String(id) ? { ...p, ...updates } : p),
      }));
      await supabase.from('finished_products').update({
        code: updates.code,
        name: updates.name,
        name_en: updates.nameEn,
        cosmetics_type: updates.cosmeticsType,
        spec: updates.spec,
        brand_type: updates.brandType,
        net_weight_g: updates.weight,
        prod_report_name: updates.prodReportName,
        updated_at: new Date().toISOString()
      }).eq('id', id);
    },

    uploadProductsFromExcel: async (products) => {
      const payload = products.map(p => ({
        code: p.code, name: p.name, name_en: p.nameEn || '', cosmetics_type: p.cosmeticsType || '',
        spec: p.spec || '', brand_type: p.brandType || '자사', net_weight_g: p.weight || 0, prod_report_name: p.prodReportName || ''
      }));

      const { data, error } = await supabase.from('finished_products').insert(payload).select();
      if (data && !error) {
        const versionsPayload = data.map(d => ({ product_id: d.id, version: '1.0' }));
        await supabase.from('product_versions').insert(versionsPayload);
        await get().fetchData();
        return true;
      }
      return false;
    },

    uploadComponentsFromExcel: async (components) => {
      const payload = components.map(c => ({
        reg_no: c.regNo || '', code: c.code, name: c.name, spec: c.spec || '',
        part_type: c.partType || '기타', sub_components: c.subComponents || [], material: c.material || '',
        container_type: c.containerType || c.container_type || '',
        weight_g: c.weightPerUnit || c.weight || 0, notes: c.remark || '',
      }));

      const { data, error } = await supabase.from('packaging_components').insert(payload).select();
      if (data && !error) {
        await get().fetchData();
        return true;
      }
      return false;
    },

    deleteFinishedProduct: async (id) => {
      set((state) => ({
        finishedProducts: state.finishedProducts.filter((p) => String(p.id) !== String(id)),
        selectedProductId: String(state.selectedProductId) === String(id) ? null : state.selectedProductId,
      }));
      await supabase.from('finished_products').delete().eq('id', id);
    },

    // ─── [핵심 방어] BOM 아이템 추가 ───
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
          alert("DB 버전을 생성하지 못했습니다.");
          return;
        }

        targetVersion = { id: String(verData.id), version: verData.version, isConfirmed: false, createdAt: verData.created_at, bomItems: targetVersion?.bomItems || [] };
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

      // UUID가 아닌 경우 DB 동기화
      if (!isValidUuid(componentId)) {
        const payload = {
          reg_no: comp?.regNo || '',
          code: comp?.code || `C-${Date.now()}`,
          name: comp?.name || '신규 부자재',
          spec: comp?.spec || '',
          part_type: comp?.partType || bomItem.partType || '기타',
          sub_components: comp?.subComponents || [],
          material: comp?.material || 'PP',
          material_eval_result: comp?.materialEvalResult || '미평가',
          container_type: comp?.containerType || '마개/캡/부속품(플라스틱)',
          weight_g: comp?.weight || comp?.weightPerUnit || 0,
          notes: comp?.description || ''
        };

        const { data: newCompData, error: newCompErr } = await supabase.from('packaging_components').insert([payload]).select().single();
        if (newCompErr || !newCompData) {
          alert("부자재 DB 동기화 오류: " + newCompErr?.message);
          return;
        }
        componentId = String(newCompData.id);
        set((state) => ({
          packagingComponents: state.packagingComponents.map(c => 
            String(c.id) === String(bomItem.componentId || bomItem.id) ? { ...c, id: String(newCompData.id) } : c
          )
        }));
      }

      const targetProcessType = bomItem.processType || '충진';

      // 🌟 [안전 DB 저장] process_type 컬럼이 있든 없든 튕기지 않고 처리
      let bomData = null;
      const primaryPayload = { version_id: versionId, component_id: componentId, qty: bomItem.qty || 1, process_type: targetProcessType };
      const { data: res1Data, error: res1Err } = await supabase.from('bom_items').insert([primaryPayload]).select().single();

      if (res1Err) {
        // process_type 컬럼이 없을 경우를 대비한 자동 Fallback
        const fallbackPayload = { version_id: versionId, component_id: componentId, qty: bomItem.qty || 1 };
        const { data: res2Data, error: res2Err } = await supabase.from('bom_items').insert([fallbackPayload]).select().single();
        if (res2Err) {
          alert("DB에 BOM 항목을 저장하지 못했습니다: " + res2Err.message);
          return;
        }
        bomData = res2Data;
      } else {
        bomData = res1Data;
      }

      const newBomItem = {
        id: String(bomData.id),
        componentId: componentId,
        regNo: comp?.regNo || comp?.reg_no || '',
        code: comp?.code || '',
        name: comp?.name || '',
        spec: comp?.spec || '',
        partType: bomItem.partType || comp?.partType || '',
        subComponents: comp?.subComponents || [],
        material: comp?.material || '',
        materialEvalResult: comp?.materialEvalResult || '미평가',
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

      if (typeof bomItemId === 'string' && isValidUuid(bomItemId)) {
        if (updates.qty !== undefined) {
          await supabase.from('bom_items').update({ qty: updates.qty }).eq('id', bomItemId);
        }
        if (updates.processType !== undefined) {
          await supabase.from('bom_items').update({ process_type: updates.processType }).eq('id', bomItemId);
        }
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

      // 화면 즉각 업데이트
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
          qty: b.qty
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
              id: String(verData.id),
              version: nextVerString,
              isConfirmed: false,
              createdAt: verData.created_at,
              bomItems: (lastVersion.bomItems || []).map((b, idx) => ({
                ...b,
                id: insertedBomItems[idx] ? String(insertedBomItems[idx].id) : b.id,
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
      if (!selectedProductId) return null;
      return finishedProducts.find((p) => String(p.id) === String(selectedProductId)) || null;
    },
  })
);

export default usePackagingStore;