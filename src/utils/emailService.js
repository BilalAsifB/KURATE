import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTPEmail = async (email, otp) => {
    try {
        const data = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "noreply@kurate.app",
            to: email,
            subject: "Your Password Reset OTP - KURATE",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">Password Reset Verification</h2>
                    <p>We received a request to reset your password. Use the OTP below to proceed:</p>
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                        <p style="font-size: 12px; color: #999; margin: 0 0 10px 0;">Your OTP Code</p>
                        <p style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 2px; margin: 0;">
                            ${otp}
                        </p>
                    </div>
                    <p style="color: #666;">Enter this code in the app to verify your email address.</p>
                    <p style="color: #999; font-size: 12px; margin-top: 20px;">
                        This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin-top: 20px;">
                    <p style="color: #999; font-size: 12px;">
                        © 2025 KURATE. All rights reserved.
                    </p>
                </div>
            `
        });

        return { success: true, data };
    } catch (error) {
        console.error("Error sending OTP email:", error);
        throw new Error(`Failed to send OTP email: ${error.message}`);
    }
};

export const sendPasswordResetEmail = async (email, resetToken, userId) => {
    try {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${userId}/${resetToken}`;

        const data = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "noreply@kurate.app",
            to: email,
            subject: "Password Reset Request - KURATE",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>We received a request to reset your password. Click the link below to proceed:</p>
                    <p style="margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
                            Reset Password
                        </a>
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        Or copy and paste this link in your browser:<br/>
                        <code style="background-color: #f5f5f5; padding: 5px; border-radius: 3px;">${resetUrl}</code>
                    </p>
                    <p style="color: #999; font-size: 12px; margin-top: 20px;">
                        This link will expire in 15 minutes. If you didn't request a password reset, please ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin-top: 20px;">
                    <p style="color: #999; font-size: 12px;">
                        © 2025 KURATE. All rights reserved.
                    </p>
                </div>
            `
        });

        return { success: true, data };
    } catch (error) {
        console.error("Error sending reset email:", error);
        throw new Error(`Failed to send password reset email: ${error.message}`);
    }
};

export const sendConfirmationEmail = async (email, userName) => {
    try {
        const data = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "noreply@kurate.app",
            to: email,
            subject: "Password Reset Successful - KURATE",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">Password Reset Successful</h2>
                    <p>Hi ${userName},</p>
                    <p>Your password has been successfully reset. You can now log in with your new password.</p>
                    <p style="margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL}/login" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
                            Go to Login
                        </a>
                    </p>
                    <p style="color: #999; font-size: 12px; margin-top: 20px;">
                        If you did not reset your password, please contact our support team immediately.
                    </p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin-top: 20px;">
                    <p style="color: #999; font-size: 12px;">
                        © 2025 KURATE. All rights reserved.
                    </p>
                </div>
            `
        });

        return { success: true, data };
    } catch (error) {
        console.error("Error sending confirmation email:", error);
        throw new Error(`Failed to send confirmation email: ${error.message}`);
    }
};
