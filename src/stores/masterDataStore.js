/**
 * masterDataStore.js (v2 — 테이블별 컬럼 매핑 전면 수정)
 * ─────────────────────────────────────────────────────────────
 * 문제: 5개 테이블의 실제 DB 컬럼명이 테이블마다 다름
 *   - master_cosmetic_types     : name_kr, category_main
 *   - master_packaging_types    : name_kr, packaging_group, sub_category
 *   - master_recycle_marks      : name_kr, main_category, material_code, display_text
 *   - master_recyclability_grades: grade_kr, grade_en, rank_order, code, surcharge_info, summary
 *   - master_keco_eval_rules    : criteria_kr, criteria_en, keco_code, eval_part, result_grade, legal_basis
 *
 * 해결: 테이블별로 fromDB(읽기용) / toDB(쓰기용) / orderBy 설정을 각각 정의
 * ─────────────────────────────────────────────────────────────
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// ══════════════════════════════════════════════════════════════
// 테이블별 컬럼 매핑 설정 (핵심 수정 부분)
// ══════════════════════════════════════════════════════════════
const TABLE_CONFIGS = {

  // ① 화장품 유형: name_kr, category_main(=설명), sort_order, is_active
  master_cosmetic_types: {
    fromDB: (row) => ({
      id:          row.id,
      nameKo:      row.name_kr || '',           // ← name_kr !
      nameEn:      row.name_en || '',
      description: row.category_main || '',     // ← category_main = 설명
      sortOrder:   row.sort_order ?? 0,
      isActive:    row.is_active ?? true,
      createdAt:   row.created_at,
    }),
    toDB: (data) => ({
      name_kr:       data.nameKo,
      name_en:       data.nameEn || null,
      category_main: data.description || null,
      sort_order:    Number(data.sortOrder) || 0,
      is_active:     data.isActive !== undefined ? data.isActive : true,
    }),
    orderBy: 'sort_order',          // sort_order 컬럼 존재
  },

  // ② 포장재 분류: name_kr, packaging_group, sub_category, description, sort_order
  master_packaging_types: {
    fromDB: (row) => ({
      id:             row.id,
      nameKo:         row.name_kr || '',        // ← name_kr !
      nameEn:         row.name_en || '',
      description:    row.description || '',
      sortOrder:      row.sort_order ?? 0,
      isActive:       true,                     // 이 테이블엔 is_active 컬럼 없음
      packagingGroup: row.packaging_group || '',
      subCategory:    row.sub_category || '',
      createdAt:      row.created_at,
    }),
    toDB: (data) => ({
      name_kr:     data.nameKo,
      name_en:     data.nameEn || null,
      description: data.description || null,
      sort_order:  Number(data.sortOrder) || 0,
      // packaging_group, sub_category는 고급 편집용 (모달에서 미노출)
    }),
    orderBy: 'sort_order',
  },

  // ③ 분리배출 표시: name_kr, main_category, material_code, display_text, exemption_condition, sort_order
  master_recycle_marks: {
    fromDB: (row) => ({
      id:                 row.id,
      nameKo:             row.name_kr || '',    // ← name_kr !
      nameEn:             row.name_en || '',
      description:        row.exemption_condition || '',  // ← exemption_condition = 설명
      sortOrder:          row.sort_order ?? 0,
      isActive:           true,                           // is_active 컬럼 없음
      mainCategory:       row.main_category || '',
      materialCode:       row.material_code || '',
      displayText:        row.display_text || '',
      colorCode:          row.color_code || '',
      createdAt:          row.created_at,
    }),
    toDB: (data) => ({
      name_kr:             data.nameKo,
      name_en:             data.nameEn || null,
      exemption_condition: data.description || null,
      sort_order:          Number(data.sortOrder) || 0,
    }),
    orderBy: 'sort_order',
  },

  // ④ 재활용 등급: grade_kr, grade_en, rank_order(!), code, surcharge_info, summary
  master_recyclability_grades: {
    fromDB: (row) => ({
      id:           row.id,
      nameKo:       row.grade_kr || '',         // ← grade_kr !
      nameEn:       row.grade_en || '',         // ← grade_en !
      description:  row.summary || '',          // ← summary = 설명
      sortOrder:    row.rank_order ?? 0,        // ← rank_order ! (sort_order 아님)
      isActive:     true,                       // is_active 컬럼 없음
      code:         row.code || '',
      surchargeInfo: row.surcharge_info || '',
      createdAt:    row.created_at,
    }),
    toDB: (data) => ({
      grade_kr:     data.nameKo,
      grade_en:     data.nameEn || null,
      summary:      data.description || null,
      rank_order:   Number(data.sortOrder) || 0,  // ← rank_order !
    }),
    orderBy: 'rank_order',                     // ← rank_order로 정렬 !
  },

  // ⑤ KECO 평가기준: criteria_kr, criteria_en, keco_code, eval_part, result_grade, legal_basis, sort_order
  master_keco_eval_rules: {
    fromDB: (row) => ({
      id:          row.id,
      nameKo:      row.criteria_kr || '',       // ← criteria_kr !
      nameEn:      row.criteria_en || '',       // ← criteria_en !
      description: row.legal_basis || '',       // ← legal_basis = 설명
      sortOrder:   row.sort_order ?? 0,
      isActive:    true,                        // is_active 컬럼 없음
      kecoCode:    row.keco_code || '',
      evalPart:    row.eval_part || '',
      resultGrade: row.result_grade || '',
      createdAt:   row.created_at,
    }),
    toDB: (data) => ({
      criteria_kr:  data.nameKo,
      criteria_en:  data.nameEn || null,
      legal_basis:  data.description || null,
      sort_order:   Number(data.sortOrder) || 0,
    }),
    orderBy: 'sort_order',
  },
};

// ══════════════════════════════════════════════════════════════
// Zustand 스토어
// ══════════════════════════════════════════════════════════════
const useMasterDataStore = create((set, get) => ({

  // ─── 공통 상태 ───
  isLoading: false,
  error: null,

  // ─── 5개 테이블 데이터 배열 ───
  cosmeticTypes:        [],
  packagingTypes:       [],
  recycleMarks:         [],
  recyclabilityGrades:  [],
  kecoEvalRules:        [],

  // ─────────────────────────────────────────────────────────────
  // 앱 시작 시 5개 테이블 전체 한 번에 로드
  // ─────────────────────────────────────────────────────────────
  fetchAllMasterData: async () => {
    set({ isLoading: true, error: null });
    try {
      const cfg = TABLE_CONFIGS;

      // 5개 쿼리를 동시 실행 (각 테이블의 올바른 orderBy 컬럼 사용)
      const [r1, r2, r3, r4, r5] = await Promise.all([
        supabase.from('master_cosmetic_types')
          .select('*').order(cfg.master_cosmetic_types.orderBy).order('created_at'),
        supabase.from('master_packaging_types')
          .select('*').order(cfg.master_packaging_types.orderBy).order('created_at'),
        supabase.from('master_recycle_marks')
          .select('*').order(cfg.master_recycle_marks.orderBy).order('created_at'),
        supabase.from('master_recyclability_grades')
          .select('*').order(cfg.master_recyclability_grades.orderBy),  // rank_order
        supabase.from('master_keco_eval_rules')
          .select('*').order(cfg.master_keco_eval_rules.orderBy).order('created_at'),
      ]);

      // 각 테이블의 fromDB 매핑 함수로 데이터 변환
      set({
        cosmeticTypes:       (r1.data || []).map(cfg.master_cosmetic_types.fromDB),
        packagingTypes:      (r2.data || []).map(cfg.master_packaging_types.fromDB),
        recycleMarks:        (r3.data || []).map(cfg.master_recycle_marks.fromDB),
        recyclabilityGrades: (r4.data || []).map(cfg.master_recyclability_grades.fromDB),
        kecoEvalRules:       (r5.data || []).map(cfg.master_keco_eval_rules.fromDB),
        isLoading: false,
      });

      // 오류가 있으면 콘솔에 표시 (쿼리가 일부 실패해도 앱이 죽지 않게)
      [r1, r2, r3, r4, r5].forEach((r, i) => {
        if (r.error) console.error(`[MDM] 테이블 ${i + 1} 로드 오류:`, r.error.message);
      });

    } catch (err) {
      console.error('[MDM] 전체 로드 오류:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  // ─────────────────────────────────────────────────────────────
  // ① 화장품 유형 분류 CRUD
  // ─────────────────────────────────────────────────────────────
  fetchCosmeticTypes: async () => {
    const cfg = TABLE_CONFIGS.master_cosmetic_types;
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('master_cosmetic_types').select('*')
      .order(cfg.orderBy).order('created_at');
    if (!error) set({ cosmeticTypes: (data || []).map(cfg.fromDB) });
    else set({ error: error.message });
    set({ isLoading: false });
  },

  addCosmeticTypesItem: async (data) => {
    const cfg = TABLE_CONFIGS.master_cosmetic_types;
    try {
      const { data: row, error } = await supabase
        .from('master_cosmetic_types').insert([cfg.toDB(data)]).select().single();
      if (error) throw error;
      set((s) => ({ cosmeticTypes: [...s.cosmeticTypes, cfg.fromDB(row)] }));
      return { success: true };
    } catch (err) { return { success: false, message: err.message }; }
  },

  updateCosmeticTypesItem: async (id, data) => {
    const cfg = TABLE_CONFIGS.master_cosmetic_types;
    try {
      const { error } = await supabase
        .from('master_cosmetic_types').update(cfg.toDB(data)).eq('id', id);
      if (error) throw error;
      set((s) => ({
        cosmeticTypes: s.cosmeticTypes.map((item) =>
          item.id === id ? { ...item, ...cfg.fromDB({ ...cfg.toDB(data), id, created_at: item.createdAt }) } : item
        ),
      }));
      return { success: true };
    } catch (err) { return { success: false, message: err.message }; }
  },

  deleteCosmeticTypesItem: async (id) => {
    try {
      const { error } = await supabase.from('master_cosmetic_types').delete().eq('id', id);
      if (error) throw error;
      set((s) => ({ cosmeticTypes: s.cosmeticTypes.filter((i) => i.id !== id) }));
      return { success: true };
    } catch (err) { return { success: false, message: err.message }; }
  },

  // ─────────────────────────────────────────────────────────────
  // ② 포장재 분류 CRUD
  // ─────────────────────────────────────────────────────────────
  fetchPackagingTypes: async () => {
    const cfg = TABLE_CONFIGS.master_packaging_types;
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('master_packaging_types').select('*')
      .order(cfg.orderBy).order('created_at');
    if (!error) set({ packagingTypes: (data || []).map(cfg.fromDB) });
    else set({ error: error.message });
    set({ isLoading: false });
  },

  addPackagingTypesItem: async (data) => {
    const cfg = TABLE_CONFIGS.master_packaging_types;
    try {
      const { data: row, error } = await supabase
        .from('master_packaging_types').insert([cfg.toDB(data)]).select().single();
      if (error) throw error;
      set((s) => ({ packagingTypes: [...s.packagingTypes, cfg.fromDB(row)] }));
      return { success: true };
    } catch (err) { return { success: false, message: err.message }; }
  },

  updatePackagingTypesItem: async (id, data) => {
    const cfg = TABLE_CONFIGS.master_packaging_types;
    try {
      const { error } = await supabase
        .from('master_packaging_types').update(cfg.toDB(data)).eq('id', id);
      if (error) throw error;
      set((s) => ({
        packagingTypes: s.packagingTypes.map((item) =>
          item.id === id ? { ...item, ...cfg.fromDB({ ...cfg.toDB(data), id, created_at: item.createdAt }) } : item
        ),
      }));
      return { success: true };
    } catch (err) { return { success: false, message: err.message }; }
  },

  deletePackagingTypesItem: async (id) => {
    try {
      const { error } = await supabase.from('master_packaging_types').delete().eq('id', id);
      if (error) throw error;
      set((s) => ({ packagingTypes: s.packagingTypes.filter((i) => i.id !== id) }));
      return { success: true };
    } catch (err) { return { success: false, message: err.message }; }
  },

  // ─────────────────────────────────────────────────────────────
  // ③ 분리배출 표시 CRUD
  // ─────────────────────────────────────────────────────────────
  fetchRecycleMarks: async () => {
    const cfg = TABLE_CONFIGS.master_recycle_marks;
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('master_recycle_marks').select('*')
      .order(cfg.orderBy).order('created_at');
    if (!error) set({ recycleMarks: (data || []).map(cfg.fromDB) });
    else set({ error: error.message });
    set({ isLoading: false });
  },

  addRecycleMarksItem: async (data) => {
    const cfg = TABLE_CONFIGS.master_recycle_marks;
    try {
      const { data: row, error } = await supabase
        .from('master_recycle_marks').insert([cfg.toDB(data)]).select().single();
      if (error) throw error;
      set((s) => ({ recycleMarks: [...s.recycleMarks, cfg.fromDB(row)] }));
      return { success: true };
    } catch (err) { return { success: false, message: err.message }; }
  },

  updateRecycleMarksItem: async (id, data) => {
    const cfg = TABLE_CONFIGS.master_recycle_marks;
    try {
      const { error } = await supabase
        .from('master_recycle_marks').update(cfg.toDB(data)).eq('id', id);
      if (error) throw error;
      set((s) => ({
        recycleMarks: s.recycleMarks.map((item) =>
          item.id === id ? { ...item, ...cfg.fromDB({ ...cfg.toDB(data), id, created_at: item.createdAt }) } : item
        ),
      }));
      return { success: true };
    } catch (err) { return { success: false, message: err.message }; }
  },

  deleteRecycleMarksItem: async (id) => {
    try {
      const { error } = await supabase.from('master_recycle_marks').delete().eq('id', id);
      if (error) throw error;
      set((s) => ({ recycleMarks: s.recycleMarks.filter((i) => i.id !== id) }));
      return { success: true };
    } catch (err) { return { success: false, message: err.message }; }
  },

  // ─────────────────────────────────────────────────────────────
  // ④ 재활용 등급 CRUD (rank_order 사용 주의!)
  // ─────────────────────────────────────────────────────────────
  fetchRecyclabilityGrades: async () => {
    const cfg = TABLE_CONFIGS.master_recyclability_grades;
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('master_recyclability_grades').select('*')
      .order(cfg.orderBy);       // rank_order 로 정렬
    if (!error) set({ recyclabilityGrades: (data || []).map(cfg.fromDB) });
    else set({ error: error.message });
    set({ isLoading: false });
  },

  addRecyclabilityGradesItem: async (data) => {
    const cfg = TABLE_CONFIGS.master_recyclability_grades;
    try {
      const { data: row, error } = await supabase
        .from('master_recyclability_grades').insert([cfg.toDB(data)]).select().single();
      if (error) throw error;
      set((s) => ({ recyclabilityGrades: [...s.recyclabilityGrades, cfg.fromDB(row)] }));
      return { success: true };
    } catch (err) { return { success: false, message: err.message }; }
  },

  updateRecyclabilityGradesItem: async (id, data) => {
    const cfg = TABLE_CONFIGS.master_recyclability_grades;
    try {
      const { error } = await supabase
        .from('master_recyclability_grades').update(cfg.toDB(data)).eq('id', id);
      if (error) throw error;
      set((s) => ({
        recyclabilityGrades: s.recyclabilityGrades.map((item) =>
          item.id === id ? { ...item, ...cfg.fromDB({ ...cfg.toDB(data), id, created_at: item.createdAt }) } : item
        ),
      }));
      return { success: true };
    } catch (err) { return { success: false, message: err.message }; }
  },

  deleteRecyclabilityGradesItem: async (id) => {
    try {
      const { error } = await supabase.from('master_recyclability_grades').delete().eq('id', id);
      if (error) throw error;
      set((s) => ({ recyclabilityGrades: s.recyclabilityGrades.filter((i) => i.id !== id) }));
      return { success: true };
    } catch (err) { return { success: false, message: err.message }; }
  },

  // ─────────────────────────────────────────────────────────────
  // ⑤ KECO 평가기준 CRUD
  // ─────────────────────────────────────────────────────────────
  fetchKecoEvalRules: async () => {
    const cfg = TABLE_CONFIGS.master_keco_eval_rules;
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('master_keco_eval_rules').select('*')
      .order(cfg.orderBy).order('created_at');
    if (!error) set({ kecoEvalRules: (data || []).map(cfg.fromDB) });
    else set({ error: error.message });
    set({ isLoading: false });
  },

  addKecoEvalRulesItem: async (data) => {
    const cfg = TABLE_CONFIGS.master_keco_eval_rules;
    try {
      const { data: row, error } = await supabase
        .from('master_keco_eval_rules').insert([cfg.toDB(data)]).select().single();
      if (error) throw error;
      set((s) => ({ kecoEvalRules: [...s.kecoEvalRules, cfg.fromDB(row)] }));
      return { success: true };
    } catch (err) { return { success: false, message: err.message }; }
  },

  updateKecoEvalRulesItem: async (id, data) => {
    const cfg = TABLE_CONFIGS.master_keco_eval_rules;
    try {
      const { error } = await supabase
        .from('master_keco_eval_rules').update(cfg.toDB(data)).eq('id', id);
      if (error) throw error;
      set((s) => ({
        kecoEvalRules: s.kecoEvalRules.map((item) =>
          item.id === id ? { ...item, ...cfg.fromDB({ ...cfg.toDB(data), id, created_at: item.createdAt }) } : item
        ),
      }));
      return { success: true };
    } catch (err) { return { success: false, message: err.message }; }
  },

  deleteKecoEvalRulesItem: async (id) => {
    try {
      const { error } = await supabase.from('master_keco_eval_rules').delete().eq('id', id);
      if (error) throw error;
      set((s) => ({ kecoEvalRules: s.kecoEvalRules.filter((i) => i.id !== id) }));
      return { success: true };
    } catch (err) { return { success: false, message: err.message }; }
  },
}));

export default useMasterDataStore;
