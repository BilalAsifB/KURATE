import { Router } from "express";
import { refreshAccessToken, registerUser, loginUser, logOutUser, forgetPassword, verifyOTP, changePassword } from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import rateLimit from  "express-rate-limit";

const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        statusCode: 429,
        message: "Too many accounts created from this IP, please try again after 15 minutes"
    }
})

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: {
        statusCode: 429,
        message: "Too many login attempts from this IP, please try again after 15 minutes"
    }
});

const forgetPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 requests per hour
    message: {
        statusCode: 429,
        message: "Too many password reset attempts from this IP, please try again after 1 hour"
    }
});

const verifyOTPLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: {
        statusCode: 429,
        message: "Too many OTP verification attempts, please try again after 15 minutes"
    }
});

const router = Router();

router.route("/register").post(
    registerLimiter,
    registerUser
); 

router.route("/login").post(
    loginLimiter,
    loginUser
)

// Password reset routes (3-step process)
router.route("/forgot-password").post(
    forgetPasswordLimiter,
    forgetPassword
)

router.route("/verify-otp").post(
    verifyOTPLimiter,
    verifyOTP
)

router.route("/change-password").post(
    changePassword
)

// secured routes
router.route("/logout").post(
    verifyJWT,
    logOutUser
)

router.route("/refresh-token").post(
    refreshAccessToken
)

export default router;