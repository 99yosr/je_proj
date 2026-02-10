import swaggerJSDoc from "swagger-jsdoc";

export const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My Next.js API",
      version: "1.0.0",
      description: "API documentation for Next.js 16",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./app/api/**/*.ts"], // 👈 route handlers
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
