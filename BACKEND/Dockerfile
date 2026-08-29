FROM node:20-alpine AS base

WORKDIR /usr/src/app

# Copy dependency specifications
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Ensure upload and log directories exist
RUN mkdir -p upload/img upload/pdf Log

EXPOSE 3030

ENV NODE_ENV=production
ENV PORT=3030

CMD ["npm", "start"]

