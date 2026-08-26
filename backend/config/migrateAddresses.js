/**
 * ONE-TIME MIGRATION SCRIPT
 * -------------------------
 * Purane Address documents (customer / full_name / street / pincode / is_default)
 * ko naye schema (user / firstName / lastName / addressLine1 / zipCode / isDefault ...)
 * me convert karta hai. Naye schema ke baad ye script sirf ek baar chalani hai.
 *
 * Run:  node config/migrateAddresses.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "./db.js";

dotenv.config();

const migrateAddresses = async () => {
  await connectDB();

  const collection = mongoose.connection.collection("addresses");

  // Purane docs jisme abhi bhi old field 'customer' mojood hai
  const oldDocs = await collection
    .find({ customer: { $exists: true } })
    .toArray();
  console.log(`Found ${oldDocs.length} old address document(s) to migrate...`);

  let migrated = 0;
  for (const doc of oldDocs) {
    // full_name → firstName/lastName split
    const parts = String(doc.full_name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    await collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          user: doc.customer,
          firstName: parts[0] || "Customer",
          lastName: parts.slice(1).join(" ") || "-",
          phone: doc.phone || "",
          addressLine1: doc.street || "",
          city: doc.city || "",
          state: doc.state || "",
          country: doc.country || "India",
          zipCode: doc.pincode || "",
          addressType: "HOME",
          isDefault: Boolean(doc.is_default),
        },
        $unset: {
          customer: "",
          full_name: "",
          street: "",
          pincode: "",
          is_default: "",
        },
      },
    );
    migrated += 1;
  }

  console.log(
    `Migration complete: ${migrated}/${oldDocs.length} address document(s) updated.`,
  );
  await mongoose.disconnect();
};

migrateAddresses().catch((error) => {
  console.error("Address migration failed:", error);
  process.exit(1);
});
