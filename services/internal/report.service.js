require("dotenv").config();
const mongoose = require("mongoose");
const zlib = require("zlib");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const LibroElectronico = require("../../models/libroElectronico.model");

const {
  getTipoComprobante,
  getTipoMoneda,
  calculateCoincidencePercentage,
  calculateDiscrepancyPercentage,
  calculateTotalAmountDifference,
  generateMissingExcel,
  generateObservationExcel,
} = require("../../utils/report.utils");

const { convertPeriodToMonth, currentDate } = require("../../utils/date.utils");

const {
  generateReportDetractions,
  generateReportDebitCreditNotes,
  getReportCorrelativityService,
  getReportFactoringService,
} = require("../external/report.service");
const { streamToString, parseS3Url } = require("../../utils/file.utils");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const getReportObservations = async (
  user_id,
  periodSearch,
  queryType,
  filters,
  account
) => {
  try {
    const file = await LibroElectronico.findOne(
      {
        user_id: user_id,
        ruc_account: account,
        period: periodSearch,
        type: queryType,
      },
      "path data general_status "
    );

    if (!file) {
      return {
        status: "failed",
        data: [],
        message: `No existe PLE ${queryType} para el período ${periodSearch} de la cuenta ${account}`,
      };
    }

    if (
      ("cpe" in filters || "cond" in filters) &&
      file.general_status != "processed"
    ) {
      return {
        status: "failed",
        data: [],
        message: `CPE sigue en proceso, estado: ${
          file.general_status == "validating" ? "validando" : "pendiente"
        }`,
      };
    }

    const collectionName = queryType === "compras" ? "purchases" : "sales";

    const collection = mongoose.connection.collection(collectionName);
    const db_data = await collection
      .find(
        {
          rucAccount: account,
          periodo: periodSearch,
          observaciones: { $exists: true },
        },
        {
          projection: {
            identityInfo: 1,
            "mtos.mtoIGV": 1,
            "mtos.mtoImporteTotal": 1,
            observaciones: 1,
          },
        }
      )
      .toArray();

    const compressedData = file.data[0];
    const bufferData = compressedData.buffer;

    const decompressedData = JSON.parse(zlib.gunzipSync(bufferData).toString());
    const ple_list = decompressedData;

    const db_list = Object.fromEntries(
      db_data.map((item) => [item.identityInfo, item])
    );

    const results = [];
    for (const item of ple_list) {
      const additionalData = db_list[item.identityInfo];
      if (additionalData) {
        const validCurrencies = ["PEN", "USD", "EUR"];
        const codMoneda = validCurrencies.includes(item.codMoneda)
          ? item.codMoneda
          : "OTRO";

        results.push({
          ...item,
          tipoComprobante:
            item.codComp + " - " + getTipoComprobante(item.codComp),
          moneda: codMoneda,
          tipoMoneda: codMoneda + " - " + getTipoMoneda(item.codMoneda),
          observaciones: additionalData.observaciones,
          mtoIGV: additionalData.mtos.mtoIGV,
          mtoImporteTotal: additionalData.mtos.mtoImporteTotal,
        });
      }
    }
    return {
      status: "success",
      data: results,
      filePath: file.path,
      message: "El reporte se generó de forma exitosa.",
    };
  } catch (error) {
    console.error("Error al obtener files. Detalles:", error.message);
    throw new Error(error.message);
  }
};

const getReportDetractions = async (
  user_id,
  period_search,
  queryType,
  docType,
  currency,
  filters,
  account
) => {
  console.log("getReportDetractions");
  try {
    console.log(
      "account: ",
      account,
      "- ruc_account: ",
      account,
      "- period: ",
      period_search,
      "- queryType: ",
      queryType
    );

    const file = await LibroElectronico.findOne({
      user_id: user_id,
      ruc_account: account,
      period: period_search,
      type: queryType,
    });

    if (!file) {
      return { all_results: [] };
    }

    const { ruc_account, period, type, path } = file;

    const urlObj = new URL(path);
    const key = urlObj.pathname.substring(1);

    const collectionNameDetractions = "detracciones";
    const collectionD = mongoose.connection.collection(
      collectionNameDetractions
    );
    const db_data = await collectionD
      .find({ observacion: { $exists: true } })
      .toArray();

    const compressedData = file.data[0];
    const bufferData = compressedData.buffer;

    const decompressedData = JSON.parse(zlib.gunzipSync(bufferData).toString());
    const ple_list = decompressedData;
    // console.log("###########################");
    // console.log("ple_list: ", ple_list);
    // console.log("###########################");
    // console.log("db_data: ", db_data[0]);
    const db_list = Object.fromEntries(
      db_data.map((item) => [item.identityInfo, item])
    );
    // console.log("db_list: ", db_list);
    const results = [];
    for (const item of ple_list) {
      const additionalData =
        db_list[
          (item.identityInfo,
          item.fecha_pago_sunat,
          item.rate_calculate,
          item.sunat_monto_dep,
          item.sunat_rate_csv,
          item.sunat_tipo_bien)
        ];
      // console.log("additionalData: ", additionalData);
      console.log("item00000: ", item);
      if (additionalData) {
        console.log("item1: ", item);
        results.push({
          ...item,
          tipoComprobante:
            item.codComp + " - " + getTipoComprobante(item.codComp),
          tipoMoneda: item.codMoneda + " - " + getTipoMoneda(item.codMoneda),
          fecha_pago_sunat: additionalData.fecha_pago_sunat,
          rate_calculate: additionalData.rate_calculate,
          sunat_monto_dep: additionalData.sunat_monto_dep,
          sunat_rate_csv: additionalData.sunat_rate_csv,
          sunat_tipo_bien: additionalData.sunat_tipo_bien,
          observacion: additionalData.observacion,
          mtoIGV: additionalData.sumatoria_igv,
          mtoImporteTotal: additionalData.importe_total_fe,
        });
      }
    }
    console.log("results: ", results.length);

    return {
      status: "success",
      data: results,
      download_path: "",
      relevant_data: "results.relevant_data",
      message: "El reporte se generó de forma exitosa.",
    };

    // const collectionName = type === "compras" ? "purchases" : "sales";

    // const results = await generateReportDetractions(
    //   collectionName,
    //   ruc_account,
    //   period,
    //   key,
    //   filters,
    //   "observations",
    //   docType,
    //   currency
    // );

    // return results;
  } catch (error) {
    console.error("Error al obtener files. Detalles:", error.message);
    throw new Error(error.message);
  }
};

const getReporteCreditDebitNotes = async (
  user_id,
  period_search,
  queryType,
  docType,
  currency,
  filters,
  account
) => {
  try {
    console.log("#####################################################")
    console.log("CREDIT DEBIT NOTES")
    console.log(
      "account: ",
      account,
      "- ruc_account: ",
      account,
      "- period: ",
      period_search,
      "- queryType: ",
      queryType
    );

    const file = await LibroElectronico.findOne({
      user_id: user_id,
      ruc_account: account,
      period: period_search,
      type: queryType,
    });

    if (!file) {
      return { all_results: [] };
    }


    console.log("file: ", file);
    const { path } = file;
    console.log("path: ", path);
    const urlObj = new URL(path);
    const key = urlObj.pathname.substring(1);

    // const collectionName = type === "compras" ? "purchases" : "sales";
    const collectionName = "detracciones";

    const collection = mongoose.connection.collection(collectionName);

    const db_data = await collection
    .find({ observacion_c_b: { $exists: true } })
    .toArray();  

      const compressedData = file.data[0];
      const bufferData = compressedData.buffer;
  
      const decompressedData = JSON.parse(zlib.gunzipSync(bufferData).toString());
      const ple_list = decompressedData;
  
      const db_list = Object.fromEntries(
        db_data.map((item) => [item.identityInfo, item]),
      );
      
      console.log("db_list: ", db_list);
      console.log("==================================")
      console.log("ple_list: ", ple_list);
      const results = [];
      for (const item of ple_list) {
        const additionalData = db_list[item.identityinfo];
        console.log("####################################");
        console.log("additionalData: ", additionalData);
        if (additionalData) {
          results.push({
            ...item,
            tipoComprobante:
              item.codComp + " - " + getTipoComprobante(item.codComp),
            tipoMoneda: item.codMoneda + " - " + getTipoMoneda(item.codMoneda),
            observacion: additionalData.observacion_c_b,
            mtoIGV: additionalData.sumatoria_igv,
            mtoImporteTotal: additionalData.importe_total_fe,
          });
        }
      }
      console.log("results: ", results.length);
  
      return {
        status: "success",
        data: results,
        download_path: "",
        relevant_data: "results.relevant_data",
        message: "El reporte se generó de forma exitosa.",
      };

  } catch (error) {
    console.error("Error al obtener files. Detalles:", error.message);
    throw new Error(error.message);
  }
};

const getReportCorrelativity = async (
  user_id,
  period_search,
  queryType,
  docType,
  currency,
  filters,
  account
) => {
  try {
    console.log(
      "account: ",
      account,
      "- ruc_account: ",
      account,
      "- period: ",
      period_search,
      "- queryType: ",
      queryType
    );

    const file = await LibroElectronico.findOne({
      user_id: user_id,
      ruc_account: account,
      period: period_search,
      type: queryType,
    });

    if (!file) {
      return { all_results: [] };
    }

    const { ruc_account, period, type, path } = file;

    const urlObj = new URL(path);
    const key = urlObj.pathname.substring(1);

    const collectionName = type === "compras" ? "purchases" : "sales";

    const results = await getReportCorrelativityService(
      collectionName,
      ruc_account,
      period,
      key,
      filters,
      "observations",
      docType,
      currency
    );

    return results;
  } catch (error) {
    console.error("Error al obtener files. Detalles:", error.message);
    throw new Error(error.message);
  }
};

const getReportFactoring = async (
  user_id,
  period,
  queryType,
  docType,
  currency,
  filters,
  account
) => {
  console.log("#######################");
  console.log("FACTORING1");
  try {
    console.log("periodo: ", period);
    console.log("user_id: ", user_id);
    const file = await LibroElectronico.findOne(
      {
        user_id: user_id,
        ruc_account: account,
        period: period,
        type: queryType,
      },
      "path data"
    );

    if (!file) {
      return { all_results: [] };
    }
    console.log("file: ", file);
    const { path } = file;
    console.log("path: ", path);
    const urlObj = new URL(path);
    const key = urlObj.pathname.substring(1);

    // const collectionName = type === "compras" ? "purchases" : "sales";
    const collectionName = "factoring";

    const collection = mongoose.connection.collection(collectionName);
    // const db_data = await collection
    // .find(
    //   { observaciones: { $exists: true } }
    // )
    // .toArray();

    const db_data = await collection
      .find(
        { observacion: { $exists: true } },
        {
          projection: {
            observacion: 1,
            identityInfo: 1,
            _id: 0,
            sumatoria_igv: 1,
            importe_total_fe: 1,
          },
        }
      )
      .toArray();

    const compressedData = file.data[0];
    const bufferData = compressedData.buffer;

    const decompressedData = JSON.parse(zlib.gunzipSync(bufferData).toString());
    const ple_list = decompressedData;

    const db_list = Object.fromEntries(
      db_data.map((item) => [item.identityInfo, item])
    );

    const results = [];
    for (const item of ple_list) {
      const additionalData = db_list[item.identityInfo];
      console.log("####################################");
      console.log("additionalData: ", additionalData);
      if (additionalData) {
        results.push({
          ...item,
          tipoComprobante:
            item.codComp + " - " + getTipoComprobante(item.codComp),
          tipoMoneda: item.codMoneda + " - " + getTipoMoneda(item.codMoneda),
          observacion: additionalData.observacion,
          mtoIGV: additionalData.sumatoria_igv,
          mtoImporteTotal: additionalData.importe_total_fe,
        });
      }
    }
    console.log("results: ", results.length);

    return {
      status: "success",
      data: results,
      download_path: "",
      relevant_data: "results.relevant_data",
      message: "El reporte se generó de forma exitosa.",
    };
  } catch (error) {
    console.error("Error al obtener files. Detalles:", error.message);
    throw new Error(error.message);
  }
};

const getReportMissings = async (userId, periodSearch, queryType, account) => {
  try {
    const file = await LibroElectronico.findOne(
      {
        user_id: userId,
        ruc_account: account,
        period: periodSearch,
        type: queryType,
      },
      "data path"
    );

    if (!file) {
      return {
        allResults: [],
        relevantData: {
          totalSunat: 0,
          totalPle: 0,
          coincidences: 0,
          numOnlyInDatabase: 0,
          numOnlyInPle: 0,
          coincidencePercentage: "0%",
          sumTotalDifference: 0,
          sumTotalDatabase: 0,
          sumTotalPle: 0,
          discrepancyPercentage: "0%",
          discrepancyCount: 0,
          totalCoincidences: 0,
        },
      };
    }

    const compressedData = file.data[0];
    const bufferData = compressedData.buffer;

    const decompressedData = JSON.parse(zlib.gunzipSync(bufferData).toString());
    const pleList = decompressedData.map((item) => ({
      identityInfo: item.identityInfo,
      codComp: item.codComp,
      numeroSerie: item.numeroSerie,
      numero: item.numero,
      monto: item.monto,
      periodo: item.periodo,
      codMoneda: item.codMoneda,
    }));

    const collectionName = queryType === "compras" ? "purchases" : "sales";
    const collection = mongoose.connection.collection(collectionName);
    const dbList = await collection
      .aggregate([
        {
          $match: {
            rucAccount: account,
            periodo: periodSearch,
            fecRegistro: { $exists: true },
          },
        },
        {
          $project: {
            _id: 0,
            periodo: 1,
            identityInfo: 1,
            codComp: "$codCpe",
            numero: "$numCpe",
            numeroSerie: "$numSerie",
            codMoneda: 1,
            monto: "$mtos.mtoImporteTotal",
          },
        },
      ])
      .toArray();

    const pleOnly = pleList.filter(
      (item) =>
        !dbList.some((dbItem) => dbItem.identityInfo === item.identityInfo)
    );

    const dbOnly = dbList.filter(
      (item) =>
        !pleList.some((pleItem) => pleItem.identityInfo === item.identityInfo)
    );

    const coincidences = pleList.filter((pleItem) =>
      dbList.some((dbItem) => dbItem.identityInfo === pleItem.identityInfo)
    );

    const pleOnlyWithSource = pleOnly.map((item) => ({
      ...item,
      source: "ple",
    }));

    const dbOnlyWithSource = dbOnly.map((item) => ({
      ...item,
      source: "sunat",
    }));

    const combinedData = [...pleOnlyWithSource, ...dbOnlyWithSource];

    const results = [];
    for (const item of combinedData) {
      const validCurrencies = ["PEN", "USD", "EUR"];
      const codMoneda = validCurrencies.includes(item.codMoneda)
        ? item.codMoneda
        : "OTRO";

      results.push({
        ...item,
        tipoComprobante:
          item.codComp + " - " + getTipoComprobante(item.codComp),
        moneda: codMoneda,
        tipoMoneda: codMoneda + " - " + getTipoMoneda(item.codMoneda),
      });
    }

    const coincidencePercentage = calculateCoincidencePercentage(
      dbList,
      pleList,
      coincidences
    );

    const { sumTotalDifference, sumTotalDatabase, sumTotalPle } =
      calculateTotalAmountDifference(dbList, pleList);

    const { discrepancyPercentage, discrepancyCount, totalCoincidences } =
      calculateDiscrepancyPercentage(dbList, pleList);

    const relevantData = {
      totalSunat: dbList.length || 0,
      totalPle: pleList.length || 0,
      coincidences: coincidences.length || 0,
      numOnlyInDatabase: dbOnly.length || 0,
      numOnlyInPle: pleOnly.length || 0,
      coincidencePercentage: coincidencePercentage || "0%",
      sumTotalDifference,
      sumTotalDatabase,
      sumTotalPle,
      discrepancyPercentage: discrepancyPercentage || "0%",
      discrepancyCount,
      totalCoincidences,
    };

    return { allResults: results, relevantData, filePath: file.path };
  } catch (error) {
    console.error("Error al obtener files. Detalles:", error.message);
    throw new Error(error.message);
  }
};

const getReportObservationsDownload = async (path) => {
  try {
    const objectKey = path;

    const params = {
      Bucket: "files-analytia",
      Key: objectKey,
    };
    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3Client, command);

    return url;
  } catch (error) {
    throw new Error(
      "Error al obtener detracciones. Detalles: " + error.message
    );
  }
};

const getDownloadObservationsExcel = async (params, data, filePath) => {
  try {
    const { bucket, key, rucAccount, type, period } = parseS3Url(filePath);
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const response = await s3Client.send(command);

    const observationKeys = params.filters
      ? Object.keys(params.filters).filter((key) => key !== "all")
      : [];

    const fileContent = await streamToString(response.Body);
    const rows = fileContent.split("\n").filter((row) => row.trim() !== "");

    const filteredRows = rows.filter((row) => {
      let columns = row.split("|");
      let codCar = "";

      if (type === "compras") {
        if (columns.length > 42) {
          columns = columns.slice(0, 42);
        }
        columns = columns.filter((_, index) => index < 16 || index > 22);
        codCar = `${columns[11]}${columns[5].toString().padStart(2, "0")}${
          columns[6]
        }${columns[8].toString().padStart(10, "0")}`;
      } else if (type === "ventas") {
        if (columns.length > 35) {
          columns = columns.slice(0, 35);
        }
        codCar = `${rucAccount}${columns[5].toString().padStart(2, "0")}${
          columns[6]
        }${columns[7].toString().padStart(10, "0")}`;
      }

      return data.some((item) => item.identityInfo === codCar);
    });

    const updatedRows = filteredRows.map((row) => {
      let columns = row.split("|");
      let codCar = "";

      if (type === "compras") {
        if (columns.length > 42) {
          columns = columns.slice(0, 42);
        }
        columns = columns.filter((_, index) => index < 16 || index > 22);
        codCar = `${columns[11]}${columns[5].toString().padStart(2, "0")}${
          columns[6]
        }${columns[8].toString().padStart(10, "0")}`;
      } else if (type === "ventas") {
        if (columns.length > 35) {
          columns = columns.slice(0, 35);
        }
        codCar = `${rucAccount}${columns[5].toString().padStart(2, "0")}${
          columns[6]
        }${columns[7].toString().padStart(10, "0")}`;
      }

      const matchingItem = data.find((item) => item.identityInfo === codCar);

      const observationColumns = observationKeys.map((key) => {
        if (
          matchingItem &&
          matchingItem.observaciones &&
          matchingItem.observaciones[key]
        ) {
          return matchingItem.observaciones[key].join(". ");
        }
        return "-";
      });

      return [...columns, ...observationColumns].join("|");
    });

    const excelBuffer = await generateObservationExcel(
      updatedRows,
      observationKeys,
      type
    );

    const textPeriod = convertPeriodToMonth(period);
    const date = currentDate();

    const filename = `izitax_${type}_${rucAccount}_${textPeriod}_${date}`;

    return { excelBuffer, filename };
  } catch (error) {
    throw new Error("Error al intentar descargar. Detalles: " + error.message);
  }
};

const getDownloadMissingsExcel = async (data, filePath) => {
  try {
    const { rucAccount, type, period } = parseS3Url(filePath);

    const excelBuffer = await generateMissingExcel(data);

    const textPeriod = convertPeriodToMonth(period);
    const date = currentDate();

    const filename = `izitax_comp_faltantes_${type}_${rucAccount}_${textPeriod}_${date}`;

    return { excelBuffer, filename };
  } catch (error) {
    throw new Error("Error al intentar descargar. Detalles: " + error.message);
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
