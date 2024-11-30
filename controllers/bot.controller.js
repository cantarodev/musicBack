const botService = require("../services/internal/bot.service");

const createBot = async (req, res) => {
  try {
    const { identifier_tag, name, description, required_clave_sol } = req.body;
    await botService.createBot(
      name,
      description,
      identifier_tag,
      required_clave_sol
    );

    return res.status(200).json({
      status: "success",
      message: "Bot creada con éxito.",
    });
  } catch (error) {
    console.error(message);
    return res.status(500).json({
      status: "error",
      message:
        "Lo sentimos, hubo un problema con el servidor. Por favor, inténtalo de nuevo más tarde.",
    });
  }
};

const getBots = async (req, res) => {
  try {
    const bots = await botService.getBots();
    res.status(200).json({
      status: "success",
      data: bots,
      message: "Bots recuperados exitosamente.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      data: null,
      message: "Error al recuperar los bots. Por favor, intente más tarde.",
    });
  }
};

const deleteBot = async (req, res) => {
  try {
    const { botId } = req.params;

    await botService.deleteBot(botId);

    res.status(200).json({
      status: "success",
      message: "Bot eliminado de forma exitosa.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "No se pudo eliminar el Bot.",
    });
  }
};

const updateBot = async (req, res) => {
  const { bot_id, name, description, required_clave_sol } = req.body;

  try {
    const bot = await botService.updateBot(
      bot_id,
      name,
      description,
      required_clave_sol
    );
    res.status(200).json({
      status: "success",
      data: bot,
      message: "Bot actualizado de forma exitosa.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      data: null,
      message: "No se pudo actualizar la información del Bot",
    });
  }
};

module.exports = {
  createBot,
  getBots,
  deleteBot,
  updateBot,
};
