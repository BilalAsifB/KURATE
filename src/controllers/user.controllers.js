import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { User } from "../models/user.models.js";
import { APIResponse } from "../utils/APIResponse.js";
import jwt from "jsonwebtoken";
import { sendConfirmationEmail, sendOTPEmail } from "../utils/emailService.js";
import crypto from "crypto";

// cookies are only server modifiable
const OPTIONS = { secure: true, httpOnly: true }

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const refreshToken = await user.generateRefreshToken()
        const accessToken = await user.generateAccessToken()
        
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false }) // save on db without running validators

        return { accessToken, refreshToken }
    } catch (error) {
        throw new APIError(500, `Token generation failed: ${error.message}`)
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const {
        name, email, password
    } = req.body

    // validate if all fields are provided
    if ([name, email, password].some(
        (field) => !field || field?.trim() === "" )) {
            throw new APIError(400, "All fields are required")
    }

    // email validation: must be a @nu.edu.pk email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@nu\.edu\.pk$/;
    if (!emailRegex.test(email.toLowerCase())) {
        throw new APIError(400, "Email must be a valid @nu.edu.pk email address")
    }

    // password validation: min 8 characters, one capital, one special char, alphanumeric
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password.trim())) {
        throw new APIError(400, "Password does not meet requirements. It must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character.");
    }

    // check if user already exists
    const existingUser = await User.findOne({
        email: email.toLowerCase()
    })

    if (existingUser) {
        throw new APIError(409, "User already exists")
    }

    // create user
    const user = await User.create({
        name: name.trim(), 
        email: email.toLowerCase().trim(),
        password: password.trim(), 
        refreshToken: ""
    })

    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // check if user creation was successful
    if (!userCreated) {
        throw new APIError(500, "User creation failed")
    }

    // return response
    return res.status(201).json(
        new APIResponse(201, userCreated, "User created successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    const {email, password} = req.body

    if (!email  || email?.trim() === "") {
        throw new APIError(400, "Email is required")
    }
    
    if (!password  || password?.trim() === "") {    
        throw new APIError(400, "Password is required")
    }

    const user = await User.findOne({
        email: email.toLowerCase().trim()
    })

    if (!user) {
        throw new APIError(404, "User not found")
    }

    const isCorrect = await user.isPasswordCorrect(password.trim())

    if (!isCorrect) {
        throw new APIError(401, "Invalid credentials")  
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const responseData = {
        user: loggedInUser,
        accessToken,
        refreshToken
    }

    return res.status(200).cookie(
        "accessToken", accessToken, OPTIONS
    ).cookie(
        "refreshToken", refreshToken, OPTIONS
    ).json(
        new APIResponse(
            200, 
            responseData,
            "Login successful. Please complete your profile.",
            "Login successful")
    )
})

const logOutUser = asyncHandler(async (req, res) => {
    const userId = req.user._id
    await User.findByIdAndUpdate(userId,
        {$set: {refreshToken: undefined}},
        {new: true}
    )

    return res.status(200).clearCookie(
        "accessToken", OPTIONS
    ).clearCookie(
        "refreshToken", OPTIONS
    ).json(
        new APIResponse(200, {}, "Logout successful")
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken || incomingRefreshToken?.trim() === "") {
        throw new APIError(400, "Refresh token is required")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        if (!decodedToken?._id) {
            throw new APIError(401, "Invalid refresh token")
        }
    
        const user = await User.findById(decodedToken._id)
    
        if (!user || !user.refreshToken) {
            throw new APIError(401, "Invalid refresh token")
        }
    
        if (user.refreshToken !== incomingRefreshToken) {
            throw new APIError(401, "Invalid refresh token")
        }
    
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    
    
        return res.status(200).cookie(
            "accessToken", accessToken, OPTIONS
        ).cookie(
            "refreshToken", refreshToken, OPTIONS
        ).json(
            new APIResponse(200, {
                accessToken,
                refreshToken
            }, "Access token refreshed successfully")
        )
    } catch (error) {
        if (error instanceof APIError) {
            throw error
        }
        throw new APIError(401, error?.message || "Invalid refresh token")
    }
})

const forgetPassword = asyncHandler(async (req, res) => {
    const { email } = req.body

    // Validate email
    if (!email || email?.trim() === "") {
        throw new APIError(400, "Email is required")
    }

    // Find user by email
    const user = await User.findOne({
        email: email.toLowerCase().trim()
    })

    if (!user) {
        // Return success message even if user doesn't exist (security best practice)
        return res.status(200).json(
            new APIResponse(200, {}, "If an account exists with this email, you will receive an OTP to verify your identity")
        )
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Set OTP and expiry (10 minutes)
    user.otp = otp
    user.otpExpires = Date.now() + 10 * 60 * 1000
    user.otpAttempts = 0
    user.otpVerified = false
    await user.save({ validateBeforeSave: false })

    try {
        // Send OTP email
        await sendOTPEmail(user.email, otp)

        return res.status(200).json(
            new APIResponse(200, { userId: user._id }, "OTP has been sent to your email. Please verify within 10 minutes.")
        )
    } catch (error) {
        // Clear OTP on email failure
        user.otp = undefined
        user.otpExpires = undefined
        await user.save({ validateBeforeSave: false })

        throw new APIError(500, "Failed to send OTP email. Please try again later.")
    }
})

const verifyOTP = asyncHandler(async (req, res) => {
    const { userId, otp } = req.body

    // Validate inputs
    if (!userId || userId?.trim() === "") {
        throw new APIError(400, "User ID is required")
    }

    if (!otp || otp?.trim() === "") {
        throw new APIError(400, "OTP is required")
    }

    // Find user by ID
    const user = await User.findById(userId)

    if (!user) {
        throw new APIError(404, "User not found")
    }

    // Check if OTP is expired
    if (!user.otpExpires || user.otpExpires < Date.now()) {
        throw new APIError(400, "OTP has expired. Please request a new one.")
    }

    // Check max OTP attempts (max 5 attempts)
    if (user.otpAttempts >= 5) {
        // Clear OTP after max attempts
        user.otp = undefined
        user.otpExpires = undefined
        user.otpAttempts = 0
        await user.save({ validateBeforeSave: false })
        throw new APIError(429, "Too many OTP verification attempts. Please request a new OTP.")
    }

    // Verify OTP
    if (user.otp !== otp.trim()) {
        user.otpAttempts += 1
        await user.save({ validateBeforeSave: false })
        throw new APIError(400, `Incorrect OTP. ${5 - user.otpAttempts} attempts remaining.`)
    }

    // OTP is correct
    user.otpVerified = true
    user.otp = undefined
    user.otpExpires = undefined
    user.otpAttempts = 0
    await user.save({ validateBeforeSave: false })

    return res.status(200).json(
        new APIResponse(200, { verified: true }, "OTP verified successfully. You can now change your password.")
    )
})

const resetPassword = asyncHandler(async (req, res) => {
    const { userId, token, newPassword, confirmPassword } = req.body

    // Validate all required fields
    if (!userId || userId?.trim() === "") {
        throw new APIError(400, "User ID is required")
    }

    if (!token || token?.trim() === "") {
        throw new APIError(400, "Reset token is required")
    }

    if (!newPassword || newPassword?.trim() === "") {
        throw new APIError(400, "New password is required")
    }

    if (!confirmPassword || confirmPassword?.trim() === "") {
        throw new APIError(400, "Password confirmation is required")
    }

    if (newPassword !== confirmPassword) {
        throw new APIError(400, "Passwords do not match")
    }

    // Password validation: min 8 characters, one capital, one special char, alphanumeric
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(newPassword.trim())) {
        throw new APIError(400, "Password does not meet requirements. It must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character.")
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex')

    // Find user with matching reset token and unexpired token
    const user = await User.findOne({
        _id: userId,
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    })

    if (!user) {
        throw new APIError(400, "Password reset token is invalid or has expired")
    }

    // Update password and clear reset token
    user.password = newPassword.trim()
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined

    await user.save()

    try {
        // Send confirmation email
        await sendConfirmationEmail(user.email, user.name)
    } catch (error) {
        console.error("Failed to send confirmation email:", error)
        // Don't throw error here since password reset was successful
    }

    return res.status(200).json(
        new APIResponse(200, {}, "Password has been reset successfully. Please log in with your new password.")
    )
})

export { 
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    forgetPassword,
    verifyOTP,
    resetPassword,
}