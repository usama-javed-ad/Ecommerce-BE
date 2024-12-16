export default () => ({
    database: {
      uri: process.env.DB_HOST || 'mongodb://mongo:27017/',
      name: process.env.DB,
    },
    JWT_SECRET:
      process.env.JWT_SECRET
  });
  