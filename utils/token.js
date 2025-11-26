import jwt from "jsonwebtoken";

export const generateTokens = (user) =>{
    const accessToken = jwt.sign(
        {id: user.id},
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '10m' }
    )

    const refreshToken = jwt.sign(
        {id: user.id},
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    )

    return { accessToken, refreshToken }
}

