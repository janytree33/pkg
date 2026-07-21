/**
 * EprExemptionPanel.jsx
 * ─────────────────────────────────────
 * EPR 면제조건 & 의무생산자 판정 기준 안내 패널
 * 법적 근거와 화장품 용기 EPR 품목코드 안내 포함
 */
import { Shield, Scale, Package, ExternalLink, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { EPR_EXEMPTION_CONDITIONS, CONTAINER_TYPE_MAP } from '../../utils/constants';

export default function EprExemptionPanel() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── 면제조건 카드 ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EPR_EXEMPTION_CONDITIONS.map((condition, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20
                       border border-green-200 dark:border-green-800 rounded-xl p-5"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{condition.icon}</span>
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-300 mb-1">
                  {condition.title}
                </h4>
                <p className="text-sm text-green-700 dark:text-green-400 mb-2">
                  {condition.condition}
                </p>
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/40 
                                text-green-800 dark:text-green-300 rounded-full text-xs font-bold">
                  <CheckCircle size={12} />
                  {condition.result}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── 의무생산자 판정 기준 ─── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-card">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Scale size={20} className="text-brand-500" />
          의무생산자 판정 기준 (자사/타사 구분)
        </h3>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-semibold mb-1">법적 근거</p>
              <p>자원의 절약과 재활용촉진에 관한 법률 시행령 제18조 (의무생산자의 범위)</p>
              <p className="mt-1">출처: 한국환경공단 『EPR 출고·수입실적서 제출 안내 가이드북』</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {/* 신고 대상 */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
            <CheckCircle size={18} className="text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300 text-sm">
                ✅ 신고 대상 — 자사 브랜드 (상표권 보유)
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                자사 상표로 판매하는 제품. 직접 제조 또는 OEM 위탁 제조 모두 포함.
                상표권을 자사가 소유하므로 EPR 출고실적 신고 의무가 있습니다.
              </p>
            </div>
          </div>

          {/* 신고 제외 1 */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700">
            <XCircle size={18} className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-slate-600 dark:text-slate-400 text-sm">
                🚫 신고 제외 — 타사 OEM/ODM 단순 납품
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                타사 상표를 부착하여 주문생산(OEM)하여 납품하는 경우,
                해당 제품의 출고실적은 상표권을 소유한 위탁자(주문자)가 신고합니다.
              </p>
            </div>
          </div>

          {/* 신고 제외 2 */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700">
            <XCircle size={18} className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-slate-600 dark:text-slate-400 text-sm">
                🚫 신고 제외 — 타사 브랜드 사입/유통
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                이미 제조사/상표권자가 출고 신고를 마친 완제품을 사와서
                단순 유통만 하는 경우 신고 대상에서 제외됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 확인 링크 */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <a
            href="https://pub.keco.or.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 
                       hover:text-brand-700 dark:hover:text-brand-300"
          >
            <ExternalLink size={14} />
            자원순환통합징수포털 → 고객센터 → 자료실에서 가이드북 확인
          </a>
        </div>
      </div>

      {/* ─── 화장품 용기 EPR 품목코드 안내 ─── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-card">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Package size={20} className="text-brand-500" />
          화장품 용기 EPR 품목코드 안내
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          포장재 등록 시 용기 형태를 선택하면 아래 표에 따라 EPR 품목코드가 자동 매핑됩니다.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50">
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">용기 형태</th>
                <th className="text-center px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400 w-24">품목코드</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">설명</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {CONTAINER_TYPE_MAP.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                    {item.label}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="inline-block px-2 py-0.5 bg-brand-100 dark:bg-brand-900/30 
                                     text-brand-700 dark:text-brand-400 rounded text-xs font-mono font-bold">
                      {item.code}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                    {item.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 팁 */}
        <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <strong>참고:</strong> 유리병 제품이라도 플라스틱 캡, 펌프, 스포이드 등 부속품의 플라스틱 중량은
            합산하여 EPR 신고에 포함해야 합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
