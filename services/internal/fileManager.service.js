require("dotenv").config();
const mongoose = require("mongoose");
const zlib = require("zlib");

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const User = require("../../models/user.model");
const LibroElectronico = require("../../models/libroElectronico.model");
const Vouching = require("../../models/vouching.model");
const { modifyFileContent, invokeLambda } = require("../../utils/file.utils");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const createFile = async (res, user_id, ruc_account, period, type, files) => {
  if (
    !user_id ||
    !ruc_account ||
    !period ||
    !type ||
    !files ||
    files.length === 0
  ) {
    return res
      .status(400)
      .json({ status: "error", message: "Faltan datos obligatorios." });
  }

  try {
    const user = await User.findById(user_id);

    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "Usuario no encontrado." });
    }

    const uploadPromises = files.map(async (file) => {
      const filename = file.originalname;

      // Modificar el contenido del archivo
      const { results, observations } = await modifyFileContent(
        file.buffer,
        type,
        ruc_account,
        period
      );

      if (observations.length > 0) {
        return {
          filename,
          observations,
          status: "error",
        };
      }

      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `izitax/ple/${ruc_account}/${type}/${period}/${filename}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      // guardar archivo PLE en AWS S3
      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);

      const s3Path = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${uploadParams.Key}`;
      // registrar PLE en la base de datos

      const existingDocument = await LibroElectronico.findOne(
        {
          ruc_account,
          period,
          type,
        },
        { data: 0, updatedAt: 0, __v: 0 }
      );

      if (existingDocument) {
        const collection = mongoose.connection.collection(
          type === "compras" ? "purchases" : "sales"
        );

        const fieldPrefix =
          type === "compras" ? "datosEmisor" : "datosReceptor";

        await collection.updateMany(
          {
            rucAccount: ruc_account,
            periodo: period,
          },
          {
            $unset: {
              cpe: "",
              [`${fieldPrefix}.afectoRus`]: "",
              [`${fieldPrefix}.errorCount`]: "",
              [`${fieldPrefix}.errorMessage`]: "",
              observaciones: "",
            },
          }
        );

        await collection.updateMany(
          {
            rucAccount: ruc_account,
            periodo: period,
            tipoCambio: { $ne: 1 },
          },
          { $unset: { tipoCambio: "" } }
        );
      }

      const compressedData = zlib.gzipSync(JSON.stringify(results));
      const ple_saved = await LibroElectronico.updateOne(
        { ruc_account, period, type },
        {
          $set: {
            user_id: user._id,
            ruc_account,
            name: filename,
            period,
            count: results.length,
            type: type,
            path: s3Path,
            size: file.size,
            data: compressedData,
            general_status: "pending",
            is_cpe_validated: false,
            is_tc_validated: false,
            is_rus_validated: false,
            data_loaded: false,
          },
        },
        { upsert: true }
      );

      const pleId = existingDocument
        ? String(existingDocument._id)
        : String(ple_saved.upsertedId);

      await invokeLambda("uploadDataFromPleToIzitax", { ple_id: pleId });

      return {
        filename,
        observations: [],
        status: "success",
      };
    });

    // Ejecutar todas las promesas de carga
    const results = await Promise.all(uploadPromises);

    // Filtrar los archivos con errores y éxito
    const errors = results.filter((result) => result.status === "error");
    const successes = results.filter((result) => result.status === "success");

    res.json({
      status: errors.length > 0 ? "partial success" : "success",
      message:
        errors.length > 0
          ? "Algunos archivos tienen observaciones y no fueron cargados."
          : "Todos los archivos se registraron de forma correcta.",
      successes: successes.map((result) => ({
        filename: result.filename,
        observations: result.observations,
      })),
      errors: errors.map((result) => ({
        filename: result.filename,
        observations: result.observations,
      })),
    });
  } catch (error) {
    console.error("Error al cargar archivos:", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

const createVouchingFile = async (res, user_id, ruc_account, period, files) => {
  if (!user_id || !ruc_account || !period || !files || files.length === 0) {
    return res
      .status(400)
      .json({ status: "error", message: "Faltan datos obligatorios." });
  }

  try {
    const user = await User.findById(user_id);

    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "Usuario no encontrado." });
    }

    const uploadPromises = files.map(async (file) => {
      const filename = file.originalname;

      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `izitax/vouching/${ruc_account}/${period}/${filename}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      // guardar archivo PLE en AWS S3
      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);

      const s3Path = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${uploadParams.Key}`;
      // registrar PLE en la base de datos

      const existingDocument = await Vouching.findOne(
        {
          ruc_account,
          period,
        },
        { updatedAt: 0, __v: 0 }
      );

      if (existingDocument) {
        return {
          filename,
          status: "error",
        };
      }

      await Vouching.updateOne(
        { ruc_account, period },
        {
          $set: {
            user_id: user._id,
            ruc_account,
            name: filename,
            period,
            path: s3Path,
            size: file.size,
          },
        },
        { upsert: true }
      );

      return {
        filename,
        status: "success",
      };
    });

    // Ejecutar todas las promesas de carga
    const results = await Promise.all(uploadPromises);

    // Filtrar los archivos con errores y éxito
    const errors = results.filter((result) => result.status === "error");
    const successes = results.filter((result) => result.status === "success");

    res.json({
      status: errors.length > 0 ? "partial success" : "success",
      message:
        errors.length > 0
          ? "Algunos archivos no fueron cargados."
          : "Todos los archivos se registraron de forma correcta.",
      successes: successes.map((result) => ({
        filename: result.filename,
      })),
      errors: errors.map((result) => ({
        filename: result.filename,
      })),
    });
  } catch (error) {
    console.error("Error al cargar archivos:", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

const getFiles = async (user_id, ruc_account, option, year, type) => {
  try {
    const filters = {
      user_id,
      ruc_account,
      period: { $regex: `^${year}` },
    };

    if (type !== "all" && option !== "vouching") {
      filters["type"] = type;
    }

    const files =
      option !== "vouching"
        ? await LibroElectronico.find(filters, {
            data: 0,
            updatedAt: 0,
            __v: 0,
          })
        : await Vouching.find(filters, {
            updatedAt: 0,
            __v: 0,
          });

    return files;
  } catch (error) {
    throw new Error("Error al obtener files. Detalles: " + error.message);
  }
};

const getPleTotals = async (user_id, ruc_account) => {
  try {
    const files = await LibroElectronico.find(
      { user_id, ruc_account },
      { data: 0, updatedAt: 0, __v: 0 }
    );
    let countPurchases = 0;
    let countSales = 0;
    let countDocPurchases = 0;
    let countDocSales = 0;
    let sizePurchases = 0;
    let sizeSales = 0;

    files.forEach((file) => {
      if (file.type == "compras") {
        countPurchases += 1;
        countDocPurchases += file.count;
        sizePurchases += file.size;
      } else if (file.type == "ventas") {
        countSales += 1;
        countDocSales += file.count;
        sizeSales += file.size;
      }
    });

    const data = [
      {
        type: "compras",
        countPle: countPurchases,
        countDoc: countDocPurchases,
        size: sizePurchases,
      },
      {
        type: "ventas",
        countPle: countSales,
        countDoc: countDocSales,
        size: sizeSales,
      },
    ];
    return data;
  } catch (error) {
    throw new Error("Error al obtener totales. Detalles: " + error.message);
  }
};

const getVouchingTotals = async (user_id, ruc_account) => {
  try {
    const files = await Vouching.find(
      { user_id, ruc_account },
      { updatedAt: 0, __v: 0 }
    );
    let sizeTotals = 0;

    files.forEach((file) => {
      sizeTotals += file.size;
    });

    const data = {
      numberFiles: files.length,
      sizeTotals,
    };
    return data;
  } catch (error) {
    throw new Error("Error al obtener totales. Detalles: " + error.message);
  }
};

const deletePleFile = async (user_id, file_id) => {
  try {
    const result = await LibroElectronico.findOneAndDelete(
      { _id: file_id, user_id: user_id },
      { projection: { data: 0, updatedAt: 0, __v: 0 } }
    );

    if (!result) {
      return {
        status: "error",
        message: "El PLE que desea eliminar no existe.",
      };
    }

    const type = result.type;
    const params = {
      Bucket: "files-analytia",
      Key: `izitax/ple/${result.ruc_account}/${type}/${result.period}/${result.name}`,
    };

    // eliminar archivo PLE de AWS S3
    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);

    const collection = mongoose.connection.collection(
      type === "compras" ? "purchases" : "sales"
    );

    const fieldPrefix = type === "compras" ? "datosEmisor" : "datosReceptor";
    await collection.updateMany(
      {
        rucAccount: result.ruc_account,
        periodo: result.period,
      },
      {
        $unset: {
          cpe: "",
          [`${fieldPrefix}.afectoRus`]: "",
          [`${fieldPrefix}.errorCount`]: "",
          [`${fieldPrefix}.errorMessage`]: "",
          observaciones: "",
        },
      }
    );

    await collection.updateMany(
      {
        rucAccount: result.ruc_account,
        periodo: result.period,
        tipoCambio: { $ne: 1 },
      },
      { $unset: { tipoCambio: "" } }
    );

    return {
      status: "success",
      message: "PLE eliminida de manera correcta.",
    };
  } catch (error) {
    throw new Error(
      "Error al intentar eliminar el PLE. Detalles: " + error.message
    );
  }
};

const deleteVouchingFile = async (user_id, file_id) => {
  try {
    const result = await Vouching.findOneAndDelete(
      { _id: file_id, user_id: user_id },
      { projection: { updatedAt: 0, __v: 0 } }
    );

    if (!result) {
      return {
        status: "error",
        message: "El archivo que desea eliminar no existe.",
      };
    }

    const params = {
      Bucket: "files-analytia",
      Key: `izitax/vouching/${result.ruc_account}/${result.period}/${result.name}`,
    };

    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);

    return {
      status: "success",
      message: "Archivo eliminida de manera correcta.",
    };
  } catch (error) {
    throw new Error(
      "Error al intentar eliminar el archivo. Detalles: " + error.message
    );
  }
};

const downloadFile = async (user_id, file_id, option) => {
  try {
    const exists =
      option === "vouching"
        ? await Vouching.findOne({
            _id: file_id,
            user_id: user_id,
          })
        : await LibroElectronico.findOne({
            _id: file_id,
            user_id: user_id,
          });

    if (!exists) {
      return {
        status: "error",
        message: "El PLE que desea descargar no existe.",
      };
    }

    const type = exists.type;
    let objectKey = "";

    if (option === "vouching") {
      objectKey = `izitax/vouching/${exists.ruc_account}/${exists.period}/${exists.name}`;
    } else {
      objectKey = `izitax/ple/${exists.ruc_account}/${type}/${exists.period}/${exists.name}`;
    }

    const params = {
      Bucket: "files-analytia",
      Key: objectKey,
    };

    // descargar archivo PLE de AWS S3
    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    return {
      status: "success",
      message: url,
    };
  } catch (error) {
    throw new Error("Error al intentar descargar. Detalles: " + error.message);
  }
};

const searchConstancePLE = async (user_id, file_id, comprobante) => {
  console.log("###################################");
  console.log("comprobante: ", comprobante);
  try {
    const exists = await LibroElectronico.findOne({
      _id: file_id,
      user_id: user_id,
    });
    const type = exists.type;
    const objectKey = `izitax/ple/${exists.ruc_account}/${type}/${exists.period}/${exists.name}`;
    console.log("rutaS3: ", objectKey);
    const params = {
      Bucket: "files-analytia",
      Key: objectKey,
    };
    const command = new GetObjectCommand(params);
    const txtObject = await s3Client.send(command);
    const txtData = await streamToString(txtObject.Body);
    const parsedData = parseTxtToJSON(txtData);

    const buscarComprobantePorConcatenacion = (parsedData, comprobante) => {
      for (const row of parsedData) {
        const concatenado = `${row.numDocIdentidadProveedor}${row.numSerieCDP}${row.numCDP}`;

        if (concatenado === comprobante) {
          console.log("Comprobante encontrado:", row);
          return row;
        }
      }
      return "Comprobante no encontrado.";
    };

    const resultado = buscarComprobantePorConcatenacion(
      parsedData,
      comprobante
    );

    if (resultado) {
      return {
        status: "SUCCESS",
        message: [resultado],
      };
    } else {
      return {
        status: "ERROR",
        message: "Comprobante no encontrado.",
      };
    }
  } catch (error) {
    throw new Error(
      "Error al intentar procesar el archivo. Detalles: " + error.message
    );
  }
};

const streamToString = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
};

const parseTxtToJSON = (txtData) => {
  const lines = txtData.split("\n").filter(Boolean);
  const headers = [
    "perTributario",
    "cuo",
    "_corrAsientoContable",
    "fecEmision",
    "fecVencPag",
    "codTipoCDP",
    "numSerieCDP",
    "_annCDPDUA",
    "numCDP",
    "numCDPRangoFinal",
    "codTipoDocIdentidadProveedor",
    "numDocIdentidadProveedor",
    "nomRazonSocialProveedor",
    "montos.mtoBIGravadaDG",
    "montos.mtoIgvIpmDG",
    "montos.mtoBIGravadaDGNG",
    "montos.mtoIgvIpmDGNG",
    "montos.mtoBIGravadaDNG",
    "montos.mtoIgvIpmDNG",
    "montos.mtoValorAdqNG",
    "montos.mtoISC",
    "montos.mtoIcbp",
    "montos.mtoOtrosTrib",
    "montos.mtoTotalCp",
    "codMoneda",
    "tipoCambio",
    "fecEmisionMod",
    "codTipoCDPMod",
    "numSerieCDPMod",
    "_codDUA",
    "numCDPMod",
    "_fecEmisionCDD",
    "_numCDD",
    "_marcaCDRet",
    "_clasifBS",
    "_idOperSocIRR",
    "_errTipo1",
    "_errTipo2",
    "_errTipo3",
    "_errTipo4",
    "_indCDPCancelados",
    "codEstadoComprobante",
    "CLU",
  ];

  return lines.map((line) => {
    const values = line.split("|").map((value) => value.trim());
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index];
    });
    return record;
  });
};

module.exports = {
  createFile,
  createVouchingFile,
  getFiles,
  getPleTotals,
  getVouchingTotals,
  deletePleFile,
  deleteVouchingFile,
  downloadFile,
  searchConstancePLE,
};
