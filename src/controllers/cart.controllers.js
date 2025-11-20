import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { ContextCart } from "../models/contextCart.models.js";
import { Document } from "../models/document.models.js";

export const getCartsByDocument = asyncHandler(async (req, res) => {
    const { documentId } = req.params;
    const userId = req.user.id;

    // verufy that the document belongs to the user
    const document = await Document.findOne({ _id: documentId, user: userId });
    if (!document) {
        throw new APIError(404, "Document not found or access denied");
    }

    // Get all carts associated with the document
    const carts = await ContextCart
    .find({user: userId, document: documentId })
    .populate("document", "title")
    .sort({ createdAt: -1 });

    return res.status(200).json(
        new APIResponse(
            200, 
            carts, 
            `Retrieved ${carts.length} cart(s) for the document`
        )
    );
});

export const getAllUserCarts = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Get all carts for the authenticated user
    const carts = await ContextCart
    .find({ user: userId })
    .populate("document", "title sourceType")
    .sort({ createdAt: -1 });

    return res.status(200).json(
        new APIResponse(
            200, 
            carts, 
            `Retrieved ${carts.length} cart(s) for the user`
        )
    );
});

export const createCart = asyncHandler(async (req, res) => {
    const { documentId, name, snippets } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!documentId || documentId?.trim() === "") {
        throw new APIError(400, "Document ID is required");
    }

    if (!name || name?.trim() === "") {
        throw new APIError(400, "Cart name is required");
    }

    if (!snippets || !Array.isArray(snippets)) {
        throw new APIError(400, "Snippets array is required and must be an array");
    }

    if (snippets.length === 0) {
        throw new APIError(400, "At least one snippet is required");
    }

    // Verify that each snippet has required fields
    for (let i = 0; i < snippets.length; i++) {
        const snippet = snippets[i];
        if (!snippet.type || !["text", "table", "image"].includes(snippet.type)) {
            throw new APIError(400, `Snippet at index ${i} has invalid or missing type`);
        }
        if (!snippet.content || snippet.content?.trim() === "") {
            throw new APIError(400, `Snippet at index ${i} is missing content`);
        }
    }

    // Verify that the document belongs to the user
    const document = await Document.findOne({ _id: documentId, user: userId });
    if (!document) {
        throw new APIError(404, "Document not found or access denied");
    }

    // Create the new cart
    const newCart = await ContextCart.create({
        user: userId,
        document: documentId,
        name: name || "Untitled Cart",
        snippets,
    });

    // Populate document reference for response
    const populatedCart = await ContextCart
    .findById(cart._id)
    .populate("document", "title");

    return res.status(201).json(
        new APIResponse(201, populatedCart, "Context cart created successfully")
    );
});

export const updateCart = asyncHandler(async (req, res) => {
    const { cartId } = req.params;
    const { name, snippets } = req.body;
    const userId = req.user.id;

    // Find the cart to update and verify ownership
    const cart = await ContextCart.findOne({ _id: cartId, user: userId });
    if (!cart) {
        throw new APIError(404, "Context cart not found or access denied");
    }

    // Validate snippets if provided
    if (snippets && Array.isArray(snippets)) {
        if (snippets.length === 0) {
            throw new APIError(400, "Snippets must be an array");
        }

        for (let i = 0; i < snippets.length; i++) {
            const snippet = snippets[i];
            if (!snippet.type || !["text", "table", "image"].includes(snippet.type)) {
                throw new APIError(400, `Snippet at index ${i} has invalid or missing type`);
            }
            if (!snippet.content || snippet.content?.trim() === "") {
                throw new APIError(400, `Snippet at index ${i} is missing content`);
            }
        }
    }

    // Update cart fields
    const updateData = {};
    if (name != undefined) updateData.name = name;
    if (snippets != undefined) updateData.snippets = snippets;

    const updatedCart = await ContextCart.findByIdAndUpdate(
        cartId,
        { $set: updateData },
        { new: true }
    ).populate("document", "title");

    return res.status(200).json(
        new APIResponse(200, updatedCart, "Context cart updated successfully")
    );
});

export const deleteCart = asyncHandler(async (req, res) => {
   const { cartId } = req.params;
   const userId = req.user.id;
   
   // Find and delete the cart if it belongs to the user
   const cart = await ContextCart.findOneAndDelete({ _id: cartId, user: userId });
   if (!cart) {
       throw new APIError(404, "Context cart not found or access denied");
   }

   return res.status(200).json(
       new APIResponse(200, null, "Context cart deleted successfully")
   );   
});