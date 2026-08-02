/**
 * packagingStore.js
 * ─────────────────────────────────────
 * 포장재 & 완제품 데이터 관리 스토어
 * - UUID 자동 동기화 및 BOM 확정 기능 적용
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// UUID 형식 검증 함수 (8-4-4-4-12 패턴)
const isValidUuid = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const usePackagingStore = create(
  (set, get) => ({
    packagingComponents: [],
    finishedProducts: [],
    selectedProductId: null,
    isLoaded: false,

    // ─── 데이터 초기 로드 ───
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
              id, version, created_at,
              bom_items (
                id, component_id, qty
              )
            )
          `);
          
        if (prodError) {
          console.error("완제품 데이터 로드 에러:", prodError);
        }

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
              versions: sortedVersions.map(v => {
                return {
                  id: v.id, 
                  version: v.version || '1.0',
                  isConfirmed: v.isConfirmed || false,
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
        console.error("Supabase 데이터 로드 예외 발생:", error);
      }
    },

    // ─── 포장재 직접 등록 ───
    addPackagingComponent: async (component) => {
      const { packagingComponents } = get();

      if (component.code && component.code.trim()) {
        const inputCode = component.code.trim().toLowerCase();
        const isCodeExists = packagingComponents.some(
          c => c.code && c.code.trim().toLowerCase() === inputCode
        );

        if (isCodeExists) {
          alert(`⚠️ 이미 등록되어 있는 포장재 코드입니다.\n[입력한 코드: ${component.code}]`);
          return null;
        }
      }

      if (component.regNo && component.regNo.trim()) {
        const inputRegNo = component.regNo.trim().toLowerCase();
        const isRegNoExists = packagingComponents.some(
          c => c.regNo && c.regNo.trim().toLowerCase() === inputRegNo
        );

        if (isRegNoExists) {
          alert(`⚠️ 이미 등록되어 있는 등록번호입니다.\n[입력한 등록번호: ${component.regNo}]`);
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

    updatePackagingComponent: async (id, updates) => {
      set((state) => ({
        packagingComponents: state.packagingComponents.map((c) =>
          String(c.id) === String(id) ? { ...c, ...updates } : c
        ),
      }));
      await supabase.from('packaging_components').update({
        reg_no: updates.regNo,
        code: updates.code,
        name: updates.name,
        spec: updates.spec,
        part_type: updates.partType,
        sub_components: updates.subComponents || [],
        material: updates.material,
        container_type: updates.containerType,
        weight_g: updates.weightPerUnit || updates.weight,
        supplier: updates.supplier,
        supplier_spec_doc: updates.specFiles ? JSON.stringify(updates.specFiles) : (updates.specFile || ''),
        notes: updates.remark || updates.description,
        updated_at: new Date().toISOString()
      }).eq('id', id);
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
          id: prodData.id,
          ...product,
          versions: [{ id: verData?.id || `ver_${prodData.id}`, version: '1.0', isConfirmed: false, bomItems: [], createdAt: verData?.created_at }],
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
      const eprCodeMapper = {
        "플라스틱병(PET-무색)": "0410", "플라스틱병(PET-유색)": "0420", "플라스틱병(PET-복합)": "0430",
        "플라스틱 용기/단지(PE/PP/ABS 단일)": "0450", "마개/캡/부속품(플라스틱)": "0450", "튜브/필름(복합재질)": "0490",
        "유리병(뚜껑일체형)": "0310", "유리병(뚜껑분리형)": "0320", "일반팩(단상자 등)": "0110", "멸균팩": "0120",
        "철캔(일체형)": "0510", "철캔(분리형)": "0520", "알루미늄캔(일체형)": "0610", "알루미늄캔(분리형)": "0620",
        "단상자": "0110", "용기": "0450", "캡": "0450", "뚜껑": "0450"
      };

      const payload = components.map(c => ({
        reg_no: c.regNo || '', code: c.code, name: c.name, spec: c.spec || '',
        part_type: c.partType || '기타', sub_components: c.subComponents || [], material: c.material || '',
        container_type: eprCodeMapper[(c.containerType || c.container_type || '').trim()] || c.containerType || c.container_type || '',
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

    setSelectedProduct: (id) => set({ selectedProductId: id }),

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
    },

    // 🌟 [핵심 보완] BOM 부자재 추가 (UUID 검증 및 자동 DB 동기화)
    addBomItem: async (productId, versionIndex, bomItem) => {
      const products = get().finishedProducts;
      let p = products.find(prod => String(prod.id) === String(productId));
      if (!p) return;

      let versions = p.versions || [];
      const safeIndex = Math.min(Math.max(0, versionIndex || 0), Math.max(0, versions.length - 1));
      let targetVersion = versions[safeIndex];

      // 1. 가상 버전일 경우 DB에 진짜 버전 생성
      if (!targetVersion || !targetVersion.id || String(targetVersion.id).startsWith('ver_')) {
        const { data: verData, error: verError } = await supabase.from('product_versions').insert([{
          product_id: p.id,
          version: targetVersion?.version || '1.0'
        }]).select().single();

        if (verError || !verData) {
          alert("DB에 버전을 생성하지 못했습니다: " + (verError?.message || "알 수 없는 오류"));
          return;
        }

        targetVersion = { id: verData.id, version: verData.version, isConfirmed: false, createdAt: verData.created_at, bomItems: targetVersion?.bomItems || [] };
        if (versions.length === 0) versions = [targetVersion];
        else versions[safeIndex] = targetVersion;
        p.versions = versions;
      }

      if (targetVersion.isConfirmed) {
        alert("🔒 이미 확정된 BOM 버전입니다. 수정하려면 [확정 해제] 후 진행해 주세요.");
        return;
      }

      const versionId = targetVersion.id;
      let componentId = bomItem.componentId || bomItem.id;
      const components = get().packagingComponents;
      let comp = components.find(c => String(c.id) === String(componentId));

      // 🌟 2. componentId가 UUID가 아니면(숫자 타임스탬프 등) DB에 부자재를 먼저 생성하여 진짜 UUID 획득
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
          alert("부자재 DB 동기화 오류: " + (newCompErr?.message || "알 수 없는 오류"));
          return;
        }

        // DB에서 부여한 진짜 UUID 적용
        componentId = newCompData.id;

        // 스토어 상태 내 부자재 ID도 진짜 UUID로 업데이트
        set((state) => ({
          packagingComponents: state.packagingComponents.map(c => 
            String(c.id) === String(bomItem.componentId || bomItem.id) ? { ...c, id: newCompData.id } : c
          )
        }));
      }

      // 3. Supabase bom_items 테이블에 진짜 UUID로 안전하게 저장
      const { data: bomData, error: bomError } = await supabase.from('bom_items').insert([{
        version_id: versionId,
        component_id: componentId,
        qty: bomItem.qty || 1
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
        processType: bomItem.processType || '충진'
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
      const p = get().finishedProducts.find(prod => String(prod.id) === String(productId));
      const targetVer = p?.versions?.[versionIndex];
      if (targetVer?.isConfirmed) {
        alert("🔒 확정된 BOM 버전의 부자재는 삭제할 수 없습니다.");
        return;
      }

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
      if (updates.qty !== undefined && typeof bomItemId === 'string' && isValidUuid(bomItemId)) {
        await supabase.from('bom_items').update({ qty: updates.qty }).eq('id', bomItemId);
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