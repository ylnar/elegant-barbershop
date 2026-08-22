import serverless from 'serverless-http';
import { createApp } from '../../server/app.ts';

interface NetlifyEvent {
  httpMethod: string;
  path: string;
  headers: Record<string, string | undefined>;
  multiValueHeaders?: Record<string, string[]>;
  queryStringParameters: Record<string, string> | null;
  body: string | null;
  isBase64Encoded: boolean;
}

interface NetlifyContext {
  callbackWaitsForEmptyEventLoop: boolean;
}

const app = createApp();
const lambdaHandler = serverless(app);

export const handler = async (event: NetlifyEvent, context: NetlifyContext) =>
  lambdaHandler(event, context);
