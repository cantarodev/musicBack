const axios = require("axios");
const User = require("../../models/user.model");
const { v4: uuidv4 } = require("uuid");

const createClaveSolAccount = async (
  user_id,
  verified,
  name,
  ruc,
  username,
  password,
  limit_difference
) => {
  try {
    const user = await User.findById({ _id: user_id });

    if (!user) {
      return { status: "FAILED", message: "Usuario no encontrado." };
    }

    const response = await axios.post(
      "https://app-sire-backend.analytia.pe/api/create-userclavesol",
      {
        name,
        username,
        password,
        ruc,
        sale: true,
        buy: true,
        user: user?.token,
        status: verified ? true : false,
      }
    );

    const { data, status } = response;
    const token = data?.data?.token;

    if (status !== 200 || !token)
      throw new Error(`La solicitud falló con el estado: ${status}`);

    if (!token) throw new Error("El token no es válido.");

    return await User.findOneAndUpdate(
      { _id: user_id },
      {
        $push: {
          accounts: {
            account_id: uuidv4(),
            verified,
            name,
            ruc,
            username,
            password,
            limit_difference,
            status: verified ? "active" : "pending",
            token,
          },
        },
      },
      {
        new: true,
      }
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getClaveSolAccounts = async (user_id) => {
  try {
    const user = await User.findOne({ _id: user_id });

    if (user) {
      if (user.role === "admin") {
        const users = await User.find().populate("accounts");
        const allAccounts = users.reduce((acc, user) => {
          const userAccountsWithUserId = user.accounts.map((account) => ({
            ...account,
            user_id: user._id,
          }));
          return [...acc, ...userAccountsWithUserId];
        }, []);
        return allAccounts;
      } else {
        return user.accounts;
      }
    }
  } catch (error) {
    throw new Error("Error al obtener usuarios. Detalles: " + error.message);
  }
};

const deleteClaveSolAccount = async (account_id) => {
  try {
    const existsClaveSol = await User.findOne({
      "accounts.account_id": account_id,
    });

    if (!existsClaveSol) {
      return {
        status: "FAILED",
        message: "Cuenta clave sol no encontrada.",
      };
    }

    const account = existsClaveSol.accounts.find(
      (account) => account.account_id === account_id
    );

    const resp = await axios.put(
      "https://app-sire-backend.analytia.pe/api/update-status",
      {
        token: account.token,
        status: false,
      }
    );

    return await User.findOneAndUpdate(
      {
        "accounts.account_id": account_id,
      },
      { $set: { "accounts.$.status": "inactive" } },
      {
        new: true,
        fields: ["name ruc username verified status"],
      }
    );
  } catch (error) {
    throw new Error("Error al eliminar clave SOL. Detalles: " + error.message);
  }
};

const updateClaveSolAccount = async (
  user_id,
  account_id,
  verified,
  name,
  ruc,
  username,
  password
) => {
  try {
    const user = await User.findById({ _id: user_id });

    if (!user) {
      throw new Error("Usuario no encontrado.");
    }

    const account = user.accounts.find(
      (account) => account.account_id === account_id
    );

    if (account.status === "inactive" && user.role_id !== 1) {
      throw new Error("La cuenta clave sol esta inactiva.");
    }

    const response = await axios.put(
      "https://app-sire-backend.analytia.pe/api/update-status",
      {
        token: account.token,
        status: verified ? true : false,
      }
    );

    const { data } = response;
    const token = data.data?.token;
    if (response.status !== 200 || !token)
      throw new Error("La solicitud falló o el token no es válido.");

    const status = verified ? "active" : "pending";

    const claveSolAccount = await User.findOneAndUpdate(
      {
        "accounts.account_id": account_id,
      },
      {
        $set: {
          "accounts.$.verified": verified,
          "accounts.$.name": name,
          "accounts.$.ruc": ruc,
          "accounts.$.username": username,
          "accounts.$.password": password,
          "accounts.$.status": status,
        },
      },
      { new: true }
    );

    if (!claveSolAccount) {
      throw new Error("No se encontró la cuenta clave SOL");
    }

    return claveSolAccount;
  } catch (error) {
    throw new Error(
      "Error al actualizar la información de la cuenta clave SOL. Detalles: " +
        error.message
    );
  }
};

const deleteAllAccounts = async (accountIds) => {
  try {
    accountIds = accountIds.split(",");

    const users = await User.find({
      "accounts.account_id": { $in: accountIds },
    });

    if (users.length === 0) {
      return {
        status: "FAILED",
        message: "Cuentas clave sol no encontradas.",
      };
    }

    for (let accountId of accountIds) {
      const user = users.find((user) =>
        user.accounts.some((account) => account.account_id === accountId)
      );

      if (!user) continue;

      const account = user.accounts.find(
        (account) => account.account_id === accountId
      );

      if (account) {
        await axios.put(
          "https://app-sire-backend.analytia.pe/api/update-status",
          {
            token: account.token,
            status: false,
          }
        );
      }
    }

    await User.updateMany(
      {
        "accounts.account_id": { $in: accountIds },
      },
      {
        $set: {
          "accounts.$[elem].status": "inactive",
        },
      },
      { new: true, arrayFilters: [{ "elem.account_id": { $in: accountIds } }] }
    );
  } catch (error) {
    throw new Error(
      "Error al eliminar las cuentas. Detalles: " + error.message
    );
  }
};

module.exports = {
  createClaveSolAccount,
  getClaveSolAccounts,
  deleteClaveSolAccount,
  deleteAllAccounts,
  updateClaveSolAccount,
};
