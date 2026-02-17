import swaggerJSDoc from "swagger-jsdoc";

export const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Junior Entreprise API",
      version: "1.0.0",
      description: "API documentation for Junior Entreprise Management System",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: "apiKey",
          in: "cookie",
          name: "session",
          description: "Session-based authentication using iron-session",
        },
      },
    },
    security: [
      {
        sessionAuth: [],
      },
    ],
    tags: [
      { name: "Activity", description: "Activity management endpoints" },
      { name: "Auth", description: "Authentication and authorization endpoints" },
      { name: "Events", description: "Event management endpoints" },
      { name: "Juniors", description: "Junior Entreprise management endpoints" },
      { name: "Messages", description: "Messaging system endpoints" },
      { name: "Consulter Info Jets", description: "FicheJE consultation endpoints" },
      { name: "Demande Projet", description: "Project request endpoints" },
      { name: "Feedback", description: "Feedback retrieval endpoints" },
      { name: "Docs", description: "API documentation endpoints" },
    ],
  },
  apis: ["./app/api/**/*.ts"], // 👈 route handlers
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
