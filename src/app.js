import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));

app.use(express.json({
    limit: "16kb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}));

app.use(cookieParser());

// Routes
app.use("/api/users", userRouter);

// Basic health check route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Kurate Server is running"
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(`[${new Date().toISOString()}] Error: ${message}`);

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || []
    });
});

// 404 Not Found middleware
app.use((req, res) => {
    res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Route not found"
    });
});

export default app;