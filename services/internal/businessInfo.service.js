const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://izitax-test:1z1tax..@analytia.uylxxpb.mongodb.net/izitax";
const dbName = "izitax";

const client = new MongoClient(uri);
let db = null;

const connectToDb = async () => {
  if (!db) {
    try {
      await client.connect();
      db = client.db(dbName);
      console.log("Conectado a MongoDB");
    } catch (error) {
      console.error("Error al conectar a MongoDB:", error.message);
      throw error;
    }
  }
  return db;
};

const getPeriods = async (tipo, ruc) => {
  try {
    const db = await connectToDb();
    const collection = db.collection("sales");
    console.log(tipo.ruc);

    const uniquePeriods = await collection.distinct("periodo", {
      rucAccount: "20161636780",
    });
    console.log(uniquePeriods);

    return uniquePeriods;
  } catch (error) {
    console.error("Error al obtener los períodos únicos:", error);
    throw error;
  }
};

process.on("SIGINT", async () => {
  if (client) {
    await client.close();
    console.log("Conexión a MongoDB cerrada");
    process.exit(0);
  }
});

module.exports = {
  getPeriods,
};
