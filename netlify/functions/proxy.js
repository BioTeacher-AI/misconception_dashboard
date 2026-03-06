const DEFAULT_GFORM_JSON_URL = 'https://script.google.com/macros/s/AKfycbyhcx9DhJYA146r1WEigOXn51WK7mzi0ikEjFD4VEpWKoxzqREy9EVPBHJdECXwT0bwTQ/exec';

export async function handler(event) {
  const baseUrl = process.env.GFORM_JSON_URL || DEFAULT_GFORM_JSON_URL;
  const dataset = event?.queryStringParameters?.dataset;

  const targetUrl = new URL(baseUrl);
  if (dataset === 'pre' || dataset === 'post') {
    targetUrl.searchParams.set('dataset', dataset);
  }

  try {
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
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
