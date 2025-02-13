import OpenAI from 'openai/index.mjs';
import { z } from 'zod';
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { GPTError } from '../utils/error.js';
import config from "../config/config.js";
import validarGPT from '../utils/validarGPT.js';


/**
 * Realiza una consulta a GPT para extraer información específica de un texto basado en una configuración dada.
 *
 * Utiliza OpenAI para procesar el texto y devolver datos estructurados según un esquema dinámico.
 *
 * @async
 * @module consulta_gpt
 * @param {string} texto - Texto de entrada que se analizará.
 * @param {Array<string>} base_config - Lista de claves que se deben extraer del texto.
 * @param {string} [model='gpt-4o-mini'] - Modelo de IA de OpenAI a utilizar para la consulta.
 * @throws {GPTError} Si hay problemas con la solicitud a OpenAI o si la IA rechaza la consulta.
 * @returns {Promise<Object>} Objeto con la información extraída, el modelo utilizado y el conteo de tokens usados.
 *
 * @example
 * const texto = "Este libro tiene 300 páginas y trata sobre aventuras en el espacio.";
 * const base_config = ["cantidad_hojas", "genero", "temas_principales"];
 * const response = await consulta_gpt(texto, base_config);
 * console.log(response);
 */
export default async function services(texto, base_config,model='gpt-4o-mini') {
    validarGPT(texto, base_config); 
    try {
        const openai = new OpenAI({
            apiKey: config.gptKey
        });

        //Definir el esquema de respuesta
        const estructura_dinamica = {};

        base_config.forEach((campo) => {
                estructura_dinamica[campo] = z.array(z.string());
        });
        const esquema_respuesta = z.object(estructura_dinamica);
        /////

        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    role: "developer", content:
                        `Eres un asistente experto en análisis de textos. 
                        Extrae del siguiente texto la siguiente información solo si en el texto se indica: ${base_config.join(", ")}. 
                        Devuelve la información en formato JSON con exactamente esas claves.` },
                {
                    role: "user",
                    content: texto,
                },
            ],
            response_format: zodResponseFormat(esquema_respuesta, "messaje_formateado")
        });
        if(completion.choices[0].message.refusal)throw new GPTError(new Error('No se pudo completar la consulta con GPT, No se pudo usar el JSON. Refusal'),'No se pudo completar la consulta con GPT, No se pudo usar el JSON. Refusal', {texto,base_config});
        return { 
            tokens: { input: completion.usage.prompt_tokens, output: completion.usage.completion_tokens , model: completion.model, },
            message: JSON.parse(completion.choices[0].message.content)
        }
    } catch (error) {
        throw new GPTError(error,error.message,{texto,base_config});
    }
}


