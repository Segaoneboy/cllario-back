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
const allowedOrigins = ['https://localhost:3000', "https://cllario.vercel.app"];

app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: function(origin, callback){
        if(!origin) return callback(null, true);
        if(allowedOrigins.includes(origin)){
            return callback(null, true);
        }
        return callback(new Error("Not allowed"));
    },
    credentials: true,
}));

app.use('/api/auth/', AuthRoute)
app.use('/api/test/', TestRoute)
app.use('/api/', UserRoute)

app.listen(port, ()=>{
    console.log(`Server started on port ${port}`);
})