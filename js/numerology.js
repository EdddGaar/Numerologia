const letterValues = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9, s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8 };

export function reducirNumero(n, preserveMasters = true) {
    if (preserveMasters && (n === 11 || n === 22)) return n;
    let sum = String(n).split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
    if (sum > 9 && (!preserveMasters || (sum !== 11 && sum !== 22))) {
        return reducirNumero(sum, preserveMasters);
    }
    return sum;
}

export function calculateNameNumber(name, type) {
    const vowels = 'aeiouáéíóú';
    let sum = 0;
    for (let char of name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")) {
        if (type === 'vowels' && vowels.includes(char)) {
            sum += letterValues[char] || 0;
        } else if (type === 'consonants' && !vowels.includes(char) && letterValues[char]) {
            sum += letterValues[char] || 0;
        }
    }
    return reducirNumero(sum);
}

export function calculateKarmaNumbers(name) {
    const presentNumbers = new Set();
    for (let char of name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")) {
        if (letterValues[char]) {
            presentNumbers.add(letterValues[char]);
        }
    }
    const karma = [];
    for (let i = 1; i <= 9; i++) {
        if (!presentNumbers.has(i)) {
            karma.push(i);
        }
    }
    return karma.length > 0 ? karma : ["Ninguno"];
}

export function getMoonPhase(date) {
    const Y = date.getFullYear();
    let M = date.getMonth() + 1;
    const D = date.getDate();
    let c = 0, e = 0, jd = 0, b = 0;
    let yearForCalc = Y;

    if (M < 3) {
        yearForCalc--;
        M += 12;
    }
    
    c = 365.25 * yearForCalc;
    e = 30.6 * M;
    jd = c + e + D - 694039.09;
    jd /= 29.5305882;
    b = parseInt(jd);
    jd -= b;
    b = Math.round(jd * 8);
    if (b >= 8) b = 0;

    const phases = [
        {icon: "🌑", name: "Luna Nueva"},
        {icon: "🌒", name: "Cuarto Creciente"},
        {icon: "🌓", name: "Cuarto Creciente"},
        {icon: "🌔", name: "Cuarto Creciente"},
        {icon: "🌕", name: "Luna Llena"},
        {icon: "🌖", name: "Cuarto Menguante"},
        {icon: "🌗", name: "Cuarto Menguante"},
        {icon: "🌘", name: "Cuarto Menguante"}
    ];
    return phases[b];
}
