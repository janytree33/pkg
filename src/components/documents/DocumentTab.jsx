import React, { useState, useRef } from 'react';
import { Eye, FileDown, Printer, History } from 'lucide-react';
import SpecificationPreview from './SpecificationPreview';
import { generatePdf, printDocument } from '../../utils/pdfGenerator';
import useDocumentStore from '../../stores/documentStore';
import { generateId } from '../../utils/constants';

/**
 * 사양서 발행을 위한 입력 폼과 실행 버튼(미리보기, PDF, 인쇄), 발행 이력을 포함하는 탭 컴포넌트입니다.
 */
const DocumentTab = ({ product }) => {
  // 문서 관리 스토어에서 기록 추가(addDocument) 및 조회(getDocumentsForProduct) 기능을 가져옵니다.
  const { addDocument, getDocumentsForProduct } = useDocumentStore();
  
  // 사용자가 폼에서 입력하는 값들을 저장하는 상태(State) 변수들입니다.
  const [versionIndex, setVersionIndex] = useState(0); // 선택한 제품 버전의 인덱스
  const [certNo, setCertNo] = useState(''); // 인증번호 (선택 입력)
  const [remark, setRemark] = useState('EPR 제출용'); // 비고 (기본값 적용)
  
  // 오늘 날짜를 'YYYY-MM-DD' 포맷으로 구하여 발행일 기본값으로 설정합니다.
  const today = new Date().toISOString().split('T')[0];
  const [issueDate, setIssueDate] = useState(today); 
  
  // A4 미리보기 화면을 화면에 노출할지 결정하는 상태입니다.
  const [showPreview, setShowPreview] = useState(false);

  // 화면에 보이지 않더라도 PDF 변환 및 인쇄를 하기 위해 미리보기 DOM에 직접 접근할 수 있는 Ref입니다.
  const previewRef = useRef(null);

  // 이 제품에 대해 과거에 발행된 문서 목록을 가져옵니다.
  const history = getDocumentsForProduct(product?.id);

  if (!product) return null;

  // 사용자가 선택한 버전의 상세 정보 객체입니다.
  const selectedVersion = product.versions && product.versions.length > 0 
    ? product.versions[versionIndex] 
    : { version: '1.0' };

  /**
   * [PDF 다운로드] 버튼 클릭 시 동작하는 함수입니다.
   */
  const handleDownloadPdf = async () => {
    if (previewRef.current) {
      // PDF 파일 이름 규칙: '제품코드_v버전_발행일(하이픈제거).pdf'
      const filename = `${product.code}_v${selectedVersion.version}_${issueDate.replace(/-/g, '')}.pdf`;
      
      // 스토어에 발행 내역을 저장합니다.
      addDocument({
        id: generateId(),
        productId: product.id,
        versionIndex,
        version: selectedVersion.version,
        certNo,
        remark,
        issueDate,
        type: 'PDF',
        filename,
        createdAt: new Date().toISOString()
      });

      // pdfGenerator의 함수를 호출하여 실제 PDF 파일을 생성하고 다운로드 받습니다.
      await generatePdf(previewRef.current, filename);
      alert('PDF 다운로드가 완료되었습니다.');
    }
  };

  /**
   * [인쇄하기] 버튼 클릭 시 동작하는 함수입니다.
   */
  const handlePrint = () => {
    if (previewRef.current) {
      // 스토어에 인쇄 기록을 저장합니다.
      addDocument({
        id: generateId(),
        productId: product.id,
        versionIndex,
        version: selectedVersion.version,
        certNo,
        remark,
        issueDate,
        type: 'PRINT',
        filename: '인쇄 출력',
        createdAt: new Date().toISOString()
      });

      // pdfGenerator의 인쇄 함수를 호출하여 새 창으로 인쇄 화면을 띄웁니다.
      printDocument(previewRef.current);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      
      {/* 1. 문서 발행 폼 영역 */}
      <div className="bg-white p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
          <FileDown className="mr-2 h-6 w-6 text-brand-500" />
          용기 사양서 발행
        </h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* 버전 선택란 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">버전 선택</label>
            <select
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
              value={versionIndex}
              onChange={(e) => setVersionIndex(Number(e.target.value))}
            >
              {product.versions?.map((ver, idx) => (
                <option key={idx} value={idx}>
                  버전 {ver.version} ({ver.components?.length || 0}개 부품)
                </option>
              ))}
            </select>
          </div>
          
          {/* 발행일 선택란 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">발행일</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>
          
          {/* 인증번호 입력란 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">인증번호 (선택)</label>
            <input
              type="text"
              placeholder="비워두면 공란으로 발행됩니다"
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
              value={certNo}
              onChange={(e) => setCertNo(e.target.value)}
            />
          </div>
          
          {/* 비고 입력란 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비고 내용</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>
        </div>

        {/* 2. 실행 버튼 영역 (미리보기, PDF, 인쇄) */}
        <div className="flex space-x-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded flex items-center justify-center transition-colors"
          >
            <Eye className="mr-2 h-5 w-5" />
            {showPreview ? '미리보기 닫기' : '보고서 미리보기'}
          </button>
          <button
            onClick={handleDownloadPdf}
            className="flex-1 bg-brand-400 text-white font-bold tracking-wide shadow-sm hover:shadow-md hover:bg-brand-500 text-white font-medium py-2 px-4 rounded flex items-center justify-center transition-colors shadow-sm"
          >
            <FileDown className="mr-2 h-5 w-5" />
            PDF 다운로드
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded flex items-center justify-center transition-colors shadow-sm"
          >
            <Printer className="mr-2 h-5 w-5" />
            인쇄하기
          </button>
        </div>
      </div>

      {/* 3. A4 문서 미리보기 영역 (토글 기능 적용) */}
      {showPreview && (
        <div className="p-6 bg-gray-200 overflow-auto flex justify-center border-b border-gray-300" style={{ height: '500px' }}>
          {/* 흰색 종이 배경 효과를 줍니다 */}
          <div className="shadow-lg bg-white">
            <SpecificationPreview
              ref={previewRef}
              product={product}
              versionIndex={versionIndex}
              certNo={certNo}
              remark={remark}
              issueDate={issueDate}
            />
          </div>
        </div>
      )}
      
      {/* 화면상 미리보기가 닫혀 있어도, PDF/인쇄 출력을 캡처하기 위해 보이지 않는 곳에 렌더링을 유지합니다. */}
      {!showPreview && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <SpecificationPreview
            ref={previewRef}
            product={product}
            versionIndex={versionIndex}
            certNo={certNo}
            remark={remark}
            issueDate={issueDate}
          />
        </div>
      )}

      {/* 4. 문서 발행 이력 (History) 테이블 영역 */}
      <div className="flex-1 bg-white p-6 overflow-auto">
        <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
          <History className="mr-2 h-5 w-5 text-gray-500" />
          문서 발행 이력
        </h3>
        
        {history.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">발행일시</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">버전</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">파일명 / 비고</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* 배열을 역순으로 돌려 최신 기록이 맨 위에 보이도록 합니다. */}
              {[...history].reverse().map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(doc.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {/* PDF인지 인쇄인지에 따라 뱃지 색상을 다르게 적용합니다. */}
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      doc.type === 'PDF' ? 'bg-brand-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {doc.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">v{doc.version}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {doc.filename}
                    <div className="text-xs text-gray-400 mt-1">{doc.remark}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            아직 이 제품에 대해 발행된 사양서 기록이 없습니다.
          </div>
        )}
      </div>
      
    </div>
  );
};

export default DocumentTab;
