import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { ApiError } from "./utils/ApiError.js"

const app = express();

// Build list of allowed origins from env + known defaults
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8000",
    ...(process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map(o => o.trim()).filter(Boolean)
        : [])
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, mobile apps, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, origin);
        }
        return callback(new Error(`CORS: Origin '${origin}' not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

import userRouter from './routes/user.route.js'
import bookRouter from './routes/book.route.js'
import adminRouter from './routes/admin.route.js'
import noteRouter from './routes/note.route.js'

app.use("/users", userRouter)
app.use("/books", bookRouter)
app.use("/admin", adminRouter)
app.use("/notes", noteRouter)

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

export { app };