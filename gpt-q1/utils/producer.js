/**
 * Publica un mensaje en RabbitMQ y espera una respuesta del consumidor.
 *
 * @param {Object} configProducer - La configuración del productor.
 * @param {Object} configProducer.channel - El canal de RabbitMQ.
 * @param {string} configProducer.exchange - El exchange de RabbitMQ.
 * @param {string} configProducer.routingKey - La clave de enrutamiento para el mensaje.
 * @param {Object} configProducer.payload - La carga útil del mensaje.
 * @param {Object} configProducer.replyQueue - La cola de respuesta.
 * @returns {Promise<Object>} Una promesa que se resuelve con la respuesta del consumidor.
 * @throws {Error} Si ocurre un error durante la publicación o el consumo del mensaje.
 */
export default async function producer(configProducer) {
    const correlationId = Math.random().toString(); // ID único
    configProducer.channel.publish(configProducer.exchange, configProducer.routingKey, Buffer.from(JSON.stringify(configProducer.payload)), {
        replyTo: configProducer.replyQueue.queue,
        correlationId
    });

    return new Promise(async (resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("⏳ Timeout: No se recibió respuesta del consumidor."));
        }, 30000); // 30s de espera antes de rechazar

        try {
            // Capturar el consumerTag correctamente
            const { consumerTag }=await configProducer.channel.consume(configProducer.replyQueue.queue, (msg) => {
                if (!msg) return;

                if (msg.properties.correlationId === correlationId) {
                    clearTimeout(timeout); // Cancelar timeout

                    const res = JSON.parse(msg.content.toString());

                    configProducer.channel.ack(msg); // Confirmar recepción del mensaje
                    configProducer.channel.cancel(consumerTag);
                    resolve(res);
                } else {
                    configProducer.channel.nack(msg, false, true); // Reinsertar si el correlationId no coincide
                    configProducer.channel.cancel(consumerTag);
                    
                }
            }, { noAck: false });

        } catch (error) {
            clearTimeout(timeout);
            reject(error);
        }
    });
}
