import { prisma } from '../utils/prismaClient.js';
import { generateDevelopmentPlan } from '../utils/aiService.js'; // Импортируем наш сервис

export const testAnalysis = async (req, res) => {
    const results = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Пользователь не аутентифицирован" });
    }

    try {
        // 1. Сохраняем результаты теста (Test)
        // Используем транзакцию не обязательно, но логично было бы сначала сохранить тест,
        // а потом пробовать генерировать план.

        const savedTest = await prisma.test.create({
            data: {
                userId,
                results: results
            }
        });

        // 2. Отправляем результаты в ИИ
        // Это может занять 2-4 секунды, поэтому клиент будет ждать
        const aiPlanData = await generateDevelopmentPlan(results);

        let savedPlan = null;

        // 3. Если ИИ вернул данные, сохраняем их в DevelopmentPlan
        if (aiPlanData) {
            savedPlan = await prisma.developmentPlan.create({
                data: {
                    testId: savedTest.id,
                    summary: aiPlanData.summary,
                    // Используем новые, упрощенные поля:
                    strengths: aiPlanData.strengths,
                    weaknesses: aiPlanData.weaknesses,
                    developmentPlan: aiPlanData.developmentPlan,
                }
            });
        }

        // 4. Возвращаем полный ответ клиенту
        res.status(200).json({
            message: 'Анализ завершен успешно',
            test: savedTest,
            plan: savedPlan
        });

    } catch (error) {
        console.error("Ошибка в testAnalysis:", error);
        res.status(500).json({ message: "Произошла ошибка при сохранении или анализе", error: error.message });
    }
};