import XLSX from 'xlsx';

function readExcel(filename) {
  console.log(`\n--- Reading ${filename} ---`);
  try {
    const workbook = XLSX.readFile(filename);
    console.log('Sheets:', workbook.SheetNames);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log('Headers (Row 1):', data[0]);
    console.log('Sample Data (Row 2):', data[1]);
  } catch (e) {
    console.error('Error reading file:', e.message);
  }
}

readExcel('완제품 등록.xlsx');
readExcel('중량산출_기초자료_엑셀업로드_샘플.xlsx');
