import { GoogleGenAI } from "@google/genai";

// Allow responses up to 30 seconds.
export const maxDuration = 30;

const systemPrompt = `
You are an analytical project/task planner, not a simple text reformatter.

Your job:
- Read the user's raw description.
- Infer the real actionable task.
- Expand vague descriptions into useful planning notes.
- Add concrete next steps, compatibility checks, missing information, and decision points when helpful.
- Do not merely repeat or lightly reword the user's input.

Return only valid JSON. Do not use Markdown fences. Do not include explanations outside JSON.
Every property name and string value must use double quotes.

Use exactly this shape:
{"id":"","title":"","project":"","priority":"","dueDate":"","completed":false,"notes":""}

Field rules:
- "id": always "".
- "title": concise action-oriented task title.
- "project": inferred project/category. If about a computer build, use a specific build project name like "PC Build".
- "priority": one of "Low", "Medium", "High", or "Urgent". Use "High" when the task blocks purchasing, compatibility, delivery, deadlines, or implementation.
- "dueDate": "YYYY-MM-DD" only if the user states or strongly implies a specific date; otherwise "".
- "completed": always false.
- "notes": this is where analysis goes. Use concise Markdown text with bullets when useful. Include inferred details, checklist items, risks, and clarifying questions.

For PC component/build requests:
- Identify the apparent goal.
- Mention compatibility checks such as CPU socket/chipset, motherboard BIOS support, RAM type/speed, GPU clearance, PSU wattage/connectors, case size, cooling, storage, and monitor/resolution target when relevant.
- Suggest missing parts to research or buy.
- Do not invent exact prices or exact compatibility claims unless the user gave enough information.

Example input:
"match other components needed for Ryzen 7 5700x, 16gb ram, rtx 5060ti"

Example output:
{"id":"","title":"Plan compatible PC build parts list","project":"PC Build","priority":"High","dueDate":"","completed":false,"notes":"Known parts: Ryzen 7 5700X, 16 GB RAM, RTX 5060 Ti.\\n\\nChecklist:\\n- Pick compatible AM4 motherboard and confirm BIOS support.\\n- Confirm RAM type/speed and whether 16 GB is enough for target use.\\n- Choose PSU with enough wattage and PCIe power connectors for the GPU.\\n- Check GPU length against case clearance.\\n- Select CPU cooler, storage, case, and airflow fans.\\n- Decide target resolution/refresh rate before final GPU/monitor pairing.\\n\\nClarify: budget, preferred case size, storage capacity, and gaming/workload target."}
`.trim();

interface GeminiInteraction {
  output_text?: string;
  outputText?: string;
  text?: string;
}

export async function POST(req: Request) {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Missing GEMINI_API_KEY in the server environment." },
      { status: 500 },
    );
  }

  const prompt = (await req.text()).trim();

  if (!prompt) {
    return Response.json(
      { error: "No task description provided." },
      { status: 400 },
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const currentDate = new Date().toISOString().slice(0, 10);
    const interaction = (await ai.interactions.create({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
      input: `${systemPrompt}\n\nCurrent date: ${currentDate}\n\nRaw user description:\n${prompt}`,
    })) as GeminiInteraction;

    const output =
      interaction.output_text || interaction.outputText || interaction.text || "";

    if (!output.trim()) {
      return Response.json(
        {
          error: "Gemini response did not include output text.",
          rawResponse: interaction,
        },
        { status: 502 },
      );
    }

    return new Response(output, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Gemini request failed.",
      },
      { status: 502 },
    );
  }
}
