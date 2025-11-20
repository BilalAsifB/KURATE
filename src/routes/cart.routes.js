import { Router } from "express";
import {
    getCartsByDocument,
    createCart,
    updateCart,
    deleteCart,
    getAllUserCarts,
} from "../controllers/cart.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// ALl routes are protected and require JWT verification
router.use(verifyJWT);

// Get all carts for a specific document
router.route("/document/:documentId").get(getCartsByDocument);

// Get all carts for the authenticated user
router.route("/").get(getAllUserCarts);

// Create a new cart
router.route("/").post(createCart);

// Update an existing cart
router.route("/:cartId").put(updateCart);

// Delete a cart
router.route("/:cartId").delete(deleteCart);

export default router;