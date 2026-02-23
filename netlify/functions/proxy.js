const DEFAULT_GFORM_JSON_URL = 'https://script.google.com/macros/s/AKfycbynbBxwrZxznIqDebsUVI3MYVfIL3uWja9q_swsqeN7JYX0vIoj8vpiMFKyMsjZK6neVg/exec';

export async function handler() {
  const targetUrl = process.env.GFORM_JSON_URL || DEFAULT_GFORM_JSON_URL;

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
