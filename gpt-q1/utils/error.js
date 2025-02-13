import { DateTime } from 'luxon';
import config from '../config/config.js';
import chalk from 'chalk';
/**
 * Clase personalizada para manejar errores en la aplicación.
 *
 * Extiende la clase `Error` de JavaScript y agrega propiedades adicionales
 * para un manejo más preciso de errores en aplicaciones que utilizan microservicios.
 *
 * @class CustomError
 * @extends Error
 * @param {Error} error - El error original.
 * @param {string} message - Mensaje descriptivo del error.
 * @param {string} type - Tipo de error.
 *
 * @property {string} type - Tipo de error.
 * @property {string} message_error - Mensaje descriptivo del error.
 * @property {string} info_error - Información adicional sobre el error.
 * @property {string} stack_error - Stack trace del error.
 * @property {string} microservice - Nombre del microservicio desde el que se lanzó el error.
 * @property {Array} date - Fecha y hora en que se produjo el error.
 */
class CustomError extends Error {
    constructor(error, message, type) {
        super(error);
        if(!message){
            console.log(chalk.bgRed(` El campo 'message' es requerido para el registro del error. Tipo: ${type} `))
            throw new TypeError('Campos requeridos para el registro del error no fueron enviados en :' + type)
        }
        this.type = type;
        this.message_error = message;
        this.info_error = error.message;
        this.stack_error = error.stack;
        this.microservice = config.nameMicroservice;
        this.date = [DateTime.now().toLocaleString(DateTime.DATETIME_MED), DateTime.now().toFormat("yyyy/MM/dd*HH:mm:ss")];
    }
}

/**
 * Clase personalizada para manejar errores de conexión con MongoDB.
 *
 * @class ConnectionMongoError
 * @extends CustomError
 * @param {Error} error - El error original.
 * @param {string} message - Mensaje descriptivo del error.
 *
 * @property {string} URI - URI de conexión a MongoDB.
 */
export class ConnectionMongoError extends CustomError {
    constructor(error, message) {
        const nameTypeError = "ConnectionMongoError"
        super(error, message, nameTypeError)
        this.URI = config.URIConnection
    }
}
/**
 * Clase personalizada para manejar errores de conexión con RabbitMQ.
 *
 * @class ConnectionRabbitMQError
 * @extends CustomError
 * @param {Error} error - El error original.
 * @param {string} message - Mensaje descriptivo del error.
 *
 * @property {string} URI - URI de conexión a RabbitMQ.
 */
export class ConnectionRabbitMQError extends CustomError {
    constructor(error, message) {
        const nameTypeError = "ConnectionRabbitMQError"
        super(error, message, nameTypeError)
        this.URI = config.amqpUrl
    }
}
/**
 * Clase personalizada para manejar errores de conexión con el servidor.
 *
 * @class ConnectionServerError
 * @extends CustomError
 * @param {Error} error - El error original.
 * @param {string} message - Mensaje descriptivo del error.
 *
 * @property {number|string} server_port - Puerto del servidor.
 */
export class ConnectionServerError extends CustomError {
    constructor(error, message) {
        const nameTypeError = "ConnectionServerError"
        super(error, message, nameTypeError)
        this.server_port = config.port
    }
}
/**
 * Clase personalizada para manejar errores de operaciones CRUD.
 *
 * @class ReadError
 * @extends GPTError
 * @param {string} message - Mensaje descriptivo del error.
 * @param {Object} imputs - Datos adicionales relacionados con el error.
 *
 * @property {string} db - Nombre de la base de datos.
 * @property {Object} payload - Datos adicionales relacionados con el error.
 */
export class GPTError extends CustomError {
    constructor(error,message, imputs) {
        super(error,message, "GPTError")
        this.payload = imputs;
    }
}

/**
 * Clase personalizada para manejar errores del Producer.
 *
 * @class ProducerError
 * @extends CustomError
 * @param {string} message - Mensaje descriptivo del error.
 * @param {Object} imputs - Datos adicionales relacionados con el error.
 *
 * @property {string} db - Nombre de la base de datos.
 * @property {Object} payload - Datos adicionales relacionados con el error.
 */
export class ProducerError extends CustomError {
    constructor(error,message, imputs, configProducer) {
        super(error,message, "ProducerError")
        this.payload = imputs;
        this.exchangeProducer = configProducer.exchange
        this.routingKeyProducer = configProducer.routingKey
    }
}