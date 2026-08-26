const fs = require('fs');
const path = 'src/constants/kecoSchemas.js';
let content = fs.readFileSync(path, 'utf8');

const schema07 = `
  '07': [
    {
      id: 'body',
      name: '몸체',
      parts: [
        {
          id: 'b_all',
          name: '공통',
          grades: {
            '재활용 최우수/우수': [
              { id: 'p_b_1', text: '단일재질 무색(먹는샘물, 음료류)' },
              { id: 'p_b_2', text: '경량화지수 1이하' },
              { id: 'p_b_3', text: '경량화지수 1초과' },
              { id: 'p_b_4', text: '단일재질 무색(먹는샘물, 음료류 제외)' }
            ],
            '재활용 어려움': [
              { id: 'p_b_5', text: '녹색 이외의 유색(먹는샘물, 음료류 제외)' },
              { id: 'p_b_6', text: '글리콜변성PET 수지(PET-G) 재질이 혼합된 경우' },
              { id: 'p_b_7', text: '유색 페트병(먹는샘물, 음료류)' },
              { id: 'p_b_8', text: '복합재질' }
            ],
            '재활용 보통': [
              { id: 'p_b_9', text: '단일재질 녹색(먹는샘물, 음료류 제외)' }
            ]
          }
        }
      ]
    },
    {
      id: 'label',
      name: '라벨',
      parts: [
        {
          id: 'l_all',
          name: '공통',
          grades: {
            '재활용 최우수/우수': [
              { id: 'p_l_1', text: '미사용' },
              { id: 'p_l_2', text: '병마개 부착 라벨을 사용한 경우' },
              { id: 'p_l_3', text: '비중 1미만의 합성수지 재질로 소비자가 손쉽게 분리 가능하도록 하는 구조(절취선 또는 접(점)착제 도포시 가장자리 미도포)' },
              { id: 'p_l_4', text: '비접(점)착식' },
              { id: 'p_l_5', text: '라벨면적의 0.5% 범위 미만으로 열알칼리성 분리 접(점)착제가 도포된 경우' },
              { id: 'p_l_6', text: '열알칼리성 분리 접(점)착제를 사용하고 접(점)착제 도포면적이 페트병 전체면적의 20%, 라벨면적의 60% 이하인 경우' },
              { id: 'p_l_7', text: '몸체와 동일한 재질의 비접(점)착식으로 재활용공정에서 분리가 가능한 열알칼리성 분리잉크를 사용한 경우' }
            ],
            '재활용 어려움': [
              { id: 'p_l_8', text: '소비자가 손쉽게 분리 가능하도록 하는 구조가 없는 비중 1이상의 합성수지 재질' },
              { id: 'p_l_9', text: '열알칼리성 분리가 불가능한 접(점)착제 사용' },
              { id: 'p_l_10', text: '몸체에 직접 인쇄(유통기간 및 제조일자 표시 제외)' },
              { id: 'p_l_11', text: 'PVC 계열의 재질' },
              { id: 'p_l_12', text: '합성수지 이외의 재질' },
              { id: 'p_l_13', text: '금속혼입재질' }
            ],
            '재활용 보통': [
              { id: 'p_l_14', text: '비중 1미만의 합성수지 재질로 열알칼리성 분리 접(점)착제를 사용하고 접(점)착제 도포면적이 페트병 전체면적의 20%, 라벨면적의 60%를 초과한 경우' },
              { id: 'p_l_15', text: '비중 1미만의 합성수지 재질로 열알칼리성 분리 접(점)착제를 사용하고 접(점)착제 도포면적이 페트병 전체면적의 20%, 라벨면적의 60% 이하이나 가장자리를 도포한 경우' },
              { id: 'p_l_16', text: '비중 1미만의 합성수지 재질로 절취선이 없는 비접(점)착식' },
              { id: 'p_l_17', text: '비중 1 이상의 합성수지 재질로 소비자가 손쉽게 분리 가능하도록 하는 구조(절취선 또는 접(점)착제 도포시 가장자리 미도포)' },
              { id: 'p_l_18', text: '관련법에 의한 어린이 보호포장, 의약품 특수포장, 화장품 안전용기·포장을 위해 분리 불가능한 경우' }
            ]
          }
        }
      ]
    },
    {
      id: 'cap',
      name: '마개 및 잡자재',
      parts: [
        {
          id: 'c_all',
          name: '공통',
          grades: {
            '재활용 최우수/우수': [
              { id: 'p_c_1', text: '비중 1미만의 합성수지' },
              { id: 'p_c_2', text: '무색 페트 단일재질' }
            ],
            '재활용 어려움': [
              { id: 'p_c_3', text: '비중 1이상의 합성수지(무색 페트 단일재질 제외)' },
              { id: 'p_c_4', text: 'PVC 계열의 재질' },
              { id: 'p_c_5', text: '합성수지 이외의 재질' }
            ],
            '재활용 보통': [
              { id: 'p_c_6', text: '합성수지 이외의 재질이 포함된 비중 1미만의 잡자재' },
              { id: 'p_c_7', text: '합성수지 이외의 재질로 구성된 부분이 몸체, 마개 모두와 분리가 가능한 경우' },
              { id: 'p_c_8', text: '몸체로부터 완전히 분리해야만 사용할 수 있는 속마개(리드) 사용' },
              { id: 'p_c_9', text: '관련법에 의한 어린이 보호포장, 의약품 특수포장, 화장품 안전용기·포장을 위해 분리 불가능한 경우' }
            ]
          }
        }
      ]
    },
`;

// Insert it right after the start of KECO_SCHEMAS = {
const targetIdx = content.indexOf('export const KECO_SCHEMAS = {') + 'export const KECO_SCHEMAS = {'.length;
content = content.substring(0, targetIdx) + schema07 + content.substring(targetIdx);
fs.writeFileSync(path, content, 'utf8');
console.log('Success');
