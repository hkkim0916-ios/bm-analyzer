const DEFAULT_MODEL = "gpt-5.5";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "POST 요청만 지원합니다." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ ok: false, error: "OPENAI_API_KEY 환경변수가 설정되지 않았습니다." });
  }

  try {
    const { item, localAnalysis } = req.body || {};
    if (!item || !localAnalysis) {
      return res.status(400).json({ ok: false, error: "사업아이템 데이터가 부족합니다." });
    }

    const payload = {
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "너는 보수적인 사업모델 검증 컨설턴트다.",
                "사용자 입력을 그대로 믿지 말고, 가정의 타당성, 수익모델의 구체성, 유사 사업모델, 시장/고객 검증 필요사항을 비판적으로 판단한다.",
                "수익모델, 가격, 비용, 고객 획득 채널, 경쟁 대안이 불분명하면 추진 추천을 피하고 조건부 추진 또는 보류로 판단한다.",
                "출력은 반드시 JSON만 반환한다. 마크다운을 쓰지 않는다.",
              ].join("\n"),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                task: "사업모델 타당성 검증",
                requiredJsonShape: {
                  status: "ready",
                  title: "AI 타당성 검증",
                  decision: "추진 추천 | 조건부 추진 | 보류",
                  summary: "3문장 이내 요약",
                  guardrail: "판단을 낮춰야 하는 핵심 사유. 없으면 빈 문자열",
                  findings: ["핵심 검증 의견 3~5개"],
                  missingEvidence: ["추가로 필요한 외부 근거 3~6개"],
                  nextQuestions: ["사용자에게 추가로 물어볼 질문 3~5개"],
                  comparableModels: [
                    {
                      name: "유사 사업모델명",
                      fit: "높음 | 보통 | 낮음",
                      revenuePattern: "주요 수익화 방식",
                      caution: "주의점",
                    },
                  ],
                },
                userInput: item,
                localAnalysis,
              }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_object",
        },
      },
    };

    if (process.env.OPENAI_ENABLE_WEB_SEARCH === "true") {
      payload.tools = [{ type: "web_search_preview" }];
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: data.error?.message || "OpenAI API 요청 실패",
      });
    }

    const text = extractResponseText(data);
    const analysis = parseJson(text);

    return res.status(200).json({ ok: true, analysis });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || "서버 오류가 발생했습니다." });
  }
};

function extractResponseText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) parts.push(content.text);
      if (typeof content.text === "string") parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("OpenAI 응답을 JSON으로 해석하지 못했습니다.");
  }
}
