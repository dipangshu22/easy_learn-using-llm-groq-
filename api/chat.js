export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GROQ_API_KEY' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { messages } = body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Expected { messages: [...] }' });
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', 
        max_tokens: 1024,
        temperature: 0.3,
        messages,
      }),
    });

    let data;
    try {
      data = await groqRes.json();
    } catch {
      const text = await groqRes.text();
      return res.status(500).json({
        error: 'Invalid response from Groq',
        raw: text,
      });
    }

    if (!groqRes.ok) {
      return res.status(groqRes.status).json({
        error: data.error?.message || 'Groq API error',
      });
    }

    const text = data.choices?.[0]?.message?.content ?? '';
return res.status(200).json({
  content: [{ type: 'text', text }]
});

  } catch (err) {
    return res.status(500).json({
      error: 'Internal server error: ' + err.message,
    });
  }
}