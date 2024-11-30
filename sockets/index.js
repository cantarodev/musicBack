const mongoose = require("mongoose");
const User = require("../models/user.model");
const LibroElectronico = require("../models/libroElectronico.model");
const {
  sendNotificationPleProcessed,
  sendNotificationPleError,
} = require("../utils/email.utils");

const setupSockets = async (io) => {
  try {
    const changeStream = LibroElectronico.watch();

    changeStream.on("change", async (change) => {
      try {
        if (change.operationType === "update") {
          const { _id } = change.documentKey;
          const { updatedFields } = change.updateDescription;

          const document = await LibroElectronico.findOne(
            { _id },
            "user_id ruc_account type period name data"
          );

          const name = document.name;
          const type = document.type;
          const period = document.period;

          if (updatedFields && "general_status" in updatedFields) {
            const status = updatedFields.general_status;

            const userId = document.user_id;

            const user = await User.findOne({ _id: userId });
            const email = user.email;
            const ownerEmail = process.env.OWNER_EMAIL;

            if (status === "processed") {
              console.log(
                "PLE procesado y se realiza el envío de un correo de confirmación."
              );

              await sendNotificationPleProcessed({
                user_id: userId,
                type,
                name,
                email,
                period,
              });
            } else if (status === "error") {
              const emails = [email, ownerEmail];
              const collection = mongoose.connection.collection(
                type === "compras" ? "purchases" : "sales"
              );

              results = await collection
                .find(
                  { "cpe.errorCount": { $gte: 3 } },
                  { "cpe.errorMessage": 1, _id: 0 }
                )
                .toArray();

              const uniqueErrors = new Set();

              results.forEach((doc) => {
                doc.cpe.errorMessage.forEach((error) => {
                  uniqueErrors.add(error);
                });
              });

              const errors = Array.from(uniqueErrors);

              await sendNotificationPleError({
                user_id: userId,
                type,
                name,
                emails,
                period,
                errors,
              });
            }

            if (userId) {
              io.to(String(userId)).emit("status", status);
            }
          }
        }
      } catch (err) {
        console.error("Error al procesar el cambio:", err);
      }
    });

    io.on("connection", (socket) => {
      console.log("Nuevo cliente conectado");

      socket.on("joinRoom", (userId) => {
        socket.join(String(userId));
        console.log(`Usuario ${userId} se unió a su sala`);
      });

      socket.on("disconnect", () => {
        console.log("Cliente desconectado");
      });
    });
  } catch (err) {
    console.error("Error en sockets:", err);
  }
};

module.exports = setupSockets;
