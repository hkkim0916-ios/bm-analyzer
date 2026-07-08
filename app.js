const STORAGE_KEY = "bm-analyzer-items-v4";
const LEGACY_STORAGE_KEYS = ["bm-analyzer-items-v3", "bm-analyzer-items-v2", "bm-analyzer-items-v1"];

const fields = ["name", "category", "target", "problem", "solution", "revenue", "cost", "differentiation"];

const SCORE_KEYS = {
  feasibility: "추진 가능성",
  difficulty: "구현 난이도",
  risk: "리스크",
  profitability: "수익성",
  market: "시장성",
  differentiation: "차별성",
  scalability: "확장성",
  initialCost: "초기 실행비용",
};

const MODEL_BENCHMARKS = [
  {
    id: "vertical-saas",
    name: "버티컬 SaaS",
    keywords: ["대시보드", "관리", "업무", "자동화", "SaaS", "구독", "리포트", "B2B", "기업", "소상공인"],
    strengths: ["반복 매출 설계가 가능함", "특정 업종 문제에 깊게 들어가면 전환 장벽을 만들 수 있음"],
    risks: ["초기 고객 확보와 온보딩 비용이 커질 수 있음", "범용 기능으로 흐르면 차별성이 약해짐"],
    revenueHints: ["월 구독", "좌석당 과금", "업체당 과금", "초기 구축비 + 월 유지비"],
    trend: "업무 자동화, AI 보조 운영, 소규모 팀용 SaaS 수요와 맞물릴 수 있음",
    fitBoost: 0.9,
  },
  {
    id: "marketplace",
    name: "마켓플레이스/중개",
    keywords: ["중개", "매칭", "거래", "공급자", "수요자", "수수료", "예약", "견적"],
    strengths: ["거래가 반복되면 네트워크 효과가 생길 수 있음", "수수료 모델이 명확함"],
    risks: ["양면 시장을 동시에 확보해야 해서 초기 난이도가 높음", "거래 우회와 품질 관리 리스크가 있음"],
    revenueHints: ["거래 수수료", "리드 과금", "프리미엄 노출", "예약 수수료"],
    trend: "전문 영역별 중개와 온디맨드 서비스 수요가 있으나 초기 유동성 확보가 핵심",
    fitBoost: 0.3,
  },
  {
    id: "content-community",
    name: "콘텐츠/커뮤니티",
    keywords: ["콘텐츠", "커뮤니티", "교육", "강의", "멤버십", "뉴스레터", "구독"],
    strengths: ["작게 시작하고 빠르게 검증하기 좋음", "팬덤이나 전문성이 있으면 반복 수익화 가능"],
    risks: ["콘텐츠 생산 지속성이 필요함", "무료 대안이 많아 유료 전환 근거가 약할 수 있음"],
    revenueHints: ["멤버십", "강의 판매", "스폰서십", "유료 자료", "컨설팅 연계"],
    trend: "전문 지식의 니치 구독화와 커뮤니티 기반 판매 흐름에 맞음",
    fitBoost: 0.5,
  },
  {
    id: "commerce",
    name: "커머스/브랜드",
    keywords: ["판매", "상품", "커머스", "재고", "배송", "브랜드", "스토어", "구매"],
    strengths: ["가격과 매출 측정이 비교적 명확함", "초기 테스트 판매가 가능함"],
    risks: ["재고, 물류, 광고비 부담이 큼", "차별화가 약하면 가격 경쟁으로 흐를 수 있음"],
    revenueHints: ["상품 마진", "번들 판매", "정기 배송", "업셀"],
    trend: "니치 브랜드와 숏폼 기반 판매는 가능성이 있으나 광고 효율 검증이 중요",
    fitBoost: 0.2,
  },
  {
    id: "ai-service",
    name: "AI 서비스/자동화",
    keywords: ["AI", "인공지능", "자동화", "분석", "생성", "챗봇", "문서", "업무 자동화"],
    strengths: ["반복 업무를 줄이는 가치 제안이 명확하면 빠른 검증이 가능함", "기존 업무 도구에 붙이는 형태로 시작하기 좋음"],
    risks: ["기술 자체만으로는 차별화가 어렵고 데이터 품질과 워크플로 적합성이 중요함", "API 비용과 개인정보 이슈가 생길 수 있음"],
    revenueHints: ["월 구독", "사용량 기반 과금", "업무당 과금", "초기 세팅비"],
    trend: "AI 에이전트, 업무 자동화, 개인화 분석 흐름과 부합하나 실제 업무 절감 효과 검증이 필수",
    fitBoost: 0.8,
  },
];

let items = loadItems();
let activeId = items[0]?.id || createItem().id;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function loadItems() {
  for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      // 오래된 임시 저장값이 깨져 있어도 앱은 계속 열려야 합니다.
    }
  }
  return [];
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function createItem() {
  const item = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: "",
    category: "AI/소프트웨어",
    target: "",
    problem: "",
    solution: "",
    revenue: "",
    cost: "",
    differentiation: "",
    answers: {},
    questions: [],
    gaps: [],
    analysis: null,
    refinedAt: null,
  };
  items.unshift(item);
  persist();
  return item;
}

function currentItem() {
  return items.find((item) => item.id === activeId) || items[0];
}

function collectForm() {
  const item = currentItem();
  fields.forEach((field) => {
    item[field] = $(`#${field}`).value.trim();
  });
  item.updatedAt = new Date().toISOString();
  persist();
}

function fillForm() {
  const item = currentItem();
  fields.forEach((field) => {
    $(`#${field}`).value = item[field] || "";
  });
  renderRefinement();
  renderReport();
}

function renderItems() {
  $("#itemCount").textContent = String(items.length);
  $("#itemList").innerHTML = items
    .map((item) => {
      const name = escapeHtml(item.name || "새 사업아이템");
      const category = escapeHtml(item.category || "미분류");
      const status = item.analysis?.decision || (item.refinedAt ? "정교화 완료" : "입력 중");
      return `
        <button class="item-button ${item.id === activeId ? "active" : ""}" type="button" data-id="${item.id}">
          <strong>${name}</strong>
          <span>${category} · ${status}</span>
        </button>
      `;
    })
    .join("");

  $$(".item-button").forEach((button) => {
    button.addEventListener("click", () => {
      collectForm();
      activeId = button.dataset.id;
      render();
    });
  });
}

function setTab(tabName) {
  $$(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  $$(".panel").forEach((panel) => panel.classList.remove("active"));
  $(`#${tabName}Panel`).classList.add("active");
}

function createRefinement(item) {
  const gaps = detectGaps(item);
  const questions = gaps.map((gap) => ({ id: gap.id, text: gap.question, reason: gap.impact }));
  const fixedQuestions = [
    {
      id: "pricing",
      text: "첫 유료 상품의 가격, 과금 주기, 구매 단위는 어떻게 예상하나요?",
      reason: "수익모델이 불명확하면 추진 추천을 제한합니다.",
    },
    {
      id: "channel",
      text: "초기 고객 10명을 확보하기 위한 가장 현실적인 채널은 무엇인가요?",
      reason: "실행 가능성과 시장 접근성을 판단합니다.",
    },
    {
      id: "mvp",
      text: "30일 안에 만들거나 실험할 수 있는 최소 검증 버전은 무엇인가요?",
      reason: "구현 난이도와 초기 실행비용을 판단합니다.",
    },
    {
      id: "metric",
      text: "이 사업이 작동한다고 판단할 수 있는 핵심 지표 1~2개는 무엇인가요?",
      reason: "검증 로드맵과 추진 판단의 기준을 정합니다.",
    },
  ];

  fixedQuestions.forEach((question) => {
    if (!questions.some((itemQuestion) => itemQuestion.id === question.id)) questions.push(question);
  });

  item.gaps = gaps;
  item.questions = questions.slice(0, 8);
  item.refinedAt = new Date().toISOString();
  item.analysis = null;
  item.updatedAt = new Date().toISOString();
  persist();
}

function detectGaps(item) {
  const gaps = [];
  const add = (id, title, detail, impact, question) => gaps.push({ id, title, detail, impact, question });

  if (wordCount(item.target) < 8) {
    add("target-detail", "핵심 고객군이 넓거나 모호함", "누구에게 먼저 팔 것인지가 좁혀져야 초기 실행 전략을 세울 수 있습니다.", "추진 가능성, 시장성", "가장 먼저 공략할 핵심 고객군을 직업, 상황, 규모, 지역 기준으로 좁히면 누구인가요?");
  }
  if (wordCount(item.problem) < 10) {
    add("problem-cost", "문제의 강도와 비용이 부족함", "고객이 얼마나 불편해하고 돈을 낼 이유가 있는지 판단하기 어렵습니다.", "수익성, 시장성", "고객이 이 문제 때문에 현재 감수하는 시간, 비용, 불편은 어느 정도인가요?");
  }
  if (wordCount(item.solution) < 10) {
    add("solution-scope", "솔루션 범위가 덜 구체적임", "무엇을 만들고 무엇은 만들지 않을지 정해야 구현 난이도를 계산할 수 있습니다.", "구현 난이도, 초기 실행비용", "첫 버전에서 반드시 제공할 핵심 기능 3가지는 무엇인가요?");
  }
  if (revenueMaturity(item) < 0.45) {
    add("revenue-model", "수익모델 구체화가 부족함", "가격, 과금 단위, 비용 구조가 약하면 추진 추천을 내리기 어렵습니다.", "수익성, 리스크, 추진 판단", "가격, 과금 방식, 예상 고객당 매출, 주요 비용을 숫자 또는 범위로 적으면 어떻게 되나요?");
  }
  if (wordCount(item.differentiation) < 8) {
    add("competition", "경쟁 대안 대비 전환 이유가 약함", "고객이 기존 대안을 버리고 바꿀 이유가 필요합니다.", "차별성, 시장성", "고객이 지금 쓰는 대안이나 경쟁사는 무엇이며, 왜 바꿀 수 있나요?");
  }
  if (!contains(allText(item), ["규제", "개인정보", "허가", "법률", "의료", "금융", "재고", "배송", "운영"])) {
    add("risk", "핵심 리스크가 아직 드러나지 않음", "규제, 개인정보, 운영, 자금, 경쟁 리스크 중 무엇이 큰지 구분해야 합니다.", "리스크", "법률, 개인정보, 재고, 운영, 파트너 의존성 중 가장 걱정되는 리스크는 무엇인가요?");
  }

  return gaps.slice(0, 7);
}

function renderRefinement() {
  const item = currentItem();
  if (!item.gaps?.length && !item.questions?.length) {
    item.gaps = detectGaps(item);
    item.questions = item.gaps.map((gap) => ({ id: gap.id, text: gap.question, reason: gap.impact })).slice(0, 7);
  }

  $("#gapList").innerHTML = item.gaps?.length
    ? item.gaps.map((gap) => `
      <div class="gap-card">
        <strong>${escapeHtml(gap.title)}</strong>
        <p>${escapeHtml(gap.detail)}</p>
        <span>영향 항목: ${escapeHtml(gap.impact)}</span>
      </div>
    `).join("")
    : `<div class="gap-card"><strong>큰 보완 항목이 없습니다.</strong><p>추가 질문 답변을 채우면 분석 정밀도가 더 올라갑니다.</p><span>영향 항목: 전체</span></div>`;

  $("#questionList").innerHTML = (item.questions || [])
    .map((question, index) => {
      const value = escapeHtml(item.answers?.[question.id] || "");
      return `
        <div class="question-row">
          <p>${index + 1}. ${escapeHtml(question.text)}</p>
          <textarea data-question-id="${question.id}" placeholder="${escapeHtml(question.reason)}">${value}</textarea>
        </div>
      `;
    })
    .join("");

  $$("[data-question-id]").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      const active = currentItem();
      active.answers[textarea.dataset.questionId] = textarea.value.trim();
      active.analysis = null;
      active.updatedAt = new Date().toISOString();
      persist();
    });
  });
}

function analyze(item) {
  if (!item.refinedAt || !item.questions?.length) createRefinement(item);

  const text = allText(item);
  const answerText = Object.values(item.answers || {}).join(" ");
  const answeredRatio = item.questions.length ? Object.values(item.answers || {}).filter((answer) => wordCount(answer) >= 5).length / item.questions.length : 0;
  const clarity = avg([
    normalizedLength(item.target, 80),
    normalizedLength(item.problem, 110),
    normalizedLength(item.solution, 100),
    normalizedLength(item.revenue, 90),
    normalizedLength(item.cost, 80),
    normalizedLength(item.differentiation, 80),
    normalizedLength(answerText, 200),
  ]);
  const revenueScore = revenueMaturity(item);
  const benchmarks = matchBenchmarks(item);
  const benchmark = benchmarks[0];
  const trendScore = benchmark ? Math.min(1, benchmark.score / 5 + benchmark.model.fitBoost / 5) : 0.25;
  const signals = getSignals(item, text);
  const missingPenalty = Math.max(0, (item.gaps?.length || 0) - Object.values(item.answers || {}).filter(Boolean).length);
  const concreteness = avg([clarity, answeredRatio, revenueScore]);

  const raw = {
    feasibility: 3.8 + clarity * 1.7 + answeredRatio * 1.6 + trendScore * 0.8 + bool(signals.hasChannel) + bool(signals.hasMvp) - bool(signals.hasHighRisk),
    difficulty: 3 + bool(signals.hasAiSoftware) + bool(signals.hasHighRisk) * 2 + (1 - clarity) * 2 + missingPenalty * 0.25,
    risk: 3.5 + bool(signals.hasHighRisk) * 2 + bool(!signals.hasCompetition) + bool(!signals.hasChannel) + (1 - answeredRatio) * 1.8 + (1 - revenueScore) * 1.7,
    profitability: 2.8 + revenueScore * 4 + bool(signals.hasRecurring) + bool(signals.hasB2B) + trendScore * 0.8,
    market: 3.8 + normalizedLength(item.problem + item.target + answerText, 240) * 2 + bool(signals.hasB2B) + bool(signals.hasChannel) + trendScore * 0.7,
    differentiation: 3 + normalizedLength(item.differentiation + answerText, 220) * 2.6 + bool(signals.hasCompetition),
    scalability: 3.8 + bool(signals.hasRecurring) + bool(signals.hasAiSoftware) + bool(signals.hasChannel) + trendScore,
    initialCost: 7 - bool(signals.hasHighRisk) - (3 + bool(signals.hasAiSoftware) + bool(signals.hasHighRisk)) / 2 + answeredRatio,
  };

  const scores = Object.fromEntries(Object.entries(raw).map(([key, value]) => [SCORE_KEYS[key], clamp(Math.round(value))]));
  const guardrails = buildGuardrails({ item, answeredRatio, clarity, revenueScore, concreteness, signals, benchmark });
  const baseScore = overallScore(scores);
  const decision = decideConservatively(baseScore, guardrails);
  const contexts = { answeredRatio, clarity, revenueScore, concreteness, signals, benchmark, benchmarks, trendScore, guardrails };

  return {
    createdAt: new Date().toISOString(),
    confidence: confidenceLabel({ answeredRatio, revenueScore, concreteness }),
    decision,
    baseScore,
    scores,
    summary: buildSummary(item, decision, contexts),
    refinement: buildRefinedModel(item),
    guardrails,
    benchmarks: buildBenchmarkReport(benchmarks, revenueScore),
    externalValidation: buildExternalValidation(item, contexts),
    metricAnalyses: buildMetricAnalyses(item, scores, contexts),
    canvas: buildCanvas(item),
    fitMatrix: buildFitMatrix(item, scores, contexts),
    swot: buildSwot(item, contexts),
    roadmap: buildRoadmap(item),
    recommendations: buildRecommendations(contexts),
  };
}

function revenueMaturity(item) {
  const text = `${item.revenue || ""} ${item.cost || ""} ${Object.values(item.answers || {}).join(" ")}`;
  const hasPrice = /\d/.test(text) || contains(text, ["원", "만원", "달러", "%", "퍼센트"]);
  const hasUnit = contains(text, ["월", "년", "건당", "사용량", "좌석", "업체", "고객", "구독", "수수료", "판매", "회당"]);
  const hasCost = wordCount(item.cost) >= 6 || contains(text, ["비용", "원가", "서버", "인건비", "광고비", "운영비", "마진"]);
  const hasRevenue = wordCount(item.revenue) >= 6 || contains(text, ["구독", "수수료", "판매", "광고", "유지보수", "구축비"]);
  return avg([bool(hasPrice), bool(hasUnit), bool(hasCost), bool(hasRevenue), normalizedLength(text, 180)]);
}

function matchBenchmarks(item) {
  const text = allText(item).toLowerCase();
  return MODEL_BENCHMARKS
    .map((model) => {
      const keywordScore = model.keywords.reduce((sum, keyword) => sum + (text.includes(keyword.toLowerCase()) ? 1 : 0), 0);
      return { model, score: keywordScore };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score + b.model.fitBoost - (a.score + a.model.fitBoost))
    .slice(0, 3);
}

function buildGuardrails({ answeredRatio, clarity, revenueScore, concreteness, signals, benchmark }) {
  const guardrails = [];
  if (revenueScore < 0.45) {
    guardrails.push({ level: "block-go", title: "수익모델 불명확", detail: "가격, 과금 단위, 비용 구조가 부족하여 추진 추천을 제한합니다." });
  }
  if (concreteness < 0.48) {
    guardrails.push({ level: "block-go", title: "사업모델 구체화 부족", detail: "입력과 보완 답변의 구체성이 낮아 비교표에서 과대평가될 수 있습니다." });
  }
  if (answeredRatio < 0.35) {
    guardrails.push({ level: "block-go", title: "정교화 답변 부족", detail: "AI가 제시한 보완 질문에 대한 답변이 부족하여 최종 추천을 보류합니다." });
  }
  if (!signals.hasChannel) {
    guardrails.push({ level: "cap-conditional", title: "고객 획득 채널 부족", detail: "초기 고객을 확보할 경로가 없으면 조건부 추진까지만 가능합니다." });
  }
  if (!benchmark) {
    guardrails.push({ level: "cap-conditional", title: "유사 사업모델 근거 부족", detail: "입력 내용에서 비교 가능한 사업모델 유형이 명확히 잡히지 않았습니다." });
  }
  if (signals.hasHighRisk) {
    guardrails.push({ level: "cap-conditional", title: "민감 리스크 존재", detail: "규제, 개인정보, 운영 책임 가능성이 있어 사전 체크 전까지 조건부 판단이 적절합니다." });
  }
  return guardrails;
}

function decideConservatively(baseScore, guardrails) {
  const hasBlock = guardrails.some((item) => item.level === "block-go");
  const hasCap = guardrails.some((item) => item.level === "cap-conditional");
  if (baseScore < 5.2) return "보류";
  if (hasBlock) return baseScore >= 6.4 ? "조건부 추진" : "보류";
  if (baseScore >= 7 && !hasCap) return "추진 추천";
  return "조건부 추진";
}

function decisionRank(decision) {
  return { "보류": 0, "조건부 추진": 1, "추진 추천": 2 }[decision] ?? 1;
}

function lowerDecision(a, b) {
  return decisionRank(a) <= decisionRank(b) ? a : b;
}

function confidenceLabel({ answeredRatio, revenueScore, concreteness }) {
  if (answeredRatio >= 0.75 && revenueScore >= 0.65 && concreteness >= 0.62) return "높음";
  if (answeredRatio >= 0.45 && revenueScore >= 0.45) return "보통";
  return "낮음";
}

function getSignals(item, text) {
  return {
    hasB2B: contains(text, ["기업", "소상공인", "사업자", "B2B", "업체", "팀", "기관"]),
    hasRecurring: contains(text, ["구독", "월", "정기", "반복", "유지보수", "멤버십"]),
    hasHighRisk: contains(text, ["의료", "금융", "투자", "보험", "개인정보", "규제", "허가", "재고", "배송"]),
    hasAiSoftware: contains(item.category + text, ["AI", "소프트웨어", "앱", "대시보드", "자동화", "SaaS"]),
    hasChannel: contains(text, ["검색", "광고", "소개", "영업", "커뮤니티", "SNS", "파트너", "콘텐츠", "채널"]),
    hasMvp: contains(text, ["MVP", "파일럿", "프로토타입", "30일", "테스트", "검증", "첫 버전"]),
    hasCompetition: contains(text, ["경쟁", "대안", "차별", "기존", "전환"]),
  };
}

function buildSummary(item, decision, contexts) {
  const benchmark = contexts.benchmark?.model.name || "명확한 유사모델 없음";
  return [
    `${item.name || "해당 아이템"}은 ${item.target || "명확화가 필요한 고객"}의 문제를 ${item.solution || "정의 중인 솔루션"}으로 해결하려는 모델입니다.`,
    `현재 판단은 ${decision}입니다. 유사 사업모델 기준으로는 ${benchmark}에 가장 가깝고, 수익모델 성숙도는 ${percent(contexts.revenueScore)}입니다.`,
    `수익모델, 고객 획득 채널, 검증 지표가 약하면 시장 트렌드가 좋아도 추진 추천이 아니라 조건부 또는 보류로 제한됩니다.`,
  ];
}

function buildRefinedModel(item) {
  return [
    `핵심 고객: ${item.target || "추가 정의 필요"}`,
    `고객 문제: ${item.problem || "추가 정의 필요"}`,
    `제공 가치: ${item.solution || "추가 정의 필요"}`,
    `수익 모델: ${item.revenue || "추가 정의 필요"}`,
    `비용 구조: ${item.cost || "추가 정의 필요"}`,
    `차별화 근거: ${item.differentiation || "추가 정의 필요"}`,
    ...Object.entries(item.answers || {}).filter(([, value]) => value).map(([key, value]) => `보완 답변(${questionTitle(item, key)}): ${value}`),
  ];
}

function buildBenchmarkReport(benchmarks, revenueScore) {
  if (!benchmarks.length) {
    return [{
      name: "유사 사업모델 미확정",
      fit: "낮음",
      trend: "입력 내용만으로는 비교 가능한 모델을 특정하기 어렵습니다.",
      revenueHints: ["가격, 과금 단위, 비용 구조를 먼저 정의해야 합니다."],
      caution: "유사모델이 불명확하면 추진 추천은 제한됩니다.",
    }];
  }
  return benchmarks.map(({ model, score }) => ({
    name: model.name,
    fit: score >= 4 ? "높음" : score >= 2 ? "보통" : "낮음",
    trend: model.trend,
    revenueHints: model.revenueHints,
    caution: revenueScore < 0.45 ? "현재 수익모델이 약하므로 이 벤치마크는 참고 근거일 뿐 추진 추천 근거로는 부족합니다." : model.risks.join(" / "),
  }));
}

function buildExternalValidation(item, contexts) {
  const benchmarkName = contexts.benchmark?.model.name || "유사 사업모델";
  const coreName = item.name || item.solution || item.problem || "사업아이템";
  const target = item.target || "타겟 고객";
  const problem = item.problem || "고객 문제";
  const revenue = item.revenue || "수익모델";
  const queries = [
    `${coreName} ${benchmarkName} 사례 수익모델`,
    `${target} ${problem} 시장 규모 문제점`,
    `${coreName} 경쟁사 대안 가격`,
    `${benchmarkName} 실패 사례 리스크`,
    `${revenue} 가격 과금 방식 벤치마크`,
  ];

  const checks = [
    {
      name: "문제 타당성",
      status: item.problem && wordCount(item.problem) >= 10 ? "가설 있음" : "보완 필요",
      evidence: "고객이 실제로 겪는 빈도, 현재 해결 방식, 감수 중인 비용을 외부 자료나 인터뷰로 확인해야 합니다.",
      needed: ["고객 인터뷰", "커뮤니티/리뷰 불만 사례", "검색량 또는 관련 보고서"],
    },
    {
      name: "수익모델 타당성",
      status: contexts.revenueScore >= 0.65 ? "가설 있음" : "취약",
      evidence: "유사 서비스의 가격, 과금 단위, 무료/유료 전환 구조와 비교해야 합니다.",
      needed: ["경쟁 서비스 가격표", "예상 고객당 매출", "손익분기 고객 수"],
    },
    {
      name: "경쟁 대안 타당성",
      status: contexts.signals.hasCompetition ? "가설 있음" : "보완 필요",
      evidence: "고객이 이미 쓰는 대안이 무엇인지 모르면 차별성과 전환 가능성을 판단하기 어렵습니다.",
      needed: ["대체재 3개", "경쟁사 가격", "전환 장벽"],
    },
    {
      name: "트렌드 적합성",
      status: contexts.benchmark ? "참고 가능" : "보완 필요",
      evidence: "트렌드는 추진 근거가 아니라 보조 신호입니다. 실제 지불의사와 반복 사용 가능성으로 검증해야 합니다.",
      needed: ["최근 유사 사례", "성장 중인 세부 카테고리", "실패 사례"],
    },
  ];

  const assumptions = [
    `${target}이 ${problem}을 충분히 절실하게 느낀다.`,
    `${target}이 현재 대안보다 이 솔루션을 선택할 이유가 있다.`,
    `${revenue} 방식으로 실제 결제가 발생할 수 있다.`,
    `초기 채널에서 충분한 고객 반응을 얻을 수 있다.`,
  ];

  return { queries, checks, assumptions };
}

function canUseAiApi() {
  return location.protocol === "http:" || location.protocol === "https:";
}

async function enrichWithAiValidation(item, analysis) {
  if (!canUseAiApi()) {
    analysis.aiValidation = {
      status: "not-configured",
      title: "AI 검증 미연결",
      summary: "현재 파일을 직접 열고 있어 OpenAI API 서버 함수가 호출되지 않았습니다. Vercel 등으로 배포하고 OPENAI_API_KEY를 설정하면 AI 검증이 실행됩니다.",
      decision: analysis.decision,
      findings: [],
      missingEvidence: ["배포 환경", "OPENAI_API_KEY", "서버 API 엔드포인트"],
      nextQuestions: [],
    };
    return analysis;
  }

  try {
    const response = await fetch("./api/analyze-business-model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item, localAnalysis: analysis }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || "AI 검증 실패");

    analysis.aiValidation = result.analysis;
    if (result.analysis?.decision) {
      analysis.decision = lowerDecision(result.analysis.decision, analysis.decision);
    }
    if (result.analysis?.guardrail) {
      analysis.guardrails = [
        ...analysis.guardrails,
        { level: "block-go", title: "AI 검증 보정", detail: result.analysis.guardrail },
      ];
    }
    return analysis;
  } catch (error) {
    analysis.aiValidation = {
      status: "error",
      title: "AI 검증 실패",
      summary: error.message || "OpenAI API 검증 중 오류가 발생했습니다.",
      decision: analysis.decision,
      findings: [],
      missingEvidence: ["API 연결 상태", "OPENAI_API_KEY", "서버 로그"],
      nextQuestions: [],
    };
    return analysis;
  }
}

function buildMetricAnalyses(item, scores, contexts) {
  const { revenueScore, signals, benchmarks } = contexts;
  return [
    {
      name: "수익성",
      score: scores["수익성"],
      diagnosis: revenueScore >= 0.65 ? "가격, 과금 단위, 비용 구조가 어느 정도 잡혀 있어 수익성 검증이 가능합니다." : "수익모델이 불분명하여 사업성이 과대평가될 위험이 큽니다.",
      evidence: [item.revenue ? "수익구조 입력됨" : "수익구조 부족", item.cost ? "비용구조 입력됨" : "비용구조 부족", `수익모델 성숙도 ${percent(revenueScore)}`],
      needs: ["첫 가격안", "과금 단위", "고객 1명당 예상 매출", "월 고정비", "손익분기 고객 수"],
      action: "유사모델의 과금 방식 중 하나를 임시로 채택하고, 고객 인터뷰에서 가격 저항을 확인하세요.",
    },
    {
      name: "유사모델/트렌드 적합도",
      score: Math.max(1, Math.min(10, Math.round((contexts.trendScore || 0.2) * 10))),
      diagnosis: benchmarks.length ? `${benchmarks[0].model.name} 모델과 가장 유사합니다. 다만 트렌드는 보조 근거이며 수익모델을 대신할 수 없습니다.` : "비교 가능한 유사모델이 명확하지 않아 시장 트렌드 기반 판단이 제한됩니다.",
      evidence: benchmarks.length ? benchmarks.map((entry) => `${entry.model.name} 매칭 ${entry.score}개`) : ["유사모델 매칭 부족"],
      needs: ["가장 가까운 유사모델 1개 선택", "해당 모델의 과금 방식", "성공 조건과 실패 리스크"],
      action: "비슷한 사업모델을 하나 고른 뒤, 그 모델의 수익원과 고객 획득 방식을 현재 아이템에 적용 가능한지 검토하세요.",
    },
    {
      name: "추진 가능성",
      score: scores["추진 가능성"],
      diagnosis: signals.hasChannel && signals.hasMvp ? "초기 실행 경로와 검증 단서가 있어 작은 실험으로 옮길 수 있습니다." : "아이디어 방향은 있으나 첫 고객 확보와 MVP 범위가 더 필요합니다.",
      evidence: [signals.hasChannel ? "획득 채널 단서 있음" : "획득 채널 부족", signals.hasMvp ? "MVP 단서 있음" : "MVP 범위 부족"],
      needs: ["초기 고객 10명 리스트", "첫 접촉 메시지", "30일 MVP 범위"],
      action: "채널 하나를 고르고 1주일 안에 고객 인터뷰 또는 사전 신청을 받아 실제 반응을 확인하세요.",
    },
    {
      name: "리스크",
      score: scores["리스크"],
      diagnosis: scores["리스크"] >= 7 ? "불확실성이 큰 편입니다. 수익모델, 경쟁 대안, 고객 확보, 법률/운영 책임을 분리해서 봐야 합니다." : "치명적 리스크는 제한적이나 고객 전환과 비용 검증은 남아 있습니다.",
      evidence: [signals.hasHighRisk ? "민감 리스크 단서 있음" : "민감 리스크 단서 낮음", signals.hasCompetition ? "경쟁/대안 인식 있음" : "경쟁 대안 분석 부족"],
      needs: ["리스크별 발생 가능성", "리스크별 영향도", "출시 전 차단 조건"],
      action: "리스크를 법률, 데이터, 운영, 자금, 경쟁으로 나누어 각 1개씩 예방책을 정하세요.",
    },
    {
      name: "시장성",
      score: scores["시장성"],
      diagnosis: item.problem && item.target ? "고객과 문제의 연결은 있으나 시장 크기보다 문제의 절실성 검증이 먼저입니다." : "시장 규모를 따지기 전에 고객군과 문제를 더 좁혀야 합니다.",
      evidence: [item.problem ? "문제 입력됨" : "문제 설명 부족", item.target ? "고객 입력됨" : "고객 설명 부족", signals.hasChannel ? "도달 채널 단서 있음" : "도달 채널 부족"],
      needs: ["문제를 겪는 빈도", "현재 대안 비용", "구매 결정권자"],
      action: "동일 문제를 겪는 고객 5명을 찾아 문제 빈도와 현재 해결 방식을 확인하세요.",
    },
    {
      name: "차별성",
      score: scores["차별성"],
      diagnosis: scores["차별성"] >= 7 ? "차별화 방향은 있으나 고객이 체감하는 언어로 더 수치화하면 좋습니다." : "기존 대안 대비 왜 바꿔야 하는지가 아직 충분히 날카롭지 않습니다.",
      evidence: [item.differentiation ? "차별화 입력됨" : "차별화 설명 부족", signals.hasCompetition ? "경쟁 대안 단서 있음" : "경쟁 대안 단서 부족"],
      needs: ["대체재 3개", "기존 방식 대비 절감 시간", "전환을 막는 이유"],
      action: "차별화를 기능 목록이 아니라 시간 절감, 비용 절감, 오류 감소, 편의성 중 하나의 수치로 표현하세요.",
    },
    {
      name: "구현 난이도",
      score: scores["구현 난이도"],
      diagnosis: scores["구현 난이도"] >= 7 ? "기술, 운영, 규제 중 하나 이상이 MVP 범위를 크게 만들 가능성이 있습니다." : "첫 버전을 제한하면 개인 또는 소규모 팀도 검증 가능한 수준입니다.",
      evidence: [signals.hasAiSoftware ? "소프트웨어/AI 요소 포함" : "기술 복잡도 단서 낮음", signals.hasHighRisk ? "규제 또는 운영 리스크 단서 있음" : "고위험 규제 단서 낮음"],
      needs: ["MVP 제외 기능 목록", "필수 기능 3개", "외부 도구로 대체 가능한 기능"],
      action: "완성형 제품보다 수작업 운영을 섞은 테스트 버전으로 구현 범위를 줄이세요.",
    },
  ];
}

function buildCanvas(item) {
  return [
    { name: "고객 세그먼트", value: item.target || "핵심 고객군을 더 좁혀야 함" },
    { name: "문제", value: item.problem || "고객의 비용, 시간, 불편을 구체화해야 함" },
    { name: "가치 제안", value: item.solution || "첫 버전의 핵심 제공 가치를 정의해야 함" },
    { name: "채널", value: item.answers?.channel || "초기 고객 획득 채널 검증 필요" },
    { name: "수익원", value: item.revenue || "가격, 과금 주기, 구매 단위 정의 필요" },
    { name: "비용 구조", value: item.cost || "초기 고정비와 변동비 산정 필요" },
    { name: "경쟁 우위", value: item.differentiation || "기존 대안 대비 전환 이유 필요" },
    { name: "핵심 지표", value: item.answers?.metric || "사전 신청, 인터뷰 수, 유료 전환율 등 지표 설정 필요" },
  ];
}

function buildFitMatrix(item, scores, contexts) {
  return [
    { name: "문제-고객 적합도", level: scores["시장성"] >= 7 ? "양호" : "검증 필요", detail: item.target && item.problem ? "고객과 문제는 연결되어 있으나 문제 빈도와 지불의사 확인이 필요합니다." : "고객군과 문제를 더 좁혀야 합니다." },
    { name: "수익-비용 적합도", level: contexts.revenueScore >= 0.65 ? "양호" : "취약", detail: "가격, 고객 획득 비용, 월 고정비를 연결해 손익분기 고객 수를 계산해야 합니다." },
    { name: "모델-트렌드 적합도", level: contexts.benchmark ? "가설 있음" : "부족", detail: contexts.benchmark ? `${contexts.benchmark.model.name} 모델과 유사하나 수익모델 검증이 우선입니다.` : "비교 가능한 유사모델을 먼저 특정해야 합니다." },
    { name: "채널-시장 적합도", level: contexts.signals.hasChannel ? "가설 있음" : "부족", detail: contexts.signals.hasChannel ? "초기 채널 가설을 실제 유입으로 검증해야 합니다." : "고객을 만나는 구체적 경로가 부족합니다." },
  ];
}

function buildSwot(item, contexts) {
  const { signals } = contexts;
  return {
    강점: [
      item.differentiation || "차별화 요소를 구체화하면 설득력이 커질 수 있음",
      contexts.benchmark ? `${contexts.benchmark.model.name} 유형의 기존 수익화 패턴을 참고할 수 있음` : "유사모델을 특정하면 수익화 패턴을 가져올 수 있음",
    ],
    약점: [
      contexts.revenueScore < 0.45 ? "수익모델 구체화가 부족해 추진 판단이 위험함" : "수익모델은 있으나 실제 지불의사 검증이 필요함",
      signals.hasCompetition ? "기존 대안에서 전환시키는 비용이 발생할 수 있음" : "경쟁 대안 분석이 부족함",
    ],
    기회: [
      contexts.benchmark?.model.trend || "적합한 벤치마크 모델을 찾으면 트렌드 기반 가설을 만들 수 있음",
      signals.hasRecurring ? "반복 매출 구조로 누적 수익을 만들 가능성이 있음" : "구독, 유지보수, 사용량 과금 등 반복 매출 구조로 확장 가능",
    ],
    위협: [
      signals.hasHighRisk ? "규제, 개인정보, 운영 책임 리스크가 큼" : "고객 확보 비용이 예상보다 커질 수 있음",
      "수익성이 검증되지 않은 상태에서 개발 범위를 키우면 매몰비용이 커질 수 있음",
    ],
  };
}

function buildRoadmap(item) {
  const metric = item.answers?.metric || "인터뷰 5건, 사전 신청 10건, 유료 의향 3건";
  return [
    { stage: "1주차", goal: "수익모델 가설", task: "가격표, 과금 단위, 월 고정비, 손익분기 고객 수를 임시 계산", metric: "고객당 예상 매출, 손익분기 고객 수" },
    { stage: "2주차", goal: "문제 검증", task: "핵심 고객 5명 인터뷰로 문제 빈도, 현재 대안, 지불의사를 확인", metric },
    { stage: "3주차", goal: "제안 검증", task: "랜딩페이지 또는 제안서 1장으로 가치 제안과 가격 반응을 테스트", metric: "사전 신청률 또는 회신율" },
    { stage: "4주차", goal: "MVP 검증", task: item.answers?.mvp || "수작업을 포함한 최소 기능 버전으로 실제 사용 흐름을 확인", metric: "완료율, 재사용 의향, 유료 전환 의향" },
  ];
}

function buildRecommendations(contexts) {
  const recommendations = [
    "수익모델이 불명확하면 추진 추천을 내리지 않도록 제한했습니다. 먼저 가격, 과금 단위, 비용 구조를 숫자로 잡으세요.",
    contexts.benchmark ? `${contexts.benchmark.model.name} 모델의 수익화 방식을 참고하되, 그대로 모방하지 말고 현재 고객군의 지불 방식에 맞게 변형하세요.` : "유사 사업모델을 하나 정하고 해당 모델의 수익원, 고객 획득 방식, 실패 리스크를 비교하세요.",
    contexts.signals.hasChannel ? "채널 가설을 넓히지 말고 하나만 골라 7일 동안 반응률을 측정하세요." : "고객 획득 채널이 약하므로 광고, 커뮤니티, 소개, 직접 영업 중 하나를 선택해 첫 접촉 실험을 설계하세요.",
  ];
  if (contexts.guardrails.length) {
    recommendations.push(`현재 판단을 제한한 핵심 사유는 ${contexts.guardrails.map((item) => item.title).join(", ")}입니다.`);
  }
  return recommendations;
}

function renderReport() {
  const item = currentItem();
  if (!item.analysis) {
    $("#analysisStatus").textContent = item.refinedAt ? "추가 질문 답변 후 최종 분석을 실행하세요." : "먼저 정교화 단계에서 보완 항목을 확인하세요.";
    $("#report").className = "report empty-state";
    $("#report").textContent = item.refinedAt ? "정교화 질문이 준비되었습니다. 답변을 입력한 뒤 최종 분석을 실행하세요." : "아직 분석 결과가 없습니다.";
    return;
  }

  const analysis = item.analysis;
  $("#analysisStatus").textContent = `${new Date(analysis.createdAt).toLocaleString("ko-KR")} 기준 · 신뢰도 ${analysis.confidence}`;
  $("#report").className = "report";
  $("#report").innerHTML = `
    <div class="decision ${decisionClass(analysis.decision)}">
      <span>${escapeHtml(analysis.decision)}</span>
      <span>종합 ${overallScore(analysis.scores).toFixed(1)}</span>
    </div>
    ${renderListBlock("BM 요약", analysis.summary)}
    ${renderGuardrails(analysis.guardrails)}
    ${renderAiValidation(analysis.aiValidation)}
    ${renderBenchmarks(analysis.benchmarks)}
    ${renderExternalValidation(analysis.externalValidation)}
    ${renderListBlock("정교화된 비즈니스 모델", analysis.refinement)}
    <div class="analysis-grid">${analysis.metricAnalyses.map(renderMetricAnalysis).join("")}</div>
    <div class="canvas-grid">${analysis.canvas.map((cell) => `<div class="canvas-cell"><strong>${escapeHtml(cell.name)}</strong><p>${escapeHtml(cell.value)}</p></div>`).join("")}</div>
    <div class="fit-grid">${analysis.fitMatrix.map((cell) => `<div class="fit-card"><span>${escapeHtml(cell.level)}</span><strong>${escapeHtml(cell.name)}</strong><p>${escapeHtml(cell.detail)}</p></div>`).join("")}</div>
    <div class="swot-grid">${Object.entries(analysis.swot).map(([name, values]) => `<div class="swot-cell"><h3>${escapeHtml(name)}</h3><ul>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul></div>`).join("")}</div>
    <div class="roadmap">
      <h3>30일 검증 로드맵</h3>
      ${analysis.roadmap.map((step) => `<div class="roadmap-step"><span>${escapeHtml(step.stage)}</span><strong>${escapeHtml(step.goal)}</strong><p>${escapeHtml(step.task)}</p><em>확인 지표: ${escapeHtml(step.metric)}</em></div>`).join("")}
    </div>
    <div class="recommendation"><h3>최종 전략 제언</h3><ol>${analysis.recommendations.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ol></div>
  `;
}

function renderGuardrails(guardrails) {
  if (!guardrails.length) return "";
  return `
    <div class="guardrail-block">
      <h3>판단 보정 사유</h3>
      ${guardrails.map((item) => `<div class="guardrail ${item.level}"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail)}</p></div>`).join("")}
    </div>
  `;
}

function renderAiValidation(validation) {
  if (!validation) return "";
  const findings = validation.findings || [];
  const missingEvidence = validation.missingEvidence || [];
  const nextQuestions = validation.nextQuestions || [];
  return `
    <div class="ai-validation ${escapeHtml(validation.status || "ready")}">
      <div class="ai-validation-head">
        <div>
          <h3>${escapeHtml(validation.title || "AI 타당성 검증")}</h3>
          <p>${escapeHtml(validation.summary || "")}</p>
        </div>
        <strong>${escapeHtml(validation.decision || "")}</strong>
      </div>
      ${findings.length ? `<h4>핵심 검증 의견</h4><ul>${findings.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
      ${missingEvidence.length ? `<h4>추가 근거 필요</h4><ul>${missingEvidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
      ${nextQuestions.length ? `<h4>다음 질문</h4><ul>${nextQuestions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
    </div>
  `;
}

function renderBenchmarks(benchmarks) {
  return `
    <div class="benchmark-grid">
      ${benchmarks.map((item) => `
        <div class="benchmark-card">
          <span>유사모델 적합도 ${escapeHtml(item.fit)}</span>
          <strong>${escapeHtml(item.name)}</strong>
          <p>${escapeHtml(item.trend)}</p>
          <h4>참고 수익화 방식</h4>
          <ul>${item.revenueHints.map((hint) => `<li>${escapeHtml(hint)}</li>`).join("")}</ul>
          <em>${escapeHtml(item.caution)}</em>
        </div>
      `).join("")}
    </div>
  `;
}

function renderExternalValidation(validation) {
  return `
    <div class="validation-block">
      <h3>외부/자체 검증</h3>
      <div class="validation-grid">
        ${validation.checks.map((check) => `
          <div class="validation-card">
            <span>${escapeHtml(check.status)}</span>
            <strong>${escapeHtml(check.name)}</strong>
            <p>${escapeHtml(check.evidence)}</p>
            <ul>${check.needed.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </div>
        `).join("")}
      </div>
      <div class="search-panel">
        <h4>추천 검색</h4>
        <div class="search-links">
          ${validation.queries.map((query) => `<a href="${searchUrl(query)}" target="_blank" rel="noreferrer">${escapeHtml(query)}</a>`).join("")}
        </div>
      </div>
      <div class="assumption-panel">
        <h4>검증해야 할 핵심 가정</h4>
        <ul>${validation.assumptions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
    </div>
  `;
}

function renderMetricAnalysis(metric) {
  return `
    <div class="analysis-card">
      <div class="analysis-card-head"><span>${escapeHtml(metric.name)}</span><strong>${metric.score}/10</strong></div>
      <p>${escapeHtml(metric.diagnosis)}</p>
      <h4>근거</h4>
      <ul>${metric.evidence.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>
      <h4>보완 필요사항</h4>
      <ul>${metric.needs.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>
      <div class="action-line">${escapeHtml(metric.action)}</div>
    </div>
  `;
}

function renderListBlock(title, values) {
  return `<div class="summary-block"><h3>${escapeHtml(title)}</h3><ul>${values.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul></div>`;
}

function renderCompare() {
  $("#compareTable").innerHTML =
    items.filter((item) => item.analysis).sort((a, b) => overallScore(b.analysis.scores) - overallScore(a.analysis.scores)).map((item) => {
      const scores = item.analysis.scores;
      return `
        <tr>
          <td><strong>${escapeHtml(item.name || "이름 없음")}</strong><br>${escapeHtml(item.category || "")}</td>
          <td>${scores["추진 가능성"]}</td>
          <td>${scores["구현 난이도"]}</td>
          <td>${scores["리스크"]}</td>
          <td>${scores["수익성"]}</td>
          <td>${escapeHtml(item.analysis.decision)}</td>
        </tr>
      `;
    }).join("") || `<tr><td colspan="6">분석된 아이템이 없습니다.</td></tr>`;
}

function reportText(item) {
  if (!item.analysis) return "";
  const a = item.analysis;
  return [
    `# ${item.name || "사업아이템"} 분석 리포트`,
    "",
    "## BM 요약",
    ...a.summary.map((line) => `- ${line}`),
    "",
    "## 판단 보정 사유",
    ...(a.guardrails.length ? a.guardrails.map((item) => `- ${item.title}: ${item.detail}`) : ["- 보정 사유 없음"]),
    "",
    "## OpenAI API 타당성 검증",
    ...(a.aiValidation ? [
      `- 상태: ${a.aiValidation.title || a.aiValidation.status}`,
      `- 판단: ${a.aiValidation.decision || a.decision}`,
      `- 요약: ${a.aiValidation.summary || ""}`,
      ...(a.aiValidation.findings || []).map((item) => `- 검증 의견: ${item}`),
      ...(a.aiValidation.missingEvidence || []).map((item) => `- 추가 근거 필요: ${item}`),
      ...(a.aiValidation.nextQuestions || []).map((item) => `- 다음 질문: ${item}`),
    ] : ["- AI 검증 없음"]),
    "",
    "## 유사 사업모델/트렌드",
    ...a.benchmarks.map((item) => `- ${item.name} (${item.fit}): ${item.trend} / 수익화: ${item.revenueHints.join(", ")}`),
    "",
    "## 외부/자체 검증",
    ...a.externalValidation.checks.map((item) => `- ${item.name} (${item.status}): ${item.evidence} / 필요자료: ${item.needed.join(", ")}`),
    "",
    "## 추천 검색",
    ...a.externalValidation.queries.map((query) => `- ${query}`),
    "",
    "## 검증해야 할 핵심 가정",
    ...a.externalValidation.assumptions.map((item) => `- ${item}`),
    "",
    "## 항목별 상세 분석",
    ...a.metricAnalyses.flatMap((metric) => [`### ${metric.name} ${metric.score}/10`, `- 진단: ${metric.diagnosis}`, `- 근거: ${metric.evidence.join(", ")}`, `- 보완 필요사항: ${metric.needs.join(", ")}`, `- 실행 제언: ${metric.action}`]),
    "",
    "## 최종 전략 제언",
    ...a.recommendations.map((value, index) => `${index + 1}. ${value}`),
  ].join("\n");
}

function exportJson() {
  const data = JSON.stringify(items, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bm-analyzer-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function render() {
  renderItems();
  fillForm();
  renderCompare();
}

function allText(item) {
  return `${fields.map((field) => item[field] || "").join(" ")} ${Object.values(item.answers || {}).join(" ")}`;
}

function wordCount(value) {
  return (value || "").trim().split(/\s+/).filter(Boolean).length;
}

function normalizedLength(value, target) {
  return Math.min((value || "").length / target, 1);
}

function avg(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function contains(value, words) {
  const text = (value || "").toLowerCase();
  return words.some((word) => text.includes(String(word).toLowerCase()));
}

function bool(value) {
  return value ? 1 : 0;
}

function clamp(value) {
  return Math.max(1, Math.min(10, value));
}

function percent(value) {
  return `${Math.round(value * 100)}%`;
}

function searchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function overallScore(scores) {
  return (
    scores["추진 가능성"] +
    scores["수익성"] +
    scores["시장성"] +
    scores["차별성"] +
    scores["확장성"] +
    scores["초기 실행비용"] -
    scores["리스크"] * 0.5 -
    scores["구현 난이도"] * 0.25
  ) / 4.75;
}

function decisionClass(decision) {
  if (decision === "추진 추천") return "go";
  if (decision === "조건부 추진") return "conditional";
  return "hold";
}

function questionTitle(item, id) {
  return item.questions?.find((question) => question.id === id)?.text || id;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

$$(".tab").forEach((tab) => tab.addEventListener("click", () => setTab(tab.dataset.tab)));

fields.forEach((field) => {
  $(`#${field}`).addEventListener("input", () => {
    collectForm();
    const item = currentItem();
    item.gaps = [];
    item.questions = [];
    item.refinedAt = null;
    item.analysis = null;
    persist();
    renderItems();
  });
});

$("#newItemButton").addEventListener("click", () => {
  collectForm();
  const item = createItem();
  activeId = item.id;
  render();
  setTab("input");
});

$("#saveButton").addEventListener("click", () => {
  collectForm();
  renderItems();
});

$("#askButton").addEventListener("click", () => {
  collectForm();
  createRefinement(currentItem());
  render();
  setTab("refine");
});

$("#refreshQuestionsButton").addEventListener("click", () => {
  collectForm();
  createRefinement(currentItem());
  renderRefinement();
  renderItems();
});

$("#analyzeButton").addEventListener("click", async () => {
  collectForm();
  const item = currentItem();
  if (!item.refinedAt) {
    createRefinement(item);
    render();
    setTab("refine");
    return;
  }
  $("#analyzeButton").textContent = "분석 중";
  $("#analyzeButton").disabled = true;
  const localAnalysis = analyze(item);
  item.analysis = await enrichWithAiValidation(item, localAnalysis);
  item.updatedAt = new Date().toISOString();
  persist();
  render();
  setTab("analysis");
  $("#analyzeButton").textContent = "최종 분석";
  $("#analyzeButton").disabled = false;
});

$("#copyReportButton").addEventListener("click", async () => {
  const text = reportText(currentItem());
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  $("#copyReportButton").textContent = "복사됨";
  setTimeout(() => {
    $("#copyReportButton").textContent = "복사";
  }, 1400);
});

$("#exportButton").addEventListener("click", exportJson);

render();
