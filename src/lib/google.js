import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BASE_URL}/api/google/callback`
);

const drive = google.drive({ version: 'v3', auth: oauth2Client });

export { oauth2Client, drive };
