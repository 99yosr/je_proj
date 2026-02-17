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
      schemas: {
        News: {
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
            content: { type: "string" },
            image: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            author: { type: "string", nullable: true },
            juniorId: { type: "integer", nullable: true },
          },
        },
        Project: {
          type: "object",
          properties: {
            id: { type: "integer" },
            titre: { type: "string" },
            description: { type: "string" },
            image: { type: "string", nullable: true },
            statut: { type: "string" },
            dateDebut: { type: "string", format: "date-time", nullable: true },
            dateFin: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            juniorId: { type: "integer" },
            revenu: { type: "number", nullable: true },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ProjectStatsItem: {
          type: "object",
          properties: {
            year: { type: "integer" },
            count: { type: "integer" },
          },
        },
        RevenuResponse: {
          type: "object",
          properties: {
            juniorId: { type: "integer" },
            year: { type: "integer" },
            totalRevenu: { type: "number" },
          },
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
      { name: "News", description: "News management endpoints" },
      { name: "Messages", description: "Messaging system endpoints" },
      { name: "Consulter Info Jets", description: "FicheJE consultation endpoints" },
      { name: "Demande Projet", description: "Project request endpoints" },
      { name: "Feedback", description: "Feedback retrieval endpoints" },
      { name: "Docs", description: "API documentation endpoints" },
      { name: "Notifications", description: "User notifications endpoints" },
      { name: "Profile", description: "Profile management endpoints" },
      { name: "Projects", description: "Project management endpoints" },
      { name: "Update Info Jets", description: "FicheJE update endpoints" },
      { name: "Upload", description: "File upload endpoints" },
      { name: "Users", description: "User administration endpoints" },
    ],
  },
  apis: ["./app/api/**/*.ts"], // 👈 route handlers
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
