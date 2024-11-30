const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");
const readline = require("readline");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const purchasesColumns = [
  "periodo",
  "cuo",
  "correlativo",
  "fechaEmision",
  "fechaVencimiento",
  "tipoComprobante",
  "serie",
  "anioEmisionDuas",
  "numero",
  "importeTotalSinCredito",
  "tipoDocumento",
  "ruc",
  "razonSocial",
  "baseImponible",
  "igv",
  "baseImponibleAdquisiciones",
  "montoImpuestoVentasMunicipal",
  "baseImponibleSinCreditoFiscal",
  "montoImpuestoVentasMunicipal",
  "noGravadas",
  "montoImpuestoSelectivo",
  "impuestoPlasticos",
  "otrosTributosNoBaseImponible",
  "total",
  "moneda",
  "tipoCambio",
  "fechaEmisionComprobanteModificado",
  "tipoComprobanteModificado",
  "numeroSerieComprobanteModificado",
  "codigoDependenciaAduanera",
  "numeroComprobanteModificado",
  "fechaEmisionConstanciaDetraccion",
  "numeroConstanciaDetraccion",
  "marcaComprobanteRetencion",
  "clasificacionBienesServicios",
  "identificacionContratoProyecto",
  "errorTipo1TipoCambio",
  "errorTipo2ProveedoresNoHabidos",
  "errorTipo3ProveedoresRenuncia",
  "errorTipo4DNIConRUC",
  "indicadorPagoCancelado",
  "estadoAnotacionAjuste",
];

const countLines = (buffer) => {
  const contenido = buffer.toString("utf-8");
  const lineas = contenido.split("\n");
  const lineasNoVacias = lineas.filter((linea) => linea.trim() !== "");
  return lineasNoVacias.length;
};

const downloadFileFromS3 = async (key) => {
  const command = new GetObjectCommand({ Bucket: "files-analytia", Key: key });
  const response = await s3Client.send(command);

  const rl = readline.createInterface({
    input: response.Body,
    crlfDelay: Infinity,
  });

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
  }

  return lineCount;
};

const downloadFileContentFromS3 = async (key) => {
  const command = new GetObjectCommand({ Bucket: "files-analytia", Key: key });
  const response = await s3Client.send(command);

  const rl = readline.createInterface({
    input: response.Body,
    crlfDelay: Infinity,
  });

  const content = [];
  for await (const line of rl) {
    const obj = convertLineToObject(line);
    content.push(obj);
  }

  return content;
};

const convertLineToObject = (line) => {
  const values = line.split("|");

  return purchasesColumns.reduce((obj, col, index) => {
    obj[col] = values[index];
    return obj;
  }, {});
};

const modifyFileContent = async (
  buffer,
  type,
  rucAccount,
  period,
  chunkSize = 50000
) => {
  let fileContent = buffer.toString("utf-8");
  const rows = fileContent.split("\n").filter((row) => row.trim() !== "");

  let observations = [];

  const validateRow = (columns, type, globalPos) => {
    const obs = [];

    if (type === "compras") {
      if (columns.length < 42)
        obs.push({
          message: `Tiene ${columns.length} columnas, menos de 42`,
          row: globalPos + 1,
        });
    } else if (type === "ventas") {
      if (columns.length < 35)
        obs.push({
          message: `Tiene ${columns.length} columnas, menos de 35`,
          row: globalPos + 1,
        });
    }

    return obs;
  };

  const formatRow = (columns, type, rucAccount, period) => {
    let codCar = "";
    let format = {};

    if (type === "compras") {
      codCar = `${columns[11]}${columns[5].toString().padStart(2, "0")}${
        columns[6]
      }${columns[8].toString().padStart(10, "0")}`;
      format = {
        identityInfo: codCar,
        periodoPle: columns[0],
        fechaEmision: columns[3],
        fechaPago: columns[4],
        codComp: columns[5],
        numeroSerie: columns[6],
        numero: columns[8],
        codDoc: columns[10],
        numDoc: columns[11],
        razonSocial: columns[12],
        mtos: {
          mtoBIGravada: columns[13],
          mtoIGV: columns[14],
          mtoBIGravadaDGNG: columns[15],
          mtoIgvIpmDGNG: columns[16],
          mtoBIGravadaDNG: columns[17],
          mtoIgvIpmDNG: columns[18],
          mtoValorAdqNG: columns[19],
          mtoISC: columns[20],
          mtoIcbp: columns[21],
          mtoOtrosTrib: columns[22],
        },
        monto: columns[23],
        codMoneda: columns[24],
        tipoCambio: columns[25],
        periodo: period,
      };
    } else if (type === "ventas") {
      codCar = `${rucAccount}${columns[5].toString().padStart(2, "0")}${
        columns[6]
      }${columns[7].toString().padStart(10, "0")}`;
      format = {
        identityInfo: codCar,
        periodoPle: columns[0],
        fechaEmision: columns[3],
        fechaPago: columns[4],
        codComp: columns[5],
        numeroSerie: columns[6],
        numero: columns[7],
        codDoc: columns[9],
        numDoc: columns[10],
        razonSocial: columns[11],
        mtos: {
          mtoValFactExpo: columns[12],
          mtoBIGravada: columns[13],
          mtoDsctoBI: columns[14],
          mtoIGV: columns[15],
          mtoDsctoIGV: columns[16],
          mtoExonerado: columns[17],
          mtoInafecto: columns[18],
          mtoISC: columns[19],
          mtoBIIvap: columns[20],
          mtoIvap: columns[21],
          mtoIcbp: columns[22],
          mtoOtrosTrib: columns[23],
        },
        monto: columns[24],
        codMoneda: columns[25],
        tipoCambio: columns[26],
        periodo: period,
      };
    }

    return format;
  };

  const processChunk = async (chunk, index) => {
    console.log(`Procesando chunk #${index + 1} con ${chunk.length} filas`);
    const globalIndexStart = index * chunkSize;
    return chunk
      .map((row, pos) => {
        const columns = row.split("|");
        const globalPos = globalIndexStart + pos;
        const rowObservations = validateRow(columns, type, globalPos);

        if (rowObservations.length > 0) {
          rowObservations.forEach((obs) => {
            if (!observations[obs.message]) {
              observations[obs.message] = [];
            }
            observations[obs.message].push(obs.row);
          });
          return null;
        }

        return formatRow(columns, type, rucAccount, period);
      })
      .filter((row) => row !== null);
  };

  const chunks = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    chunks.push(rows.slice(i, i + chunkSize));
  }

  const allChunksResults = await Promise.all(
    chunks.map((chunk, index) => processChunk(chunk, index))
  );

  const formattedObservations = Object.entries(observations).map(
    ([message, rows]) => `${message} en las filas [${rows.join(", ")}]`
  );

  return {
    results: allChunksResults.flat(),
    observations: formattedObservations,
  };
};

async function invokeLambda(functionName, payload) {
  const params = {
    FunctionName: functionName,
    InvocationType: "Event",
    Payload: JSON.stringify(payload),
  };

  try {
    const command = new InvokeCommand(params);
    await lambdaClient.send(command);
  } catch (error) {
    console.error("Error al invocar la Lambda:", error);
  }
}

const parseS3Url = (url) => {
  console.log(url);

  const s3Regex =
    /^https?:\/\/([^.]*)\.s3\.amazonaws\.com\/izitax\/ple\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/;
  const match = url.match(s3Regex);
  if (!match) throw new Error("URL no válida para S3");

  return {
    bucket: match[1],
    key: `izitax/ple/${match[2]}/${match[3]}/${match[4]}/${match[5]}`,
    rucAccount: match[2],
    type: match[3],
    period: match[4],
  };
};

const streamToString = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    stream.on("error", (err) => reject(err));
  });
};

module.exports = {
  countLines,
  downloadFileFromS3,
  downloadFileContentFromS3,
  modifyFileContent,
  invokeLambda,
  streamToString,
  parseS3Url,
};
