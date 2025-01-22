
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import ws from 'ws';

// Required for Neon serverless with WebSocket support
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineTLS = true;
neonConfig.pipelineConnect = true;

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
