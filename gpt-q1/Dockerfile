# Imagen base de Node.js
FROM node:22

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos del proyecto
COPY package*.json ./
RUN npm install
COPY . .

# Exponer el puerto (aunque no es estrictamente necesario para este tipo de servicio)
EXPOSE 8080

# Comando para iniciar el microservicio
CMD ["npm", "start"]
