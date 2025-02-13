import express from 'express'
import config from '../config/config.js'
import { ConnectionServerError } from '../utils/error.js';
import ora from 'ora';

/**
 * Inicia el servidor Express.
 *
 * Configura y arranca un servidor Express en el puerto especificado en la configuración.
 * Muestra un spinner durante el proceso de inicio del servidor.
 *
 * @async
 * @function startServer
 * @throws {ConnectionServerError} Si ocurre un error al iniciar el servidor.
 */
export default async function startServer() {
    const spinner = ora({spinner: 'moon'});
    try {
        spinner.start('Iniciando servidor...');
        const app = express();
        spinner.succeed('Servidor iniciado');
        app.get('/', (req, res) => {
            //res.redirect('https://www.google.com');
            res.send(`${config.nameMicroservice} esta corriendo en cloud run`);
        });

        app.listen(config.port, () => {
            console.log(`${config.nameMicroservice} esta corriendo en el puerto ${config.port} \n`);
        })
        await new Promise(resolve => setTimeout(resolve, 200));//esperar 200ms
    } catch (error) {
        throw new ConnectionServerError(error,'Hubo un error al iniciar el servidor');
    }
}