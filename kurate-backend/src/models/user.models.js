import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        trim: true  
    },
    refreshToken: {
        type: String
    },
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    },
    otp: {
        type: String
    },
    otpExpires: {
        type: Date
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    otpVerified: {
        type: Boolean,
        default: false
    }
}, {timestamps: true})

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(
            this.password,
            10
        )
        next()
    }
    return next()
})

userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = async function(){
    return jwt.sign({
        _id: this._id,
        email: this.email,
        name: this.name
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY      
    })
}

userSchema.methods.generateRefreshToken = async function(){
    return jwt.sign({
        _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY      
    })
}

userSchema.methods.generatePasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex')
    
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')
    
    this.passwordResetExpires = Date.now() + 15 * 60 * 1000 // 15 minutes
    
    return resetToken
}

export const User = mongoose.model("User", userSchema);