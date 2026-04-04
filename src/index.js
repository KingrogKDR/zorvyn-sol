import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import { initDB, seedDB } from "./db/db.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import authRouter from "./routes/authRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";
import recordRouter from "./routes/recordRoutes.js";
import userRouter from "./routes/userRoutes.js";
import { globalErrorHandler } from "./utils/apiError.js";

dotenv.config()

const app = express();

initDB();
seedDB();

app.use(express.json());
app.use(cookieParser());


// routes...
app.use("/auth", authRouter)
app.use("/users", authMiddleware, userRouter)
app.use("/records", authMiddleware, recordRouter)
app.use("/dashboard", authMiddleware, dashboardRouter)

app.use(globalErrorHandler) // must be at the end

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(`Server is running on localhost:${port}`);
});

