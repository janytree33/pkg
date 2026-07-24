/**
 * EprExemptionPanel.jsx
 * ─────────────────────────────────────
 * EPR 면제조건 & 의무생산자 판정 기준 안내 패널 (개선버전)
 * 『자원재활용법 시행령』 별표 4 법령 기준 완전 반영
 */
import { Scale, Package, ExternalLink, AlertTriangle, CheckCircle, XCircle, Info, FileText } from 'lucide-react';
import { EPR_MATERIAL_GROUPS, CONTAINER_TYPE_MAP } from '../../utils/constants';

export default function EprExemptionPanel() {
  return (
    <div className="space-y-6">

      {/* ─── 1. 매출액 기준 전체 면제 ─── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          🏢 1단계: 사업장 규모(매출액) 기준 면제
          <span className="text-xs font-normal text-slate-400">(최우선 확인)</span>
        </h3>
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 mb-4">
          <Info size={13} className="inline mr-1" />
          아래 조건 중 하나라도 해당하면 <strong>출고량과 무관하게 모든 포장재 분담금 100% 면제</strong>입니다.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="text-2xl mb-2">🏭</div>
            <div className="font-semibold text-emerald-800 text-sm mb-1">국내 제조업자</div>
            <div className="text-xs text-emerald-700 mb-3">(OEM 위탁 상표권자 포함)</div>
            <div className="text-2xl font-bold text-emerald-700">10억원 미만</div>
            <div className="text-xs text-emerald-600 mt-1">전년도 연간 총매출액 기준</div>
          </div>
          <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
            <div className="text-2xl mb-2">🛳️</div>
            <div className="font-semibold text-cyan-800 text-sm mb-1">수입업자</div>
            <div className="text-xs text-cyan-700 mb-3">(CIF 관세청 총수입신고액 기준)</div>
            <div className="text-2xl font-bold text-cyan-700">3억원 미만</div>
            <div className="text-xs text-cyan-600 mt-1">전년도 연간 총수입액 기준</div>
          </div>
        </div>
      </div>

      {/* ─── 2. 재질별 출고량 기준 면제 ─── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
          📊 2단계: 포장재 재질별 연간 출고량 기준 면제
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          매출액이 기준 이상이더라도, <strong>각 재질의 연간 출고량이 아래 기준 미만</strong>이면 해당 재질에 대한 분담금이 면제됩니다.
          재질별로 독립적으로 판정합니다.
        </p>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap w-[25%]">재질 구분</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 whitespace-nowrap w-[15%]">면제 기준</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 w-[30%]">화장품 적용 예시</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 w-[30%]">앱 내 재질 선택값</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {EPR_MATERIAL_GROUPS.map((group) => (
                <tr key={group.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{group.icon}</span>
                      <span className="font-semibold text-slate-800 text-sm">{group.label}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <div
                      className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
                      style={{ backgroundColor: group.bgColor, color: group.color, border: `1px solid ${group.borderColor}` }}
                    >
                      {group.exemptionTonnes}톤 미만
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">{(group.exemptionTonnes * 1000).toLocaleString()}kg 미만</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{group.examples}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {group.materials.map(m => (
                        <code key={m} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{m}</code>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}

              {/* EPR 제외 항목 */}
              <tr className="bg-slate-50/50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-lg">📦</span>
                    <span className="font-semibold text-slate-500 text-sm line-through">일반 종이 단상자</span>
                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">EPR 대상 아님</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-xs text-slate-400">—</td>
                <td className="px-4 py-3 text-xs text-slate-400">겉상자, 골판지, 쇼핑백 등 일반 종이류</td>
                <td className="px-4 py-3">
                  <code className="text-[10px] bg-red-50 text-red-400 px-1.5 py-0.5 rounded">Paper (단상자/제외)</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 주의사항: 단상자 부속 플라스틱 */}
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-800">
              <p className="font-bold mb-2">⚠️ 종이 단상자 관련 주의사항 (실무)</p>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-red-500 font-bold shrink-0">❌ 신고 안 함:</span>
                  <span>종이 단상자 자체, 설명서, 택배 박스, 종이 쇼핑백</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">✅ 신고 필요:</span>
                  <span>단상자에 붙은 <strong>투명 PET 창문 필름</strong> → BOM에 <code className="bg-amber-100 px-1 rounded">PET</code> 재질로 등록</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">✅ 신고 필요:</span>
                  <span>단상자 겉면 <strong>수축 비닐 래핑</strong> → BOM에 <code className="bg-amber-100 px-1 rounded">Film/Sheet (필름/수축비닐)</code>로 등록</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">✅ 신고 필요:</span>
                  <span>유리병의 <strong>플라스틱 캡·펌프·스포이드</strong> → BOM에 <code className="bg-amber-100 px-1 rounded">PP</code> 또는 <code className="bg-amber-100 px-1 rounded">PE</code>로 등록</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. 의무생산자 판정 기준 (자사/타사) ─── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Scale size={18} className="text-emerald-500" />
          의무생산자 판정 기준 (자사/타사 구분)
        </h3>

        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg mb-4">
          <div className="flex items-start gap-2">
            <FileText size={14} className="text-blue-500 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-semibold">법적 근거</p>
              <p>『자원의 절약과 재활용촉진에 관한 법률 시행령』 제18조 (의무생산자의 범위)</p>
              <p className="mt-1 text-blue-600">
                출처: <a onClick={() => window.open('/docs/epr_guide.pdf', '_blank')} className="underline hover:text-blue-800 font-medium cursor-pointer">한국환경공단 EPR 가이드북 다운로드 <ExternalLink size={12} className="inline mb-0.5" /></a>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <CheckCircle size={18} className="text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800 text-sm">✅ 신고 대상 — 자사 브랜드 (상표권 보유)</p>
              <p className="text-xs text-emerald-700 mt-1">
                자사 상표로 판매하는 제품. <strong>직접 제조 또는 OEM 위탁 제조 모두 포함</strong>.
                상표권을 자사가 소유하므로 EPR 출고실적 신고 의무가 있습니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <XCircle size={18} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-slate-600 text-sm">🚫 신고 제외 — 타사 OEM/ODM 단순 납품</p>
              <p className="text-xs text-slate-500 mt-1">
                타사 상표를 부착하여 주문생산(OEM)하여 납품하는 경우, 해당 제품의 출고실적은 상표권을 소유한 위탁자(주문자)가 신고합니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <XCircle size={18} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-slate-600 text-sm">🚫 신고 제외 — 타사 브랜드 사입/유통</p>
              <p className="text-xs text-slate-500 mt-1">
                이미 제조사/상표권자가 출고 신고를 마친 완제품을 사와서 단순 유통만 하는 경우 신고 대상에서 제외됩니다.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <a
            href="https://pub.keco.or.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
          >
            <ExternalLink size={14} />
            자원순환통합징수포털 → 고객센터 → 자료실에서 가이드북 확인
          </a>
        </div>
      </div>

      {/* ─── 4. 화장품 용기 EPR 품목코드 안내 ─── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Package size={18} className="text-emerald-500" />
          화장품 용기 EPR 품목코드 안내
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          포장재 등록 시 용기 형태를 선택하면 EPR 품목코드가 자동 매핑됩니다.
        </p>
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">용기 형태</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 w-24">품목코드</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">설명</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {CONTAINER_TYPE_MAP.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-slate-800 text-sm">{item.label}</td>
                  <td className="px-4 py-2.5 text-center">
                    <code className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-mono font-bold border border-emerald-100">
                      {item.code}
                    </code>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{item.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">
            <strong>유리병 제품 주의:</strong> 유리병 자체는 유리병 코드(0210/0220)로 신고하되,
            플라스틱 캡·펌프·스포이드 등 부속품의 플라스틱 중량은 합성수지(0450 등)로 별도 합산하여 신고해야 합니다.
          </p>
        </div>
      </div>

    </div>
  );
}
