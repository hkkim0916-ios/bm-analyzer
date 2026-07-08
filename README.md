# BM Analyzer

모바일 브라우저에서 사업아이템을 입력하고, 정교화 질문과 OpenAI API 기반 타당성 검증을 통해 사업모델을 평가하는 웹앱입니다.

## 로컬 사용

`index.html`을 브라우저에서 직접 열면 기본 규칙 기반 분석이 동작합니다.

파일로 직접 여는 경우 OpenAI API 서버 함수는 호출되지 않습니다.

## OpenAI API 연동

Vercel 등에 이 폴더를 배포한 뒤 환경변수를 설정합니다.

```text
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.5
```

선택적으로 웹 검색 도구 사용을 켤 수 있습니다.

```text
OPENAI_ENABLE_WEB_SEARCH=true
```

## 배포 구조

```text
index.html
styles.css
app.js
api/
  analyze-business-model.js
```

프론트는 `./api/analyze-business-model` 서버 함수로 요청을 보내며, API 키는 브라우저에 노출되지 않습니다.
