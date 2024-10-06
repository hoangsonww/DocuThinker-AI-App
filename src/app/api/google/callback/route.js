import { oauth2Client } from '@/lib/google';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return new Response(JSON.stringify({ error: 'Authorization code is missing' }), { status: 400 });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    return new Response(JSON.stringify({ message: 'Authenticated successfully', tokens }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error exchanging authorization code' }), { status: 500 });
  }
}
