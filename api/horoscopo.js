// Este archivo va en la carpeta: /api/horoscopo.js
// Esta es nuestra nueva API que usa OpenRouter para generar horóscopos gratis.

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

  const signoCapitalizado = signo.charAt(0).toUpperCase() + signo.slice(1);

  try {
    // 1. Preparamos la petición para la API de OpenRouter
    const apiKey = process.env.OPENROUTER_API_KEY; // Usamos la nueva variable de entorno
    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

    // Le pedimos a la IA que actúe como un astrólogo y que SIEMPRE responda con un JSON.
    const prompt = `
      Actúa como un astrólogo experto. Genera un horóscopo para el signo zodiacal '${signoCapitalizado}' para el día de hoy.
      El tono debe ser positivo y enfocado en el crecimiento personal. El idioma debe ser español mexicano.
      Tu respuesta DEBE ser únicamente un objeto JSON válido, sin texto adicional antes o después.
      El objeto JSON debe tener las siguientes claves: "description", "lucky_number", "color", "compatibility", "mood".
      Ejemplo de formato de respuesta:
      {
        "description": "Un día excelente para la creatividad. Tus ideas fluirán con facilidad y podrías recibir reconocimiento por tu ingenio. Confía en tu intuición.",
        "lucky_number": "7",
        "color": "Violeta",
        "compatibility": "Acuario",
        "mood": "Inspirado"
      }
    `;

    const payload = {
      model: "deepseek/deepseek-chat", // Usamos el modelo gratuito de DeepSeek
      messages: [{ role: "user", content: prompt }]
    };

    // 2. Hacemos la llamada a la IA de OpenRouter
    const openRouterResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        // ===== INICIO DE LA MEJORA =====
        // Añadimos las cabeceras recomendadas por OpenRouter
        'HTTP-Referer': 'https://numerologia-one.vercel.app', // URL de tu sitio en producción
        'X-Title': 'Sendero 11 - Códice Numerológico' // Nombre de tu sitio
        // ===== FIN DE LA MEJORA =====
      },
      body: JSON.stringify(payload)
    });

    if (!openRouterResponse.ok) {
      const errorBody = await openRouterResponse.text();
      console.error("Error desde la API de OpenRouter:", errorBody);
      throw new Error(`La API de OpenRouter no respondió correctamente. Status: ${openRouterResponse.status}`);
    }

    const openRouterResult = await openRouterResponse.json();
    
    // 3. Extraemos y parseamos la respuesta JSON del modelo
    const messageContent = openRouterResult.choices && openRouterResult.choices[0].message.content;
    if (!messageContent) {
        throw new Error("La respuesta de la API de OpenRouter no tiene el formato esperado.");
    }

    // El modelo nos devuelve el JSON como un string, así que lo convertimos a un objeto real.
    const horoscopoData = JSON.parse(messageContent);

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

