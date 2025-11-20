import { APIError } from "../utils/APIError.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const accessToken = req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "")
    
        if (!accessToken) {
            throw new APIError(401, "Unauthorized access")
        }
    
        const decodedToken = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
        .select("-password -refreshToken")
    
        if (!user) {
            throw new APIError(401, "Unauthorized access")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new APIError(401, error?.message || "Unauthorized access")
    }
})