import {
    setDB,
    showInitialForm,
    runCalculation,
    showCardDetails,
    handlePdfButtonClick,
    generatePdf,
    handleSinergia,
    handlePrevMonth,
    handleNextMonth,
    generateClientLink,
    copyClientLink
} from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- INICIALIZACIÓN DE FIREBASE ---
    const firebaseConfig = {
        apiKey: "TU_API_KEY", // ¡RECUERDA CAMBIAR ESTO Y PROTEGERLO!
        authDomain: "numerologia-sendero11.firebaseapp.com",
        projectId: "numerologia-sendero11",
        storageBucket: "numerologia-sendero11.appspot.com",
        messagingSenderId: "1001480790018",
        appId: "1:1001480790018:web:fa17a029b86ad24638071b",
        measurementId: "G-ZLB0DYTJBJ"
    };
    
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        setDB(firebase.firestore()); // Pasa la instancia de la DB al módulo de UI
    } catch (e) {
        console.error("Error al inicializar Firebase.", e);
        alert("Error de configuración de la base de datos. Contacta al administrador.");
    }

    // --- INICIALIZACIÓN DE PARTICLES.JS ---
    particlesJS("particles-js", {
        "particles": { "number": { "value": 25, "density": { "enable": true, "value_area": 900 } }, "color": { "value": "#ffffff" }, "shape": { "type": "circle" }, "opacity": { "value": 0.4, "random": false }, "size": { "value": 3, "random": true }, "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.3, "width": 1 }, "move": { "enable": true, "speed": 1, "direction": "none", "out_mode": "out" } },
        "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": false } } },
        "retina_detect": true
    });

    // --- LÓGICA DE ARRANQUE ---
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');

    if (data) {
        try {
            const decodedData = JSON.parse(atob(data));
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expirationDate = new Date(decodedData.validUntil);
            
            if (decodedData.validUntil && today > expirationDate) {
                document.getElementById('portal-content').innerHTML = `
                    <img src="https://raw.githubusercontent.com/EdddGaar/Numerologia/main/sendero%2011%20ver2.png" alt="Logo Sendero 11" class="w-48 h-48 mb-8 mx-auto">
                    <h2 class="main-title text-4xl text-red-400 mb-4">Acceso Expirado</h2>
                    <p class="text-lg text-gray-300">El enlace para tu reporte personalizado ha expirado.</p>
                    <p class="text-sm text-gray-500 mt-2">Por favor, contacta a Sendero 11 para renovar tu acceso.</p>`;
                document.getElementById('portal').classList.add('flex');
            } else {
                runCalculation(decodedData.name, decodedData.birthdate, decodedData.duration, decodedData.startDate, false);
            }
        } catch (e) {
            document.getElementById('portal-content').innerHTML = `
                <img src="https://raw.githubusercontent.com/EdddGaar/Numerologia/main/sendero%2011%20ver2.png" alt="Logo Sendero 11" class="w-48 h-48 mb-8 mx-auto">
                <h2 class="main-title text-4xl text-red-400 mb-4">Enlace Inválido</h2>
                <p class="text-lg text-gray-300">El enlace que has usado no es correcto o está dañado.</p>`;
            document.getElementById('portal').classList.add('flex');
        }
    } else {
        // MODO PÚBLICO / ADMIN
        showInitialForm();
    }

    // --- ASIGNACIÓN DE EVENTOS (EVENT LISTENERS) ---
    document.body.addEventListener('submit', (e) => {
        if (e.target.id === 'numerology-form') {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const birthdateStr = document.getElementById('birthdate').value;
            if (name && birthdateStr) {
               runCalculation(name, birthdateStr, 99, new Date().toISOString().split('T')[0], true);
            }
        } else if (e.target.id === 'sinergia-form') {
            handleSinergia(e);
        }
    });

    document.body.addEventListener('click', (e) => {
        const cardId = e.target.closest('.info-card')?.id;
        if (cardId) {
            // ===== INICIO DE LA CORRECCIÓN =====
            const typeKebab = cardId.replace('-card', ''); // Ej: 'camino-vida' o 'ano-personal'
            const type = typeKebab.replace(/-./g, x => x[1].toUpperCase()); // Convierte a 'caminoVida'
            // ===== FIN DE LA CORRECCIÓN =====
            showCardDetails(type);
        }

        if (e.target.id === 'generate-pdf-btn') generatePdf();
        if (e.target.id === 'prev-month') handlePrevMonth();
        if (e.target.id === 'next-month') handleNextMonth();
        if (e.target.id === 'generate-link-btn') generateClientLink();
        if (e.target.id === 'copy-link-btn') copyClientLink();

        if (e.target.matches('.pdf-range-button')) {
            handlePdfButtonClick(e);
        }
        
        const generalModal = document.getElementById('general-modal');
        if (e.target.id === 'general-modal' || e.target.id === 'close-modal' || e.target.parentElement.id === 'close-modal') {
            generalModal.classList.add('hidden');
        }
    });
});
