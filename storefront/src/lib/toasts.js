import { toast } from "sonner";

/** Small success toast after adding a product to the bag. */
export const notifyAddedToBag = (name) =>
  toast.success("Added to your bag", {
    icon: "🛍️",
    description: `${name} is waiting in your bag`,
  });

/** Small toast after toggling the wishlist (saved or removed). */
export const notifyWishlist = (name, saved) =>
  toast.success(saved ? "Saved to wishlist" : "Removed from wishlist", {
    icon: saved ? "❤️" : "🤍",
    description: name,
  });
