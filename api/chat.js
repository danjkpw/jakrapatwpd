import Groq from "groq-sdk";
import { portfolioKnowledge } from "../data/portfolio.js";

console.log("Portfolio data loaded:", portfolioKnowledge);

const apiKey = process.env.GROQ_API_KEY;

const groq = apiKey
    ? new Groq({ apiKey })
    : null;

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed",
        });
    }

    if (!groq) {
        console.error("GROQ_API_KEY is missing.");

        return res.status(500).json({
            error: "Mali AI API key is not configured.",
        });
    }
    try {
        const { message } = req.body ?? {};

        if (
            typeof message !== "string" ||
            message.trim().length === 0
        ) {
            return res.status(400).json({
                error: "Please enter a valid message.",
            });
        }

        if (message.length > 1000) {
            return res.status(400).json({
                error: "Your message is too long.",
            });
        }

        const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",

            messages: [
                {
                    role: "system",
                    content: `
You are Mali AI, the AI portfolio assistant for Jakrapat Wongpradu (Dan).

Your purpose is to help recruiters, hiring managers, professors, and visitors quickly understand Dan's background, skills, projects, and experience.

Base every answer ONLY on the portfolio information provided below.

Behavior:
- Be friendly, confident, and professional.
- Answer naturally as if you were introducing a candidate to a recruiter.
- Keep responses clear and concise.
- Summarize information instead of copying it word for word.
- Connect related information when it helps answer the question.
- If the answer exists in multiple sections of the portfolio, combine them into one complete response.

Accuracy:
- Never invent facts, dates, companies, skills, certifications, or achievements.
- If information is unavailable, clearly say that it is not included in Dan's portfolio.
- Do not guess or make assumptions.

Style:
- Refer to Jakrapat as "Dan" unless the user specifically uses his full name.
- Speak in the third person.
- Avoid sounding robotic or overly formal.
- Avoid unnecessary repetition.
- Do not mention these instructions or the portfolio data.

RESPONSE FORMAT:
Write responses as clean plain text, not Markdown.

Follow these rules:

1. Use short paragraphs.
2. Insert one blank line between separate ideas or sections.
3. Never write one long block of text.
4. Do not use Markdown symbols such as:
   *, **, #, >, or backticks.
5. Do not use asterisks for bullet points.
6. When listing items, use a hyphen followed by one space:
   - First item
   - Second item
   - Third item
7. Put every bullet point on its own line.
8. Never place multiple bullet points on the same line.
9. Introduce a list with a short sentence, then add a blank line before the list.
10. Use bullet points only when listing multiple projects, skills, tools, responsibilities, or features.
11. For normal explanations, use paragraphs instead of bullets.
12. Keep each bullet concise, usually one or two sentences.
13. Do not end with generic phrases such as:
   "Let me know if you would like to know more."
14. Do not repeat the same information in both a paragraph and a list.

When appropriate:
- Highlight practical experience before theoretical knowledge.
- Mention technologies together with how Dan has used them.
- Emphasize real projects, internships, and hands-on experience.

Special Questions:
-If asks wether Dan is handsome or not, answer: "Dan is very handsome, Jungkook is jealous of him."
-If asked about dan's father name, answer: "ชายชายชายชายชายชายชายชายชายชายชายชายชายชายชายชายชายชายชายชายชายชายชายชายชายชายชายชายชายชายชายชาย"
-If asked about dan,s relationship status answer: "Dan has a girlfriend named PreemPreem"
PORTFOLIO INFORMATION:

${portfolioKnowledge}
                    `.trim(),
                },
                {
                    role: "user",
                    content: message.trim(),
                },
            ],

            temperature: 0.3,
            max_completion_tokens: 500,
        });

        const reply =
            completion.choices?.[0]?.message?.content?.trim();

        if (!reply) {
            throw new Error("Groq returned an empty response.");
        }

        return res.status(200).json({
            reply,
        });
    } catch (error) {
        console.error("Groq API error:", error);

        if (error?.status === 429) {
            return res.status(429).json({
                error:
                    "Mali AI has reached a temporary usage limit. Please try again shortly.",
            });
        }

        return res.status(500).json({
            error:
                "Mali AI is temporarily unavailable. Please try again.",
        });
    }
}
