/**
 * Migration Script: Convert Price-Based to Discount-Based Pricing
 *
 * This script migrates existing events from the old pricing model (minPrice/maxPrice)
 * to the new discount-based model (minDiscount/maxDiscount).
 *
 * OLD MODEL: Tickets have basePrice, minPrice, maxPrice
 * NEW MODEL: Tickets have basePrice, minDiscount (0-100%), maxDiscount (0-100%)
 *
 * Calculation:
 * - minDiscount = ((basePrice - maxPrice) / basePrice) * 100
 * - maxDiscount = ((basePrice - minPrice) / basePrice) * 100
 *
 * Usage: tsx scripts/migrate-pricing.ts
 */

import { connect } from "mongoose";
import Event from "../src/models/Event";

async function migratePricing() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    console.log("Connecting to MongoDB...");
    await connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB\n");

    // Find all events with ticket batches
    const events = await Event.find({}).lean();
    console.log(`Found ${events.length} events to migrate\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const event of events) {
      try {
        console.log(`Processing event: ${event.eventName} (${event._id})`);

        if (!event.ticketBatches || event.ticketBatches.length === 0) {
          console.log("  ⚠ No ticket batches found, skipping\n");
          skippedCount++;
          continue;
        }

        let hasOldFields = false;
        const updatedBatches = event.ticketBatches.map((batch: any) => {
          // Check if this batch still has old price fields
          if (
            typeof batch.minPrice !== "undefined" &&
            typeof batch.maxPrice !== "undefined"
          ) {
            hasOldFields = true;

            // Validate basePrice
            if (!batch.basePrice || batch.basePrice <= 0) {
              throw new Error(
                `Invalid basePrice (${batch.basePrice}) for batch "${batch.name}"`,
              );
            }

            // Calculate discount percentages
            // minDiscount: smallest discount (when price is highest/maxPrice)
            // maxDiscount: largest discount (when price is lowest/minPrice)
            const minDiscount =
              ((batch.basePrice - batch.maxPrice) / batch.basePrice) * 100;
            const maxDiscount =
              ((batch.basePrice - batch.minPrice) / batch.basePrice) * 100;

            // Ensure discounts are within valid range (0-100%)
            const safeMinDiscount = Math.max(0, Math.min(100, minDiscount));
            const safeMaxDiscount = Math.max(0, Math.min(100, maxDiscount));

            console.log(`  Batch: ${batch.name}`);
            console.log(`    Base Price: £${batch.basePrice}`);
            console.log(
              `    Old: £${batch.minPrice} - £${batch.maxPrice} (min-max price)`,
            );
            console.log(
              `    New: ${safeMinDiscount.toFixed(1)}% - ${safeMaxDiscount.toFixed(1)}% (min-max discount)`,
            );
            console.log(
              `    Resulting Price Range: £${(batch.basePrice * (1 - safeMaxDiscount / 100)).toFixed(2)} - £${(batch.basePrice * (1 - safeMinDiscount / 100)).toFixed(2)}`,
            );

            return {
              ...batch,
              minDiscount: safeMinDiscount,
              maxDiscount: safeMaxDiscount,
              // Remove old fields
              minPrice: undefined,
              maxPrice: undefined,
            };
          } else if (
            typeof batch.minDiscount !== "undefined" &&
            typeof batch.maxDiscount !== "undefined"
          ) {
            // Already migrated
            console.log(`  Batch: ${batch.name} - already migrated`);
            return batch;
          } else {
            throw new Error(
              `Batch "${batch.name}" has neither old nor new pricing fields`,
            );
          }
        });

        if (hasOldFields) {
          // Update the event with new discount-based pricing
          await Event.updateOne(
            { _id: event._id },
            { $set: { ticketBatches: updatedBatches } },
          );
          console.log("  ✓ Event migrated successfully\n");
          migratedCount++;
        } else {
          console.log("  ✓ Event already migrated\n");
          skippedCount++;
        }
      } catch (error) {
        console.error(`  ✗ Error processing event: ${error}`);
        console.error(`    Event ID: ${event._id}\n`);
        errorCount++;
      }
    }

    // Summary
    console.log("=".repeat(60));
    console.log("MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total events: ${events.length}`);
    console.log(`✓ Successfully migrated: ${migratedCount}`);
    console.log(`⚠ Skipped (no batches): ${skippedCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log("=".repeat(60));

    if (errorCount > 0) {
      console.log(
        "\n⚠ Some events failed to migrate. Please review the errors above.",
      );
      process.exit(1);
    } else {
      console.log("\n✓ Migration completed successfully!");
      process.exit(0);
    }
  } catch (error) {
    console.error("Fatal error during migration:", error);
    process.exit(1);
  }
}

// Run the migration
migratePricing();
