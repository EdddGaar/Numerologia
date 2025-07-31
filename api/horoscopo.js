// Este archivo va en la nueva carpeta: /api/horoscopo.js

// Esta es una "Función Serverless" de Vercel.
// Se encarga de hacer la llamada a la API de Aztro desde el servidor.

export default async function handler(request, response) {
  // 1. Obtenemos el signo que nos mandó la app desde la URL (?signo=aries)
  const signo = request.query.signo;

  // Si no nos mandaron un signo, devolvemos un error
  if (!signo) {
    return response.status(400).json({ error: 'El signo es requerido' });
  }

  try {
    // 2. Hacemos la llamada a la API de Aztro (esto pasa de servidor a servidor, sin problemas de CORS)
    const aztroURL = `https://aztro.sameerkumar.website/?sign=${signo}&day=today`;
    const aztroResponse = await fetch(aztroURL, { method: 'POST' });
    
    if (!aztroResponse.ok) {
        // Si la API de Aztro falla, pasamos el error
        throw new Error(`La API de Aztro no respondió correctamente. Status: ${aztroResponse.status}`);
    }

    const horoscopoData = await aztroResponse.json();

    // 3. Configuramos las cabeceras para permitir que nuestra app lea la respuesta (CORS)
    // Esto le da permiso a tu sitio de Vercel para que pueda leer la respuesta.
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 4. Devolvemos los datos del horóscopo a nuestra app
    return response.status(200).json(horoscopoData);

  } catch (error) {
    console.error('Error en la función serverless:', error);
    return response.status(500).json({ error: 'Error interno al obtener el horóscopo.' });
  }
}

