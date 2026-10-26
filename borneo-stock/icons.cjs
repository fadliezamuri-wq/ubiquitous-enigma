// Borneo / Sarawak icon set. Each icon is drawn on a 1000x1000 canvas.
const INK = '#2a1a12';
const S = `stroke="${INK}" stroke-width="16" stroke-linejoin="round" stroke-linecap="round"`;
const VINK = '#5a3b2a';
const V = `stroke="${VINK}" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"`;

const bold = {
  hornbill: `
    <path d="M150 742 Q500 722 860 752 Q880 772 860 792 Q500 770 150 790 Q132 766 150 742Z" fill="#8a5a3b" ${S}/>
    <path d="M800 750 q40 -60 90 -50 q-20 50 -90 50Z" fill="#7fb04a" ${S}/>
    <path d="M330 620 L230 870 L320 892 L400 670Z" fill="#fffaf0" ${S}/>
    <path d="M258 800 L344 822 L320 892 L230 870Z" fill="${INK}" ${S}/>
    <ellipse cx="420" cy="560" rx="130" ry="180" transform="rotate(-28 420 560)" fill="${INK}" ${S}/>
    <path d="M330 470 Q300 600 380 690" fill="none" stroke="#5b4637" stroke-width="12" stroke-linecap="round"/>
    <path d="M300 520 Q290 600 330 660" fill="none" stroke="#5b4637" stroke-width="12" stroke-linecap="round"/>
    <path d="M470 660 Q540 690 500 750 Q440 750 440 700Z" fill="#fffaf0" ${S}/>
    <path d="M440 742 l-14 26 M462 744 l0 28 M484 742 l14 26" stroke="#f2b134" stroke-width="12" stroke-linecap="round"/>
    <circle cx="540" cy="360" r="92" fill="${INK}" ${S}/>
    <path d="M592 318 Q760 352 870 505 Q740 452 596 412Z" fill="#f7ecc0" ${S}/>
    <path d="M596 318 Q680 336 730 380 L600 375Z" fill="#f2b134"/>
    <path d="M592 318 Q760 352 870 505 Q740 452 596 412Z" fill="none" ${S}/>
    <path d="M582 312 Q612 240 712 250 Q790 255 832 205 Q850 298 762 322 Q680 336 600 326Z" fill="#e65a2a" ${S}/>
    <path d="M640 285 Q720 290 790 262" fill="none" stroke="#f2b134" stroke-width="10" stroke-linecap="round"/>
    <circle cx="560" cy="350" r="30" fill="#d9452b"/>
    <circle cx="560" cy="350" r="20" fill="#fff"/>
    <circle cx="564" cy="352" r="10" fill="${INK}"/>
    <circle cx="555" cy="343" r="5" fill="#fff"/>`,

  sape: `
    <g transform="rotate(-20 500 500)">
      <path d="M440 245 Q438 150 495 110 Q560 70 572 140 Q548 128 528 150 Q562 180 560 245Z" fill="#b5652e" ${S}/>
      <circle cx="532" cy="118" r="12" fill="#f3e2b8" ${S} stroke-width="8"/>
      <path d="M415 245 Q500 215 585 245 L605 770 Q605 845 500 852 Q395 845 395 770Z" fill="#c9783a" ${S}/>
      <path d="M440 300 L560 300 L572 760 Q570 800 500 805 Q430 800 428 760Z" fill="#a85a28"/>
      <g fill="none" stroke="#fff3da" stroke-width="11" stroke-linecap="round">
        <path d="M500 330 q-50 20 -40 70 q10 40 50 25 q30 -15 10 -40"/>
        <path d="M500 330 q50 20 40 70 q-10 40 -50 25"/>
        <path d="M470 470 q-30 40 0 80 q40 30 60 -10 q10 -30 -20 -35"/>
        <path d="M530 470 q30 40 0 80"/>
        <path d="M500 590 q-60 30 -40 90 q20 40 60 20 q20 -20 0 -40"/>
        <path d="M500 590 q60 30 40 90 q-20 40 -60 20"/>
        <path d="M455 720 q45 40 90 0"/>
      </g>
      <g fill="#f3e2b8" ${S} stroke-width="6">
        <rect x="474" y="255" width="52" height="14" rx="4"/>
        <rect x="476" y="285" width="48" height="14" rx="4"/>
        <rect x="472" y="770" width="56" height="18" rx="5"/>
      </g>
      <g stroke="#f7ecc0" stroke-width="4">
        <line x1="484" y1="160" x2="484" y2="780"/>
        <line x1="500" y1="160" x2="500" y2="780"/>
        <line x1="516" y1="160" x2="516" y2="780"/>
      </g>
    </g>
        <path d="M745 220 q25 -10 30 15 l0 70 M775 235 l40 -12 l0 60" fill="none" ${S} stroke-width="12"/>
    <circle cx="760" cy="305" r="16" fill="${INK}"/><circle cx="800" cy="290" r="16" fill="${INK}"/>`,

  pitcher: `
    <path d="M520 780 Q600 860 700 830 Q780 800 760 740" fill="none" ${S} stroke-width="14"/>
    <path d="M760 740 Q800 610 700 560 Q600 640 640 760 Q690 800 760 740Z" fill="#6aa043" ${S}/>
    <path d="M705 575 Q690 680 745 745" fill="none" stroke="#4f7f30" stroke-width="10" stroke-linecap="round"/>
    <path d="M410 390 Q350 600 425 770 Q500 830 575 770 Q650 600 590 390Z" fill="#8cc152" ${S}/>
    <path d="M440 470 Q420 620 455 760" fill="none" stroke="#c2413a" stroke-width="12" stroke-linecap="round" stroke-dasharray="2 26"/>
    <path d="M560 470 Q580 620 545 760" fill="none" stroke="#c2413a" stroke-width="12" stroke-linecap="round" stroke-dasharray="2 26"/>
    <g fill="#c2413a"><circle cx="480" cy="520" r="14"/><circle cx="520" cy="600" r="11"/><circle cx="490" cy="680" r="13"/><circle cx="530" cy="460" r="9"/><circle cx="525" cy="730" r="9"/><circle cx="470" cy="610" r="8"/></g>
    <ellipse cx="500" cy="392" rx="102" ry="36" fill="#b8323a" ${S}/>
    <ellipse cx="500" cy="394" rx="70" ry="18" fill="#4a1a17"/>
    <path d="M430 365 Q480 250 610 290 Q640 330 600 360 Q520 340 430 365Z" fill="#9ccc5f" ${S}/>
    <g fill="#c2413a"><circle cx="520" cy="310" r="10"/><circle cx="565" cy="320" r="8"/><circle cx="485" cy="335" r="7"/></g>
    <path d="M610 290 Q660 250 700 280" fill="none" ${S} stroke-width="12"/>`,

  orangutan: `
    <path d="M500 175 Q560 140 600 190 Q680 170 700 250 Q790 290 770 400 Q840 500 770 600 Q780 720 660 760 Q580 830 500 820 Q420 830 340 760 Q220 720 230 600 Q160 500 230 400 Q210 290 300 250 Q320 170 400 190 Q440 140 500 175Z" fill="#c4561f" ${S}/>
    <path d="M440 200 q20 -40 50 -30 M520 190 q30 -30 60 -10" fill="none" ${S} stroke-width="12"/>
    <circle cx="245" cy="500" r="45" fill="#e7b48a" ${S}/>
    <circle cx="755" cy="500" r="45" fill="#e7b48a" ${S}/>
    <path d="M500 330 Q560 290 620 330 Q690 380 660 470 Q650 520 600 540 Q690 600 640 690 Q580 760 500 760 Q420 760 360 690 Q310 600 400 540 Q350 520 340 470 Q310 380 380 330 Q440 290 500 330Z" fill="#e7b48a" ${S}/>
    <path d="M330 300 Q420 250 500 330 Q580 250 670 300" fill="none" ${S} stroke-width="12"/>
    <circle cx="430" cy="440" r="30" fill="${INK}"/><circle cx="570" cy="440" r="30" fill="${INK}"/>
    <circle cx="440" cy="430" r="10" fill="#fff"/><circle cx="580" cy="430" r="10" fill="#fff"/>
    <ellipse cx="480" cy="560" rx="10" ry="14" fill="${INK}"/><ellipse cx="520" cy="560" rx="10" ry="14" fill="${INK}"/>
    <path d="M420 640 Q500 700 580 640" fill="#a8432a" ${S} stroke-width="12"/>
    <ellipse cx="380" cy="600" rx="28" ry="16" fill="#e79a7a" opacity=".8"/>
    <ellipse cx="620" cy="600" rx="28" ry="16" fill="#e79a7a" opacity=".8"/>`,

  rafflesia: `
    ${[0, 72, 144, 216, 288].map(a => `
    <g transform="rotate(${a} 500 520)">
      <path d="M500 520 Q360 400 400 270 Q440 190 500 190 Q560 190 600 270 Q640 400 500 520Z" fill="#c63b2d" ${S}/>
      <g fill="#f6d2b8"><circle cx="470" cy="270" r="20"/><circle cx="535" cy="255" r="16"/><circle cx="510" cy="320" r="22"/><circle cx="455" cy="340" r="13"/><circle cx="560" cy="330" r="14"/><circle cx="500" cy="225" r="10"/></g>
    </g>`).join('')}
    <circle cx="500" cy="520" r="140" fill="#9c2b22" ${S}/>
    <circle cx="500" cy="520" r="100" fill="#f2d9c2" ${S} stroke-width="12"/>
    <circle cx="500" cy="520" r="78" fill="#3a1410"/>
    <g fill="#c98a6a">${[0,40,80,120,160,200,240,280,320].map(a => `<circle cx="${500 + 40 * Math.cos(a*Math.PI/180)}" cy="${520 + 40 * Math.sin(a*Math.PI/180)}" r="11"/>`).join('')}<circle cx="500" cy="520" r="12"/></g>`,

  terabai: `
    <path d="M500 120 Q660 200 668 500 Q660 800 500 880 Q340 800 332 500 Q340 200 500 120Z" fill="#f3ead8" ${S}/>
    <path d="M500 165 Q625 235 632 500 Q625 765 500 835 Q375 765 368 500 Q375 235 500 165Z" fill="none" stroke="#c0392b" stroke-width="10"/>
    <g fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round">
      <path d="M500 230 q-70 20 -70 80 q0 40 40 40 q30 0 30 -30 q0 -20 -20 -20"/>
      <path d="M500 230 q70 20 70 80 q0 40 -40 40 q-30 0 -30 -30 q0 -20 20 -20"/>
      <path d="M500 770 q-70 -20 -70 -80 q0 -40 40 -40 q30 0 30 30 q0 20 -20 20"/>
      <path d="M500 770 q70 -20 70 -80 q0 -40 -40 -40 q-30 0 -30 30 q0 20 20 20"/>
    </g>
    <circle cx="440" cy="470" r="48" fill="#c0392b" ${S} stroke-width="12"/>
    <circle cx="560" cy="470" r="48" fill="#c0392b" ${S} stroke-width="12"/>
    <circle cx="440" cy="470" r="26" fill="#fff" ${S} stroke-width="10"/>
    <circle cx="560" cy="470" r="26" fill="#fff" ${S} stroke-width="10"/>
    <circle cx="440" cy="470" r="11" fill="${INK}"/><circle cx="560" cy="470" r="11" fill="${INK}"/>
    <path d="M500 480 L520 545 L480 545Z" fill="${INK}"/>
    <path d="M430 580 Q500 620 570 580 L560 600 Q500 650 440 600Z" fill="#c0392b" ${S} stroke-width="10"/>
    <path d="M455 597 l0 14 M480 606 l0 16 M500 608 l0 16 M520 606 l0 16 M545 597 l0 14" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`,

  keklapis: `
    <ellipse cx="500" cy="770" rx="330" ry="70" fill="#f7f1e3" ${S}/>
    <ellipse cx="500" cy="770" rx="250" ry="45" fill="none" stroke="#d9cdb2" stroke-width="8"/>
    <path d="M280 400 L560 330 L740 410 L460 480Z" fill="#9b5a2c" ${S}/>
    <path d="M460 480 L740 410 L740 680 L460 760Z" fill="#7c4420" ${S}/>
    ${(() => {
      // Map flat (u, v) on the cake's front face onto the skewed face.
      const m = (u, v) => `${280 + u} ${(400 + v + u * 0.444).toFixed(1)}`;
      const poly = (pts, fill) => `<path d="M${pts.map(([u, v]) => m(u, v)).join(' L')}Z" fill="${fill}"/>`;
      let out = '';
      for (let i = 0; i < 10; i++) out += poly([[0, i * 28], [180, i * 28], [180, i * 28 + 28], [0, i * 28 + 28]], i % 2 ? '#c1702c' : '#f4c542');
      const c = [90, 140];
      out += poly([[90, 30], c, [20, 140]], '#d63b3b') + poly([[90, 30], [160, 140], c], '#3d9a4f');
      out += poly([[20, 140], c, [90, 250]], '#3d9a4f') + poly([c, [160, 140], [90, 250]], '#d63b3b');
      out += poly([[90, 95], [125, 140], [90, 185], [55, 140]], '#fff6e0');
      out += poly([[90, 120], [107, 140], [90, 160], [73, 140]], '#d63b3b');
      return out;
    })()}
    <path d="M280 400 L460 480 L460 760 L280 680Z" fill="none" ${S}/>
    <path d="M470 500 L730 432 M470 560 L730 492 M470 620 L730 552 M470 680 L730 612" stroke="#a8652f" stroke-width="8"/>`,

  laksa: `
    <g fill="none" stroke="#fff3da" stroke-width="12" stroke-linecap="round">
      <path d="M420 330 q-30 -40 0 -80 q30 -40 0 -80"/>
      <path d="M520 320 q-30 -40 0 -80 q30 -40 0 -80"/>
      <path d="M610 330 q-30 -40 0 -80"/>
    </g>
    <path d="M240 500 L760 500 Q745 760 500 790 Q255 760 240 500Z" fill="#fdfaf2" ${S}/>
    <path d="M300 640 Q500 680 700 640" fill="none" stroke="#3f6fb5" stroke-width="12"/>
    <g fill="#3f6fb5"><circle cx="360" cy="690" r="10"/><circle cx="440" cy="710" r="10"/><circle cx="520" cy="714" r="10"/><circle cx="600" cy="705" r="10"/><circle cx="660" cy="680" r="9"/></g>
    <path d="M400 790 L600 790 L580 820 L420 820Z" fill="#fdfaf2" ${S}/>
    <ellipse cx="500" cy="500" rx="260" ry="70" fill="#e2742b" ${S}/>
    <g fill="none" stroke="#fff7e3" stroke-width="7" stroke-linecap="round">
      <path d="M330 500 q30 -20 60 0 t60 0"/><path d="M560 515 q30 -20 60 0"/>
    </g>
    <g fill="#f5d34a" ${S} stroke-width="8">
      <rect x="430" y="470" width="90" height="16" rx="6" transform="rotate(-12 475 478)"/>
      <rect x="470" y="505" width="80" height="16" rx="6" transform="rotate(8 510 513)"/>
    </g>
    <g fill="#f2846a" ${S} stroke-width="10">
      <path d="M330 470 q30 -40 80 -10 q-10 40 -40 50 q-30 0 -40 -40Z"/>
      <path d="M590 465 q40 -35 85 0 q-15 40 -45 45 q-30 -5 -40 -45Z"/>
    </g>
    <g stroke="#c2412a" stroke-width="5"><path d="M360 465 l10 30 M385 458 l5 30"/><path d="M615 460 l5 30 M640 458 l0 30"/></g>
    <g fill="#5aa14a" ${S} stroke-width="7">
      <path d="M540 470 q20 -30 45 -10 q-20 25 -45 10Z"/><path d="M420 525 q15 -30 45 -15 q-20 30 -45 15Z"/>
    </g>
    <circle cx="300" cy="512" r="30" fill="#9ccc5f" ${S} stroke-width="10"/><circle cx="300" cy="512" r="16" fill="#e8f3c9"/>
    <g stroke="${INK}" stroke-width="16" stroke-linecap="round">
      <line x1="620" y1="520" x2="830" y2="250"/><line x1="655" y1="525" x2="860" y2="275"/>
    </g>
    <g stroke="#b9864f" stroke-width="10" stroke-linecap="round">
      <line x1="620" y1="520" x2="830" y2="250"/><line x1="655" y1="525" x2="860" y2="275"/>
    </g>`,
};

const vintage = {
  longhouse: `
    <path d="M140 760 Q500 740 860 760" fill="none" ${V}/>
    <path d="M180 780 q40 -10 80 0 M600 780 q50 -10 100 0" fill="none" ${V} stroke-width="6"/>
    <g ${V}>${[220, 300, 380, 460, 540, 620, 700, 780].map(x => `<line x1="${x}" y1="600" x2="${x}" y2="750"/>`).join('')}</g>
    <path d="M200 600 L800 600 L800 640 L200 640Z" fill="#b98a5a" ${V}/>
    <path d="M220 470 L780 470 L780 600 L220 600Z" fill="#d9b98a" ${V}/>
    <g stroke="${VINK}" stroke-width="5">${Array.from({length: 13}, (_, i) => `<line x1="${250 + i * 42}" y1="480" x2="${250 + i * 42}" y2="592"/>`).join('')}</g>
    <rect x="300" y="505" width="50" height="60" fill="#5a3b2a"/><rect x="480" y="505" width="50" height="60" fill="#5a3b2a"/><rect x="650" y="505" width="50" height="60" fill="#5a3b2a"/>
    <path d="M170 480 L280 340 L720 340 L830 480Z" fill="#a0613d" ${V}/>
    <g stroke="#7a4527" stroke-width="5">${Array.from({length: 9}, (_, i) => `<line x1="${200 + i * 75}" y1="${470}" x2="${290 + i * 52}" y2="350"/>`).join('')}</g>
    <path d="M170 480 L280 340 L720 340 L830 480Z" fill="none" ${V}/>
    <path d="M240 340 l40 -40 M760 340 l-40 -40" ${V}/>
    <path d="M840 760 L770 620" ${V} stroke-width="14"/>
    <g ${V} stroke-width="6"><line x1="822" y1="725" x2="840" y2="718"/><line x1="806" y1="692" x2="824" y2="685"/><line x1="790" y1="658" x2="808" y2="651"/></g>
    <path d="M110 760 Q120 560 150 430" fill="none" ${V}/>
    <g fill="#7a8a4a" ${V} stroke-width="7">
      <path d="M150 430 q-80 -10 -110 50 q60 -20 110 -50Z"/><path d="M150 430 q80 -20 120 30 q-60 -10 -120 -30Z"/>
      <path d="M150 430 q-40 -70 -10 -120 q20 60 10 120Z"/><path d="M150 430 q40 -60 100 -60 q-40 40 -100 60Z"/>
    </g>`,

  terendak: `
    <path d="M150 560 Q500 640 850 560 Q700 360 500 300 Q300 360 150 560Z" fill="#e6d3a8" ${V}/>
    <clipPath id="tc"><path d="M150 560 Q500 640 850 560 Q700 360 500 300 Q300 360 150 560Z"/></clipPath>
    <g clip-path="url(#tc)">
      <path d="M200 520 Q500 590 800 520 L760 480 Q500 545 240 480Z" fill="#a8432a"/>
      ${Array.from({length: 12}, (_, i) => { const x = 255 + i * 42; return `<path d="M${x} ${505 + Math.abs(i-5.5)*-3} l21 -32 l21 32Z" fill="#2f2620"/>`; }).join('')}
      <path d="M300 420 Q500 470 700 420 L670 395 Q500 438 330 395Z" fill="#c99a3a"/>
      ${Array.from({length: 8}, (_, i) => { const x = 340 + i * 42; return `<path d="M${x} 412 l21 22 l21 -22Z" fill="#a8432a"/>`; }).join('')}
      <path d="M390 350 Q500 380 610 350 L590 330 Q500 355 410 330Z" fill="#2f2620"/>
    </g>
    <path d="M150 560 Q500 640 850 560 Q700 360 500 300 Q300 360 150 560Z" fill="none" ${V}/>
    <path d="M150 560 Q500 680 850 560" fill="none" ${V}/>
    <circle cx="500" cy="296" r="18" fill="#a8432a" ${V} stroke-width="8"/>
`,

  proboscis: `
    <path d="M500 220 Q680 220 720 400 Q760 560 650 660 Q580 720 500 720 Q420 720 350 660 Q240 560 280 400 Q320 220 500 220Z" fill="#c98a4b" ${V}/>
    <ellipse cx="290" cy="450" rx="34" ry="44" fill="#e8c9a0" ${V}/>
    <ellipse cx="710" cy="450" rx="34" ry="44" fill="#e8c9a0" ${V}/>
    <path d="M500 330 Q610 330 630 440 Q640 560 580 640 Q540 680 500 680 Q460 680 420 640 Q360 560 370 440 Q390 330 500 330Z" fill="#e8b48e" ${V}/>
    <path d="M400 410 q40 -25 70 0 M530 410 q40 -25 70 0" fill="none" ${V} stroke-width="8"/>
    <circle cx="440" cy="440" r="13" fill="${VINK}"/><circle cx="560" cy="440" r="13" fill="${VINK}"/>
    <path d="M478 470 Q440 540 450 600 Q470 640 500 640 Q540 640 552 600 Q560 540 522 470 Q500 455 478 470Z" fill="#d9825f" ${V}/>
    <path d="M480 620 q10 10 20 0 q10 10 20 0" fill="none" ${V} stroke-width="6"/>
    <path d="M460 670 Q500 690 540 670" fill="none" ${V} stroke-width="7"/>
    <path d="M380 720 Q500 790 620 720 Q600 780 500 800 Q400 780 380 720Z" fill="#f1e2c6" ${V}/>`,

  longboat: `
    <circle cx="660" cy="330" r="90" fill="#d99a4e" opacity=".85"/>
    <path d="M140 520 Q300 470 420 510 Q560 450 700 500 Q790 470 860 510" fill="none" ${V} stroke-width="7"/>
    <g fill="#7a8a4a" ${V} stroke-width="6">
      <path d="M230 500 l0 -140 M230 360 q-50 0 -70 40 M230 360 q50 -10 70 30 M230 360 q-20 -40 -60 -40 M230 360 q30 -40 70 -30" fill="none"/>
      <path d="M760 500 l-10 -120 M750 380 q-50 0 -60 40 M750 380 q50 -10 60 30 M750 380 q-10 -40 -50 -40 M750 380 q30 -40 60 -20" fill="none"/>
    </g>
    <path d="M160 590 Q500 560 840 590" fill="none" stroke="#7aa0a0" stroke-width="10" stroke-linecap="round"/>
    <path d="M150 600 Q200 560 210 520 Q500 640 790 520 Q800 560 850 600 Q500 700 150 600Z" fill="#a0613d" ${V}/>
    <path d="M220 560 Q500 640 780 560" fill="none" stroke="#e6d3a8" stroke-width="8"/>
    <g fill="none" stroke="#7aa0a0" stroke-width="8" stroke-linecap="round">
      <path d="M180 690 q40 -14 80 0 t80 0"/><path d="M560 710 q40 -14 80 0 t80 0"/><path d="M380 740 q40 -14 80 0"/>
    </g>`,
};

module.exports = { bold, vintage };
