// src/utils/pdfGenerator.js
import html2pdf from 'html2pdf.js';

/**
 * 주어진 HTML 요소를 A4 크기의 PDF로 변환하여 다운로드하는 함수입니다.
 * @param {HTMLElement} element - PDF로 변환할 대상 DOM 요소
 * @param {string} filename - 다운로드될 PDF 파일의 이름 (기본값: 'packaging-specification.pdf')
 */
export const generatePdf = async (element, filename = 'packaging-specification.pdf') => {
  // pdf 생성 옵션 설정 (내부 컴포넌트에서 이미 padding을 주었으므로 여백은 0으로 설정)
  const opt = {
    margin:       0,
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true }, 
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
    
    // 이미지 렌더링이 완전히 끝날 수 있도록 넉넉한 지연시간(700ms) 후 인쇄 대화상자를 엽니다.
    setTimeout(() => {
      printWindow.print();
      // 크롬/엣지 인쇄 버그(저장 중 무한대기) 방지를 위해 프로그래밍 강제 닫기를 수행하지 않습니다.
      // 인쇄 완료 후 팝업 창은 사용자가 수동으로 닫거나 창 뒤편에 남겨둡니다.
    }, 700);
  } else {
    // 팝업 차단이 설정된 경우 알림을 표시합니다.
    alert("팝업 차단이 설정되어 있습니다. 인쇄를 위해 팝업 차단을 해제해 주세요.");
  }
};
