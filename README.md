# Misconception Dashboard (Vite + React)

Google Apps Script 웹앱 JSON API를 읽어 설문 결과를 대시보드로 표시하는 Vite + React(JavaScript) 프로젝트입니다.

## 로컬 실행

```bash
npm install
netlify dev
```

> 프록시 함수(`/.netlify/functions/proxy`)를 사용하므로 로컬에서도 `netlify dev` 실행을 권장합니다.

## 환경변수 설정

### Netlify Function 환경변수 (`GFORM_JSON_URL`)

프록시 함수는 기본적으로 아래 Google Apps Script URL을 사용합니다.

```bash
https://script.google.com/macros/s/AKfycbynbBxwrZxznIqDebsUVI3MYVfIL3uWja9q_swsqeN7JYX0vIoj8vpiMFKyMsjZK6neVg/exec
```

원하면 `GFORM_JSON_URL`로 다른 엔드포인트를 덮어쓸 수 있습니다.

- Netlify 사이트 대시보드 → **Site configuration** → **Environment variables**
- 아래 키를 추가

```bash
GFORM_JSON_URL=https://script.google.com/macros/s/AKfycbynbBxwrZxznIqDebsUVI3MYVfIL3uWja9q_swsqeN7JYX0vIoj8vpiMFKyMsjZK6neVg/exec
```

로컬에서는 `.env` 또는 쉘 환경변수로 설정할 수 있습니다.

```bash
GFORM_JSON_URL=https://script.google.com/macros/s/AKfycbynbBxwrZxznIqDebsUVI3MYVfIL3uWja9q_swsqeN7JYX0vIoj8vpiMFKyMsjZK6neVg/exec
```

## 프론트엔드 API 경로 (App.jsx와 동일)

프론트엔드는 직접 Apps Script를 호출하지 않고 Netlify Function 프록시를 호출합니다. 기본값은 아래와 같습니다.

```js
const API_URL = import.meta.env.VITE_API_PROXY_PATH || '/.netlify/functions/proxy';
```

일반적으로 `VITE_API_PROXY_PATH`는 설정하지 않아도 되며, 필요할 때만 경로를 오버라이드합니다.

## 빌드

```bash
npm run build
npm run preview
```

## Netlify 배포

이 저장소에는 `netlify.toml`이 포함되어 있습니다.

- Build command: `npm run build`
- Publish directory: `dist`
- Function env var(선택): `GFORM_JSON_URL`
