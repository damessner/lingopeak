import db from '@/lib/db';

export interface AIServiceConfig {
  provider: 'GEMINI' | 'OPENCODE_ZEN';
  apiKey: string;
  endpointUrl?: string; // Optional custom endpoint for OpenCode Zen / gateway
  modelName?: string;   // Optional model selector
}

/**
 * Helper to fetch AI configuration settings from environment variables.
 * Fallbacks are provided if not configured.
 */
function getAIConfig(): AIServiceConfig {
  const provider = (process.env.AI_PROVIDER || 'GEMINI').toUpperCase() as 'GEMINI' | 'OPENCODE_ZEN';
  const apiKey = process.env.AI_API_KEY || '';
  const endpointUrl = process.env.AI_ENDPOINT_URL || 'https://api.opencode.ai/v1/chat/completions';
  const modelName = process.env.AI_MODEL_NAME || (provider === 'GEMINI' ? 'gemini-2.5-flash' : 'deepseek-v4-flash');

  return { provider, apiKey, endpointUrl, modelName };
}

/**
 * Sends a prompt to the configured AI provider and returns the string response.
 */
export async function generateCompletion(prompt: string, jsonMode: boolean = false): Promise<string> {
  const config = getAIConfig();

  if (!config.apiKey) {
    throw new Error('AI API Key is not configured. Please add AI_API_KEY to your env settings.');
  }

  if (config.provider === 'GEMINI') {
    // 1. Gemini REST API generateContent
    const model = config.modelName || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

    const payload = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: jsonMode ? {
        responseMimeType: 'application/json'
      } : undefined
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini API Error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('Gemini API returned an empty response.');
    }

    return responseText;
  } else {
    // 2. OpenCode Zen / OpenAI-Compatible completion API
    const url = config.endpointUrl || 'https://api.opencode.ai/v1/chat/completions';
    const model = config.modelName || 'zen-model';

    const payload = {
      model,
      messages: [
        { role: 'user', content: prompt }
      ],
      response_format: jsonMode ? { type: 'json_object' } : undefined,
      temperature: 0.3
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`OpenCode Zen API Error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    const responseText = data.choices?.[0]?.message?.content;
    if (!responseText) {
      throw new Error('OpenCode Zen API returned an empty response.');
    }

    return responseText;
  }
}
