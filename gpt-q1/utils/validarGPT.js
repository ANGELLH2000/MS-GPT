import { GPTError } from "./error.js";
/**
 * Valida los parámetros necesarios para realizar una consulta con GPT.
 *
 * @param {string} texto - El texto que se va a procesar.
 * @param {Object} base_config - La configuración base necesaria para la consulta.
 * @throws {GPTError} Si alguno de los parámetros es inválido o está ausente.
 */
export default function validarGPT(texto, base_config) {
    if(!texto) throw new GPTError(new Error('Campo requerido texto'),'No se pudo completar la consulta con GPT.', {texto,base_config});
    if(!base_config) throw new GPTError(new Error('Campo requerido base_config'),'No se pudo completar la consulta con GPT.', {texto,base_config});
}