const fs = require('fs');
const path = 'src/components/documents/SpecificationPreview.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Import useEprEvaluationStore
if (!content.includes('useEprEvaluationStore')) {
  content = content.replace(
    /import usePackagingStore from '\.\.\/\.\.\/stores\/packagingStore';/,
    "import usePackagingStore from '../../stores/packagingStore';\nimport useEprEvaluationStore from '../../stores/eprEvaluationStore';"
  );
}

// 2. Fetch linkedEprEval
if (!content.includes('const eprEvaluations = useEprEvaluationStore(state => state.evaluations);')) {
  content = content.replace(
    /const \{ packagingComponents \} = usePackagingStore\(\);/,
    "const { packagingComponents } = usePackagingStore();\n  const eprEvaluations = useEprEvaluationStore(state => state.evaluations);"
  );
  
  content = content.replace(
    /: \{ version: '1.0', bomItems: \[\] \};/,
    ": { version: '1.0', bomItems: [] };\n\n  const linkedEprEval = eprEvaluations.find(e => String(e.id) === String(version?.eprEvaluationId));"
  );
}

// 3. Fix the rendering logic to use linkedEprEval when it exists
const rowLogicOld = `
        let evalResult = comp.materialEvalResult || '미평가';
        
        // --- THIS PART IS WHAT I'M GOING TO REPLACE in the component directly, wait I should use replace_file_content for precision ---
`;

fs.writeFileSync(path + '.backup', content, 'utf8');
console.log('Setup basic imports');
