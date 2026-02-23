# Misconception Dashboard (Vite + React)

Google Apps Script 웹앱 JSON API를 읽어 설문 결과를 대시보드로 표시하는 Vite + React(JavaScript) 프로젝트입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

## 환경변수 설정

프로젝트 루트에 `.env` 파일을 만들고 API URL을 설정하세요.

```bash
VITE_GFORM_API_URL=https://your-google-apps-script-webapp-url
```

코드에서는 아래와 같이 사용합니다.

```js
const API_URL = import.meta.env.VITE_GFORM_API_URL;
```

## 빌드

```bash
npm run build
npm run preview
```

## Netlify 배포

이 저장소에는 `netlify.toml`이 포함되어 있습니다.

- Build command: `npm run build`
- Publish directory: `dist`

Netlify 사이트 설정에서 환경변수 `VITE_GFORM_API_URL`를 반드시 추가하세요.
