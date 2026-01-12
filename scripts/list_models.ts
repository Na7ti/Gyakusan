
import { getCookies } from "https://deno.land/std@0.216.0/http/cookie.ts";

async function listModels() {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found");
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  console.log(`Fetching models from: ${url.replace(apiKey, "HIDDEN")}`);

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      console.error("Error fetching models:", data);
    } else {
      console.log("Available Models:");
      data.models?.forEach((m: any) => {
        if (m.supportedGenerationMethods?.includes("generateContent")) {
           console.log(`- ${m.name} (${m.version})`);
        }
      });
    }
  } catch (e) {
    console.error("Exception:", e);
  }
}

listModels();
