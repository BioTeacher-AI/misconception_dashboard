export async function handler() {
  const targetUrl = process.env.GFORM_JSON_URL;

  if (!targetUrl) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        error: 'GFORM_JSON_URL 환경변수가 설정되지 않았습니다.',
      }),
    };
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const text = await response.text();

    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: text,
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        error: '프록시 요청 중 오류가 발생했습니다.',
        detail: error?.message ?? 'unknown error',
      }),
    };
  }
}
