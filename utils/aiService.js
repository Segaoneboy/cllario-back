// utils/aiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

// !!! ВАЖНОЕ ИСПРАВЛЕНИЕ: Используем переменную окружения для ключа !!!
// Убедитесь, что в .env лежит НОВЫЙ ключ Gemini API.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Массив вопросов для контекста AI
const questions = [
    {
        name: "q1",
        question: "Что для тебя важнее в работе?",
        options: [
            { value: "influence", label: "Влиять на результат" },
            { value: "stable", label: "Стабильность" },
            { value: "challenge", label: "Новые вызовы" },
            { value: "team", label: "Хорошая атмосфера" },
        ],
    },
    {
        name: "q2",
        question: "Что сильнее тебя мотивирует?",
        options: [
            { value: "recognition", label: "Признание" },
            { value: "result", label: "Результат" },
            { value: "process", label: "Процесс" },
            { value: "money", label: "Деньги" },
        ],
    },
    {
        name: "q3",
        question: "Как ты решаешь сложные задачи?",
        options: [
            { value: "analysis", label: "Анализирую всё" },
            { value: "intuition", label: "Делаю интуитивно" },
            { value: "ask", label: "Спрашиваю других" },
            { value: "try", label: "Пробую и корректирую" },
        ],
    },
    {
        name: "q4",
        question: "Как ты чувствуешь себя в группе?",
        options: [
            { value: "leader", label: "Я лидер" },
            { value: "listener", label: "Я слушаю" },
            { value: "team", label: "Участвую" },
            { value: "solo", label: "Предпочитаю быть один" },
        ],
    },
];


// Используем модель без строгой JSON-схемы
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
});


/**
 * Парсит Markdown-ответ от AI в структурированный JSON-объект.
 */
const parseMarkdownResponse = (markdownText) => {
    const data = {
        summary: '',
        strengths: [],
        weaknesses: [],
        developmentPlan: []
    };

    // 1. Извлекаем Summary (первый параграф до первого заголовка)
    // Используем более универсальный паттерн для захвата текста до первого заголовка ##
    const summaryMatch = markdownText.match(/^(.*?)(?=\n##|$)/s);
    if (summaryMatch && summaryMatch[1]) {
        data.summary = summaryMatch[1].trim().replace(/\n+/g, ' ');
    }

    // 2. Парсим секции-массивы по жестко заданным заголовкам
    const sections = {
        'СИЛЬНЫЕ СТОРОНЫ': 'strengths',
        'СЛАБЫЕ СТОРОНЫ': 'weaknesses',
        'ПЛАН РАЗВИТИЯ': 'developmentPlan',
    };

    for (const [mdTitle, key] of Object.entries(sections)) {
        // Регулярное выражение для поиска заголовка и списка под ним
        const regex = new RegExp(`##\\s*${mdTitle}\\s*\\n+([^#]*?)(?=\\n##|$)`, 's');
        const match = markdownText.match(regex);

        if (match && match[1]) {
            const listText = match[1].trim();
            // Парсим Markdown-список (строки, начинающиеся с *, -, или цифры.)
            const items = listText
                .split(/\r?\n(?=[*-]|\d+\.)/)
                .map(item => item.replace(/^[*-]\s*|^\d+\.\s*/, '').trim()) // Удаляем символы списка
                .filter(item => item.length > 0); // Очищаем пустые строки

            data[key] = items;
        }
    }

    return data;
};


export const generateDevelopmentPlan = async (testResults) => {

    // Создаем расшифровку ответов для AI
    let analysisContext = "--- Детальный анализ ответов пользователя ---\n";

    questions.forEach(q => {
        const answerValue = testResults[q.name];
        if (answerValue) {
            const selectedOption = q.options.find(opt => opt.value === answerValue);
            const label = selectedOption ? selectedOption.label : 'Неизвестный ответ';

            analysisContext += `Вопрос: ${q.question}\n`;
            analysisContext += `Ответ: ${label} (Ключ: ${answerValue})\n\n`;
        }
    });


    const prompt = `
    Ты — профессиональный карьерный коуч, HR-консультант и психолог с 15-летним опытом. 
    Твоя задача — провести глубокий анализ на основе предоставленных данных и составить комплексный план развития.

    **КРИТИЧЕСКИЕ ИНСТРУКЦИИ ПО ФОРМАТУ ВЫВОДА:**
    1. Начни с краткого резюме (Summary). **НЕ НУЖНО ПИСАТЬ О ТОМ ЧТО ТЫ КОУЧЕР С 15-ЛЕТНИМ ОПЫТОМ** просто опиши краткое резюме без лишней информации
    2. Используй **только** следующие заголовки Markdown в точности, как они написаны: "## СИЛЬНЫЕ СТОРОНЫ", "## СЛАБЫЕ СТОРОНЫ", "## ПЛАН РАЗВИТИЯ".
    3. Все списки должны быть маркированными или нумерованными пунктами.
    4. Каждая секция должна содержать 5-7 конкретных, измеримых пунктов.
    5. **ВСЕ СЕКЦИИ ДОЛЖНЫ БЫТЬ ЗАПОЛНЕНЫ!** Генерируй сильные стороны, используя позитивную интерпретацию ответов.

    **Ответы пользователя (Сырые ключи):**
    ${JSON.stringify(testResults)}
    
    ${analysisContext} 

    `;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Парсим Markdown в нужный JSON-формат
        const parsedData = parseMarkdownResponse(responseText);

        // Добавляем минимальную проверку
        if (!parsedData || !parsedData.summary || parsedData.strengths.length === 0) {
            console.warn("AI сгенерировал неполный ответ. Попытка использования сырого текста...");
            // В случае неудачного парсинга, можно вернуть объект с хотя бы summary
            return {
                summary: parsedData.summary || responseText.substring(0, 200) + "...",
                strengths: parsedData.strengths || [],
                weaknesses: parsedData.weaknesses || [],
                developmentPlan: parsedData.developmentPlan || [],
            };
        }

        return parsedData;

    } catch (error) {
        console.error("Ошибка при генерации AI:", error);
        return null;
    }
};