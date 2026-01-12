export class GeminiClient {
  private apiKey: string;

  constructor() {
    this.apiKey = Deno.env.get("GEMINI_API_KEY") || "";
  }

  async generateRoadmap(examTitle: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const model = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const prompt = `資格試験「${examTitle}」の合格に向けた効率的な学習ロードマップを作成してください。以下の項目を含めてください：
1. 効率的な学習順序
2. 重点的に取り組むべき頻出分野
3. 学習のコツやアドバイス
日本語で簡潔に、Markdown形式で出力してください。`;

    try {
      console.log(`Fetching Gemini API: ${this.apiKey ? "KEY_PRESENT" : "KEY_MISSING"} for model ${model}`);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Gemini API Error:", error);
        throw new Error(`Gemini API failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (e) {
      console.error("Gemini API Exception:", e);
      throw e;
    }
  }
}
