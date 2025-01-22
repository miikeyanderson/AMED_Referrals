import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Referral API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Automated Referral Management (ARM) platform',
      contact: {
        name: 'API Support',
        url: 'https://github.com/yourusername/arm-platform',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie for authentication',
        },
      },
    },
    security: [
      {
        sessionAuth: [],
      },
    ],
  },
  apis: ['./server/routes.ts'], // Path to the API routes
};

export const specs = swaggerJsdoc(options);
