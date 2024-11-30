const claveSolAccountService = require("../services/internal/claveSolAccount.service");
const { validateAccount } = require("../utils/validate.utils");
const User = require("../models/user.model");

const createClaveSolAccount = async (req, res) => {
  try {
    const {
      user_id,
      verified,
      name,
      ruc,
      username,
      password,
      limit_difference,
    } = req.body;
    const account = await claveSolAccountService.createClaveSolAccount(
      user_id,
      verified,
      name,
      ruc,
      username,
      password,
      limit_difference
    );

    return res.status(200).json({
      status: "success",
      data: account,
      message: "Cuenta clave SOL creada con éxito.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      data: null,
      message:
        "Lo sentimos, hubo un problema con el servidor. Por favor, inténtalo de nuevo más tarde.",
    });
  }
};

const validateClaveSolAccount = async (req, res) => {
  try {
    const { user_id, account_id, ruc, username, password, mode } = req.body;
    let validated = false;

    const user = await User.findById({ _id: user_id });

    if (!user) {
      return res.status(404).json({
        status: "error",
        validated: validated,
        message: "Usuario no encontrado.",
      });
    }

    // if (user.status !== "active") {
    //   return res.status(403).json({
    //     status: "error",
    //     validated: validated,
    //     message: "El usuario no está activo.",
    //   });
    // }

    let message = "";
    if (mode === "test") {
      const resp = await validateAccount(ruc, username, password);
      if (resp.status == 400) {
        message = "Cuenta clave sol no es válida.";
      } else {
        validated = true;
        message = "Cuenta clave sol válida.";
      }
    }

    if (account_id && mode !== "test") {
      const account = user.accounts.find(
        (account) => account.account_id === account_id
      );

      if (!account) {
        return res.status(404).json({
          status: "error",
          validated,
          message: "Cuenta clave sol no encontrada.",
        });
      }

      if (account.status === "inactive") {
        return res.status(403).json({
          status: "error",
          validated,
          message: "Cuenta clave sol esta inactiva.",
        });
      }

      const resp = await validateAccount(ruc, username, password);
      if (resp.status == 400) {
        message = "Cuenta clave sol no es válida.";
      } else {
        validated = true;
        message = "Cuenta clave sol válida.";
      }

      const updateFields = {
        "accounts.$.verified": validated,
      };

      if (validated === true) {
        updateFields["accounts.$.status"] = "active";
      }

      await User.updateOne(
        {
          "accounts.account_id": account_id,
        },
        {
          $set: updateFields,
        },
        { new: true }
      );
    }

    return res.status(200).json({
      status: "success",
      validated,
      message,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      validated: false,
      message: "Inténtalo más tarde. Hubo un problema de nuestro lado.",
    });
  }
};

const getClaveSolAccounts = async (req, res) => {
  const { user_id } = req.params;

  try {
    const accounts = await claveSolAccountService.getClaveSolAccounts(user_id);
    res.status(200).json({
      status: "success",
      data: accounts,
      message: "Cuentas clave sol recuperados exitosamente.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      data: null,
      message: "Error al recuperar las cuentas. Por favor, intente más tarde.",
    });
  }
};

const deleteClaveSolAccount = async (req, res) => {
  try {
    const { account_id } = req.params;

    const account = await claveSolAccountService.deleteClaveSolAccount(
      account_id
    );
    return res.status(200).json({
      status: "success",
      data: account,
      message: "Cuenta clave sol eliminida.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      data: null,
      message: "No se pudo eliminar la cuenta clave sol",
    });
  }
};

const updateClaveSolAccount = async (req, res) => {
  const { user_id, account_id, verified, name, ruc, username, password } =
    req.body;

  try {
    const account = await claveSolAccountService.updateClaveSolAccount(
      user_id,
      account_id,
      verified,
      name,
      ruc,
      username,
      password
    );
    res.status(200).json({
      status: "success",
      data: account,
      message: "Cuenta clave sol actualizada de forma exitosa.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      data: null,
      message: "No se pudo actualizar la información de la cuenta clave sol",
    });
  }
};

const deleteAllAccounts = async (req, res) => {
  try {
    const { accountIds } = req.params;

    await claveSolAccountService.deleteAllAccounts(accountIds);

    res.status(200).json({
      status: "success",
      message: "Los registros seleccionados han sido eliminados correctamente.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      message: "No se lograron eliminar las cuentas clave sol.",
    });
  }
};

module.exports = {
  createClaveSolAccount,
  validateClaveSolAccount,
  getClaveSolAccounts,
  deleteClaveSolAccount,
  deleteAllAccounts,
  updateClaveSolAccount,
};
