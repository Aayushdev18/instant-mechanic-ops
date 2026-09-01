export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Instant Mechanic Operations API",
    version: "1.0.0",
    description:
      "REST API for the Instant Mechanic live operations dashboard. Amounts are stored in INR paise? No — integer rupees.",
  },
  servers: [{ url: "/", description: "Current host" }],
  paths: {
    "/api/events": {
      get: {
        summary: "Server-Sent Events stream for live booking updates",
        responses: { "200": { description: "text/event-stream" } },
      },
    },
    "/api/dashboard": {
      get: {
        summary: "Overview KPIs, charts, recent bookings, mechanic map points",
        responses: { "200": { description: "Dashboard payload" } },
      },
    },
    "/api/bookings": {
      get: {
        summary: "List bookings",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "mechanicId", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "sort", in: "query", schema: { type: "string" } },
          { name: "order", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "pageSize", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "Paginated bookings" } },
      },
    },
    "/api/bookings/export": {
      get: {
        summary: "Export bookings as CSV",
        responses: { "200": { description: "text/csv" } },
      },
    },
    "/api/bookings/{id}": {
      get: {
        summary: "Booking detail with status timeline",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Booking" }, "404": { description: "Not found" } },
      },
    },
    "/api/bookings/{id}/status": {
      patch: {
        summary: "Update booking status and broadcast over WebSocket",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Updated booking" } },
      },
    },
    "/api/mechanics": {
      get: {
        summary: "List mechanics with latest booking",
        responses: { "200": { description: "Mechanics" } },
      },
    },
    "/api/mechanics/{id}": {
      get: {
        summary: "Mechanic detail",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Mechanic" } },
      },
    },
    "/api/customers": {
      get: {
        summary: "Paginated customers",
        responses: { "200": { description: "Customers" } },
      },
    },
    "/api/customers/{id}": {
      get: {
        summary: "Customer detail",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Customer" } },
      },
    },
  },
};
