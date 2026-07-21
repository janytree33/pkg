// src/utils/pdfGenerator.js
import html2pdf from 'html2pdf.js';

/**
 * 주어진 HTML 요소를 A4 크기의 PDF로 변환하여 다운로드하는 함수입니다.
 * @param {HTMLElement} element - PDF로 변환할 대상 DOM 요소
 * @param {string} filename - 다운로드될 PDF 파일의 이름 (기본값: 'packaging-specification.pdf')
 */
export const generatePdf = async (element, filename = 'packaging-specification.pdf') => {
  // pdf 생성 옵션 설정 (A4 기준 여백 15mm)
  const opt = {
    margin:       15,
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 }, // 화질을 높이기 위해 scale을 2로 설정합니다.
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // html2pdf 라이브러리를 통해 화면 요소를 캡처하고 PDF로 저장합니다.
  await html2pdf().set(opt).from(element).save();
};

/**
 * 주어진 HTML 요소의 내용을 새 창에 띄워 인쇄 화면을 호출하는 함수입니다.
 * @param {HTMLElement} element - 인쇄할 대상 DOM 요소
 */
export const printDocument = (element) => {
  // 인쇄를 위한 빈 새 창을 엽니다.
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    // 새 창에 인쇄 전용 스타일과 함께 요소의 내용을 복사하여 넣습니다.
    printWindow.document.write(`
      <html>
        <head>
          <title>문서 인쇄</title>
          <style>
            /* 인쇄 시 여백 및 페이지 크기(A4 세로) 설정 */
            @page { size: A4 portrait; margin: 15mm; }
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body>
          ${element.outerHTML}
        </body>
      </html>
    `);
    
    // 문서 쓰기 종료 (렌더링 시작)
    printWindow.document.close();
    printWindow.focus();
    
    // 내용이 완전히 렌더링될 수 있도록 아주 짧은 지연시간 후 인쇄 대화상자를 엽니다.
    setTimeout(() => {
      printWindow.print();
      printWindow.close(); // 인쇄 완료 후 창 닫기
    }, 250);
  } else {
    // 팝업 차단이 설정된 경우 알림을 표시합니다.
    alert("팝업 차단이 설정되어 있습니다. 인쇄를 위해 팝업 차단을 해제해 주세요.");
  }
};
