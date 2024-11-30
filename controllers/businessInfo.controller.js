const businessInfoService = require("../services/internal/businessInfo.service");

const getPeriodsByRuc = async (req, res) => {
  const { tipo, ruc } = req.params;

  try {
    const periods = await businessInfoService.getPeriods(tipo, ruc);

    res.status(200).json({
      success: true,
      data: periods,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los períodos",
    });
  }
};

module.exports = {
  getPeriodsByRuc,
};
