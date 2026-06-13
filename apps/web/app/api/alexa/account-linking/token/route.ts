import { NextRequest } from 'next/server';

import { createDefaultAlexaAccountLinkingTokenHandler } from './handler';

export async function POST(request: NextRequest): Promise<Response> {
  return createDefaultAlexaAccountLinkingTokenHandler()(request);
}
