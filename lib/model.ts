type GenerateInput = {
  prompt: string;
  model?: string;
};

type GenerateOutput = {
  text: string;
  provider: "mock" | "rayincode";
};

function buildMockReply(prompt: string) {
  return `【模拟模型输出】${prompt.slice(0, 220)}`;
}

async function callRayincode(input: GenerateInput): Promise<GenerateOutput> {
  const apiKey = process.env.RAYINCODE_API_KEY;
  const baseUrl = process.env.RAYINCODE_BASE_URL || "https://api.rayincode.com/v1";
  const model = input.model || process.env.RAYINCODE_MODEL || "gpt-5.3-codex";

  if (!apiKey) {
    return { text: buildMockReply(input.prompt), provider: "mock" };
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      messages: [
        {
          role: "user",
          content: input.prompt,
        },
      ],
    }),
  });

  if (!res.ok) {
    return { text: buildMockReply(input.prompt), provider: "mock" };
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();

  if (!text) {
    return { text: buildMockReply(input.prompt), provider: "mock" };
  }

  return { text, provider: "rayincode" };
}

export async function generateAnswer(input: GenerateInput): Promise<GenerateOutput> {
  return callRayincode(input);
}
