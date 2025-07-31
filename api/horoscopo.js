// Este archivo va en la carpeta: /api/horoscopo.js

export default async function handler(request, response) {
  // Añadimos logs para ver qué pasa en Vercel
  console.log("Iniciando la función de horóscopo...");
  const signo = request.query.signo;
  console.log("Signo recibido:", signo);

  if (!signo) {
    console.error("Error: No se proporcionó ningún signo.");
    return response.status(400).json({ error: 'El signo es requerido' });
  }

  try {
    const aztroURL = `https://aztro.sameerkumar.website/?sign=${signo}&day=today`;
    console.log("Llamando a la API de Aztro:", aztroURL);
    
    const aztroResponse = await fetch(aztroURL, { method: 'POST' });
    console.log("Respuesta de Aztro recibida. Status:", aztroResponse.status);

    if (!aztroResponse.ok) {
      // Intentamos leer el cuerpo del error para tener más pistas
      const errorText = await aztroResponse.text(); 
      console.error("La API de Aztro devolvió un error:", errorText);
      throw new Error(`La API de Aztro no respondió correctamente. Status: ${aztroResponse.status}`);
    }

    const horoscopoData = await aztroResponse.json();
    console.log("Datos del horóscopo obtenidos y parseados correctamente.");

    // Damos permiso a nuestra app para leer la respuesta
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log("Enviando respuesta exitosa a la app.");
    return response.status(200).json(horoscopoData);

  } catch (error) {
    // Este bloque capturará cualquier error y nos lo mostrará
    console.error('ERROR CATCH en la función serverless:', error);
    return response.status(500).json({ 
        error: 'Error interno al obtener el horóscopo.',
        details: error.message 
    });
  }
}

