import axios from 'axios';

export async function POST(req) {
  const { text } = await req.json();

  if (!text) {
    return new Response(JSON.stringify({ error: 'No text provided for summarization' }), { status: 400 });
  }

  try {
    const response = await axios.post(
        'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
        { inputs: text },
        {
          headers: {
            Authorization: `Bearer YOUR_HUGGINGFACE_API_KEY`,
          },
        }
    );

    const summary = response.data[0].summary_text;

    return new Response(JSON.stringify({ summary }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to summarize the text' }), { status: 500 });
  }
}
