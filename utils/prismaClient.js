import { PrismaClient } from '@prisma/client'

// Создаем единственный экземпляр для всего приложения
export const prisma = new PrismaClient()