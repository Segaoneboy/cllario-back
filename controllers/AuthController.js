import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from '../utils/prismaClient.js'
import { generateTokens } from "../utils/token.js";

export const register = (req, res) => {
    const { name, email, password } = req.body;
    if(!name || !email || !password) return res.status(400).json({message: "Пустое поле при заполнении"})

    bcrypt
        .hash(password, 10)
        .then((hashedPassword) => {
            return prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                },
            });
        })
        .then((user) => {
            const { accessToken, refreshToken} = generateTokens(user);
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 7*24*60*60*1000,
            })
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 10*60*1000,
            })
            res.status(201).json({message: "Регистрация прошла успешно"})
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({ message: "Регистрация провалена"})
        })
}
export const login = (req, res) =>{
    const {email, password} = req.body;
    if(!email || !password) return res.status(400).json({ message: "Неправильный логин или пароль"})

    prisma.user
        .findUnique({ where: { email }})
        .then((user) => {
            if (!user) throw new Error("Неверные данные пользователя")

            return bcrypt.compare(password, user.password)
                .then((isMatch) => {
                    if (!isMatch) throw new Error("Неверный пароль")

                    const { accessToken, refreshToken } = generateTokens(user);

                    res.cookie("refreshToken", refreshToken, {
                        httpOnly: true,
                        secure: true,
                        sameSite: "none",
                        maxAge: 7*24*60*60*1000,
                    })
                    res.cookie('accessToken', accessToken, {
                        httpOnly: true,
                        secure: true,
                        sameSite: "none",
                        maxAge: 10*60*1000,
                    })
                    res.json({message: "Успешный вход"})
                });
        })
        .catch((err) => {
            console.error(err);
            res.status(401).json({ message: "Авторизация провалена"})
        })
}
export const refresh = (req, res) =>{
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken) return res.status(401).json({ message: "Refresh Token отсутствует"})

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
        if (err) return res.status(401).json({ message: "Неверный токен " })

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7*24*60*60*1000,
        });
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 10*60*1000,
        })
        res.json({message: "Refresh произошел успешно"})

    })

}
export const logout = (req, res) => {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
    });
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
    });

    res.json({ message: "Успешный выход из системы" })
}
