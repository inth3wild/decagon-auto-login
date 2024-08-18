FROM node:20-alpine

# Set working directory
WORKDIR /app

# Build optimization
COPY yarn.lock package.json ./

RUN yarn install --immutable

# Copy source code
COPY . .

RUN yarn build

# Run the application
CMD [ "yarn", "start" ]