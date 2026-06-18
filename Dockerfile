FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

RUN npm install -g serve

EXPOSE 5173

CMD ["sh", "-c", "if [ -n \"$VITE_API_URL\" ]; then echo \"window.__ENV__ = { VITE_API_URL: \\\"$VITE_API_URL\\\" };\" > /app/dist/config.js; fi && serve -s dist -l 5173"]
