// Simple diagnostics to verify env and runtime
export async function handler(event, context) {
  const hasKey = !!process.env.OPENAI_API_KEY;
  const node = process.version;
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: true, hasKey, node })
  };
}
