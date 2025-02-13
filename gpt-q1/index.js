import Chalk from 'chalk';
import ora from 'ora';
import { ConnectionMongoError, ConnectionRabbitMQError, ConnectionServerError, GPTError, ProducerError } from './utils/error.js';
import producer from './utils/producer.js'
import connectRabbitMQ from './connections/amqp.js';
import config from './config/config.js';
import startServer from './connections/server.js';
import services from './services/services.js';
import ApiErrors from './utils/apiErrors.js';


/**
 * Función principal que inicia el microservicio.
 *
 * Esta función realiza las siguientes tareas:
 * 1. Conecta a MongoDB.
 * 2. Conecta a RabbitMQ.
 * 3. Inicia el servidor Express.
 * 4. Escucha mensajes en la cola de RabbitMQ y los procesa.
 *
 * @async
 * @function main
 * @throws {ConnectionMongoError} Si ocurre un error al conectar a MongoDB.
 * @throws {ConnectionRabbitMQError} Si ocurre un error al conectar a RabbitMQ.
 * @throws {ConnectionServerError} Si ocurre un error al iniciar el servidor.
 */
async function main() {
    console.log(Chalk.bold.bgGreen(" 🚀 Iniciando Microservicio: " + config.nameMicroservice + "  "));
    const spinner = ora({ spinner: 'moon' });
    const antennaSpinner = ora({
        text: 'Esperando mensajes en la cola: ' + config.queue,
        spinner: {
            interval: 200, // Velocidad del cambio (ms)
            frames: [
                '📡 .',
                '📡 ..',
                '📡 ...',
                '📡 ..',
                '📡 .',
            ]
        }
    });

    try {

        // Iniciar conexión con RabbitMQ y el Servidor
        const { channel, replyQueue_costos, replyQueue_conversacion, replyQueue_chatBase } = await connectRabbitMQ();
        await startServer();


        // Escuchar mensajes en la cola de RabbitMQ y procesarlos con el servicio correspondiente 
        antennaSpinner.start();
        channel.consume(config.queue, async (message) => {
            antennaSpinner.stopAndPersist({ symbol: '📩', text: `Mensaje recibido en la cola: ${config.queue}` });

            try {
                const data_queue = JSON.parse(message.content.toString());
                channel.ack(message);
                //const res=true
                if (data_queue.libreria && data_queue.id_chat && data_queue.texto && data_queue.base_config) {

                    // Procesar mensaje recibido en la cola con el servicio correspondiente
                    spinner.start("Procesando mensaje recibido en la cola");
                    const res = await services(data_queue.texto, data_queue.base_config);
                    spinner.succeed("Mensaje procesado correctamente");


                    // Registrar datos de costos en la base de datos
                    spinner.start("Registrando datos de costos en la base de datos");
                    const payloadCostos = { libreria: data_queue.libreria, id_chat: data_queue.id_chat, tokens: res.tokens };
                    const configProducer_Costos = { payload: payloadCostos, channel, replyQueue: replyQueue_costos, exchange: "DB-CRUD", routingKey: "update.costos" };
                    const res_costos = await producer(configProducer_Costos);
                    if (res_costos.success) {
                        spinner.succeed("Datos de costos registrados correctamente en la base de datos");
                    } else {
                        let message_error = "Error al registrar datos de costos en la base de datos";
                        spinner.fail(message_error);
                        throw new ProducerError(new Error(res_costos.message), message_error, data_queue, configProducer_Costos);
                    }

                    // Registrar datos de conversacion en la base de datos
                    spinner.start("Registrando datos de conversación en la base de datos");
                    const payloadConversacion = { libreria: data_queue.libreria, id_chat: data_queue.id_chat, chat: { emisor: "client", message: data_queue.texto } };
                    const configProducer_Conversacion = { payload: payloadConversacion, channel, replyQueue: replyQueue_conversacion, exchange: "DB-CRUD", routingKey: "update.conversacion" };
                    const res_conversacion = await producer(configProducer_Conversacion);
                    if (res_conversacion.success) {
                        spinner.succeed("Datos de conversación registrados correctamente en la base de datos");
                    } else {
                        message_error = "Error al registrar datos de conversación en la base de datos";
                        spinner.fail(message_error);
                        throw new ProducerError(new Error(res_conversacion.message), message_error, data_queue, configProducer_Conversacion);
                    }

                    // Registrar datos del chat_base en la base de datos
                    spinner.start("Registrando datos de chat_base en la base de datos");
                    const base = {
                        genero: res.message.generos,
                        titulo: res.message.lecturas_previas,
                        autores: res.message.autores,
                        tema_pricipal: res.message.tema_principal,
                        ambientacion: res.message.ambientacion,
                        contexto_emocional: res.message.contexto_emocional,
                        hojas: res.message.cantidad_hojas,
                    }
                    const payloadChatBase = { libreria: data_queue.libreria, id_chat: data_queue.id_chat, base };
                    const configProducer_ChatBase = { payload: payloadChatBase, channel, replyQueue: replyQueue_chatBase, exchange: "DB-CRUD", routingKey: "update.base" };
                    const res_chatBase = await producer(configProducer_ChatBase);
                    if (res_conversacion.success) {
                        spinner.succeed("Datos de chat_base registrados correctamente en la base de datos");
                    } else {
                        message_error = "Error al registrar datos de chat_base en la base de datos";
                        spinner.fail(message_error);
                        throw new ProducerError(new Error(res_chatBase.message),message_error, data_queue, configProducer_ChatBase);
                    }



                    if (res) {
                        const confirmation = { success: true, message: "Texto trabajado correctamente con GPT y guardado en la base de datos" };
                        channel.sendToQueue(message.properties.replyTo,
                            Buffer.from(JSON.stringify(confirmation)),
                            { correlationId: message.properties.correlationId }
                        );
                        console.log("✅ Documento encontrado y confirmación enviada");
                    }
                }

            } catch (error) {
                if (error instanceof GPTError || error instanceof ProducerError) {
                    await ApiErrors(error);
                    spinner.fail(error.message_error)
                    const msg_confirmation = { success: false, message: error.message_error };
                    channel.sendToQueue(message.properties.replyTo,
                        Buffer.from(JSON.stringify(msg_confirmation)),
                        { correlationId: message.properties.correlationId }
                    );
                }
            }
            console.log('\n')
            antennaSpinner.start();

        })

    } catch (error) {
        console.log("Existe un error")
        await ApiErrors(error);
        spinner.fail(error.message_error)
        if (error instanceof ConnectionMongoError || error instanceof ConnectionRabbitMQError || error instanceof ConnectionServerError) {
            console.log(Chalk.bold.bgRedBright(" 🚀💥 No se pudo iniciar el Microservicio: " + config.nameMicroservice + "  "));
            process.exit(1);
        }

    }
}
main()