// Este archivo va en la carpeta: /api/horoscopo.js
// Esta es nuestra nueva API que usa IA para generar horóscopos.

export default async function handler(request, response) {
  // Damos permiso a nuestra app para leer la respuesta (CORS)
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Si es una petición OPTIONS (pre-vuelo de CORS), solo respondemos OK.
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const signo = request.query.signo;

  if (!signo) {
    return response.status(400).json({ error: 'El signo es requerido' });
  }

  // Capitalizamos el signo para el prompt
  const signoCapitalizado = signo.charAt(0).toUpperCase() + signo.slice(1);

  try {
    // 1. Preparamos la petición para la API de Gemini
    const apiKey = process.env.GEMINI_API_KEY; // Vercel manejará esta variable de entorno
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const prompt = `Actúa como un astrólogo experto. Genera un horóscopo para el signo zodiacal '${signoCapitalizado}' para el día de hoy. El tono debe ser positivo y enfocado en el crecimiento personal. El idioma debe ser español mexicano. Proporciona una descripción, un número de la suerte, un color de la suerte, un signo zodiacal compatible para hoy, y un estado de ánimo (mood) para el día.`;

    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: {
          type: "OBJECT",
          properties: {
            "description": { "type": "STRING" },
            "lucky_number": { "type": "STRING" },
            "color": { "type": "STRING" },
            "compatibility": { "type": "STRING" },
            "mood": { "type": "STRING" }
          },
          required: ["description", "lucky_number", "color", "compatibility", "mood"]
        }
      }
    };

    // 2. Hacemos la llamada a la IA de Gemini
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error("Error desde la API de Gemini:", errorBody);
      throw new Error(`La API de Gemini no respondió correctamente. Status: ${geminiResponse.status}`);
    }

    const geminiResult = await geminiResponse.json();
    
    // 3. Extraemos y parseamos la respuesta JSON del modelo
    const candidate = geminiResult.candidates && geminiResult.candidates[0];
    if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0].text) {
        throw new Error("La respuesta de la API de Gemini no tiene el formato esperado.");
    }

    const horoscopoData = JSON.parse(candidate.content.parts[0].text);

    // 4. Devolvemos los datos del horóscopo a nuestra app
    return response.status(200).json(horoscopoData);

  } catch (error) {
    console.error('ERROR CATCH en la función serverless:', error);
    return response.status(500).json({
      error: 'Error interno al generar el horóscopo.',
      details: error.message
    });
  }
}

