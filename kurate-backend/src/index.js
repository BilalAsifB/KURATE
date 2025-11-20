import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./database/index.js";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 8000;

// Connect to database and start server
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`⚡ Server is running at http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect database:", err);
        process.exit(1);
    });

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    process.exit(1);
});