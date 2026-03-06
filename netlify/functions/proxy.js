const DEFAULT_GFORM_JSON_URL_PRE = 'https://script.google.com/macros/s/AKfycbwcIXi2O4vJARKHyRJNh5HA2BQsJ5nC4PqHviMI-1GRXTkjZBEELCN1uoCUrEL0qFqCKQ/exec';
const DEFAULT_GFORM_JSON_URL_POST = 'https://script.google.com/macros/s/AKfycbyP4-EIA334DbLzscfG-8i95-IOgn5cFk5Glik8LkqRzP3aW9L2qy1V7RqXmAnYwF8U/exec';

export async function handler(event) {
  const dataset = event?.queryStringParameters?.dataset;
  const targetUrl = dataset === 'post'
    ? (process.env.GFORM_JSON_URL_POST || DEFAULT_GFORM_JSON_URL_POST)
    : (process.env.GFORM_JSON_URL_PRE || DEFAULT_GFORM_JSON_URL_PRE);

  try {
    const response = await fetch(targetUrl, {
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
