import mongoose from "mongoose";
import Game from "../model/game.model.js";

// Helper to execute operations within a MongoDB transaction if supported
const runInTransaction = async (fn) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    const isTxNotSupported =
      error.message.includes("Transaction numbers are only allowed") ||
      error.message.includes("does not support retryable writes") ||
      error.message.includes("replica set") ||
      error.message.includes("session");

    if (isTxNotSupported) {
      console.warn("[Transaction] MongoDB transactions not supported by this deployment. Falling back to non-transactional execution.");
      return await fn(null);
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

// GET all games
export const getGames = async (req, res, next) => {
  try {
    const games = await Game.find().sort({ displayOrder: 1 }).lean();
    res.json({ success: true, data: games });
  } catch (err) {
    next(err);
  }
};

// GET single game
export const getGame = async (req, res, next) => {
  try {
    const game = await Game.findOne({ slug: req.params.slug })
      .populate("relatedApps")
      .lean();

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    res.json({ success: true, data: game });
  } catch (err) {
    next(err);
  }
};

// DELETE game by id
export const deleteGame = async (req, res, next) => {
  try {
    const { id } = req.params;
    const game = await Game.findByIdAndDelete(id);
    if (!game) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    // Preserve contiguous ordering by shifting subsequent displayOrders down by 1
    if (game && typeof game.displayOrder === "number") {
      await Game.updateMany(
        { displayOrder: { $gt: game.displayOrder } },
        { $inc: { displayOrder: -1 } }
      );
    }

    res.json({ success: true, message: "Game deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// Swap displayOrder with the adjacent game (up or down by one position)
export const swapGameOrder = async (req, res, next) => {
  try {
    const { id, direction } = req.body;

    if (!id || !["up", "down"].includes(direction)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request. 'id' and 'direction' ('up' or 'down') are required.",
      });
    }

    await runInTransaction(async (session) => {
      let queryA = Game.findById(id);
      if (session) queryA = queryA.session(session);
      const gameA = await queryA;

      if (!gameA) {
        throw new Error("Game not found");
      }

      const orderA = gameA.displayOrder;
      const targetOrder = direction === "up" ? orderA - 1 : orderA + 1;

      if (targetOrder < 1) {
        throw new Error("Game is already at the top position");
      }

      let queryB = Game.findOne({ displayOrder: targetOrder });
      if (session) queryB = queryB.session(session);
      const gameB = await queryB;

      if (!gameB) {
        throw new Error(direction === "up" ? "Game is already at the top position" : "Game is already at the bottom position");
      }

      // Step 1: Temporarily set A's displayOrder to a negative number to avoid duplicate key conflict
      let updateA1 = Game.updateOne({ _id: gameA._id }, { $set: { displayOrder: -orderA } });
      if (session) updateA1 = updateA1.session(session);
      await updateA1;

      // Step 2: Set B's displayOrder to A's original displayOrder
      let updateB = Game.updateOne({ _id: gameB._id }, { $set: { displayOrder: orderA } });
      if (session) updateB = updateB.session(session);
      await updateB;

      // Step 3: Set A's displayOrder to the targetOrder (B's original displayOrder)
      let updateA2 = Game.updateOne({ _id: gameA._id }, { $set: { displayOrder: targetOrder } });
      if (session) updateA2 = updateA2.session(session);
      await updateA2;
    });

    res.json({
      success: true,
      message: `Successfully moved game ${direction}`,
    });
  } catch (err) {
    if (err.message === "Game not found") {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err.message.includes("already at the top") || err.message.includes("already at the bottom")) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// Move game to any specific position, shifting only the affected records
export const moveGameOrder = async (req, res, next) => {
  try {
    const { id, targetPosition } = req.body;
    const toPos = Number(targetPosition);

    if (!id || isNaN(toPos) || toPos < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid request. 'id' and a positive integer 'targetPosition' are required.",
      });
    }

    const totalGames = await Game.countDocuments();
    if (toPos > totalGames) {
      return res.status(400).json({
        success: false,
        message: `targetPosition cannot exceed the total number of games (${totalGames})`,
      });
    }

    await runInTransaction(async (session) => {
      let queryA = Game.findById(id);
      if (session) queryA = queryA.session(session);
      const gameA = await queryA;

      if (!gameA) {
        throw new Error("Game not found");
      }

      const fromPos = gameA.displayOrder;
      if (fromPos === toPos) {
        return;
      }

      // Temporarily set gameA's displayOrder to a negative number to avoid duplicate key errors
      let updateA_temp = Game.updateOne({ _id: gameA._id }, { $set: { displayOrder: -fromPos } });
      if (session) updateA_temp = updateA_temp.session(session);
      await updateA_temp;

      if (fromPos > toPos) {
        // Moving from position 8 to 3: shift positions 3–7 down by one (increment by 1)
        // Process in descending order (largest position first) to avoid conflicts
        let queryShift = Game.find({ displayOrder: { $gte: toPos, $lte: fromPos - 1 } }).sort({ displayOrder: -1 });
        if (session) queryShift = queryShift.session(session);
        const affectedGames = await queryShift;

        for (const g of affectedGames) {
          let updateG = Game.updateOne({ _id: g._id }, { $set: { displayOrder: g.displayOrder + 1 } });
          if (session) updateG = updateG.session(session);
          await updateG;
        }
      } else {
        // Moving from position 3 to 8: shift positions 4–8 up by one (decrement by 1)
        // Process in ascending order (smallest position first) to avoid conflicts
        let queryShift = Game.find({ displayOrder: { $gte: fromPos + 1, $lte: toPos } }).sort({ displayOrder: 1 });
        if (session) queryShift = queryShift.session(session);
        const affectedGames = await queryShift;

        for (const g of affectedGames) {
          let updateG = Game.updateOne({ _id: g._id }, { $set: { displayOrder: g.displayOrder - 1 } });
          if (session) updateG = updateG.session(session);
          await updateG;
        }
      }

      // Set gameA's displayOrder to the target position
      let updateA_final = Game.updateOne({ _id: gameA._id }, { $set: { displayOrder: toPos } });
      if (session) updateA_final = updateA_final.session(session);
      await updateA_final;
    });

    res.json({
      success: true,
      message: `Successfully moved game to position ${toPos}`,
    });
  } catch (err) {
    if (err.message === "Game not found") {
      return res.status(404).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// Initialize displayOrder migration on server startup
export const initializeDisplayOrders = async () => {
  try {
    const games = await Game.find().sort({ displayOrder: 1, createdAt: 1 });
    let updatedCount = 0;
    for (let i = 0; i < games.length; i++) {
      const expectedOrder = i + 1;
      if (games[i].displayOrder !== expectedOrder) {
        games[i].displayOrder = expectedOrder;
        await games[i].save();
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      console.log(`[Migration] Contiguous displayOrder initialized/fixed for ${updatedCount} games.`);
    }
    // Synchronize unique index to ensure database matches mongoose schema
    await Game.syncIndexes();
  } catch (error) {
    console.error("[Migration] Error initializing displayOrder:", error);
  }
};