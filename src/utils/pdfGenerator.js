// src/utils/pdfGenerator.js
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * 주어진 HTML 요소를 A4 크기의 PDF로 변환하여 다운로드하는 함수입니다.
 * @param {HTMLElement} element - PDF로 변환할 대상 DOM 요소
 * @param {string} filename - 다운로드될 PDF 파일의 이름 (기본값: 'packaging-specification.pdf')
 */
export const generatePdf = async (element, filename = 'packaging-specification.pdf') => {
  try {
    // 1. html2canvas로 화면 캡처
    const canvas = await html2canvas(element, {
      scale: 2,           // 해상도 2배로 선명하게
      useCORS: true,      // 외부 이미지(로고, 도장 등) CORS 허용
      logging: false,
    });

    // 2. 캡처된 canvas를 이미지 데이터로 변환
    const imgData = canvas.toDataURL('image/png');

    // 3. jsPDF 인스턴스 생성 (A4 세로 기준)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // 4. A4 용지 크기에 맞게 이미지 삽입
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // 비율을 유지하며 가로 길이를 꽉 채우고 세로는 내용만큼 잡기
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // 만약 내용이 A4 세로보다 길어지면 페이지가 넘어갈 수도 있지만 
    // 사양서는 보통 1페이지 이내로 설계됨.
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // 5. PDF 파일 저장
    pdf.save(filename);
  } catch (error) {
    console.error("PDF 생성 중 에러 발생:", error);
    alert("PDF 다운로드 중 오류가 발생했습니다.");
  }
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
