import dotenv from "dotenv";
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: resolve(__dirname, '../.env') });

// Package.json
const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../package.json')));

/**
 * Clase para gestionar la configuración de la aplicación.
 *
 * Esta clase carga las variables de entorno desde un archivo .env y las propiedades
 * del archivo package.json para configurar las conexiones y otros parámetros de la aplicación.
 *
 * @class Configuracion
 * @property {string} gptKey - Clave de API para GPT.
 * @property {string} amqpUrl - URL de conexión a RabbitMQ.
 * @property {string} exchange - Nombre del intercambio en RabbitMQ.
 * @property {string} queue - Nombre de la cola en RabbitMQ.
 * @property {string} routingKey - Clave de enrutamiento en RabbitMQ.
 * @property {number} max_cant_queue - Número máximo de mensajes en la cola.
 * @property {number} port - Puerto en el que se ejecuta el servidor.
 * @property {string} nameMicroservice - Nombre del microservicio.
 * @property {string} hostApiErrors - URL del host para la API de errores.
 */
class Configuracion {
    constructor() {
        //GPT Key
        this.gptKey = process.env.OPENAI_API_KEY,
        
        // Amqp connection
        this.amqpUrl = process.env.AMQP_URL,
        this.exchange = "GPT",
        this.queue = "Q1-GPT1",
        this.routingKey = "gpt.q1"
        this.max_cant_queue = 10,

        // Server connection
        this.port = process.env.PORT || 8080,

        // Microservice name
        this.nameMicroservice = packageJson.name

        //Host ApiErrors
        this.hostApiErrors = process.env.HOST_API_ERRORS
    }
}
const config = new Configuracion();
export default config;
