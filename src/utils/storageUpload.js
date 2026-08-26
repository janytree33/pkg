import { supabase } from '../lib/supabase';

export const uploadFileToStorage = async (file, bucketName = 'epr_documents') => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError.message);
      throw new Error(`파일 업로드 실패: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
      throw new Error('업로드된 파일의 공개 URL을 가져올 수 없습니다.');
    }

    return data.publicUrl;
  } catch (error) {
    console.error('File upload exception:', error);
    throw error;
  }
};
