import config from "../config/config.js";

/**
 * Envía un mensaje de error a la API de errores.
 *
 * Esta función envía un mensaje de error a la API de errores especificada en la configuración.
 * Utiliza una solicitud HTTP POST para enviar los detalles del error en formato JSON.
 *
 * @async
 * @function ApiErrors
 * @param {Object} error - El objeto de error que se enviará a la API de errores.
 * @returns {Promise<void>} Una promesa que se resuelve cuando se completa la solicitud.
 */
export default async function ApiErrors(error){
    await fetch(config.hostApiErrors, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
    })
    .catch((error) => {
        console.error("Error al enviar mensaje de error:", error);
    });
    console.log("Mensaje de error enviado")
}