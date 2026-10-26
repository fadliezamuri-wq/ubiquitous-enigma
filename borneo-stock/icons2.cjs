// Borneo / Sarawak icon set, batch 2. Same 1000x1000 canvas and styles as icons.cjs.
const INK = '#2a1a12';
const S = `stroke="${INK}" stroke-width="16" stroke-linejoin="round" stroke-linecap="round"`;
const VINK = '#5a3b2a';
const V = `stroke="${VINK}" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"`;

// Thick outlined line: dark stroke underneath, colour stroke on top.
const tube = (d, color, w, ink = INK, edge = 16) =>
  `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${w + edge}" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

const range = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');

const bowl = (band) => `
    <path d="M240 520 L760 520 Q745 770 500 795 Q255 770 240 520Z" fill="#fdfaf2" ${S}/>
    <path d="M300 640 Q500 690 700 640" fill="none" stroke="${band}" stroke-width="12"/>
    <g fill="${band}">${[360, 440, 520, 600].map(x => `<rect x="${x - 10}" y="${688 + (x === 360 ? -4 : 6)}" width="20" height="20" transform="rotate(45 ${x} ${698})"/>`).join('')}</g>
    <path d="M400 790 L600 790 L580 822 L420 822Z" fill="#fdfaf2" ${S}/>`;

const chopsticks = (x1, y1, x2, y2) =>
  tube(`M${x1} ${y1} L${x2} ${y2}`, '#b9864f', 10) + tube(`M${x1 + 35} ${y1 + 5} L${x2 + 30} ${y2 + 25}`, '#b9864f', 10);

const hairyBall = (cx, cy, r) => {
  let hairs = '';
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const x1 = cx + r * 0.9 * Math.cos(a), y1 = cy + r * 0.9 * Math.sin(a);
    const x2 = cx + (r + 48) * Math.cos(a + 0.18), y2 = cy + (r + 48) * Math.sin(a + 0.18);
    const qx = cx + (r + 30) * Math.cos(a - 0.05), qy = cy + (r + 30) * Math.sin(a - 0.05);
    hairs += tube(`M${x1.toFixed(1)} ${y1.toFixed(1)} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`, '#d6312b', 9, INK, 12);
    hairs += `<circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="5" fill="#7fb04a"/>`;
  }
  return hairs + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#d6312b" ${S}/>` +
    `<ellipse cx="${cx - r * 0.35}" cy="${cy - r * 0.4}" rx="${r * 0.22}" ry="${r * 0.12}" fill="#fff" opacity=".45" transform="rotate(-35 ${cx - r * 0.35} ${cy - r * 0.4})"/>`;
};

const durianShell = () => {
  const pts = [];
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const k = i % 2 ? 1.13 : 1;
    pts.push(`${(500 + 220 * k * Math.cos(a)).toFixed(1)} ${(560 + 250 * k * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(' L')}Z`;
};

const bold2 = {
  kolomee: `
    ${bowl('#c0392b')}
    <path d="M252 528 Q262 400 500 382 Q738 400 748 528 Q500 565 252 528Z" fill="#f6dd8a" ${S}/>
    <g fill="none" stroke="#d9a93a" stroke-width="8" stroke-linecap="round">
      <path d="M300 505 q25 -30 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0"/>
      <path d="M320 465 q25 -30 50 0 t50 0 t50 0 t50 0 t50 0 t50 0"/>
      <path d="M370 425 q25 -30 50 0 t50 0 t50 0 t50 0"/>
    </g>
    ${[[-14, 430, 400], [4, 500, 392], [20, 570, 408]].map(([a, x, y]) => `
    <g transform="rotate(${a} ${x} ${y})">
      <rect x="${x - 60}" y="${y - 24}" width="120" height="48" rx="12" fill="#b8452e" ${S} stroke-width="10"/>
      <rect x="${x - 48}" y="${y - 12}" width="96" height="24" rx="8" fill="#ec9a7c"/>
    </g>`).join('')}
    <g fill="#6cb34a" ${S} stroke-width="7">
      <circle cx="350" cy="470" r="12"/><circle cx="640" cy="460" r="12"/><circle cx="420" cy="500" r="10"/><circle cx="600" cy="505" r="10"/><circle cx="520" cy="470" r="9"/>
    </g>
    <path d="M640 520 Q700 420 760 450 Q740 520 640 520Z" fill="#4f9a3a" ${S} stroke-width="10"/>
    <path d="M650 515 Q700 470 745 455" fill="none" stroke="#8cc152" stroke-width="7"/>
    ${chopsticks(180, 280, 360, 500)}`,

  tehcspecial: `
    <ellipse cx="500" cy="815" rx="190" ry="34" fill="#8a5a3b" ${S}/>
    <path d="M370 250 L630 250 L595 800 Q500 820 405 800Z" fill="#ffffff" opacity=".35"/>
    <clipPath id="glass2"><path d="M373 300 L627 300 L595 800 Q500 820 405 800Z"/></clipPath>
    <g clip-path="url(#glass2)">
      <rect x="350" y="300" width="300" height="230" fill="#c96a2b"/>
      <path d="M350 530 q25 -14 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 L650 670 L350 670Z" fill="#f3e3c3"/>
      <path d="M350 670 q25 -14 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 L650 830 L350 830Z" fill="#7a3f17"/>
      <rect x="400" y="292" width="80" height="70" rx="12" fill="#fff" opacity=".55" transform="rotate(-12 440 327)" ${S} stroke-width="6"/>
      <rect x="500" y="300" width="74" height="66" rx="12" fill="#fff" opacity=".55" transform="rotate(10 537 333)" ${S} stroke-width="6"/>
    </g>
    ${tube('M550 330 L660 140', '#3d9a4f', 20)}
    <path d="M370 250 L630 250 L595 800 Q500 820 405 800Z" fill="none" ${S}/>
    <path d="M415 340 L435 760" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".7"/>
    <path d="M760 360 l0 40 M740 380 l40 0 M250 520 l0 30 M235 535 l30 0" stroke="#fff3da" stroke-width="10" stroke-linecap="round"/>`,

  manokpansuh: `
    <g transform="rotate(-18 500 450)">
      <rect x="420" y="180" width="160" height="520" rx="26" fill="#8cc152" ${S}/>
      <rect x="442" y="214" width="18" height="460" rx="9" fill="#b6dc7a"/>
      <path d="M420 600 L580 600 L580 680 Q580 700 560 700 L440 700 Q420 700 420 680Z" fill="#5b4637" opacity=".55"/>
      <path d="M420 330 L580 330 M420 480 L580 480 M420 620 L580 620" stroke="${INK}" stroke-width="10"/>
      <path d="M480 180 Q420 90 450 50 Q505 100 495 180Z" fill="#5aa14a" ${S} stroke-width="12"/>
      <path d="M515 182 Q560 80 615 90 Q585 150 535 186Z" fill="#6fb34f" ${S} stroke-width="12"/>
      <ellipse cx="500" cy="182" rx="80" ry="22" fill="#4f7f30" ${S} stroke-width="12"/>
      <rect x="420" y="180" width="160" height="520" rx="26" fill="none" ${S}/>
    </g>
    <path d="M370 790 Q345 690 420 620 Q412 700 465 710 Q455 610 525 545 Q525 650 575 665 Q585 610 615 600 Q650 690 630 790Z" fill="#e8662c" ${S}/>
    <path d="M440 790 Q430 730 470 695 Q480 745 510 745 Q520 690 555 670 Q585 740 565 790Z" fill="#f6c445"/>
    <g ${S}>
      <rect x="300" y="770" width="400" height="44" rx="22" fill="#8a5a3b" transform="rotate(10 500 792)"/>
      <rect x="300" y="770" width="400" height="44" rx="22" fill="#a8693a" transform="rotate(-10 500 792)"/>
    </g>
    <g fill="none" stroke="#fff3da" stroke-width="10" stroke-linecap="round">
      <path d="M690 260 q-25 -35 0 -70 q25 -35 0 -70"/><path d="M760 300 q-20 -30 0 -60"/>
    </g>`,

  midin: `
    ${tube('M470 840 Q450 650 470 470 Q490 330 420 300 Q350 290 350 360 Q355 420 410 410 Q440 400 430 370', '#5d9b36', 28)}
    ${tube('M510 840 Q520 620 560 440 Q590 300 670 300 Q740 310 730 380 Q720 430 670 420 Q640 410 650 380', '#6fb34f', 28)}
    ${tube('M490 840 Q480 600 515 330 Q535 200 600 195 Q655 198 650 248 Q645 285 608 280', '#7cc152', 26)}
    <g fill="#8cc152" ${S} stroke-width="8">
      <ellipse cx="430" cy="560" rx="34" ry="16" transform="rotate(-25 430 560)"/>
      <ellipse cx="500" cy="520" rx="30" ry="14" transform="rotate(20 500 520)"/>
      <ellipse cx="590" cy="560" rx="34" ry="16" transform="rotate(25 590 560)"/>
      <ellipse cx="445" cy="470" rx="28" ry="13" transform="rotate(-30 445 470)"/>
      <ellipse cx="530" cy="430" rx="26" ry="12" transform="rotate(25 530 430)"/>
    </g>
    <rect x="420" y="715" width="160" height="44" rx="14" fill="#c0392b" ${S} stroke-width="12"/>
    <path d="M440 737 l120 0" stroke="#f3d27a" stroke-width="8" stroke-dasharray="14 12"/>`,

  durian: `
    ${tube('M500 330 L500 240 Q505 205 545 200', '#7a5232', 22)}
    <path d="${durianShell()}" fill="#a7b83d" ${S}/>
    <g fill="none" stroke="#6f7f26" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
      ${range(5, r => range(5 - Math.abs(r - 2) + 2, c => {
        const n = 5 - Math.abs(r - 2) + 2;
        const x = 500 + (c - (n - 1) / 2) * 62;
        const y = 400 + r * 80;
        return `<path d="M${x - 18} ${y + 14} L${x} ${y - 16} L${x + 18} ${y + 14}"/>`;
      }))}
    </g>
    <ellipse cx="410" cy="430" rx="40" ry="22" fill="#fff" opacity=".3" transform="rotate(-40 410 430)"/>`,

  rambutan: `
    ${hairyBall(390, 520, 135)}
    ${hairyBall(625, 410, 110)}
    <path d="M520 700 Q530 820 640 830 Q750 820 760 700Z" fill="#d6312b" ${S}/>
    <ellipse cx="640" cy="670" rx="80" ry="95" fill="#f6f1e4" ${S}/>
    <ellipse cx="615" cy="630" rx="20" ry="34" fill="#fff" transform="rotate(-20 615 630)"/>
    <path d="M520 700 L760 700" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>`,

  terungdayak: `
    <circle cx="420" cy="520" r="200" fill="#f0a13a" ${S}/>
    <g fill="none" stroke="#d9822a" stroke-width="9" stroke-linecap="round">
      <path d="M300 420 Q260 540 320 650"/><path d="M540 420 Q580 540 520 660"/>
    </g>
    <ellipse cx="340" cy="430" rx="50" ry="26" fill="#fff" opacity=".45" transform="rotate(-40 340 430)"/>
    <path d="M420 330 L380 290 L340 330 L370 345 L330 380 L400 360 L420 400 L440 360 L510 380 L470 345 L500 330 L460 290Z" fill="#5d9b36" ${S} stroke-width="12"/>
    ${tube('M420 300 L430 230 Q440 200 470 205', '#7a5232', 18)}
    <circle cx="690" cy="700" r="130" fill="#f0a13a" ${S}/>
    <circle cx="690" cy="700" r="105" fill="#fbe7b0"/>
    <circle cx="690" cy="700" r="70" fill="none" stroke="#f3cf7a" stroke-width="10"/>
    <g fill="#c98a2a">${range(10, i => {
      const a = (i / 10) * Math.PI * 2;
      return `<ellipse cx="${(690 + 62 * Math.cos(a)).toFixed(1)}" cy="${(700 + 62 * Math.sin(a)).toFixed(1)}" rx="10" ry="6" transform="rotate(${(a * 180 / Math.PI).toFixed(0)} ${(690 + 62 * Math.cos(a)).toFixed(1)} ${(700 + 62 * Math.sin(a)).toFixed(1)})"/>`;
    })}</g>
    <circle cx="690" cy="700" r="18" fill="#f3cf7a"/>`,

  kuchingcat: `
    ${tube('M600 790 Q760 800 770 660 Q775 600 735 610', '#f0a04b', 40)}
    <path d="M370 380 L355 245 L465 320Z" fill="#f0a04b" ${S}/>
    <path d="M630 380 L645 245 L535 320Z" fill="#f0a04b" ${S}/>
    <path d="M380 340 L375 290 L420 318Z M620 340 L625 290 L580 318Z" fill="#f2a7a0"/>
    <path d="M380 820 Q330 640 420 560 L580 560 Q670 640 620 820Z" fill="#f0a04b" ${S}/>
    <ellipse cx="500" cy="720" rx="72" ry="90" fill="#fbe3c0"/>
    <ellipse cx="450" cy="815" rx="48" ry="26" fill="#f0a04b" ${S}/>
    <ellipse cx="550" cy="815" rx="48" ry="26" fill="#f0a04b" ${S}/>
    <ellipse cx="500" cy="450" rx="175" ry="148" fill="#f0a04b" ${S}/>
    <path d="M470 315 l0 40 M500 308 l0 46 M530 315 l0 40" stroke="#c96f22" stroke-width="12" stroke-linecap="round"/>
    <path d="M330 440 l40 6 M330 480 l40 -4 M670 440 l-40 6 M670 480 l-40 -4" stroke="#c96f22" stroke-width="10" stroke-linecap="round"/>
    <circle cx="438" cy="450" r="26" fill="${INK}"/><circle cx="562" cy="450" r="26" fill="${INK}"/>
    <circle cx="447" cy="440" r="9" fill="#fff"/><circle cx="571" cy="440" r="9" fill="#fff"/>
    <path d="M488 492 L512 492 L500 507Z" fill="#e0706a" ${S} stroke-width="6"/>
    <path d="M470 515 q15 20 30 0 q15 20 30 0" fill="none" ${S} stroke-width="8"/>
    <ellipse cx="400" cy="505" rx="26" ry="14" fill="#f2a7a0" opacity=".8"/><ellipse cx="600" cy="505" rx="26" ry="14" fill="#f2a7a0" opacity=".8"/>
    <path d="M395 575 Q500 625 605 575 L612 618 Q500 668 388 618Z" fill="#c0392b" ${S} stroke-width="12"/>
    <g fill="#fff3da">${[430, 470, 510, 550].map((x, i) => `<rect x="${x - 7}" y="${605 + (i === 0 || i === 3 ? -6 : 3)}" width="14" height="14" transform="rotate(45 ${x} ${612 + (i === 0 || i === 3 ? -6 : 3)})"/>`).join('')}</g>`,

  sunbear: `
    <circle cx="320" cy="290" r="62" fill="#2f2622" ${S}/><circle cx="320" cy="290" r="30" fill="#5b4637"/>
    <circle cx="680" cy="290" r="62" fill="#2f2622" ${S}/><circle cx="680" cy="290" r="30" fill="#5b4637"/>
    <path d="M280 880 Q270 700 500 690 Q730 700 720 880 Q500 920 280 880Z" fill="#2f2622" ${S}/>
    <path d="M360 760 Q500 860 640 760 Q620 830 500 868 Q380 830 360 760Z" fill="#f7e0a8" ${S} stroke-width="10"/>
    <circle cx="500" cy="470" r="220" fill="#2f2622" ${S}/>
    <ellipse cx="500" cy="550" rx="115" ry="88" fill="#e2b77a" ${S} stroke-width="12"/>
    <ellipse cx="500" cy="510" rx="42" ry="26" fill="${INK}"/>
    <ellipse cx="488" cy="502" rx="12" ry="6" fill="#fff" opacity=".6"/>
    <path d="M500 535 L500 570 M462 580 Q500 605 538 580" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
    <circle cx="415" cy="430" r="22" fill="#fff"/><circle cx="585" cy="430" r="22" fill="#fff"/>
    <circle cx="419" cy="433" r="14" fill="${INK}"/><circle cx="581" cy="433" r="14" fill="${INK}"/>
    <ellipse cx="375" cy="520" rx="26" ry="14" fill="#c86a5a" opacity=".7"/><ellipse cx="625" cy="520" rx="26" ry="14" fill="#c86a5a" opacity=".7"/>`,

  tarsier: `
    <rect x="620" y="90" width="64" height="840" rx="32" fill="#8a5a3b" ${S}/>
    <path d="M640 300 l25 -40 M650 700 l25 30" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
    ${tube('M520 770 Q470 900 360 905', '#9c6d42', 16)}
    <ellipse cx="560" cy="640" rx="105" ry="150" fill="#b98654" ${S}/>
    ${tube('M590 760 Q520 800 560 840 Q600 850 630 820', '#b98654', 34)}
    ${tube('M560 560 Q600 580 630 570', '#b98654', 30)}
    <path d="M630 555 l30 -10 M632 575 l32 0 M630 592 l28 10" stroke="#e8b58e" stroke-width="12" stroke-linecap="round"/>
    <path d="M630 808 l30 -12 M632 828 l32 2" stroke="#e8b58e" stroke-width="12" stroke-linecap="round"/>
    <ellipse cx="320" cy="280" rx="62" ry="88" fill="#c69563" ${S} transform="rotate(-30 320 280)"/>
    <ellipse cx="320" cy="280" rx="32" ry="55" fill="#e8b58e" transform="rotate(-30 320 280)"/>
    <ellipse cx="610" cy="270" rx="62" ry="88" fill="#c69563" ${S} transform="rotate(30 610 270)"/>
    <ellipse cx="610" cy="270" rx="32" ry="55" fill="#e8b58e" transform="rotate(30 610 270)"/>
    <circle cx="470" cy="420" r="168" fill="#c69563" ${S}/>
    <circle cx="398" cy="420" r="70" fill="#f2b134" ${S} stroke-width="12"/>
    <circle cx="545" cy="420" r="70" fill="#f2b134" ${S} stroke-width="12"/>
    <circle cx="400" cy="424" r="48" fill="${INK}"/><circle cx="543" cy="424" r="48" fill="${INK}"/>
    <circle cx="384" cy="404" r="15" fill="#fff"/><circle cx="527" cy="404" r="15" fill="#fff"/>
    <ellipse cx="471" cy="510" rx="12" ry="8" fill="${INK}"/>
    <path d="M445 540 Q471 556 497 540" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>`,

  pygmyelephant: `
    <g fill="#8f9aa6" ${S}>
      <rect x="370" y="620" width="82" height="180" rx="28"/><rect x="465" y="640" width="82" height="170" rx="28"/>
      <rect x="575" y="640" width="82" height="170" rx="28"/><rect x="665" y="620" width="82" height="180" rx="28"/>
    </g>
    <g fill="#e9e4da">${[411, 506, 616, 706].map(x => `<rect x="${x - 26}" y="${x === 411 || x === 706 ? 780 : 790}" width="52" height="14" rx="7"/>`).join('')}</g>
    ${tube('M740 560 Q790 590 785 640', '#8f9aa6', 10)}
    <ellipse cx="560" cy="560" rx="210" ry="155" fill="#8f9aa6" ${S}/>
    <path d="M500 460 Q560 440 620 470" fill="none" stroke="#7a8590" stroke-width="10" stroke-linecap="round"/>
    ${tube('M265 520 Q205 610 225 690 Q240 735 285 715', '#8f9aa6', 56)}
    <circle cx="350" cy="460" r="140" fill="#8f9aa6" ${S}/>
    <path d="M400 360 Q520 330 540 460 Q540 570 430 580 Q380 520 400 360Z" fill="#b4bcc6" ${S}/>
    <path d="M270 545 Q262 600 305 610" fill="none" stroke="#fffaf0" stroke-width="22" stroke-linecap="round"/>
    <path d="M270 545 Q262 600 305 610" fill="none" ${S} stroke-width="6"/>
    <circle cx="315" cy="440" r="16" fill="${INK}"/><circle cx="320" cy="434" r="5" fill="#fff"/>
    <ellipse cx="300" cy="500" rx="24" ry="13" fill="#e9a1a1" opacity=".8"/>
    <path d="M290 395 q20 -15 40 0" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`,

  birdwing: `
    ${[0, 1].map(m => `
    <g ${m ? 'transform="matrix(-1 0 0 1 1000 0)"' : ''}>
      <path d="M500 480 Q600 300 870 245 Q840 430 515 525Z" fill="${INK}" ${S}/>
      <path d="M548 468 Q650 375 815 295 L790 352 L758 345 L735 385 L705 377 L680 412 L652 405 L625 435 L598 432Z" fill="#3cc47a"/>
      <path d="M510 520 Q760 470 800 600 Q720 730 525 590Z" fill="${INK}" ${S}/>
      <path d="M560 560 Q670 520 735 575 L700 590 L690 620 L655 612 L640 640 Q590 610 560 560Z" fill="#3cc47a"/>
      <g fill="#fff3da"><circle cx="770" cy="640" r="7"/><circle cx="735" cy="675" r="7"/><circle cx="695" cy="700" r="6"/></g>
    </g>`).join('')}
    <ellipse cx="500" cy="540" rx="24" ry="120" fill="${INK}"/>
    <circle cx="500" cy="420" r="32" fill="#c0392b" ${S} stroke-width="10"/>
    <path d="M490 395 Q460 300 420 270 M510 395 Q540 300 580 270" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
    <circle cx="420" cy="270" r="12" fill="${INK}"/><circle cx="580" cy="270" r="12" fill="${INK}"/>`,

  crocodile: `
    <g fill="none" stroke="#fff3da" stroke-width="10" stroke-linecap="round">
      <path d="M160 760 q40 -16 80 0 t80 0 t80 0"/><path d="M560 780 q40 -16 80 0 t80 0 t80 0"/>
    </g>
    <g fill="#6aa84f" ${S}>
      <rect x="400" y="600" width="60" height="100" rx="22"/><rect x="620" y="600" width="60" height="100" rx="22"/>
    </g>
    <path d="M760 530 Q880 510 905 640 Q850 600 760 610Z" fill="#6aa84f" ${S}/>
    <ellipse cx="560" cy="570" rx="230" ry="88" fill="#6aa84f" ${S}/>
    <path d="M360 610 Q560 660 760 600" fill="none" stroke="#a9d27a" stroke-width="18" stroke-linecap="round"/>
    <g fill="#4f8a3a" ${S} stroke-width="8">${range(7, i => `<path d="M${410 + i * 50} 490 l22 -38 l22 38Z"/>`)}</g>
    <path d="M150 590 L330 600 Q350 650 280 655 L170 630 Q130 612 150 590Z" fill="#8cc152" ${S}/>
    <g fill="#fff">${range(6, i => `<path d="M${185 + i * 25} 588 l10 18 l10 -18Z"/>`)}</g>
    <path d="M380 520 Q330 460 260 490 L150 535 Q120 560 150 590 L345 605Z" fill="#6aa84f" ${S}/>
    <circle cx="170" cy="530" r="16" fill="#6aa84f" ${S} stroke-width="8"/>
    <circle cx="320" cy="470" r="42" fill="#6aa84f" ${S}/>
    <circle cx="322" cy="466" r="24" fill="#fff"/>
    <ellipse cx="325" cy="467" rx="7" ry="16" fill="${INK}"/>
    <path d="M330 600 Q300 575 270 590" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`,

  gong: `
    <g fill="#8a5a3b" ${S}>
      <rect x="250" y="270" width="44" height="560" rx="10"/><rect x="706" y="270" width="44" height="560" rx="10"/>
      <rect x="205" y="810" width="134" height="36" rx="12"/><rect x="661" y="810" width="134" height="36" rx="12"/>
    </g>
    <path d="M190 245 Q200 205 240 230 Q500 195 760 230 Q800 205 810 245 Q800 290 770 280 Q500 245 230 280 Q200 290 190 245Z" fill="#a8693a" ${S}/>
    <path d="M430 262 L445 360 M570 262 L555 360" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
    <circle cx="500" cy="550" r="195" fill="#d9a43a" ${S}/>
    <circle cx="500" cy="550" r="162" fill="none" stroke="#b07f22" stroke-width="10"/>
    <circle cx="500" cy="550" r="110" fill="none" stroke="#f2c95f" stroke-width="10"/>
    <circle cx="500" cy="550" r="56" fill="#f2c95f" ${S} stroke-width="12"/>
    <path d="M400 430 Q440 395 490 390" fill="none" stroke="#fff6d8" stroke-width="12" stroke-linecap="round" opacity=".8"/>
    <circle cx="485" cy="533" r="14" fill="#fff6d8" opacity=".8"/>
    ${tube('M560 880 L800 862', '#a8693a', 16)}
    <ellipse cx="545" cy="882" rx="42" ry="30" fill="#c0392b" ${S} stroke-width="12"/>`,

  pangolin: `
    <g fill="#e2b98e" ${S}>
      <rect x="320" y="650" width="62" height="100" rx="22"/><rect x="640" y="650" width="62" height="100" rx="22"/>
    </g>
    <path d="M325 742 l-12 18 M345 745 l-4 20 M365 742 l4 18 M645 742 l-12 18 M665 745 l-4 20 M685 742 l4 18" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
    <clipPath id="pang"><path d="M260 690 Q270 430 520 410 Q760 420 800 620 Q860 700 920 690 Q880 770 780 730 Q740 700 700 690Z"/></clipPath>
    <path d="M260 690 Q270 430 520 410 Q760 420 800 620 Q860 700 920 690 Q880 770 780 730 Q740 700 700 690Z" fill="#b5814f"/>
    <g clip-path="url(#pang)" fill="none" stroke="#7a5232" stroke-width="9" stroke-linecap="round">
      ${range(7, r => range(12, c => `<path d="M${230 + c * 60 + (r % 2) * 30} ${430 + r * 45} q30 40 60 0"/>`))}
    </g>
    <path d="M260 690 Q270 430 520 410 Q760 420 800 620 Q860 700 920 690 Q880 770 780 730 Q740 700 700 690Z" fill="none" ${S}/>
    <path d="M300 590 Q200 590 130 655 Q200 700 300 690Z" fill="#e2b98e" ${S}/>
    <circle cx="235" cy="628" r="10" fill="${INK}"/>
    <path d="M260 690 L700 690" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>`,
};

const vintage2 = {
  tajau: `
    <ellipse cx="500" cy="805" rx="230" ry="28" fill="#cdbb9c" opacity=".7"/>
    <path d="M430 240 L570 240 L575 285 Q720 335 722 520 Q722 720 600 800 L400 800 Q278 720 278 520 Q280 335 425 285Z" fill="#7a5a3e" ${V}/>
    <rect x="410" y="218" width="180" height="34" rx="10" fill="#7a5a3e" ${V}/>
    <path d="M425 285 Q500 300 575 285" fill="none" ${V} stroke-width="6"/>
    <g fill="none" ${V} stroke-width="9">
      <path d="M345 345 q-38 -2 -32 34 q6 28 40 16"/><path d="M655 345 q38 -2 32 34 q-6 28 -40 16"/>
    </g>
    <path d="M290 460 Q500 505 710 460 L716 575 Q500 620 284 575Z" fill="#c99a3a" ${V}/>
    <g fill="none" stroke="${VINK}" stroke-width="6" stroke-linecap="round">
      ${range(5, i => { const x = 335 + i * 82; return `<path d="M${x} ${545} q0 -50 35 -45 q30 5 20 30 q-8 18 -25 8"/>`; })}
    </g>
    <path d="M330 660 Q500 700 670 660" fill="none" stroke="#e6d3a8" stroke-width="6" stroke-dasharray="20 14"/>
    <path d="M360 720 Q500 750 640 720" fill="none" stroke="#e6d3a8" stroke-width="6"/>
    <path d="M340 360 Q320 420 330 470" fill="none" stroke="#a88a66" stroke-width="10" stroke-linecap="round"/>`,

  sumpit: `
    <path d="M240 830 L760 175" stroke="${VINK}" stroke-width="34" stroke-linecap="round"/>
    <path d="M240 830 L760 175" stroke="#a0613d" stroke-width="20" stroke-linecap="round"/>
    <path d="M748 192 L818 98 L772 205Z" fill="#cfc6b2" ${V} stroke-width="8"/>
    <g ${V} stroke-width="6"><path d="M725 205 l25 20 M712 222 l25 20 M699 239 l25 20"/></g>
    <circle cx="245" cy="826" r="22" fill="#5a3b2a"/>
    <g transform="rotate(12 600 640)">
      <path d="M620 470 Q600 400 640 380 Q690 365 700 420 L710 470Z" fill="#a0613d" ${V}/>
      <rect x="560" y="470" width="160" height="320" rx="34" fill="#c99a3a" ${V}/>
      <g stroke="${VINK}" stroke-width="5">${range(6, i => `<path d="M562 ${530 + i * 42} L718 ${530 + i * 42}"/>`)}</g>
      <path d="M560 600 L720 600 L720 650 L560 650Z" fill="#a8432a"/>
      ${range(5, i => `<path d="M${570 + i * 30} 650 l15 -26 l15 26Z" fill="#2f2620"/>`)}
      <rect x="560" y="470" width="160" height="320" rx="34" fill="none" ${V}/>
    </g>
    <path d="M560 500 Q470 560 500 700" fill="none" stroke="#7a4527" stroke-width="12" stroke-linecap="round"/>
    <g ${V} stroke-width="6"><path d="M250 520 L420 460"/><path d="M265 560 L435 500"/></g>
    <path d="M232 532 l22 -18 l-4 26Z M247 572 l22 -18 l-4 26Z" fill="#e6d3a8" ${V} stroke-width="5"/>`,

  manik: `
    ${(() => {
      const cols = ['#a0613d', '#c99a3a', '#2f2620', '#e6d3a8', '#6e7f63', '#a8432a'];
      let out = '';
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        out += `<circle cx="${(500 + 230 * Math.cos(a)).toFixed(1)}" cy="${(430 + 210 * Math.sin(a)).toFixed(1)}" r="17" fill="${cols[i % 6]}" ${V} stroke-width="5"/>`;
      }
      const pal = ['#c99a3a', '#2f2620', '#a8432a', '#e6d3a8'];
      for (let r = 0; r < 6; r++) {
        const n = 7 - r;
        for (let c = 0; c < n; c++) {
          const x = 500 + (c - (n - 1) / 2) * 36, y = 660 + r * 32;
          out += `<circle cx="${x}" cy="${y}" r="15" fill="${pal[(r + Math.abs(c - (n - 1) / 2)) % 4 | 0]}" ${V} stroke-width="4"/>`;
        }
      }
      return out;
    })()}
    <g ${V} stroke-width="5">${range(5, i => `<path d="M${456 + i * 22} 830 l0 ${50 + (i % 2) * 20}"/>`)}</g>
    <g fill="#a0613d">${range(5, i => `<circle cx="${456 + i * 22}" cy="${885 + (i % 2) * 20}" r="7"/>`)}</g>`,

  ingan: `
    <path d="M375 330 Q290 520 385 720" fill="none" stroke="#7a4527" stroke-width="20" stroke-linecap="round"/>
    <clipPath id="ing"><path d="M350 300 L650 300 L620 780 Q500 810 380 780Z"/></clipPath>
    <path d="M350 300 L650 300 L620 780 Q500 810 380 780Z" fill="#d9b98a"/>
    <g clip-path="url(#ing)" stroke="#a07a4a" stroke-width="4">
      ${range(22, i => `<path d="M${200 + i * 30} 300 l300 520"/><path d="M${800 - i * 30} 300 l-300 520"/>`)}
      <path d="M340 420 L660 420 L660 490 L340 490Z" fill="#e6d3a8" stroke="none"/>
      ${range(9, i => `<path d="M${350 + i * 35} 488 l17 -60 l18 60Z" fill="#5a3b2a" stroke="none"/>`)}
      <path d="M340 620 L660 620 L660 660 L340 660Z" fill="#a8432a" stroke="none"/>
    </g>
    <path d="M350 300 L650 300 L620 780 Q500 810 380 780Z" fill="none" ${V}/>
    <rect x="335" y="282" width="330" height="36" rx="12" fill="#a0613d" ${V}/>
    <g fill="#7a4527" ${V} stroke-width="7"><rect x="395" y="785" width="34" height="40" rx="6"/><rect x="571" y="785" width="34" height="40" rx="6"/></g>`,

  bubu: `
    <path d="M220 420 Q195 520 220 620 L805 545 Q825 520 805 495Z" fill="#d9b98a" ${V}/>
    <g stroke="#a07a4a" stroke-width="4">
      <path d="M230 450 L805 505 M226 485 L805 512 M224 520 L805 520 M226 555 L805 528 M230 590 L805 535"/>
    </g>
    <g fill="none" ${V} stroke-width="7">
      <path d="M335 425 Q320 520 335 610"/><path d="M450 445 Q438 520 450 595"/>
      <path d="M565 465 Q556 520 565 580"/><path d="M680 482 Q673 520 680 562"/>
    </g>
    <ellipse cx="222" cy="520" rx="44" ry="102" fill="#a0613d" ${V}/>
    <ellipse cx="230" cy="520" rx="22" ry="52" fill="#5a3b2a"/>
    <path d="M805 495 L850 505 L850 535 L805 545" fill="#7a4527" ${V}/>
    <path d="M520 730 q40 -40 100 -10 q-50 40 -100 10Z M520 730 l-30 -20 l0 40Z" fill="#7aa0a0" ${V} stroke-width="7"/>
    <circle cx="595" cy="722" r="5" fill="${VINK}"/>
    <g fill="none" stroke="#7aa0a0" stroke-width="8" stroke-linecap="round">
      <path d="M170 790 q40 -14 80 0 t80 0"/><path d="M640 800 q40 -14 80 0 t80 0"/>
    </g>`,

  baruk: `
    <path d="M140 790 Q500 770 860 790" fill="none" ${V}/>
    <g ${V}>${[340, 400, 460, 540, 600, 660].map(x => `<line x1="${x}" y1="630" x2="${x}" y2="780"/>`).join('')}</g>
    <path d="M290 600 L710 600 L710 640 L290 640Z" fill="#b98a5a" ${V}/>
    <path d="M335 470 L665 470 L665 600 L335 600Z" fill="#d9b98a" ${V}/>
    <g stroke="${VINK}" stroke-width="5">${range(7, i => `<line x1="${370 + i * 42}" y1="480" x2="${370 + i * 42}" y2="592"/>`)}</g>
    <rect x="465" y="510" width="70" height="90" fill="#5a3b2a"/>
    <path d="M280 490 L500 220 L720 490 Q500 525 280 490Z" fill="#a0613d" ${V}/>
    <g stroke="#7a4527" stroke-width="5">${range(7, i => `<line x1="500" y1="240" x2="${310 + i * 63}" y2="${492 + (i === 0 || i === 6 ? -6 : 8)}"/>`)}</g>
    <path d="M280 490 L500 220 L720 490 Q500 525 280 490Z" fill="none" ${V}/>
    <path d="M560 380 L640 330 L655 420Z" fill="#c99a3a" ${V} stroke-width="8"/>
    <path d="M600 410 L640 360" ${V} stroke-width="6"/>
    <path d="M500 220 L500 175 M485 185 L515 185" ${V}/>
    <path d="M760 790 L700 640" ${V} stroke-width="14"/>
    <g ${V} stroke-width="6"><line x1="743" y1="750" x2="761" y2="743"/><line x1="729" y1="715" x2="747" y2="708"/><line x1="715" y1="680" x2="733" y2="673"/></g>
    <g fill="#7a8a4a" ${V} stroke-width="7">
      <path d="M200 790 q-30 -80 10 -130 q30 60 -10 130Z"/><path d="M200 790 q10 -90 60 -110 q0 70 -60 110Z"/><path d="M200 790 q-40 -50 -90 -50 q20 50 90 50Z"/>
    </g>`,

  tambang: `
    <circle cx="700" cy="300" r="85" fill="#d99a4e" opacity=".85"/>
    <path d="M120 560 L880 560" stroke="#a99780" stroke-width="6" stroke-linecap="round"/>
    <path d="M300 600 L300 480 M700 600 L700 480 M500 600 L500 470" ${V}/>
    <path d="M300 520 L700 520 L700 600 L300 600Z" fill="#e6d3a8" ${V}/>
    <g fill="#5a3b2a">${range(4, i => `<rect x="${330 + i * 95}" y="535" width="60" height="40" rx="6"/>`)}</g>
    <path d="M265 490 Q500 420 735 490 L735 512 Q500 445 265 512Z" fill="#6e7f63" ${V}/>
    <path d="M170 610 Q240 595 830 595 Q850 615 805 660 Q500 690 230 660Z" fill="#a0613d" ${V}/>
    <path d="M215 630 Q500 650 820 625" fill="none" stroke="#e6d3a8" stroke-width="8"/>
    <path d="M790 600 L840 560 L860 575 L820 615" fill="#5a3b2a" ${V} stroke-width="7"/>
    <g fill="none" stroke="#7aa0a0" stroke-width="8" stroke-linecap="round">
      <path d="M160 710 q40 -14 80 0 t80 0"/><path d="M560 720 q40 -14 80 0 t80 0"/><path d="M360 760 q40 -14 80 0"/>
    </g>`,

  bakostack: `
    <circle cx="300" cy="300" r="70" fill="#d99a4e" opacity=".85"/>
    <path d="M120 700 L880 700" stroke="#7aa0a0" stroke-width="8" stroke-linecap="round"/>
    <path d="M420 700 L445 565 Q380 525 360 450 Q378 385 470 392 Q540 362 622 402 Q685 435 652 505 Q605 545 562 565 L585 700Z" fill="#a0613d" ${V}/>
    <g fill="none" stroke="#7a4527" stroke-width="6" stroke-linecap="round">
      <path d="M380 470 Q500 500 640 470"/><path d="M400 510 Q500 535 610 515"/><path d="M455 600 Q510 610 565 600"/><path d="M450 650 Q510 660 575 650"/>
    </g>
    <path d="M360 452 Q370 400 420 395 Q440 360 490 375 Q520 350 560 370 Q610 365 625 400 Q600 420 560 412 Q500 420 460 412 Q410 425 360 452Z" fill="#7a8a4a" ${V} stroke-width="8"/>
    <path d="M380 700 q30 -40 70 -20 q20 -20 40 20Z M560 700 q20 -30 50 -10 q30 -10 40 10Z" fill="#8f8577" ${V} stroke-width="7"/>
    <g fill="none" stroke="#7aa0a0" stroke-width="8" stroke-linecap="round">
      <path d="M170 750 q40 -14 80 0 t80 0"/><path d="M600 760 q40 -14 80 0 t80 0"/><path d="M380 800 q40 -14 80 0 t80 0"/>
    </g>
    <g fill="none" ${V} stroke-width="6"><path d="M690 280 q15 -15 30 0 q15 -15 30 0"/><path d="M740 330 q12 -12 24 0 q12 -12 24 0"/></g>`,

  mulucave: `
    <path d="M110 800 L150 520 Q250 390 420 370 Q600 340 760 430 Q880 500 890 800Z" fill="#a99780" ${V}/>
    <g fill="#7a8a4a" ${V} stroke-width="7">
      <path d="M180 470 q20 -50 60 -30 q30 -40 70 -10 q30 -20 50 10 Q260 470 180 470Z"/>
      <path d="M640 400 q20 -40 60 -20 q30 -30 60 0 q20 0 30 25 Q720 420 640 400Z"/>
    </g>
    <path d="M200 620 Q260 590 300 640 M700 600 Q760 580 800 630" fill="none" stroke="#7a6a58" stroke-width="7" stroke-linecap="round"/>
    <path d="M330 800 Q340 570 500 545 Q660 570 670 800Z" fill="#3e3029" ${V}/>
    <g fill="${VINK}">
      ${(() => {
        let out = '';
        for (let i = 0; i < 34; i++) {
          const t = i / 34;
          const x = 500 + 220 * t * Math.cos(t * 9) + 120 * t;
          const y = 600 - 480 * t;
          const s = 0.6 + t * 0.8;
          out += `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})" d="M-18 0 Q-9 -10 0 0 Q9 -10 18 0 Q9 -3 0 6 Q-9 -3 -18 0Z"/>`;
        }
        return out;
      })()}
    </g>`,

  buttresstree: `
    <path d="M120 770 L880 770" ${V}/>
    <path d="M460 360 L540 360 L555 640 Q620 700 770 765 L230 765 Q380 700 445 640Z" fill="#a0613d" ${V}/>
    <g fill="none" stroke="#7a4527" stroke-width="7" stroke-linecap="round">
      <path d="M470 640 Q420 700 330 760"/><path d="M500 650 L500 760"/><path d="M530 640 Q580 700 670 760"/><path d="M480 420 L485 600 M520 420 L515 600"/>
    </g>
    ${(() => {
      const c = [[370, 300, 115], [500, 230, 140], [630, 300, 115], [440, 360, 95], [565, 365, 95], [290, 360, 70], [710, 360, 70]];
      return `<g stroke="${VINK}" stroke-width="20">${c.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>` +
        `<g fill="#7a8a4a">${c.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>` +
        `<g fill="none" stroke="#5f6e3a" stroke-width="6" stroke-linecap="round"><path d="M420 250 q30 -30 60 -10"/><path d="M560 210 q30 -20 50 10"/><path d="M330 330 q20 -20 40 0"/><path d="M640 330 q20 -20 40 0"/></g>`;
    })()}
    <g fill="#7a8a4a" ${V} stroke-width="6">
      <path d="M180 770 q-10 -70 30 -100 q10 60 -30 100Z"/><path d="M180 770 q20 -60 70 -70 q-20 50 -70 70Z"/>
      <path d="M820 770 q10 -70 -30 -100 q-10 60 30 100Z"/><path d="M820 770 q-20 -60 -70 -70 q20 50 70 70Z"/>
    </g>`,

  waterfall: `
    <path d="M430 210 L570 210 L590 720 L410 720Z" fill="#b9d3cf" ${V}/>
    <g stroke="#f4efe4" stroke-width="7" stroke-linecap="round">${range(5, i => `<path d="M${450 + i * 25} ${240 + (i % 2) * 40} L${447 + i * 27} ${690 - (i % 2) * 50}"/>`)}</g>
    <path d="M120 760 L130 300 Q230 230 320 260 L430 210 L410 720 Q300 740 200 780Z" fill="#a99780" ${V}/>
    <path d="M880 760 L870 320 Q780 240 680 270 L570 210 L590 720 Q700 740 800 780Z" fill="#a99780" ${V}/>
    <g fill="none" stroke="#7a6a58" stroke-width="7" stroke-linecap="round"><path d="M200 400 L330 420 M220 540 L360 560"/><path d="M800 420 L670 440 M790 560 L650 580"/></g>
    <ellipse cx="500" cy="760" rx="270" ry="64" fill="#8fb3b0" ${V}/>
    <g fill="#f4efe4" ${V} stroke-width="6"><circle cx="440" cy="725" r="16"/><circle cx="500" cy="715" r="20"/><circle cx="560" cy="728" r="15"/></g>
    <g fill="#7a8a4a" ${V} stroke-width="7">
      <path d="M140 300 q20 -60 70 -50 q30 -40 80 -10 q40 0 30 20 Q220 280 140 300Z"/>
      <path d="M690 270 q30 -50 80 -30 q30 -20 60 10 q30 10 20 30 Q760 270 690 270Z"/>
      <path d="M260 800 q-10 -60 30 -90 q10 50 -30 90Z M740 800 q10 -60 -30 -90 q-10 50 30 90Z"/>
    </g>`,

  seaturtle: `
    <g fill="#9aa56a" ${V}>
      <path d="M380 400 Q250 330 180 380 Q260 440 370 470Z"/><path d="M620 400 Q750 330 820 380 Q740 440 630 470Z"/>
      <path d="M400 620 Q330 680 310 740 Q380 720 430 660Z"/><path d="M600 620 Q670 680 690 740 Q620 720 570 660Z"/>
      <path d="M485 690 L500 740 L515 690Z"/>
      <ellipse cx="500" cy="280" rx="55" ry="66"/>
    </g>
    <circle cx="478" cy="265" r="8" fill="${VINK}"/><circle cx="522" cy="265" r="8" fill="${VINK}"/>
    <ellipse cx="500" cy="500" rx="165" ry="205" fill="#a0794a" ${V}/>
    <g fill="none" stroke="${VINK}" stroke-width="7" stroke-linejoin="round">
      <path d="M460 360 L540 360 L565 420 L540 480 L460 480 L435 420Z"/>
      <path d="M460 480 L540 480 L565 540 L540 600 L460 600 L435 540Z"/>
      <path d="M435 420 L360 400 M435 540 L345 545 M460 600 L400 660 M565 420 L640 400 M565 540 L655 545 M540 600 L600 660 M460 360 L430 310 M540 360 L570 310"/>
    </g>
    <g fill="none" stroke="#7aa0a0" stroke-width="7"><circle cx="760" cy="230" r="14"/><circle cx="800" cy="180" r="9"/><circle cx="230" cy="700" r="12"/></g>`,

  dolphin: `
    <path d="M330 690 Q390 470 570 430 Q700 405 772 482 Q802 530 765 562 Q725 585 665 563 Q570 560 480 610 Q410 650 375 710Z" fill="#9aa3a6" ${V}/>
    <path d="M440 625 Q560 560 690 575" fill="none" stroke="#d6dadb" stroke-width="14" stroke-linecap="round"/>
    <path d="M520 445 Q555 380 595 435Z" fill="#9aa3a6" ${V}/>
    <path d="M640 570 Q630 630 585 645 Q598 600 612 568Z" fill="#9aa3a6" ${V}/>
    <path d="M378 705 Q310 715 285 760 Q335 748 355 728 Q362 772 405 790 Q398 740 385 712Z" fill="#9aa3a6" ${V}/>
    <circle cx="720" cy="490" r="9" fill="${VINK}"/>
    <path d="M745 535 Q760 540 772 532" fill="none" ${V} stroke-width="6"/>
    <g fill="none" stroke="#7aa0a0" stroke-width="9" stroke-linecap="round">
      <path d="M150 770 q40 -16 80 0 t80 0 t80 0"/><path d="M560 760 q40 -16 80 0 t80 0 t80 0"/><path d="M380 830 q40 -16 80 0 t80 0"/>
    </g>
    <g fill="#7aa0a0"><circle cx="270" cy="720" r="9"/><circle cx="250" cy="690" r="6"/><circle cx="430" cy="760" r="8"/></g>`,

  pepper: `
    <path d="M150 220 Q400 260 520 400 Q620 520 860 560" fill="none" ${V} stroke-width="14"/>
    ${[[300, 250, -20, 1], [480, 360, 40, 1.1], [640, 490, -10, 1], [790, 540, 50, 0.9]].map(([x, y, a, s]) => `
    <g transform="translate(${x} ${y}) rotate(${a}) scale(${s})">
      <path d="M0 0 Q70 -35 90 30 Q70 100 0 140 Q-70 100 -90 30 Q-70 -35 0 0Z" fill="#7a8a4a" ${V} stroke-width="8"/>
      <path d="M0 10 L0 125 M0 50 L-40 25 M0 50 L40 25 M0 85 L-45 65 M0 85 L45 65" fill="none" stroke="#5f6e3a" stroke-width="5"/>
    </g>`).join('')}
    ${[[400, 300, '#a8432a'], [560, 440, '#6e7f63'], [720, 525, '#a8432a']].map(([x, y, c]) => `
    <path d="M${x} ${y} Q${x - 20} ${y + 120} ${x + 10} ${y + 260}" fill="none" ${V} stroke-width="6"/>
    ${range(10, i => {
      const t = i / 9;
      const cx = x - 10 * Math.sin(t * 3) + (i % 2 ? 14 : -14);
      const cy = y + 30 + t * 220;
      return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="13" fill="${i < 3 && c === '#6e7f63' ? '#a8432a' : c}" ${V} stroke-width="4"/>`;
    })}`).join('')}`,

  kinabalu: `
    <circle cx="720" cy="270" r="80" fill="#d99a4e" opacity=".85"/>
    <path d="M110 760 L250 560 L300 590 L380 420 L420 460 L470 330 L510 380 L545 300 L585 370 L625 340 L685 470 L725 440 L800 600 L890 760Z" fill="#8f8577" ${V}/>
    <g fill="none" stroke="#b3aa9b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M470 330 L455 430 L480 520"/><path d="M545 300 L560 400 L540 480"/><path d="M625 340 L615 430"/><path d="M380 420 L395 520"/>
    </g>
    <path d="M160 590 Q200 550 250 570 Q290 540 340 570 Q380 560 400 590Z" fill="#f4efe4" ${V} stroke-width="7"/>
    <path d="M620 560 Q660 520 710 540 Q760 520 800 550 Q840 550 850 580 L620 580Z" fill="#f4efe4" ${V} stroke-width="7"/>
    <path d="M100 760 Q300 640 500 720 Q700 640 900 760 L900 800 L100 800Z" fill="#7a8a4a" ${V}/>
    <g fill="none" stroke="#5f6e3a" stroke-width="6" stroke-linecap="round"><path d="M250 730 q20 -20 40 0"/><path d="M650 720 q20 -20 40 0"/></g>`,
};

module.exports = { bold2, vintage2 };
