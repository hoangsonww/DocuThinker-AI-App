import { oauth2Client } from '@/lib/google';

export async function GET() {
  const scopes = ['https://www.googleapis.com/auth/drive.readonly'];
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });

  return new Response(JSON.stringify({ url: authUrl }), { status: 200 });
}
