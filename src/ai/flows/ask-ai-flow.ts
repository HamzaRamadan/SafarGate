'use server';
/**
 * @fileOverview An AI flow to answer user questions with text, aware of user context.
 *
 * - askAi - A function that calls the Genkit flow.
 * - AskAiInput - The input type for the flow.
 * - AskAiOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, getDoc } from 'firebase/firestore';
import { serverFirestore } from '@/firebase/server';


// تعريف نوع السياق الجديد بدقة
const AiContextSchema = z.object({
  path: z.string(),
  role: z.string().optional(),
});

// تعريف نوع المدخلات للدالة
const AskAiInputSchema = z.object({
  question: z.string().min(1, 'Question cannot be empty.'),
  context: AiContextSchema,
});
export type AskAiInput = z.infer<typeof AskAiInputSchema>;

// تعريف نوع المخرجات
const AskAiOutputSchema = z.object({
  answerText: z.string().describe("The text-based answer to the user's question."),
});
export type AskAiOutput = z.infer<typeof AskAiOutputSchema>;


// الدالة العامة النظيفة
export async function askAi(input: AskAiInput): Promise<AskAiOutput> {
  // 1. Protocol 88: Validation & Limits
  if (!input.question || input.question.trim().length === 0) {
      throw new Error("عفواً، السؤال فارغ.");
  }
  if (input.question.length > 200) {
    throw new Error("عفواً، السؤال طويل جداً. يرجى الاختصار (أقل من 200 حرف).");
  }

  return askAiFlow(input);
}


const askAiFlow = ai.defineFlow(
  {
    name: 'askAiFlowWithContext',
    inputSchema: AskAiInputSchema,
    outputSchema: AskAiOutputSchema,
  },
  async (input) => {
    try {
        // FETCH DYNAMIC KNOWLEDGE BASE
        const kbRef = doc(serverFirestore, 'system_config', 'knowledge_base');
        const kbSnap = await getDoc(kbRef);

        // Fallback logic if document doesn't exist yet
        const KNOWLEDGE_BASE = kbSnap.exists() ? kbSnap.data().content : "قاعدة المعرفة غير متاحة حالياً. يرجى الاتصال بالدعم.";

        // 2. Dynamic Context Injection (الحقن السياقي)
        const userRole = input.context.role === 'carrier' ? 'ناقل (سائق)' : 
                         input.context.role === 'traveler' ? 'مسافر' : 'زائر';
        
        const pageContext = input.context.path.includes('/carrier') ? 'لوحة تحكم الناقل' :
                            input.context.path.includes('/dashboard') ? 'لوحة المسافر' : 'الصفحة العامة';

        // 3. The Master Prompt
        const systemPrompt = `
          أنت المساعد الذكي الرسمي لنظام "سفريات".
          
          [بيانات المستخدم الحالي]:
          - الصفة: ${userRole}
          - المكان الحالي: ${pageContext}
          
          [قاعدة المعرفة الحية]:
          ${KNOWLEDGE_BASE}
          
          [التعليمات]:
          1. أجب بناءً على "بيانات المستخدم الحالي" (مثلاً: لا تشرح للمسافر كيفية تأسيس رحلة).
          2. مصدرك الوحيد هو قاعدة المعرفة أعلاه. لا تؤلف معلومات خارجية.
          3. أجب باختصار شديد (لا تتجاوز 3 جمل).
          4. كن لطيفاً ومهنياً.
          5. أجب باللغة العربية دائماً.
        `;

        // 4. Low-Cost Execution (Gemini Flash)
        const { text } = await ai.generate({
          model: 'googleai/gemini-1.5-flash', // النموذج الاقتصادي
          system: systemPrompt,
          prompt: input.question,
          config: {
            maxTokens: 300, // حد صارم للتكلفة
          },
        });
        
        if (!text) {
            throw new Error('AI model returned an empty response.');
        }

        return { answerText: text };

    } catch (error) {
        console.error('AI Error:', error);
        throw new Error("واجهت مشكلة تقنية بسيطة. هل يمكنك إعادة السؤال؟");
    }
  }
);
