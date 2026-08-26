import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const useEprEvaluationStore = create((set, get) => ({
  evaluations: [],
  isLoaded: false,

  fetchData: async () => {
    try {
      const { data, error } = await supabase
        .from('epr_evaluations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('EPR 평가결과 로드 에러:', error);
        set({ isLoaded: true });
        return;
      }

      const formatted = (data || []).map(item => ({
        id: String(item.id),
        certNo: item.cert_no || '',
        evalName: item.eval_name || '',
        evalGrade: item.eval_grade || '미평가',
        resultPdfUrl: item.result_pdf_url || '',
        componentIds: item.component_ids || [],
        representativeImageUrl: item.representative_image_url || '',
        vendorDocs: item.vendor_docs || [],
        kecoDocs: item.keco_docs || [],
        kecoEvaluationData: item.keco_evaluation_data || {},
        createdAt: item.created_at,
      }));

      set({ evaluations: formatted, isLoaded: true });
    } catch (err) {
      console.error('fetchData 예외:', err);
      set({ isLoaded: true });
    }
  },

  addEvaluation: async (evaluation) => {
    const payload = {
      cert_no: evaluation.certNo,
      eval_name: evaluation.evalName,
      eval_grade: evaluation.evalGrade || '미평가',
      result_pdf_url: evaluation.resultPdfUrl || '',
      component_ids: evaluation.componentIds || [],
      representative_image_url: evaluation.representativeImageUrl || '',
      vendor_docs: evaluation.vendorDocs || [],
      keco_docs: evaluation.kecoDocs || [],
      keco_evaluation_data: evaluation.kecoEvaluationData || {}
    };

    const { data, error } = await supabase
      .from('epr_evaluations')
      .insert([payload])
      .select()
      .single();

    if (error) {
      alert("평가 결과 등록에 실패했습니다: " + error.message);
      return null;
    }

    if (data) {
      const newEval = {
        id: String(data.id),
        certNo: data.cert_no,
        evalName: data.eval_name,
        evalGrade: data.eval_grade,
        resultPdfUrl: data.result_pdf_url,
        componentIds: data.component_ids || [],
        representativeImageUrl: data.representative_image_url,
        vendorDocs: data.vendor_docs || [],
        kecoDocs: data.keco_docs || [],
        kecoEvaluationData: data.keco_evaluation_data || {},
        createdAt: data.created_at,
      };
      
      set(state => ({ evaluations: [newEval, ...state.evaluations] }));
      return newEval;
    }
    return null;
  },

  updateEvaluation: async (id, updates) => {
    const payload = {
      cert_no: updates.certNo,
      eval_name: updates.evalName,
      eval_grade: updates.evalGrade,
      result_pdf_url: updates.resultPdfUrl,
      component_ids: updates.componentIds,
      representative_image_url: updates.representativeImageUrl,
      vendor_docs: updates.vendorDocs,
      keco_docs: updates.kecoDocs,
      keco_evaluation_data: updates.kecoEvaluationData,
      updated_at: new Date().toISOString()
    };

    // Remove undefined
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    const { error } = await supabase
      .from('epr_evaluations')
      .update(payload)
      .eq('id', id);

    if (error) {
      alert("평가 결과 수정에 실패했습니다: " + error.message);
      return false;
    }

    set(state => ({
      evaluations: state.evaluations.map(e => String(e.id) === String(id) ? { ...e, ...updates } : e)
    }));

    return true;
  },

  deleteEvaluation: async (id) => {
    const { error } = await supabase.from('epr_evaluations').delete().eq('id', id);
    if (error) {
      alert("삭제 실패: " + error.message);
      return false;
    }
    
    set(state => ({
      evaluations: state.evaluations.filter(e => String(e.id) !== String(id))
    }));
    return true;
  }
}));

export default useEprEvaluationStore;
