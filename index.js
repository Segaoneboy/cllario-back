import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import AuthRoute from "./routes/AuthRoute.js";
import TestRoute from "./routes/TestRoute.js";
import UserRoute from "./routes/UserRoute.js";
dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: ["http://localhost:3000"],
    credentials: true,
}));

app.use('/api/auth/', AuthRoute)
app.use('/api/test/', TestRoute)
app.use('/api/', UserRoute)

app.listen(port, ()=>{
    console.log(`Server started on port ${port}`);
})