import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { ApiError } from "./utils/ApiError.js"

const app=express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true)
        if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }
        return callback(new ApiError(403, "CORS blocked for this origin"))
    },
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true , limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRouter from './routes/user.route.js'

//routes declaration
app.use("/api/v1/users",userRouter)
//http://localhost:3000/api/v1/users/register

app.use((req, res, next) => {
    next(new ApiError(404, "Route not found"))
})

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500
    const message = err.message || "Internal Server Error"

    return res.status(statusCode).json({
        success: false,
        message,
        errors: err.errors || []
    })
})

export {app};