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

## 데이터 소스 / 프록시 구조

프론트엔드는 직접 Apps Script를 호출하지 않고, 항상 Netlify Function 프록시를 호출합니다.

- pre 요청: `/.netlify/functions/proxy?dataset=pre`
- post 요청: `/.netlify/functions/proxy?dataset=post`

프록시는 `dataset` 값을 읽어 **서로 다른 Apps Script URL**로 라우팅합니다.

- PRE API URL
  - `https://script.google.com/macros/s/AKfycbwcIXi2O4vJARKHyRJNh5HA2BQsJ5nC4PqHviMI-1GRXTkjZBEELCN1uoCUrEL0qFqCKQ/exec`
- POST API URL
  - `https://script.google.com/macros/s/AKfycbyP4-EIA334DbLzscfG-8i95-IOgn5cFk5Glik8LkqRzP3aW9L2qy1V7RqXmAnYwF8U/exec`

> 주의: 기존 `dataset=pre/post`를 Apps Script URL에 붙이는 방식은 더 이상 사용하지 않습니다.

## 로컬 실행

```bash
npm install
netlify dev
```

> 프록시 함수를 함께 쓰므로 로컬 실행은 `netlify dev`를 권장합니다.

## Netlify 환경변수

아래 2개를 설정하면 기본 URL을 덮어쓸 수 있습니다.

- `GFORM_JSON_URL_PRE`
- `GFORM_JSON_URL_POST`

예시:

```bash
GFORM_JSON_URL_PRE=https://script.google.com/macros/s/AKfycbwcIXi2O4vJARKHyRJNh5HA2BQsJ5nC4PqHviMI-1GRXTkjZBEELCN1uoCUrEL0qFqCKQ/exec
GFORM_JSON_URL_POST=https://script.google.com/macros/s/AKfycbyP4-EIA334DbLzscfG-8i95-IOgn5cFk5Glik8LkqRzP3aW9L2qy1V7RqXmAnYwF8U/exec
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
- Function env var(optional): `GFORM_JSON_URL_PRE`, `GFORM_JSON_URL_POST`
