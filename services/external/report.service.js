const {
  LambdaClient,
  InvokeCommand,
  LogType,
} = require("@aws-sdk/client-lambda");

const lambda = new LambdaClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const generateReport = async (
  collectionName,
  rucAccount,
  periodo,
  key,
  filters,
  factoringStatuses,
  reportType = "missings",
  docType = "all",
  currency = "all"
) => {
  try {
    const payload = {
      collectionName,
      rucAccount,
      periodo,
      docType,
      currency,
      key,
      filters,
      factoringStatuses,
      reportType,
      limitDifference: 0.01,
    };

    const command = new InvokeCommand({
      FunctionName: "generateReportIzitax",
      Payload: Buffer.from(JSON.stringify(payload)),
    });

    const response = await lambda.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString("utf-8"));

    const jsonObject = JSON.parse(result.body);
    console.log("DATA:", typeof jsonObject);

    return jsonObject;
  } catch (error) {
    console.error("Error al invocar la función Lambda:", error);
    throw error;
  }
};

const generateReportDetractions = async (
  collectionName,
  rucAccount,
  periodo,
  key,
  filters,
  reportType = "missings",
  docType = "all",
  currency = "all"
) => {
  try {
    const payload = {
      collectionName,
      rucAccount,
      periodo,
      docType,
      currency,
      key,
      filters,
      reportType,
      limitDifference: 0.01,
    };

    const command = new InvokeCommand({
      FunctionName: "generateReportDetracciones",
      Payload: Buffer.from(JSON.stringify(payload)),
    });

    const response = await lambda.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString("utf-8"));

    const jsonObject = JSON.parse(result.body);

    return jsonObject;
  } catch (error) {
    console.error("Error al invocar la función Lambda:", error);
    throw error;
  }
};

const generateReportDebitCreditNotes = async (
  collectionName,
  rucAccount,
  periodo,
  key,
  filters,
  reportType = "missings",
  docType = "all",
  currency = "all"
) => {
  try {
    const payload = {
      collectionName,
      rucAccount,
      periodo,
      docType,
      currency,
      key,
      filters,
      reportType,
      limitDifference: 0.01,
    };

    const command = new InvokeCommand({
      FunctionName: "generateReportCreditDebitNotes",
      Payload: Buffer.from(JSON.stringify(payload)),
      LogType: LogType.Tail,
    });

    const response = await lambda.send(command);
    console.log("RESPONSE LAMBDA: ", response);
    const result = JSON.parse(Buffer.from(response.Payload).toString("utf-8"));

    const jsonObject = JSON.parse(result.body);

    return jsonObject;
  } catch (error) {
    console.error("Error al invocar la función Lambda:", error);
    throw error;
  }
};

const getReportCorrelativityService = async (
  collectionName,
  rucAccount,
  periodo,
  key,
  filters,
  reportType = "missings",
  docType = "all",
  currency = "all"
) => {
  try {
    const payload = {
      collectionName,
      rucAccount,
      periodo,
      docType,
      currency,
      key,
      filters,
      reportType,
      limitDifference: 0.01,
    };

    const command = new InvokeCommand({
      FunctionName: "generateReportCorrelativity",
      Payload: Buffer.from(JSON.stringify(payload)),
    });

    const response = await lambda.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString("utf-8"));

    const jsonObject = JSON.parse(result.body);

    return jsonObject;
  } catch (error) {
    console.error("Error al invocar la función Lambda:", error);
    throw error;
  }
};

const getReportFactoringService = async (
  collectionName,
  rucAccount,
  periodo,
  key,
  filters,
  reportType = "missings",
  docType = "all",
  currency = "all"
) => {
  try {
    console.log("Service Factoring");
    const payload = {
      collectionName,
      rucAccount,
      periodo,
      docType,
      currency,
      key,
      filters,
      reportType,
      limitDifference: 0.01,
    };
    console.log("PAYLOAD: ", payload);
    const command = new InvokeCommand({
      FunctionName: "generateReportFactoring",
      Payload: Buffer.from(JSON.stringify(payload))
    });

    const response = await lambda.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString("utf-8"));
    const jsonObject = JSON.parse(result.body);
    const allResults = jsonObject.all_results;

    const codCpeList = [];
    const codMonedaList = [];
    const observacionList = [];
    
    jsonObject.relevant_data.filter = {
      codCpe: codCpeList,
      codMoneda: codMonedaList,
      observacion: observacionList
    };

    console.log("RELEVANT DATA:", JSON.stringify(jsonObject.relevant_data.filter, null, 2));

    return jsonObject;
  } catch (error) {
    console.error("Error al invocar la función Lambda:", error);
    throw error;
  }
};

module.exports = { generateReport, generateReportDetractions, generateReportDebitCreditNotes, getReportCorrelativityService, getReportFactoringService };
