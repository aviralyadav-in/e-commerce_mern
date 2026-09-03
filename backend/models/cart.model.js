import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required for cart"],
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        // 🆕 Color variant snapshot — same product ke alag variants
        // (Black vs Brown) alag cart lines banate hain.
        variantName: {
          type: String,
          default: null,
          trim: true,
          maxlength: [60, "Variant name cannot exceed 60 characters"],
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, "Quantity cannot be less than 1"],
          default: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalPrice: {
      type: Number,
      default: 0,
    },
    couponApplied: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalAmountAfterDiscount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const Cart = mongoose.model("Cart", cartSchema);
