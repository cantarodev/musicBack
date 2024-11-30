const fileManagerService = require("../services/internal/fileManager.service");

const createFile = async (req, res) => {
  try {
    const { user_id, rucAccount, option, period, type } = req.body;
    const files = req.files;

    if (option === "vouching") {
      await fileManagerService.createVouchingFile(
        res,
        user_id,
        rucAccount,
        period,
        files
      );
    } else {
      await fileManagerService.createFile(
        res,
        user_id,
        rucAccount,
        period,
        type,
        files
      );
    }
  } catch (error) {
    console.error(error);
    const message = String(error.message).trim();
    return res.status(500).json({
      status: "error",
      message: message,
    });
  }
};

const getFiles = async (req, res) => {
  const { user_id, rucAccount, year, type, option } = req.params;
  try {
    const files = await fileManagerService.getFiles(
      user_id,
      rucAccount,
      option,
      year,
      type
    );
    res.status(200).json({
      status: "success",
      data: files,
      message: "Archivos recuperados exitosamente.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      data: null,
      message: "Error al recuperar los archivos. Por favor, intente más tarde.",
    });
  }
};

const getTotals = async (req, res) => {
  const { user_id, rucAccount, option } = req.params;
  try {
    const data =
      option === "vouching"
        ? await fileManagerService.getVouchingTotals(user_id, rucAccount)
        : await fileManagerService.getPleTotals(user_id, rucAccount);

    res.status(200).json({
      status: "success",
      data: data,
      message: "Los totales de los archivos han sido recuperados exitosamente.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      data: null,
      message: "Error al recuperar los archivos. Por favor, intente más tarde.",
    });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { user_id, file_id, option } = req.params;

    const resp =
      option === "vouching"
        ? await fileManagerService.deleteVouchingFile(user_id, file_id)
        : await fileManagerService.deletePleFile(user_id, file_id);

    return res.status(200).json(resp);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "No se pudo eliminar la clave SOL. Err " + error,
    });
  }
};

const downloadFile = async (req, res) => {
  try {
    const { user_id, file_id, option } = req.params;

    const resp = await fileManagerService.downloadFile(
      user_id,
      file_id,
      option
    );
    return res.status(200).json(resp);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "No se pudo descargar. Err " + error,
    });
  }
};

const searchConstancePLE = async (req, res) => {
  try {
    const { user_id, file_id, comprobante } = req.params;
    const resp = await fileManagerService.searchConstancePLE(
      user_id,
      file_id,
      comprobante
    );
    return res.status(200).json(resp);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "No se pudo encontrar comprobante. Err " + error,
    });
  }
};

module.exports = {
  createFile,
  getFiles,
  getTotals,
  deleteFile,
  downloadFile,
  searchConstancePLE,
};
