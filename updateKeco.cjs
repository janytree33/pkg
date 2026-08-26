const fs = require('fs');
const path = 'src/constants/kecoSchemas.js';
let content = fs.readFileSync(path, 'utf8');

const regex = /id:\s*'lc_composite',\s*name:\s*'몸체가 복합재질',\s*grades:\s*\{\s*'재활용 최우수\/우수':\s*\[[\s\S]*?\],\s*'재활용 어려움':\s*\[[\s\S]*?\],\s*'재활용 보통':\s*\[[\s\S]*?\]\s*\}/;

const replacement = `id: 'lc_composite',
            name: '몸체가 복합재질',
            grades: {
              '재활용 최우수/우수': [],
              '재활용 어려움': [
                { id: 'lc_c_4', text: 'PVC 계열의 재질' },
                { id: 'lc_c_5', text: '합성수지 이외 재질이 함유된 리드 또는 마개 등 쓰면서 빨대가 부착된 경우' },
                { id: 'lc_c_6', text: '몸체와 다른 재질로서 몸체와 분리 불가능한 경우' }
              ],
              '재활용 보통': [
                { id: 'lc_c_1', text: '미사용' },
                { id: 'lc_c_2', text: '직접 인쇄' },
                { id: 'lc_c_3', text: '몸체와 동일한 재질' },
                { id: 'lc_c_7', text: '몸체와 다른재질로서 몸체와 분리가 가능한 경우' },
                { id: 'lc_c_8', text: '몸체로부터 완전히 분리해야만 사용할 수 있는 속마개(리드)' },
                { id: 'lc_c_9', text: '관련법에 의한 어린이보호포장, 의약품 특수포장, 화장품 안전용기·포장을 위해 분리 불가능한 경우' }
              ]
            }`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Success with Regex /");
} else {
    // If it's using the dot instead of slash
    const regexDot = /id:\s*'lc_composite',\s*name:\s*'몸체가 복합재질',\s*grades:\s*\{\s*'재활용 최우수·우수':\s*\[[\s\S]*?\],\s*'재활용 어려움':\s*\[[\s\S]*?\],\s*'재활용 보통':\s*\[[\s\S]*?\]\s*\}/;
    if (regexDot.test(content)) {
        content = content.replace(regexDot, replacement.replace(/'재활용 최우수\/우수'/g, `'재활용 최우수·우수'`));
        fs.writeFileSync(path, content, 'utf8');
        console.log("Success with Regex ·");
    } else {
        console.log("Failed to match either pattern.");
    }
}
