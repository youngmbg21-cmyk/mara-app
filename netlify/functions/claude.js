// Netlify Function — Claude API proxy
// Forwards requests to api.anthropic.com to avoid browser CORS blocks.
// The API key is passed from the client per-request (stored in the user's
// browser localStorage, never hardcoded here).

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const payload = JSON.parse(event.body);
    const { apiKey, anthropicVersion, body } = payload;

    if (!apiKey || !body) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing apiKey or body' }),
      };
    }

    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': anthropicVersion || '2023-06-01',
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });

    const data = await res.text();

    return {
      statusCode: res.status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: data,
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Proxy error' }),
    };
  }
};
