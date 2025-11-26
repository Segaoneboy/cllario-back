import { prisma } from '../utils/prismaClient.js'

export const UserController = (req, res) => {
    const userId = req.user.id
    if(!userId) return res.status(401).json({ message: `Пользователь не авторизован` });

    prisma.user.findUnique({
        where: {id: userId},
        select: {
            name: true,
            email: true,
            test: {
                orderBy: { createdAt: 'desc' },
                take: 1,   // Берём только последний тест
                select: {
                    results: true,
                    plan: {
                        select: {
                            summary: true,
                            strengths: true,
                            weaknesses: true,
                            developmentPlan: true,
                        }
                    }
                }
            }
        }
    }).then(user => {
        res.status(200).json({user})
    }).catch(err => {res.status(500).json({message: `Пользователь не найден`});})
}
