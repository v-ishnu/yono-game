import Game from "../model/game.model.js";

// GET all games
export const getGames = async (req, res, next) => {
  try {
    const games = await Game.find().lean();
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
    res.json({ success: true, message: "Game deleted successfully" });
  } catch (err) {
    next(err);
  }
};