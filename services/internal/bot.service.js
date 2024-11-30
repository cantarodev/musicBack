const Bot = require("../../models/bot.model");
const { v4: uuidv4 } = require("uuid");

const createBot = async (
  name,
  description,
  identifier_tag,
  required_clave_sol
) => {
  try {
    const bot_id = uuidv4();

    await Bot.create({
      bot_id,
      name,
      description,
      identifier_tag,
      required_clave_sol,
    });

    return;
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

const getBots = async () => {
  try {
    const bots = await Bot.find();
    return bots;
  } catch (error) {
    throw new Error("Error al obtener bots. Detalles: " + error.message);
  }
};

const deleteBot = async (bot_id) => {
  try {
    const existsBot = await Bot.findById({ _id: bot_id });

    if (!existsBot) {
      throw new Error("No existe Bot");
    }

    return await Bot.findOneAndUpdate(
      {
        _id: bot_id,
      },
      { $set: { status: "inactive" } },
      {
        new: true,
        fields: ["name status description"],
      }
    );
  } catch (error) {
    throw new Error("Error al eliminar Bot. Detalles: " + error.message);
  }
};

const updateBot = async (bot_id, name, description, required_clave_sol) => {
  try {
    const bot = await Bot.findById({ _id: bot_id });

    if (!bot) {
      throw new Error("No se encontró el Bot");
    }
    let updateBotObject = {
      name: name || bot.name,
      description: description || bot.description,
      required_clave_sol: required_clave_sol || bot.required_clave_sol,
    };

    return await Bot.findOneAndUpdate(
      { _id: bot_id },
      {
        $set: updateBotObject,
      },
      {
        new: true,
        fields: ["name status description"],
      }
    );
  } catch (error) {
    throw new Error(
      "Error al actualizar la información del Bot. Detalles: " + error.message
    );
  }
};

module.exports = {
  createBot,
  getBots,
  deleteBot,
  updateBot,
};
