const axios = require("axios");

const API_URL = process.env.API_SIRE_URL;

const createUserInExternalSystem = async (email, name, password) => {
  try {
    const response = await axios.post(API_URL, {
      email,
      name,
      password,
    });

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error("La respuesta del sistema externo no fue exitosa.");
    }
  } catch (error) {
    throw new Error(
      `Error en el sistema externo: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

module.exports = { createUserInExternalSystem };
