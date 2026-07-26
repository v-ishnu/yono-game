import Game from "../model/game.model.js";
import { publishGoogleIndexing } from "../utils/googleIndexing.js";

/**
 * Controller to handle Instant Indexing request for a single game.
 */
export const indexSingleGame = async (req, res, next) => {
  try {
    const { id } = req.params;
    const game = await Game.findById(id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    try {
      const result = await publishGoogleIndexing(game.slug);

      game.indexingStatus = {
        status: "success",
        lastIndexedAt: new Date(),
        message: `Successfully indexed ${result.url}`,
      };
      await game.save();

      return res.status(200).json({
        success: true,
        message: `Game "${game.name}" submitted for Instant Indexing successfully!`,
        data: game,
      });
    } catch (indexErr) {
      console.error(`🚨 Google Indexing failed for game "${game.name}":`, indexErr.message || indexErr);

      game.indexingStatus = {
        status: "failed",
        lastIndexedAt: new Date(),
        message: indexErr.message || "Failed to index game with Google API",
      };
      await game.save();

      return res.status(400).json({
        success: false,
        message: indexErr.message || "Failed to submit for Instant Indexing",
        data: game,
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to handle Instant Indexing for multiple games in bulk.
 */
export const indexBulkGames = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of game IDs to index",
      });
    }

    const games = await Game.find({ _id: { $in: ids } });
    const results = [];
    const updatedGames = [];

    for (const game of games) {
      try {
        const result = await publishGoogleIndexing(game.slug);
        game.indexingStatus = {
          status: "success",
          lastIndexedAt: new Date(),
          message: `Successfully indexed ${result.url}`,
        };
        await game.save();
        results.push({ id: game._id, name: game.name, success: true });
        updatedGames.push(game);
      } catch (indexErr) {
        console.error(`🚨 Bulk Indexing failed for "${game.name}":`, indexErr.message || indexErr);
        game.indexingStatus = {
          status: "failed",
          lastIndexedAt: new Date(),
          message: indexErr.message || "Failed to index game",
        };
        await game.save();
        results.push({ id: game._id, name: game.name, success: false, error: indexErr.message });
        updatedGames.push(game);
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return res.status(200).json({
      success: true,
      message: `Bulk indexing complete: ${successCount}/${games.length} games indexed successfully.`,
      results,
      data: updatedGames,
    });
  } catch (err) {
    next(err);
  }
};
