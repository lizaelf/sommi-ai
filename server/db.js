"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.db = void 0;
var serverless_1 = require("@neondatabase/serverless");
var neon_http_1 = require("drizzle-orm/neon-http");
var schema = require("@shared/schema");
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
// Use HTTP-based connection instead of WebSocket to avoid connection issues
var sql = (0, serverless_1.neon)(process.env.DATABASE_URL);
exports.db = (0, neon_http_1.drizzle)(sql, { schema: schema });
// For backwards compatibility, export a mock pool
exports.pool = {
    connect: function () { return Promise.resolve({
        query: sql,
        release: function () { },
    }); },
};
