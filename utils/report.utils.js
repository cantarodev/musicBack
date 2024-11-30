const xl = require("excel4node");

const tipoComprobante = {
  "00": "OTROS",
  "01": "FACTURA",
  "02": "RECIBO POR HONORARIO",
  "03": "BOLETA DE VENTA",
  "04": "LIQUIDAC. DE COMPRA",
  "05": "BOLETO DE AVION",
  "06": "CARTA PORTE AEREO",
  "07": "NOTA DE CREDITO",
  "08": "NOTA DE DEBITO",
  "09": "GUIA DE REMISION",
  10: "RECIBO DE ARRENDAMIE.",
  11: "POLIZA BOLSA VALORES",
  12: "TICKET MAQUINA REGIS.",
  13: "DOCUMENTO BANCOS",
  14: "RECIBO SERV. PUBLIC.",
  15: "BOLETO TRANS. PUBLIC.",
  16: "BOLETO DE VIAJE T.P.",
  17: "DOCUMENTO IGLESIA C.",
  18: "DOCUMENTO AFP",
  19: "BOLETO ESP. PUBLICOS",
  20: "COMP. DE RETENCION",
  21: "CONOCIM. EMBARQUE",
  22: "COMP. NO HABITUAL",
  23: "POLIZA DE ADJUDICAC.",
  24: "CERTIF. REGALIAS",
  25: "DOC. ATRIB. ISC",
  26: "REC. UNIDAD DE AGUA",
  27: "SEGURO C.T.R.",
  28: "TARIFA U. AEROPUERTO",
  29: "DOC. COFOPRI",
  30: "DOC. EMP. EN T.CRED",
  31: "GUIA RT",
  32: "DOC. INDUS. GAS NATU",
  34: "DOC. OPERADOR",
  35: "DOC. PARTICIPE",
  36: "REC. DIST. GAS NATU",
  37: "DOC. REVI. TEC. VEHI",
  40: "COMP. PERCEPCION",
  41: "COMP. PERC. INTERNA",
  42: "DOC. PAGO TARJETAS",
  43: "BLETO AVIACION",
  44: "BILLETE LOTERIA",
  45: "DOC. EDUC./CULT.",
  46: "FORM. PAGO TRIB.",
  48: "COMP. OPERACIONES",
  49: "CONST. DEPOSITO IVAP",
  50: "D.U.A. IMPORTACION",
  51: "POLIZA FRACCIONADA",
  52: "DESP. SIM. IMP. SIMP",
  53: "DECLARAC. MENSAJERIA",
  54: "LIQUID. COBRANZAS",
  55: "BVME FERROVIARIO",
  56: "COMP. SEAE",
  87: "NOTA DE CREDITO ES.",
  88: "NOTA DE DEBITO ES.",
  89: "NOTA AJUSTE",
  91: "COMP. DE NO DOMICILI",
  96: "EXC. CREDITO FIS.",
  97: "N.C. NO DOMICILIADO",
  98: "N.D. NO DOMICILIADO",
};

const tipoMoneda = {
  USD: "Dólares",
  PEN: "Soles",
  EUR: "Euros",
};

const columnasCompras = [
  "Periodo",
  "1. CUO",
  "Correlativo",
  "Fecha de emisión",
  "Fecha de Vencimiento o Fecha de Pago (1)",
  "Tipo",
  "Serie",
  "Año de emisión de la DUA o DSI",
  "Número de CdP",
  `En caso de optar por anotar el importe total de las operaciones diarias que no otorguen derecho a crédito fiscal en forma consolidada, registrar el número final (2).`,
  "Tipo",
  "RUC",
  "RAZÓN SOCIAL",
  "Base imponible",
  "IGV",
  "No gravadas",
  "Total",
  "Moneda",
  "Tipo de cambio (3).",
  "Fecha de emisión del comprobante de pago que se modifica (4).",
  "Tipo de comprobante de pago que se modifica (4).",
  "Número de serie del comprobante de pago que se modifica (4).",
  `Código de la dependencia Aduanera de la Declaración Única de Aduanas (DUA) o de la Declaración Simplificada de Importación (DSI).`,
  "Número del comprobante de pago que se modifica (4).",
  "Fecha de emisión de la Constancia de Depósito de Detracción (6)",
  "Número de la Constancia de Depósito de Detracción (6)",
  "Marca del comprobante de pago sujeto a retención",
  `Clasificación de los bienes y servicios adquiridos (Tabla 30) 
Aplicable solo a los contribuyentes que hayan obtenido ingresos mayores a 1,500 UIT en el ejercicio anterior`,
  `Identificación del Contrato o del proyecto en el caso de los Operadores de las sociedades irregulares, consorcios, joint ventures u otras formas de contratos de colaboración empresarial, que no lleven contabilidad independiente.`,
  "Error tipo 1: inconsistencia en el tipo de cambio",
  "Error tipo 2: inconsistencia por proveedores no habidos",
  "Error tipo 3: inconsistencia por proveedores que renunciaron a la exoneración del Apéndice I del IGV",
  "Error tipo 4: inconsistencia por DNIs que fueron utilizados en las Liquidaciones de Compra y que ya cuentan con RUC",
  "Indicador de Comprobantes de pago cancelados con medios de pago",
  "Estado que identifica la oportunidad de la anotación o indicación si ésta corresponde a un ajuste.",
];

const columnasVentas = [
  "Periodo",
  `1. Contribuyentes del Régimen General: Número correlativo del mes o Código Único de la Operación (CUO), que es la llave única o clave única o clave primaria del software contable que identifica de manera unívoca el asiento contable en el Libro Diario o del Libro Diario de Formato Simplificado en que se registró la operación.
2. Contribuyentes del Régimen Especial de Renta - RER:  Número correlativo del mes
`,
  `Número correlativo del asiento contable identificado en el campo 2, cuando se utilice el Código Único de la Operación (CUO). El primer dígito debe ser: "A" para el asiento de apertura del ejercicio, "M" para los asientos de movimientos o ajustes del mes o "C" para el asiento de cierre del ejercicio.`,
  "Fecha de emisión del Comprobante de Pago",
  "Fecha de Vencimiento o Fecha de Pago (1)",
  "Tipo de CdP",
  "Serie",
  "Nro CdP",
  `1. Para efectos del registro de tickets o cintas emitidos por máquinas registradoras que no otorguen derecho a crédito fiscal de acuerdo a las normas de Comprobantes de Pago y opten por anotar el importe total de las operaciones realizadas por día y por máquina registradora, registrar el número final (2). 
2. Se permite la consolidación diaria de las Boletas de Venta emitidas de manera electrónica`,
  "Tipo de Documento de Identidad del cliente",
  "Número de Documento de Identidad del cliente",
  `Apellidos y nombres, denominación o razón social  del cliente. En caso de personas naturales se debe consignar los datos en el siguiente orden: Apellido paterno, apellido materno y nombre completo.`,
  "Valor facturado de la exportación",
  "Base imponible de la operación gravada (4)",
  "Descuento de la Base Imponible",
  "Impuesto General a las Ventas y/o Impuesto de Promoción Municipal",
  "Descuento del Impuesto General a las Ventas y/o Impuesto de Promoción Municipal",
  "Importe total de la operación exonerada",
  "Importe total de la operación inafecta",
  "Impuesto Selectivo al Consumo, de ser el caso.",
  "Base imponible de la operación gravada con el Impuesto a las Ventas del Arroz Pilado",
  "Impuesto a las Ventas del Arroz Pilado",
  "Otros conceptos, tributos y cargos que no forman parte de la base imponible",
  "x",
  "Importe total del comprobante de pago",
  "Código  de la Moneda (Tabla 4)",
  "Tipo de cambio (5)",
  `Fecha de emisión del comprobante de pago o documento original que se modifica (6) o documento referencial al documento que sustenta el crédito fiscal`,
  "Tipo del comprobante de pago que se modifica (6)",
  "Número de serie del comprobante de pago que se modifica (6) o Código de la Dependencia Aduanera",
  "Número del comprobante de pago que se modifica (6) o Número de la DUA, de corresponder",
  `Identificación del Contrato o del proyecto en el caso de los Operadores de las sociedades irregulares, consorcios, joint ventures u otras formas de contratos de colaboración empresarial, que no lleven contabilidad independiente.`,
  "Error tipo 1: inconsistencia en el tipo de cambio",
  "Indicador de Comprobantes de pago cancelados con medios de pago",
  `Estado que identifica la oportunidad de la anotación o indicación si ésta corresponde a alguna de las situaciones previstas en el inciso e) del artículo 8° de la Resolución de Superintendencia N.° 286-2009/SUNAT`,
];

const columnasFaltantes = [
  "Periodo",
  "Tipo Comprobante",
  "Número Comprobante",
  "Moneda",
  "Importe Total",
  "SUNAT",
  "PLE",
];

const getTipoComprobante = (codComp) => {
  return tipoComprobante[codComp] || "Otro";
};

const getTipoMoneda = (codComp) => {
  return tipoMoneda[codComp] || "Otro";
};

const formatKeys = (observationKeys) => {
  return observationKeys.map((key) => {
    const formattedKey = key.replace(/([a-z])([A-Z])/g, "$1 $2");
    return `OBS ${formattedKey.toUpperCase()}`;
  });
};

const createHeaderStyle = (workbook, codColor, index, isWhite = false) => {
  return workbook.createStyle({
    font: {
      name: "Arial",
      size: 8,
      bold: index + 1 > 35 || isWhite,
      color: isWhite ? "#FFFFFF" : "#000000",
    },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    fill: { type: "pattern", patternType: "solid", fgColor: codColor },
    border: {
      left: { style: "thin", color: "#000000" },
      right: { style: "thin", color: "#000000" },
      top: { style: "thin", color: "#000000" },
      bottom: { style: "thin", color: "#000000" },
    },
  });
};

const generateObservationExcel = async (dataRows, observationKeys, type) => {
  const workbook = new xl.Workbook();
  const worksheet = workbook.addWorksheet(`Registro de ${type}`, {
    sheetView: {
      pane: {
        state: "frozen",
        ySplit: 3,
        xSplit: type === "compras" ? 10 : 9,
        topLeftCell: type === "compras" ? "K4" : "J4",
        activePane: "bottomRight",
      },
      showGridLines: false,
    },
  });

  const numberStyle = workbook.createStyle({
    font: { name: "Arial", size: 8, bold: true },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      bottom: { style: "thin", color: "black" },
    },
  });

  const numericStyle = workbook.createStyle({
    font: { name: "Arial", size: 8 },
    alignment: { horizontal: "right", vertical: "center" },
  });

  const alphanumericStyle = workbook.createStyle({
    font: { name: "Arial", size: 8 },
    alignment: { horizontal: "left", vertical: "center" },
  });

  const cellStyle = workbook.createStyle({
    font: { name: "Arial", size: 8 },
    alignment: { horizontal: "center", vertical: "center" },
  });

  let columns = type === "compras" ? columnasCompras : columnasVentas;

  columns.forEach((_, index) => {
    worksheet
      .cell(2, index + 2)
      .number(index + 1)
      .style(numberStyle);
  });

  const formattedKeysList = formatKeys(observationKeys);
  columns = [...columns, ...formattedKeysList];

  columns.forEach((col, index) => {
    let codColor = "FFFFFF";
    let isWhite = false;
    if (index + 1 <= 3) codColor = "C0C0C0";
    if (type === "compras") {
      if (index + 1 === 14 || index + 1 === 15 || index + 1 === 16)
        codColor = "BFBFBF";
      if (index + 1 > 35 && col.toLowerCase().includes("obs")) {
        codColor = "C00000";
        isWhite = true;
      }
    } else {
      if (index + 1 === 14 || index + 1 === 16) codColor = "9BC2E6";
      if (index + 1 > 35 && col.toLowerCase().includes("obs")) {
        codColor = "C00000";
        isWhite = true;
      }
    }

    let style = createHeaderStyle(workbook, codColor, index, isWhite);

    worksheet
      .cell(3, index + 2)
      .string(col)
      .style(style);
  });

  dataRows.forEach((row, rowIndex) => {
    worksheet
      .cell(rowIndex + 4, 1)
      .number(rowIndex + 1)
      .style(cellStyle);
    const values = row.split("|");

    values.forEach((value, colIndex) => {
      const cell = worksheet.cell(rowIndex + 4, colIndex + 2);
      if (!isNaN(value) && value !== null && value !== undefined) {
        cell.number(Number(value)).style(numericStyle);
      } else {
        cell.string(String(value)).style(alphanumericStyle);
      }
    });
  });

  worksheet.column(1).setWidth(3);
  worksheet.row(3).setHeight(80);

  return workbook.writeToBuffer();
};

const generateMissingExcel = async (dataRows) => {
  const workbook = new xl.Workbook();
  const worksheet = workbook.addWorksheet("Comprobantes Faltantes", {
    sheetView: {
      pane: {
        state: "frozen",
        ySplit: 3,
        topLeftCell: "B4",
        activePane: "bottomLeft",
      },
      showGridLines: false,
    },
  });

  const numericStyle = workbook.createStyle({
    font: { name: "Arial", size: 8 },
    alignment: { horizontal: "right", vertical: "center" },
  });

  const alphanumericStyle = workbook.createStyle({
    font: { name: "Arial", size: 8 },
    alignment: { horizontal: "left", vertical: "center" },
  });

  const cellStyle = workbook.createStyle({
    font: { name: "Arial", size: 8 },
    alignment: { horizontal: "center", vertical: "center" },
  });

  let columns = columnasFaltantes;

  columns.forEach((col, index) => {
    let codColor = "#FFFFFF";
    let isWhite = false;

    if (index + 1 > 5) {
      codColor = "#C00000";
      isWhite = true;
    }

    let style = createHeaderStyle(workbook, codColor, index, isWhite);

    worksheet
      .cell(3, index + 2)
      .string(col)
      .style(style);
  });

  dataRows.forEach((row, rowIndex) => {
    worksheet
      .cell(rowIndex + 4, 1)
      .number(rowIndex + 1)
      .style(cellStyle);

    columns.forEach((col, colIndex) => {
      let value;
      switch (col) {
        case "Periodo":
          value = row.periodo;
          break;
        case "Tipo Comprobante":
          value = row.tipoComprobante;
          break;
        case "Número Comprobante":
          value = `${row.numeroSerie}-${Number(row.numero)}`;
          break;
        case "Moneda":
          value = row.moneda;
          break;
        case "Importe Total":
          value = row.monto;
          break;
        case "SUNAT":
          value = row.source === "sunat" ? "EXISTE" : "NO EXISTE";
          break;
        case "PLE":
          value = row.source === "ple" ? "EXISTE" : "NO EXISTE";
          break;
        default:
          value = "";
      }

      const cell = worksheet.cell(rowIndex + 4, colIndex + 2);
      if (!isNaN(value) && value !== null && value !== undefined) {
        cell.number(Number(value)).style(numericStyle);
      } else {
        cell.string(String(value)).style(alphanumericStyle);
      }
    });
  });

  worksheet.column(1).setWidth(6);
  worksheet.column(2).setWidth(6);
  worksheet.column(3).setWidth(20);
  worksheet.column(4).setWidth(16);
  worksheet.column(5).setWidth(6);

  return await workbook.writeToBuffer();
};

const calculateCoincidencePercentage = (
  databaseResults,
  pleResults,
  coincidences
) => {
  const totalRecords =
    databaseResults.length + pleResults.length - coincidences.length;

  const numCoincidences = coincidences.length;

  if (totalRecords === 0) {
    return parseFloat(Number("0").toFixed(2)).toLocaleString("en-US") + "%";
  }

  const percentage = (numCoincidences / totalRecords) * 100;

  const formattedPercentage =
    parseFloat(percentage.toFixed(2)).toLocaleString("en-US") + "%";

  return formattedPercentage;
};

const calculateTotalAmountDifference = (databaseResults, pleResults) => {
  const databaseDict = Object.fromEntries(
    databaseResults
      .filter((item) => isFinite(Number(item.monto)))
      .map((item) => [item.identityInfo, parseFloat(item.monto)])
  );

  const pleDict = Object.fromEntries(
    pleResults
      .filter((item) => isFinite(Number(item.monto)))
      .map((item) => [item.identityInfo, parseFloat(item.monto)])
  );

  const commonKeys = Object.keys(databaseDict).filter((key) =>
    Object.hasOwn(pleDict, key)
  );

  const sumTotalDatabase = commonKeys.reduce(
    (sum, key) => sum + databaseDict[key],
    0
  );

  const sumTotalPle = commonKeys.reduce((sum, key) => sum + pleDict[key], 0);

  const sumTotalDifference = Math.abs(sumTotalDatabase - sumTotalPle);

  return {
    sumTotalDifference: sumTotalDifference.toLocaleString("en-US"),
    sumTotalDatabase: sumTotalDatabase.toLocaleString("en-US"),
    sumTotalPle: sumTotalPle.toLocaleString("en-US"),
  };
};

const calculateDiscrepancyPercentage = (databaseResults, pleResults) => {
  const databaseDict = Object.fromEntries(
    databaseResults
      .filter((item) => isFinite(Number(item.monto)))
      .map((item) => [item.identityInfo, parseFloat(item.monto)])
  );

  const pleDict = Object.fromEntries(
    pleResults
      .filter((item) => isFinite(Number(item.monto)))
      .map((item) => [item.identityInfo, parseFloat(item.monto)])
  );

  const commonKeys = Object.keys(databaseDict).filter((key) =>
    Object.hasOwn(pleDict, key)
  );

  const discrepancyCount = commonKeys.reduce((count, key) => {
    return databaseDict[key] !== pleDict[key] ? count + 1 : count;
  }, 0);

  const totalCoincidences = commonKeys.length;

  if (totalCoincidences === 0) {
    return {
      discrepancyPercentage:
        parseFloat(Number("0").toFixed(2)).toLocaleString("en-US") + "%",
      discrepancyCount: 0,
      totalCoincidences: 0,
    };
  }

  const discrepancyPercentage = (discrepancyCount / totalCoincidences) * 100;

  const formattedPercentage =
    parseFloat(discrepancyPercentage.toFixed(2)).toLocaleString("en-US") + "%";

  return {
    discrepancyPercentage: formattedPercentage,
    discrepancyCount,
    totalCoincidences,
  };
};

module.exports = {
  getTipoComprobante,
  getTipoMoneda,
  generateObservationExcel,
  generateMissingExcel,
  calculateCoincidencePercentage,
  calculateTotalAmountDifference,
  calculateDiscrepancyPercentage,
};
