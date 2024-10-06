import axios from 'axios';

export async function POST(req) {
  const { text } = await req.json();

  if (!text) {
    return new Response(JSON.stringify({ error: 'No text provided for brainstorming' }), { status: 400 });
  }

  try {
    const response = await axios.post(
        'https://api.openai.com/v1/completions',
        {
          model: 'text-davinci-003',
          prompt: `Read this text: ${text}. Now, suggest key discussion points, potential writing topics, and questions related to it.`,
          max_tokens: 200,
        },
        {
          headers: {
            Authorization: `Bearer YOUR_OPENAI_API_KEY`,
          },
        }
    );

    const brainstormingIdeas = response.data.choices[0].text;

    return new Response(JSON.stringify({ ideas: brainstormingIdeas }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to generate brainstorming ideas' }), { status: 500 });
  }
}
