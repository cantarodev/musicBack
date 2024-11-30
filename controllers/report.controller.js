const reportService = require("../services/internal/report.service");

const getReportObservations = async (req, res) => {
  const { user_id, period, queryType, filters, account } = req.body;
  try {
    const results = await reportService.getReportObservations(
      user_id,
      period,
      queryType,
      filters,
      account
    );

    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      data: null,
      message: error.message,
    });
  }
};

const getReportDetractions = async (req, res) => {
  const {
    user_id,
    period,
    queryType,
    docType,
    currency,
    filters,
    account,
    factoringStatuses,
  } = req.body;
  try {
    console.log("DETRACTIONS");
    console.log(account);
    console.log("BODY: ", req.body);
    const results = await reportService.getReportDetractions(
      user_id,
      period,
      queryType,
      docType,
      currency,
      filters,
      account,
      factoringStatuses
    );
    console.log("RESULT: ", results);
    res.status(200).json({
      status: "success",
      data: results,
      message: "Datos procesados exitosamente.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      data: null,
      message: error.message,
    });
  }
};

const getReporteCreditDebitNotes = async (req, res) => {
  console.log("REPORTE CREDIT DEBIT NOTES: ", req.body);
  const {
    user_id,
    period,
    queryType,
    docType,
    currency,
    filters,
    account,
    factoringStatuses,
  } = req.body;
  try {
    console.log("CREDIT - DEBITE NOTES");
    console.log(account);
    console.log("BODY: ", req.body);
    const results = await reportService.getReporteCreditDebitNotes(
      user_id,
      period,
      queryType,
      docType,
      currency,
      filters,
      account,
      factoringStatuses
    );
    console.log("RESULT: ", results);
    res.status(200).json({
      status: "success",
      data: results,
      message: "Datos procesados exitosamente.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      data: null,
      message: error.message,
    });
  }
};

const getReportCorrelativity = async (req, res) => {
  console.log("REPORTE correlativity: ", req.body);
  const {
    user_id,
    period,
    queryType,
    docType,
    currency,
    filters,
    account,
    factoringStatuses,
  } = req.body;
  try {
    console.log("Correlativity");
    console.log(account);
    console.log("BODY: ", req.body);
    const results = await reportService.getReportCorrelativity(
      user_id,
      period,
      queryType,
      docType,
      currency,
      filters,
      account,
      factoringStatuses
    );
    console.log("RESULT: ", results);
    res.status(200).json({
      status: "success",
      data: results,
      message: "Datos procesados exitosamente.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      data: null,
      message: error.message,
    });
  }
};

const getReportFactoring = async (req, res) => {
  const { user_id, period, queryType, docType, currency, filters, account } =
    req.body;
  try {
    console.log("BODY FACTORING: ", req.body);
    const results = await reportService.getReportFactoring(
      user_id,
      period,
      queryType,
      docType,
      currency,
      filters,
      account
    );
    console.log("RESULT: ", results);
    res.status(200).json({
      status: "success",
      data: results,
      message: "Datos procesados exitosamente.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      data: null,
      message: error.message,
    });
  }
};

const getReportMissings = async (req, res) => {
  const { user_id, period, queryType, account } = req.params;
  try {
    const results = await reportService.getReportMissings(
      user_id,
      period,
      queryType,
      account
    );

    res.status(200).json({
      status: "success",
      data: results,
      message: "Datos procesados exitosamente.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      data: null,
      message: error.message,
    });
  }
};

const getReportObservationsDownload = async (req, res) => {
  const { path } = req.body;
  console.log("path", path);

  try {
    const result = await reportService.getReportObservationsDownload(path);

    res.status(200).json({
      status: "success",
      data: result,
      message: "Observaciones descargado correctamente.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      data: null,
      message: error.message,
    });
  }
};

const getDownloadObservationsExcel = async (req, res) => {
  const { params, filteredData, filePath } = req.body;
  try {
    const data = JSON.parse(filteredData);
    const { excelBuffer, filename } =
      await reportService.getDownloadObservationsExcel(params, data, filePath);

    const excelBase64 = excelBuffer.toString("base64");

    res.status(200).json({
      status: "success",
      data: {
        excelBase64,
        filename: filename,
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      message:
        "El excel con las observaciones se procesaron de forma correcta.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      data: null,
      message: error.message,
    });
  }
};

const getDownloadMissingsExcel = async (req, res) => {
  const { filteredData, filePath } = req.body;
  try {
    const data = JSON.parse(filteredData);
    console.log("url:", filePath);

    const { excelBuffer, filename } =
      await reportService.getDownloadMissingsExcel(data, filePath);

    const excelBase64 = excelBuffer.toString("base64");

    res.status(200).json({
      status: "success",
      data: {
        excelBase64,
        filename: filename,
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      message:
        "El excel con los comprobantes faltantes se procesaron de forma correcta.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      data: null,
      message: error.message,
    });
  }
};

module.exports = {
  getReportObservations,
  getReportMissings,
  getReportObservationsDownload,
  getDownloadObservationsExcel,
  getDownloadMissingsExcel,
  getReportDetractions,
  getReporteCreditDebitNotes,
  getReportCorrelativity,
  getReportFactoring,
};
