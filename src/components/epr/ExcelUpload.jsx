import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import useEprStore from '../../stores/eprStore';

/**
 * ExcelUpload.jsx
 * ─────────────────────────────────────
 * 1단계: 생산실적 업로드 탭
 * 사용자가 엑셀 파일을 업로드하면 데이터를 파싱하여 스토어에 저장합니다.
 */
export default function ExcelUpload({ onNextStep }) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [error, setError] = useState('');

  const addProductionReport = useEprStore(state => state.addProductionReport);

  // 엑셀 파싱 및 데이터 읽기
  const processExcelFile = (file) => {
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        // 엑셀 읽기
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // JSON으로 변환 (첫 행을 헤더로 사용)
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          setError('엑셀 파일에 데이터가 없습니다.');
          return;
        }

        setFileInfo({ name: file.name, size: file.size, rows: jsonData.length });
        // 미리보기를 위해 처음 10행만 저장
        setPreviewData(jsonData.slice(0, 10));
        
        // 전체 데이터를 스토어에 저장하기 위해 임시 보관
        fileInfo.data = jsonData;
      } catch (err) {
        console.error(err);
        setError('엑셀 파일을 읽는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        processExcelFile(file);
      } else {
        setError('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
      }
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processExcelFile(e.target.files[0]);
    }
  };

  const handleSave = () => {
    if (fileInfo && fileInfo.data) {
      // 스토어에 데이터 저장
      const report = {
        fileName: fileInfo.name,
        year: year,
        totalRows: fileInfo.rows,
        data: fileInfo.data
      };
      
      addProductionReport(report);
      
      // 다음 단계(매핑)로 이동
      if (onNextStep) onNextStep();
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">생산실적 업로드</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          화장품협회 양식이나 자체 생산실적 엑셀 파일을 업로드해주세요. 품목명 기준으로 시스템과 자동 매핑됩니다.
        </p>
      </div>

      {!fileInfo ? (
        // 드래그 앤 드롭 영역
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
            ${isDragging 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => document.getElementById('excel-upload').click()}
        >
          <input
            id="excel-upload"
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            엑셀 파일을 이곳에 드래그하거나 클릭하여 선택하세요
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            지원 형식: .xlsx, .xls
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      ) : (
        // 업로드 성공 및 데이터 미리보기 영역
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{fileInfo.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  총 {fileInfo.rows}행 데이터 로드 완료
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">신고 연도</label>
                <input 
                  type="number" 
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-24 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                />
              </div>
              <button 
                onClick={handleSave}
                className="flex-1 md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                저장 및 매핑 시작
              </button>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">데이터 미리보기 (최대 10행)</h4>
              <button 
                onClick={() => { setFileInfo(null); setPreviewData([]); }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                다른 파일 선택
              </button>
            </div>
            <div className="overflow-x-auto max-h-80">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                  <tr>
                    {previewData.length > 0 && Object.keys(previewData[0]).map((key, idx) => (
                      <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {previewData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      {Object.values(row).map((val, colIndex) => (
                        <td key={colIndex} className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300 whitespace-nowrap">
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
