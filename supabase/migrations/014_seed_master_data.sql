-- ============================================================
-- 014_seed_master_data.sql (v2 — 실제 DB 스키마 맞춤 수정본)
-- 기준관리 MDM — 5개 마스터 테이블 표준 시드 데이터
--
-- 확인된 실제 컬럼 구조:
--   master_cosmetic_types     : category_main, name_kr, name_en, sort_order, is_active
--   master_packaging_types    : packaging_group, sub_category, name_kr, name_en, description, sort_order
--   master_recycle_marks      : main_category, material_code, name_kr, name_en,
--                               color_code, display_text, exemption_condition, mark_icon_url, sort_order
--   master_recyclability_grades: code, grade_kr, grade_en, rank_order, surcharge_info, summary
--   master_keco_eval_rules    : keco_code, eval_part, criteria_kr, criteria_en,
--                               result_grade, legal_basis, sort_order
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- 1. master_cosmetic_types — 화장품법 유형 분류
--    근거: 화장품법 시행규칙 [별표 3]
-- ══════════════════════════════════════════════════════════════
INSERT INTO master_cosmetic_types
  (category_main, name_kr, name_en, sort_order, is_active)
VALUES
  ('기초화장품류',  '기초화장용 제품류',       'Skin Care Products',                   10, true),
  ('기초화장품류',  '눈 화장용 제품류',         'Eye Makeup Products',                  20, true),
  ('색조화장품류',  '색조화장용 제품류',         'Color Makeup Products',                30, true),
  ('모발관리류',    '두발용 제품류',             'Hair Care Products',                   40, true),
  ('모발관리류',    '두발 염색용 제품류',         'Hair Coloring Products',               50, true),
  ('세정류',       '인체 세정용 제품류',         'Body Cleansing Products',              60, true),
  ('세정류',       '목욕용 제품류',              'Bath Products',                        70, true),
  ('영유아류',     '영·유아용 제품류',           'Products for Infants and Children',    80, true),
  ('방향류',       '방향용 제품류',              'Perfume and Fragrance Products',       90, true),
  ('네일류',       '손발톱용 제품류',            'Nail Care Products',                  100, true),
  ('면도류',       '면도용 제품류',              'Shaving Products',                    110, true),
  ('체취방지류',   '체취 방지용 제품류',          'Deodorant and Antiperspirant Products',120, true),
  ('제모류',       '체모 제거용 제품류',          'Hair Removal Products',               130, true),
  ('기능성화장품', '기능성화장품',               'Functional Cosmetics',                140, true)
;


-- ══════════════════════════════════════════════════════════════
-- 2. master_packaging_types — 포장재 분류
--    근거: EPR 포장재 재활용의무 이행 고시
-- ══════════════════════════════════════════════════════════════
INSERT INTO master_packaging_types
  (packaging_group, sub_category, name_kr, name_en, description, sort_order)
VALUES
  ('1차포장', '본체류',     '용기',         'Container',             '내용물이 직접 담기는 본체 용기. 유리병, PET병, PP·PE 단지, 에어리스 용기 등.',       10),
  ('1차포장', '마개류',     '캡/뚜껑',      'Cap / Lid',             '용기 입구를 막는 마개류. 스크류 캡, 힌지 캡, 플립톱 캡, 오버캡 등.',               20),
  ('1차포장', '마개·펌프류','펌프/스프레이', 'Pump / Spray Head',    '내용물을 펌핑·분사 방식으로 배출하는 장치. 로션 펌프, 폼 펌프, 미스트 스프레이 등.',  30),
  ('2차포장', '외포장류',   '단상자',        'Folding Carton',       '1차 용기를 담는 종이 상자. EPR 신고 대상 제외 재질(일반 종이).',                   40),
  ('2차포장', '외포장류',   '라벨',          'Label',                '용기 외면에 부착되는 라벨. 종이 라벨, PP·PET 필름 라벨, 수축 슬리브 등.',            50),
  ('2차포장', '외포장류',   '수축필름',      'Shrink Film',          '제품 외면을 감싸는 수축 포장 필름. PE·PVC 수축 필름.',                             60),
  ('2차포장', '동봉물',     '설명서',        'Package Insert',       '제품 사용방법·전성분 등을 기재한 종이 설명서. EPR 신고 제외.',                      70),
  ('1차포장', '마개·펌프류','스포이드',      'Dropper / Pipette',    '앰플·에센스 등에 사용되는 스포이드·드로퍼 조립품.',                                 80),
  ('기타',   '완충·보호재', '완충재',        'Cushioning Material',  '제품을 보호하는 완충용 소재. 발포합성수지(스티로폼), 종이 트레이 등.',                90),
  ('1차포장', '본체류',     '리필파우치',    'Refill Pouch',         '유연성 필름 소재의 리필용 파우치. 리필 전용 내용물 충전 파우치.',                   100),
  ('1차포장', '마개류',     '실링',          'Sealing / Inner Seal', '용기 입구 내부에 삽입되는 밀봉용 실링. 알루미늄 박, PE 라이너 등.',                 110),
  ('기타',   '기타',        '기타',          'Other',                '위 분류에 해당하지 않는 기타 포장재.',                                              120)
;



-- ══════════════════════════════════════════════════════════════
-- 3. master_recycle_marks — 분리배출 표시
--    근거: 환경부 고시 「포장재 재질·구조 개선 등에 관한 기준」
-- ══════════════════════════════════════════════════════════════
INSERT INTO master_recycle_marks
  (main_category, material_code, name_kr, name_en,
   color_code, display_text, exemption_condition, mark_icon_url, sort_order)
VALUES
  -- 플라스틱
  ('플라스틱', 'PET',   '페트(PET) 분리배출',            'PET Separate Collection',
   '#1a9641', '페트',   NULL, NULL, 10),

  ('플라스틱', 'HDPE',  '고밀도폴리에틸렌(HDPE) 분리배출','HDPE Separate Collection',
   '#1a9641', 'HDPE',  NULL, NULL, 20),

  ('플라스틱', 'LDPE',  '저밀도폴리에틸렌(LDPE) 분리배출','LDPE Separate Collection',
   '#1a9641', 'LDPE',  NULL, NULL, 30),

  ('플라스틱', 'PP',    '폴리프로필렌(PP) 분리배출',      'PP Separate Collection',
   '#1a9641', 'PP',    NULL, NULL, 40),

  ('플라스틱', 'PS',    '폴리스타이렌(PS) 분리배출',      'PS Separate Collection',
   '#1a9641', 'PS',    NULL, NULL, 50),

  ('플라스틱', 'OTHER', '그 외 플라스틱(OTHER) 분리배출', 'Other Plastics Separate Collection',
   '#1a9641', 'OTHER', NULL, NULL, 60),

  -- 유리
  ('유리', 'GLASS', '유리 분리배출', 'Glass Separate Collection',
   '#0571b0', '유리', NULL, NULL, 70),

  -- 금속
  ('금속', 'STEEL', '철 분리배출',       'Steel Separate Collection',
   '#636363', '철',  NULL, NULL, 80),

  ('금속', 'AL',    '알루미늄 분리배출', 'Aluminum Separate Collection',
   '#636363', '알루미늄', NULL, NULL, 90),

  -- 종이류
  ('종이', 'PAPER',      '종이 분리배출',   'Paper Separate Collection',
   '#ca8a04', '종이',    NULL, NULL, 100),

  ('종이', 'PAPER_PACK', '종이팩 분리배출', 'Paper Pack Separate Collection',
   '#ca8a04', '종이팩',  NULL, NULL, 110),

  -- 필름·비닐
  ('필름·비닐', 'FILM', '비닐류(필름) 분리배출', 'Film / Vinyl Separate Collection',
   '#7b3294', '비닐', NULL, NULL, 120),

  -- 예외 처리
  ('예외', 'EXEMPT_SMALL', '표시 면적 협소 (표시 생략)', 'Exempted — Insufficient Labeling Area',
   NULL, NULL, '용기 표면적이 작아 분리배출 표시가 물리적으로 불가능한 경우', NULL, 130),

  ('예외', 'EXEMPT_MULTI', '다국어 라벨 (별도 인쇄)',   'Multi-language Label — Separate Print',
   NULL, NULL, '분리배출 표시를 별도 다국어 라벨에 인쇄하여 부착하는 예외 적용 방식', NULL, 140)
;


-- ══════════════════════════════════════════════════════════════
-- 4. master_recyclability_grades — 재활용 등급
--    근거: 환경부·한국환경공단 「포장재 재활용 용이성 등급 기준」
-- ══════════════════════════════════════════════════════════════
INSERT INTO master_recyclability_grades
  (code, grade_kr, grade_en, rank_order, surcharge_info, summary)
VALUES
  ('BEST',
   '최우수',
   'Excellent Recyclability',
   1,
   '분담금 감경 대상',
   '단일 재질, 무색 투명, 라벨 제거 용이, 이물질 오염 없음 등 모든 평가 기준을 충족한 최고 등급.'),

  ('GOOD',
   '우수',
   'Good Recyclability',
   2,
   '표준 분담금',
   '대부분의 평가 기준 충족. 소량의 라벨 또는 복합 부착이 있으나 재활용 공정에 큰 영향 없음.'),

  ('NORMAL',
   '보통',
   'Moderate Recyclability',
   3,
   '표준 분담금',
   '복합 재질 또는 유색 용기, 분리 어려운 라벨 등의 요소로 재활용 공정에 일부 영향.'),

  ('HARD',
   '어려움',
   'Difficult to Recycle',
   4,
   '분담금 가중 대상',
   '복합 재질, 열경화성 코팅, 금속 도금, 내용물 오염 제거 불가 등으로 실질적 재활용 어려움.')
;


-- ══════════════════════════════════════════════════════════════
-- 5. master_keco_eval_rules — 재질·구조 평가기준 (KECO)
--    근거: 환경부 고시 「포장재 재질·구조 개선 등에 관한 기준」
--    컬럼: keco_code, eval_part, criteria_kr, criteria_en,
--           result_grade, legal_basis, sort_order
-- ══════════════════════════════════════════════════════════════
INSERT INTO master_keco_eval_rules
  (keco_code, eval_part, criteria_kr, criteria_en, result_grade, legal_basis, sort_order)
VALUES
  -- 10번: 합성수지 용기 — 재질 단일화
  ('10', '합성수지 용기',
   '단일 재질 용기 (PP, PE, PET 등 동일 재질)',
   'Single-material plastic container (PP, PE, PET, etc.)',
   '최우수', '포장재 재질·구조 개선 기준 별표1 10번', 10),

  ('10', '합성수지 용기',
   '복합 재질 용기 (2종 이상 혼용, 분리 불가)',
   'Multi-material container (2+ materials, inseparable)',
   '어려움', '포장재 재질·구조 개선 기준 별표1 10번', 20),

  -- 10번: 합성수지 용기 — 색상
  ('10', '합성수지 용기',
   '무색 투명 용기 (착색제·안료 무첨가)',
   'Colorless transparent container (no pigments added)',
   '최우수', '포장재 재질·구조 개선 기준 별표1 10번', 30),

  ('10', '합성수지 용기',
   '유색(착색) 용기',
   'Colored (pigmented) container',
   '보통', '포장재 재질·구조 개선 기준 별표1 10번', 40),

  -- 10번: 합성수지 용기 — 라벨·표면처리
  ('10', '합성수지 용기',
   '수분리 라벨 적용 (열수 세척 시 자동 박리)',
   'Water-removable label (auto-peeling in hot water wash)',
   '최우수', '포장재 재질·구조 개선 기준 별표1 10번', 50),

  ('10', '합성수지 용기',
   '전면 수축 슬리브 라벨 (자동 분리 설비 없음)',
   'Full-body heat shrink sleeve label (no auto-removal facility)',
   '보통', '포장재 재질·구조 개선 기준 별표1 10번', 60),

  ('10', '합성수지 용기',
   '핫멜트 접착제 라벨 (잔류 접착제 오염)',
   'Hot-melt adhesive label (residual adhesive contamination)',
   '어려움', '포장재 재질·구조 개선 기준 별표1 10번', 70),

  ('10', '합성수지 용기',
   '메탈릭 코팅 / 알루미늄·크롬 증착 처리',
   'Metallic coating / aluminum or chrome vacuum metallization',
   '어려움', '포장재 재질·구조 개선 기준 별표1 10번', 80),

  -- 10번: 합성수지 용기 — 구조 복합성
  ('10', '합성수지 용기',
   '일체형 펌프·디스펜서 (이종 재질 분리 불가)',
   'Non-separable pump/dispenser assembly (dissimilar materials)',
   '어려움', '포장재 재질·구조 개선 기준 별표1 10번', 90),

  -- 20번: 유리 용기
  ('20', '유리 용기',
   '단색 또는 무색 유리 (뚜껑 분리형)',
   'Single-color or colorless glass container (separate lid)',
   '우수', '포장재 재질·구조 개선 기준 별표1 20번', 100),

  ('20', '유리 용기',
   '유리·금속·플라스틱 합착 용기 (분리 불가)',
   'Glass-metal-plastic bonded container (inseparable)',
   '어려움', '포장재 재질·구조 개선 기준 별표1 20번', 110),

  -- PCR / 경량화 (공통)
  ('공통', '합성수지 용기',
   'PCR 원료 30% 이상 함유 용기 (재생 원료 사용)',
   'Container with 30%+ post-consumer recycled (PCR) content',
   '최우수', '포장재 재활용의무 이행 고시 별표 감경기준', 120),

  ('공통', '합성수지 용기',
   '경량화 용기 (표준 대비 15% 이상 중량 감량)',
   'Lightweight container (15%+ weight reduction vs. standard)',
   '우수', '포장재 재활용의무 이행 고시 별표 감경기준', 130),

  -- 필름류 (46번)
  ('46', '필름·시트',
   '단일 재질 필름 (PE 또는 PP 단독)',
   'Single-material film (PE or PP only)',
   '최우수', '포장재 재질·구조 개선 기준 별표1 46번', 140)
;


-- ============================================================
-- 완료 메시지
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ 014_seed_master_data.sql (v2) 삽입 완료!';
  RAISE NOTICE '   - master_cosmetic_types      : 14개 항목';
  RAISE NOTICE '   - master_packaging_types     : 15개 항목';
  RAISE NOTICE '   - master_recycle_marks       : 14개 항목';
  RAISE NOTICE '   - master_recyclability_grades:  4개 항목';
  RAISE NOTICE '   - master_keco_eval_rules     : 14개 항목';
  RAISE NOTICE '   합계: 61개 항목';
END $$;
