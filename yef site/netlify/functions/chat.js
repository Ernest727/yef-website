// Netlify function for OpenAI chat streaming (SSE passthrough) with logging
export async function handler(event, context) {
  console.log('chat function invoked', { method: event.httpMethod });
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { messages } = JSON.parse(event.body || '{}');
    console.log('payload length ok?', Array.isArray(messages), 'messages:', messages ? messages.length : 0);
    const hasKey = !!process.env.OPENAI_API_KEY;
    console.log('API Key Loaded?', hasKey);
    if (!hasKey) {
      return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Chat temporarily unavailable.' }) };
    }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.4,
        stream: true,
        max_tokens: 500
      })
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error('OpenAI error:', errText);
      return { statusCode: r.status, headers: { 'Access-Control-Allow-Origin': '*' }, body: errText };
    }

    // Collect SSE chunks into one response (Netlify basic functions)
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let sse = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      sse += decoder.decode(value, { stream: true });
    }

    console.log('stream complete (bytes):', sse.length);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      },
      body: sse
    };
  } catch (e) {
    console.error('Function error:', e);
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: e.message }) };
  }
}
