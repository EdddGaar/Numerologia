import { infoNumeros, sinergiaDetallada, astrologicalEvents, moonPhaseInfo } from './data.js';
import { reducirNumero, calculateNameNumber, calculateKarmaNumbers, getMoonPhase, getZodiacSign, obtenerHoroscopo, traducirTexto } from './numerology.js';

// Variables que necesita este módulo para funcionar
let currentUserData = {};
let currentDate = new Date();
let db; // Variable para la base de datos de Firebase
let logoBase64 = '';
let selectedMonthsForPdf = 1;

// --- FUNCIONES QUE MANIPULAN EL DOM ---

export function setDB(database) {
    db = database;
}

async function getLogoBase64() {
    if (logoBase64) return logoBase64;
    try {
        const response = await fetch('https://raw.githubusercontent.com/EdddGaar/Numerologia/main/sendero%2011%20ver2.png');
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                logoBase64 = reader.result;
                resolve(logoBase64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error al cargar el logo:", error);
        return null;
    }
}

export function showInitialForm() {
    const portalContent = document.getElementById('portal-content');
    portalContent.innerHTML = `
        <img src="https://raw.githubusercontent.com/EdddGaar/Numerologia/main/sendero%2011%20ver2.png" alt="Logo Sendero 11" class="w-48 h-48 mb-8 mx-auto">
        <p class="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">Ingresa los datos para generar un reporte.</p>
        <form id="numerology-form" class="w-full max-w-lg space-y-4 mx-auto">
            <div>
                <label for="name" class="sr-only">Tu nombre completo</label>
                <input type="text" id="name" placeholder="Nombre completo" class="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-center text-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition" required>
            </div>
            <div>
                <label for="birthdate" class="sr-only">Tu fecha de nacimiento</label>
                <input type="date" id="birthdate" class="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-center text-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition" required>
            </div>
            <button type="submit" class="w-full p-3 bg-cyan-500 text-white font-bold rounded-lg text-lg glow-button">
                Descifrar Código
            </button>
        </form>`;
    document.getElementById('portal').classList.add('flex');
}

export function runCalculation(name, birthdateStr, duration, startDate, isAdminView) {
    getLogoBase64();
    const birthdate = new Date(birthdateStr + 'T00:00:00');
    const diaNac = birthdate.getDate();
    const mesNac = birthdate.getMonth() + 1;
    const anoNac = birthdate.getFullYear();
    const anoNacStr = String(anoNac);
    
    const numeroDiaNacimiento = reducirNumero(diaNac, false);
    const caminoVida = reducirNumero(diaNac + mesNac + reducirNumero(anoNac, false));
    const alma = calculateNameNumber(name, 'vowels');
    const personalidad = calculateNameNumber(name, 'consonants');
    const destino = reducirNumero(alma + personalidad);
    const regalo = reducirNumero(parseInt(anoNacStr.slice(-2)[0]) + parseInt(anoNacStr.slice(-2)[1]));
    const karma = calculateKarmaNumbers(name);

    const hoy = new Date();
    const anoPlanetario = (hoy.getFullYear() > birthdate.getFullYear() || (hoy.getMonth() > birthdate.getMonth() || (hoy.getMonth() === birthdate.getMonth() && hoy.getDate() >= birthdate.getDate()))) ? hoy.getFullYear() : hoy.getFullYear() - 1;
    const anoPersonal = reducirNumero(diaNac + mesNac + anoPlanetario);

    currentUserData = { name, birthdate, diaNac, numeroDiaNacimiento, caminoVida, alma, personalidad, destino, regalo, karma, anoPersonal, duration, startDate: new Date(startDate) };
    
    currentDate = new Date(currentUserData.startDate);

    document.getElementById('user-name-title').textContent = name.split(' ')[0];
    
    const portalSection = document.getElementById('portal');
    const resultsSection = document.getElementById('results');
    const adminPanel = document.getElementById('admin-panel');

    portalSection.style.opacity = 0;
    setTimeout(() => {
        portalSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        
        displayResults();
        displayHoroscope(); // <-- LLAMADA A LA NUEVA FUNCIÓN

        document.getElementById('calendar-title').textContent = `Calendario Numerológico para ${name.split(' ')[0]}`;
        document.getElementById('calendar-subtitle').textContent = `Nacimiento: ${birthdate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`;
        buildCalendar(currentDate);
        setupPdfButtons(duration);

        if (isAdminView) {
            adminPanel.classList.remove('hidden');
            populateAdminDurationSelect();
            displayAnalytics();
        } else {
            adminPanel.classList.add('hidden');
        }

        setTimeout(() => {
            resultsSection.style.opacity = 1;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
    }, 500);
}

function displayResults() {
    const { caminoVida, alma, personalidad, regalo, karma, anoPersonal } = currentUserData;
    
    const createCardContent = (title, number, subtitle, color) => `
        <h3 class="font-bold text-xl text-cyan-300 pt-2">${title}</h3>
        <div class="flex-grow flex items-center justify-center">
            <p class="text-7xl font-bold rounded-full w-36 h-36 flex items-center justify-center" style="color: ${color}; text-shadow: 0 0 12px ${color}80; background: radial-gradient(circle, ${color}20 0%, transparent 65%);">${number}</p>
        </div>
        <p class="text-xs text-gray-400 pb-2">${subtitle}</p>`;

    const createKarmaCardContent = (title, karmaList, subtitle) => {
        const karmaHtml = karmaList[0] === "Ninguno" 
            ? `<span style="color: #FFFFFF;">${karmaList[0]}</span>`
            : karmaList.map(k => {
                const kColor = infoNumeros.diaPersonal[k]?.hex || '#FFFFFF';
                return `<span style="color: ${kColor}; text-shadow: 0 0 8px ${kColor}60;">${k}</span>`;
            }).join(', ');
        return `
            <h3 class="font-bold text-xl text-cyan-300 pt-2">${title}</h3>
            <div class="flex-grow flex items-center justify-center">
                <p class="text-5xl font-bold">${karmaHtml}</p>
            </div>
            <p class="text-xs text-gray-400 pb-2">${subtitle}</p>`;
    };

    document.getElementById('camino-vida-card').innerHTML = createCardContent('Camino de Vida', caminoVida, 'Tu misión y lecciones.', infoNumeros.diaPersonal[caminoVida]?.hex || '#FFFFFF');
    document.getElementById('alma-card').innerHTML = createCardContent('Alma', alma, 'Tus deseos internos.', infoNumeros.diaPersonal[alma]?.hex || '#FFFFFF');
    document.getElementById('personalidad-card').innerHTML = createCardContent('Personalidad', personalidad, 'Cómo te ven los demás.', infoNumeros.diaPersonal[personalidad]?.hex || '#FFFFFF');
    document.getElementById('regalo-card').innerHTML = createCardContent('Regalo Divino', regalo, 'Tu don natural.', infoNumeros.diaPersonal[regalo]?.hex || '#FFFFFF');
    document.getElementById('ano-personal-card').innerHTML = createCardContent('Año Personal', anoPersonal, 'Tu energía para este año.', infoNumeros.diaPersonal[anoPersonal]?.hex || '#FFFFFF');
    document.getElementById('karma-card').innerHTML = createKarmaCardContent('Karma', karma, 'Lecciones a aprender.');
}

// --- NUEVA FUNCIÓN PARA MOSTRAR EL HORÓSCOPO ---
async function displayHoroscope() {
    const day = currentUserData.birthdate.getDate();
    const month = currentUserData.birthdate.getMonth() + 1;

    const signo = getZodiacSign(day, month);
    const signoCapitalizado = signo.charAt(0).toUpperCase() + signo.slice(1);

    const horoscopoData = await obtenerHoroscopo(signo);
    if (!horoscopoData) {
        document.getElementById('horoscopo-loading').innerText = "No se pudo obtener el horóscopo de hoy.";
        return;
    }

    const descripcionTraducida = await traducirTexto(horoscopoData.description);

    const horoscopoCard = document.getElementById('horoscopo-card');
    horoscopoCard.innerHTML = `
        <h3 class="text-2xl font-bold text-purple-300 mb-2">${signoCapitalizado}</h3>
        <p class="text-gray-300 mb-4">${descripcionTraducida}</p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm mt-4 border-t border-white/10 pt-4">
            <div><p class="text-gray-400">Color</p><p class="font-bold">${horoscopoData.color}</p></div>
            <div><p class="text-gray-400">Compatibilidad</p><p class="font-bold">${horoscopoData.compatibility}</p></div>
            <div><p class="text-gray-400">Número Suerte</p><p class="font-bold">${horoscopoData.lucky_number}</p></div>
            <div><p class="text-gray-400">Humor</p><p class="font-bold">${horoscopoData.mood}</p></div>
        </div>
    `;
}


export function showCardDetails(type) {
    const { caminoVida, alma, personalidad, destino, regalo, karma, anoPersonal } = currentUserData;
    let title = '';
    let content = '';

    switch (type) {
        case 'caminoVida':
            title = `Camino de Vida ${caminoVida}`;
            content = `<p class="text-sm mb-4">${infoNumeros.caminoVida[caminoVida]}</p>`;
            break;
        case 'alma':
            title = `Número de Alma ${alma}`;
            content = `<p class="text-sm">${infoNumeros.alma[alma]}</p>`;
            break;
        case 'personalidad':
            title = `Número de Personalidad ${personalidad}`;
            content = `<p class="text-sm mb-4">${infoNumeros.personalidad[personalidad]}</p>
                       <hr class="my-3 border-white/20">
                       <p class="font-bold text-cyan-300">Tu número de Destino (Alma + Personalidad) es ${destino}.</p>`;
            break;
        case 'regalo':
             title = `Regalo Divino ${regalo}`;
            content = `<p class="text-sm">${infoNumeros.regalo[regalo]}</p>`;
            break;
        case 'karma':
            const karmaText = karma[0] === "Ninguno" ? `<p class="text-sm">${infoNumeros.karma["Ninguno"]}</p>` : karma.map(k => `<p class="text-sm text-left"><strong class="text-cyan-300">${k}:</strong> ${infoNumeros.karma[k]}</p>`).join('');
            title = `Lecciones Kármicas`;
            content = `<div class="space-y-2">${karmaText}</div>`;
            break;
        case 'anoPersonal':
            const anoInfo = infoNumeros.añoPersonal[anoPersonal];
            title = `Año Personal ${anoPersonal}`;
            content = `<h3 class="font-bold text-2xl mb-2" style="color:${anoInfo.color.toLowerCase()}">${anoInfo.palabra}</h3>
                       <p class="text-sm"><strong>Joya:</strong> ${anoInfo.joya}</p>
                       <p class="text-sm mt-4">${anoInfo.desc}</p>`;
            break;
    }

    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `<h3 class="main-title text-3xl font-bold mb-4">${title}</h3>
                              <div class="text-gray-300">${content}</div>
                              <button id="close-modal" class="mt-6 w-full p-2 bg-cyan-500 text-white font-bold rounded-lg glow-button">Cerrar</button>`;
    document.getElementById('general-modal').classList.remove('hidden');
}

export function buildCalendar(date) {
    const { anoPersonal, numeroDiaNacimiento, duration, startDate } = currentUserData;
    const month = date.getMonth();
    const year = date.getFullYear();

    document.getElementById('month-year').textContent = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
    const calendarGrid = document.getElementById('calendar-grid');
    calendarGrid.innerHTML = '';
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    diasSemana.forEach(dia => { calendarGrid.innerHTML += `<div class="text-center font-bold text-cyan-300 text-xs sm:text-base">${dia}</div>`; });
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDayOfMonth; i++) { calendarGrid.innerHTML += `<div></div>`; }

    for (let i = 1; i <= daysInMonth; i++) {
        const currentDayDate = new Date(year, month, i);
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const astroEvent = astrologicalEvents[dateString];

        const diaDeLaSemana = diasSemana[currentDayDate.getDay()];
        const periodosDiaNac = infoNumeros.periodos[numeroDiaNacimiento] || { favorables: [] };
        const isFavorable = periodosDiaNac.favorables.includes(diaDeLaSemana);
        
        const mesPersonal = reducirNumero(anoPersonal + (month + 1), false);
        const diaPersonal = reducirNumero(mesPersonal + i);
        const diaInfo = infoNumeros.diaPersonal[diaPersonal];
        
        let dayClasses = `glassmorphism rounded-lg text-center cursor-pointer flex flex-col items-center justify-center aspect-square p-1 transition-transform hover:scale-110`;
        if (new Date().toDateString() === currentDayDate.toDateString()) dayClasses += ' day-pulse border-2 border-cyan-400';
        
        const moonPhase = getMoonPhase(currentDayDate);
        
        const dayElement = document.createElement('div');
        dayElement.className = dayClasses;
        dayElement.style.border = `1px solid ${diaInfo.hex}55`;
        
        dayElement.innerHTML = `<span class="text-lg sm:text-2xl font-bold" style="color: white; text-shadow: 0 0 5px black;">${i}</span><span class="text-xs sm:text-sm font-bold" style="color: ${diaInfo.hex};">${diaPersonal}</span><div class="flex text-xs mt-1 gap-1 items-center"><span>${moonPhase.icon}</span>${astroEvent ? `<span>${astroEvent.icon}</span>` : ''}${isFavorable ? '<span class="text-yellow-300">⭐</span>' : ''}</div>`;
        dayElement.onclick = () => showDayDetails(currentDayDate);
        calendarGrid.appendChild(dayElement);
    }

    const nextMonthBtn = document.getElementById('next-month');
    const prevMonthBtn = document.getElementById('prev-month');
    
    const currentMonthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const startMonthStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    const endMonth = new Date(startDate);
    endMonth.setMonth(startDate.getMonth() + duration - 1);
    const endMonthStart = new Date(endMonth.getFullYear(), endMonth.getMonth(), 1);

    if (duration !== 99 && currentMonthStart.getTime() >= endMonthStart.getTime()) {
        nextMonthBtn.disabled = true;
        nextMonthBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        nextMonthBtn.disabled = false;
        nextMonthBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    if (currentMonthStart.getTime() <= startMonthStart.getTime()) {
        prevMonthBtn.disabled = true;
        prevMonthBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        prevMonthBtn.disabled = false;
        prevMonthBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

function showDayDetails(date) {
    const { anoPersonal } = currentUserData;
    const month = date.getMonth();
    const year = date.getFullYear();
    const day = date.getDate();

    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const astroEvent = astrologicalEvents[dateString];

    const mesPersonal = reducirNumero(anoPersonal + (month + 1), false);
    const diaPersonal = reducirNumero(mesPersonal + day);
    const diaInfo = infoNumeros.diaPersonal[diaPersonal];
    const moonPhase = getMoonPhase(date);
    
    let astroEventHtml = '';
    if (astroEvent) {
        astroEventHtml = `
        <div class="glassmorphism rounded-lg p-3 my-2 text-left">
            <h4 class="font-bold text-red-400 mb-1">${astroEvent.icon} Evento Astrológico: ${astroEvent.name}</h4>
            <p class="text-sm pl-6">${astroEvent.desc}</p>
        </div>`;
    }

    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
        <p class="text-xl font-bold mb-2">${date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <div class="mb-4">
            <p class="text-6xl font-bold" style="color:${diaInfo.hex}">${diaPersonal}</p>
            <p class="text-xl font-bold" style="color:${diaInfo.hex}">Día ${diaInfo.color}</p>
        </div>
        ${astroEventHtml}
        <div class="glassmorphism rounded-lg p-3 my-2 text-left">
            <h4 class="font-bold text-gray-300 mb-1">${moonPhase.icon} Energía Lunar: ${moonPhase.name}</h4>
            <p class="text-sm pl-6">${moonPhaseInfo[moonPhase.name].reseña}</p>
        </div>
        <div class="glassmorphism rounded-lg p-3 my-2 text-left">
            <h4 class="font-bold text-yellow-300 mb-1 flex items-center"><span class="w-4 h-4 rounded-full mr-2 border border-white/20" style="background-color:${diaInfo.hex};"></span>Vibración de Color</h4>
            <p class="text-sm pl-6">Viste de <strong>${diaInfo.ropa.color}</strong> para ${diaInfo.ropa.frase}</p>
        </div>
        <div class="glassmorphism rounded-lg p-3 my-2 text-left">
            <h4 class="font-bold text-cyan-300 mb-1">💡 Consejo del Día</h4>
            <p class="text-sm pl-6">${diaInfo.consejo}</p>
        </div>
        <div class="glassmorphism rounded-lg p-3 my-2 text-left">
            <h4 class="font-bold text-purple-300 mb-1">✨ Afirmación del Día</h4>
            <p class="text-sm italic pl-6">"${diaInfo.afirmacion}"</p>
        </div>
        <button id="close-modal" class="mt-6 w-full p-2 bg-cyan-500 text-white font-bold rounded-lg glow-button">Cerrar</button>`;
    
    document.getElementById('general-modal').classList.remove('hidden');
}

function setupPdfButtons(duration) {
    const pdfButtonsContainer = document.getElementById('pdf-range-buttons');
    const buttons = pdfButtonsContainer.querySelectorAll('.pdf-range-button');
    let highestAvailableButton = null;

    buttons.forEach(button => {
        const months = parseInt(button.dataset.months);
        button.classList.remove('bg-cyan-500');
        if (duration !== 99 && months > duration) {
            button.style.display = 'none';
        } else {
            button.style.display = 'inline-block';
            highestAvailableButton = button;
        }
    });

    if (highestAvailableButton) {
        highestAvailableButton.classList.add('bg-cyan-500');
        selectedMonthsForPdf = parseInt(highestAvailableButton.dataset.months);
    }
}

export function handlePdfButtonClick(e) {
    const pdfRangeButtons = document.querySelectorAll('.pdf-range-button');
    pdfRangeButtons.forEach(btn => btn.classList.remove('bg-cyan-500'));
    e.target.classList.add('bg-cyan-500');
    selectedMonthsForPdf = parseInt(e.target.dataset.months);
}

export async function generatePdf() {
    const loader = document.getElementById('pdf-loader');
    const progressBar = document.getElementById('pdf-progress-bar');
    loader.classList.remove('hidden');
    progressBar.style.width = '0%';

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'pt', 'letter');
    const { name, birthdate, caminoVida, alma, personalidad, destino, regalo, karma, anoPersonal } = currentUserData;
    const logoData = await getLogoBase64();

    let yPos = 0;
    const margin = 60;
    const maxWidth = pdf.internal.pageSize.getWidth() - margin * 2;

    const addPageWithHeader = (isFirstPage = false) => {
        if (!isFirstPage) {
            pdf.addPage();
        }
        pdf.setFillColor(10, 10, 26);
        pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');
        if (logoData) {
            pdf.addImage(logoData, 'PNG', margin, margin - 30, 40, 40);
        }
        pdf.setFont('Inter', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(150, 150, 150);
        pdf.text('Reporte Personalizado para ' + name, pdf.internal.pageSize.getWidth() - margin, margin - 20, { align: 'right' });
        yPos = margin + 30;
    };

    const checkPageBreak = (height) => {
        if (yPos + height > pdf.internal.pageSize.getHeight() - margin) {
            addPageWithHeader();
        }
    };

    const drawTitle = (text, size, color, y) => {
        pdf.setFont('Playfair Display', 'bold');
        pdf.setFontSize(size);
        pdf.setTextColor(color[0], color[1], color[2]);
        pdf.text(text, pdf.internal.pageSize.getWidth() / 2, y, { align: 'center' });
    };

    const drawSubTitle = (text, size, color) => {
        checkPageBreak(size * 2);
        pdf.setFont('Playfair Display', 'bold');
        pdf.setFontSize(size);
        pdf.setTextColor(color[0], color[1], color[2]);
        pdf.text(text, margin, yPos);
        yPos += size * 1.5;
    };

    const drawBodyText = (text, isListItem = false) => {
        pdf.setFont('Inter', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(224, 224, 224);
        const prefix = isListItem ? '• ' : '';
        const lines = pdf.splitTextToSize(prefix + text, maxWidth - (isListItem ? 10 : 0));
        checkPageBreak(lines.length * 12 + 15);
        pdf.text(lines, margin + (isListItem ? 10 : 0), yPos);
        yPos += lines.length * 12 + (isListItem ? 5 : 15);
    };
    
    const drawDivider = () => {
        checkPageBreak(20);
        pdf.setDrawColor(0, 191, 255, 0.3);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPos, pdf.internal.pageSize.getWidth() - margin, yPos);
        yPos += 20;
    };

    pdf.setFillColor(10, 10, 26);
    pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');
    if (logoData) {
        pdf.addImage(logoData, 'PNG', pdf.internal.pageSize.getWidth() / 2 - 50, 120, 100, 100);
    }
    drawTitle("Tu Códice Numerológico Personal", 32, [255, 255, 255], 280);
    drawTitle("Preparado para:", 14, [224, 224, 224], 360);
    drawTitle(name, 24, [0, 191, 255], 400);
    drawTitle(birthdate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }), 16, [224, 224, 224], 430);
    drawTitle("Sendero 11", 12, [224, 224, 224], pdf.internal.pageSize.getHeight() - margin);
    
    progressBar.style.width = '10%';

    addPageWithHeader();
    drawSubTitle("Una Guía a Tu Universo Interior", 18, [0, 191, 255]);
    drawBodyText("Gracias por confiar en Sendero 11 para explorar tu mapa numerológico. Este reporte ha sido generado especialmente para ti y es una herramienta poderosa para tu autoconocimiento y crecimiento.");
    drawBodyText("La numerología es un lenguaje sagrado que nos enseña que todo en el universo vibra con una frecuencia específica, y los números son el código para entender estas vibraciones. Desde tu fecha de nacimiento hasta tu nombre completo, cada número en tu vida tiene un significado profundo que revela tus talentos, desafíos y el propósito de tu alma. Al entender tu códice personal, puedes navegar tu vida con mayor claridad, propósito y confianza.");
    drawDivider();
    
    drawSubTitle(`Camino de Vida: ${caminoVida}`, 18, [0, 191, 255]);
    drawBodyText(infoNumeros.caminoVida[caminoVida]);
    drawDivider();

    drawSubTitle(`Número de Alma: ${alma}`, 18, [0, 191, 255]);
    drawBodyText(infoNumeros.alma[alma]);
    drawDivider();

    drawSubTitle(`Número de Personalidad: ${personalidad}`, 18, [0, 191, 255]);
    drawBodyText(infoNumeros.personalidad[personalidad]);
    drawBodyText(`La suma de tu Alma (${alma}) y tu Personalidad (${personalidad}) revela tu Número de Destino: ${destino}. Este número representa la misión integrada que vienes a cumplir, combinando tus deseos internos con la forma en que te proyectas al mundo.`);
    drawDivider();

    drawSubTitle(`Regalo Divino: ${regalo}`, 18, [0, 191, 255]);
    drawBodyText(infoNumeros.regalo[regalo]);
    drawDivider();

    drawSubTitle('Lecciones Kármicas', 18, [0, 191, 255]);
    if (karma[0] === "Ninguno") {
        drawBodyText(infoNumeros.karma["Ninguno"]);
    } else {
        drawBodyText("Estas son las áreas en las que vienes a trabajar en esta vida, basadas en las vibraciones numéricas ausentes en tu nombre:");
        karma.forEach(k => {
            drawBodyText(`Karma ${k}: ${infoNumeros.karma[k]}`, true);
        });
    }
    drawDivider();
    
    const anoInfo = infoNumeros.añoPersonal[anoPersonal];
    drawSubTitle(`Año Personal: ${anoPersonal}`, 18, [0, 191, 255]);
    drawBodyText(`Este año estás vibrando en un año personal ${anoPersonal}. Palabra clave: ${anoInfo.palabra}. Color: ${anoInfo.color}. Joya: ${anoInfo.joya}.`);
    drawBodyText(anoInfo.desc);
    
    progressBar.style.width = '50%';

    for (let i = 0; i < selectedMonthsForPdf; i++) {
        addPageWithHeader();
        const calendarDate = new Date(currentUserData.startDate);
        calendarDate.setDate(1);
        calendarDate.setMonth(calendarDate.getMonth() + i);
        
        const tempCalendarContainer = document.createElement('div');
        const calendarNode = document.getElementById('calendar-section').cloneNode(true);
        tempCalendarContainer.appendChild(calendarNode);
        tempCalendarContainer.style.width = '800px';
        tempCalendarContainer.style.backgroundColor = '#0a0a1a';
        tempCalendarContainer.style.color = '#e0e0e0';
        tempCalendarContainer.style.padding = '20px';
        document.body.appendChild(tempCalendarContainer);
        
        const tempGrid = tempCalendarContainer.querySelector('#calendar-grid');
        const tempMonthYear = tempCalendarContainer.querySelector('#month-year');
        
        const originalDate = new Date(currentDate);
        buildCalendar(calendarDate); // This updates the main calendar in the DOM
        tempGrid.innerHTML = document.getElementById('calendar-grid').innerHTML;
        tempMonthYear.innerHTML = `Calendario Numerológico para ${calendarDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
        buildCalendar(originalDate); // Restore the original calendar view in the DOM

        const canvas = await html2canvas(tempCalendarContainer, { backgroundColor: '#0a0a1a', scale: 2 });
        document.body.removeChild(tempCalendarContainer);
        
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth() - 80;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 40, yPos, pdfWidth, pdfHeight);

        progressBar.style.width = `${50 + (50 * (i + 1) / selectedMonthsForPdf)}%`;
    }

    pdf.save(`Reporte-Sendero-11-${currentUserData.name.split(' ')[0]}.pdf`);
    loader.classList.add('hidden');
}


export function handleSinergia(e) {
    e.preventDefault();
    const otherName = document.getElementById('other-name').value;
    const otherBirthdateValue = document.getElementById('other-birthdate').value;
    const relationshipType = document.getElementById('relationship-type').value;

    if(!otherName || !otherBirthdateValue) {
        document.getElementById('sinergia-result').innerHTML = `<p class="text-red-400">Por favor, completa todos los campos.</p>`;
        return;
    }

    const otherBirthdate = new Date(otherBirthdateValue + 'T00:00:00');
    const otherCamino = reducirNumero(otherBirthdate.getDate() + (otherBirthdate.getMonth() + 1) + reducirNumero(otherBirthdate.getFullYear(), false));
    
    const myCamino = currentUserData.caminoVida;
    
    const key = myCamino < otherCamino ? `${myCamino}-${otherCamino}` : `${otherCamino}-${myCamino}`;
    
    const compatibilidad = sinergiaDetallada[key] || { [relationshipType]: "No hay una descripción específica para esta combinación, lo que sugiere una dinámica neutral que pueden moldear con su intención." };
    const textoResultado = compatibilidad[relationshipType];

    document.getElementById('sinergia-result').innerHTML = `
        <h4 class="font-bold text-xl text-purple-300">Sinergia de Caminos ${myCamino} y ${otherCamino}</h4>
        <p class="text-white text-sm mt-2">${textoResultado}</p>`;
}

export function handlePrevMonth() {
    if (!document.getElementById('prev-month').disabled) {
        currentDate.setMonth(currentDate.getMonth() - 1);
        buildCalendar(currentDate);
    }
}

export function handleNextMonth() {
    if (!document.getElementById('next-month').disabled) {
        currentDate.setMonth(currentDate.getMonth() + 1);
        buildCalendar(currentDate);
    }
}

function populateAdminDurationSelect() {
    const select = document.getElementById('admin-duration');
    select.innerHTML = ''; // Limpiar opciones existentes
    for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i} Mes(es) de Acceso`;
        select.appendChild(option);
    }
    const permanentOption = document.createElement('option');
    permanentOption.value = 99;
    permanentOption.textContent = 'Acceso Permanente';
    select.appendChild(permanentOption);
}

export function generateClientLink() {
    if (!db) {
        alert("La base de datos no está conectada. Revisa tu configuración de Firebase.");
        return;
    }
    const name = currentUserData.name;
    const birthdate = currentUserData.birthdate.toISOString().split('T')[0];
    const duration = parseInt(document.getElementById('admin-duration').value);

    const today = new Date();
    let expirationDate = new Date(today);
    if (duration === 99) {
        expirationDate = new Date('9999-12-31');
    } else {
        expirationDate.setMonth(today.getMonth() + duration);
    }
    
    const dataToEncode = {
        name,
        birthdate,
        validUntil: expirationDate.toISOString().split('T')[0],
        duration,
        startDate: new Date().toISOString().split('T')[0]
    };

    const encodedData = btoa(JSON.stringify(dataToEncode));
    const baseURL = window.location.href.split('?')[0]; // Versión robusta
    const finalURL = `${baseURL}?data=${encodedData}`;

    document.getElementById('generated-link-container').classList.remove('hidden');
    document.getElementById('generated-link').value = finalURL;

    // Guardar en Firestore
    db.collection("clients").add({
        name: name,
        duration: duration === 99 ? 'Permanente' : `${duration} mes(es)`,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        displayAnalytics();
    }).catch(err => {
        console.error("Error al guardar en Firestore: ", err);
        alert("Hubo un error al guardar el registro del cliente.");
    });
}

export function copyClientLink() {
    const linkInput = document.getElementById('generated-link');
    const copyLinkBtnAdmin = document.getElementById('copy-link-btn');
    
    navigator.clipboard.writeText(linkInput.value).then(() => {
        copyLinkBtnAdmin.textContent = '¡Copiado!';
        setTimeout(() => { copyLinkBtnAdmin.textContent = 'Copiar'; }, 2000);
    }).catch(err => {
        console.error('Error al copiar el enlace: ', err);
        // Fallback para navegadores antiguos
        linkInput.select();
        document.execCommand('copy');
    });
}


function displayAnalytics() {
    if (!db) return;
    const container = document.getElementById('analytics-table-container');
    db.collection("clients").orderBy("createdAt", "desc").get().then(querySnapshot => {
        if (querySnapshot.empty) {
            container.innerHTML = '<p class="text-gray-400">Aún no has generado ningún enlace.</p>';
            return;
        }
        let tableHTML = `
            <table class="w-full text-sm text-left text-gray-300">
                <thead class="text-xs text-cyan-300 uppercase">
                    <tr>
                        <th scope="col" class="px-6 py-3">Cliente</th>
                        <th scope="col" class="px-6 py-3">Paquete</th>
                        <th scope="col" class="px-6 py-3">Fecha de Creación</th>
                    </tr>
                </thead>
                <tbody>`;
        querySnapshot.forEach(doc => {
            const client = doc.data();
            const date = client.createdAt ? client.createdAt.toDate().toLocaleDateString('es-ES') : 'N/A';
            tableHTML += `
                    <tr class="border-b border-gray-700">
                        <td class="px-6 py-4">${client.name}</td>
                        <td class="px-6 py-4">${client.duration}</td>
                        <td class="px-6 py-4">${date}</td>
                    </tr>`;
        });
        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;
    }).catch(err => {
        console.error("Error al leer de Firestore: ", err);
        container.innerHTML = '<p class="text-red-400">No se pudo cargar el registro. Revisa la conexión con la base de datos.</p>';
    });
}

