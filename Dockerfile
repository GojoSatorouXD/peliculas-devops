# Imagen base ligera con Node 20
FROM node:20-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Se copian primero las dependencias para aprovechar la caché de capas
COPY package*.json ./
RUN npm install --omit=dev

# Se copia el resto del código
COPY . .

# Puerto interno de la aplicación
EXPOSE 3000

# Comando de arranque
CMD ["npm", "start"]