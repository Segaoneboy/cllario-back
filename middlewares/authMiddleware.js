import jwt from "jsonwebtoken";

export function authMiddleware (req, res, next) {
    try {
        const token = req.cookies.accessToken

        if (!token) {
            res.status(401).json({ message: `Access denied. No token provided. ${token}` });
            return;
        }
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        } catch (err) {
            res.status(401).json({ message: "Invalid or expired token." });
            return;
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: `Invalid or expired token. ${err}` });
    }
};
