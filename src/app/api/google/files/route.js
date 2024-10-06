import { drive } from '@/lib/google';

export async function GET() {
  try {
    const response = await drive.files.list({
      pageSize: 10,
      fields: 'files(id, name, mimeType)',
    });

    return new Response(JSON.stringify({ files: response.data.files }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch files from Google Drive' }), { status: 500 });
  }
}
