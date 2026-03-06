# Misconception Dashboard (Vite + React)

학생이 **이름 + 학번**을 입력하면, Google Forms 사전/사후 검사 결과를 비교해서 확인할 수 있는 React + Netlify 대시보드입니다.

## 주요 기능

- **탭 UI (state 기반, 라우터 미사용)**
  - 설문 참여
  - 내 결과 보기 (기본 탭)
- **설문 참여 탭**
  - 사전 설문/사후 설문 각각 안내 + 새 창 열기 + iframe 임베드
- **내 결과 보기 탭**
  - 이름 + 학번으로 사전/사후 데이터 조회
  - 동일 학생 매칭: 이름/학번 모두 일치 + 각 데이터셋에서 최신 타임스탬프 1개 사용
  - 요약 카드(평균/변화량/개선·악화·동일)
  - 그래프 3종
    1. 사전 평균 vs 사후 평균
    2. 문항별 pre/post 비교
    3. 개선/동일/악화 분포
  - 문항별 비교 테이블 + 정렬 옵션(원래 순서/개선 큰 순/악화 큰 순)

## 데이터 소스

- Apps Script Web App 기본 URL:
  - `https://script.google.com/macros/s/AKfycbyhcx9DhJYA146r1WEigOXn51WK7mzi0ikEjFD4VEpWKoxzqREy9EVPBHJdECXwT0bwTQ/exec`
- dataset 파라미터
  - pre: `?dataset=pre`
  - post: `?dataset=post`

프론트엔드는 직접 Apps Script를 호출하지 않고, 항상 Netlify Function 프록시를 호출합니다.

## 프록시 엔드포인트

- `/.netlify/functions/proxy?dataset=pre`
- `/.netlify/functions/proxy?dataset=post`

프록시 함수는 `dataset` 쿼리를 Apps Script로 전달합니다.

## 로컬 실행

```bash
npm install
netlify dev
```

> 프록시 함수를 함께 쓰므로 로컬 실행은 `netlify dev`를 권장합니다.

## 환경변수

기본적으로 코드 내 기본 Apps Script URL을 사용하며, 필요 시 아래 변수로 덮어쓸 수 있습니다.

- `GFORM_JSON_URL` (선택)

예시:

```bash
GFORM_JSON_URL=https://script.google.com/macros/s/AKfycbyhcx9DhJYA146r1WEigOXn51WK7mzi0ikEjFD4VEpWKoxzqREy9EVPBHJdECXwT0bwTQ/exec
```

## 빌드

```bash
npm run build
npm run preview
```

## Netlify 배포

`netlify.toml` 설정:

- Build command: `npm run build`
- Publish directory: `dist`
- Function env var(optional): `GFORM_JSON_URL`
