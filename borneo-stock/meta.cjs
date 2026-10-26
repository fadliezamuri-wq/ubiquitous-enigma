// Adobe Stock metadata. Category ids: 1 Animals, 2 Buildings, 4 Drinks, 7 Food,
// 11 Landscapes, 14 Plants and Flowers, 15 Culture and Religion, 20 Transport, 21 Travel.
const boldBase = 'borneo, sarawak, malaysia, illustration, icon, vector, flat design, cartoon, clipart, culture, travel, tourism, asia, tropical, sticker, cute';
const vintageBase = 'borneo, sarawak, malaysia, illustration, vintage, minimalist, line art, hand drawn, textured paper, retro, boho, travel, tourism, asia, culture, tropical, icon';

const rows = [
  // Batch 1
  ['borneo_bold_hornbill', 1, 'Rhinoceros hornbill bird on branch, cute cartoon icon of Sarawak Borneo state bird', 'rhinoceros hornbill, hornbill, kenyalang, bird, wildlife, animal, rainforest, jungle, exotic bird, casque, branch, mascot, land of the hornbills', 1],
  ['borneo_bold_sape', 1, 'Traditional Sarawak sape lute with tribal motif, cute flat cartoon icon of Borneo music', 'sape, sapeh, lute, musical instrument, traditional music, orang ulu, dayak, string instrument, folk music, tribal pattern, ethnic, heritage, music note', 15],
  ['borneo_bold_pitcher', 1, 'Pitcher plant nepenthes cartoon icon, Borneo rainforest carnivorous plant', 'pitcher plant, nepenthes, carnivorous plant, periuk kera, rainforest, jungle, botanical, plant, nature, leaf, green, exotic plant', 14],
  ['borneo_bold_orangutan', 1, 'Cute orangutan face cartoon icon, Borneo rainforest ape wildlife', 'orangutan, ape, primate, monkey, wildlife, animal, rainforest, jungle, conservation, endangered, face, mascot, kids', 1],
  ['borneo_bold_rafflesia', 1, 'Rafflesia giant flower cartoon icon, Borneo rainforest largest flower', 'rafflesia, flower, giant flower, corpse flower, rainforest, jungle, botanical, red flower, exotic flower, nature, bloom, plant', 14],
  ['borneo_bold_terabai', 1, 'Iban terabai shield with tribal face motif, Borneo dayak warrior cartoon icon', 'terabai, shield, iban, dayak, warrior, tribal art, ethnic pattern, traditional weapon, heritage, gawai, indigenous, motif, mask', 15],
  ['borneo_bold_keklapis', 1, 'Sarawak layer cake slice kek lapis with geometric pattern, cartoon food icon', 'kek lapis, layer cake, sarawak cake, cake slice, dessert, food, bakery, sweet, hari raya, festive food, geometric pattern, colorful cake, malaysian food', 7],
  ['borneo_bold_laksa', 1, 'Sarawak laksa noodle bowl with prawns and chopsticks, cartoon food icon', 'sarawak laksa, laksa, noodle soup, noodles, bowl, prawn, shrimp, chopsticks, breakfast, malaysian food, asian food, street food, spicy, hot food', 7],
  ['borneo_vintage_longhouse', 1, 'Vintage minimalist longhouse illustration, traditional Borneo rumah panjang on stilts', 'longhouse, rumah panjang, iban, dayak, stilt house, traditional house, village, architecture, palm tree, wooden house, heritage, indigenous, kampung', 2],
  ['borneo_vintage_terendak', 1, 'Vintage minimalist terendak hat illustration, Melanau traditional Sarawak hat', 'terendak, melanau, traditional hat, conical hat, sun hat, woven hat, tribal pattern, ethnic, heritage, handicraft, geometric, costume', 15],
  ['borneo_vintage_proboscis', 1, 'Vintage minimalist proboscis monkey illustration, Borneo long nose monkey', 'proboscis monkey, monkey, long nose, bekantan, primate, wildlife, animal, rainforest, jungle, mangrove, endangered, face, cute', 1],
  ['borneo_vintage_longboat', 1, 'Vintage minimalist longboat on river with palm trees and sun, Borneo river illustration', 'longboat, boat, river, canoe, perahu, rejang river, palm tree, sunset, sun, river transport, jungle, landscape, water, adventure', 21],
  // Batch 2
  ['borneo_bold_kolomee', 2, 'Sarawak kolo mee noodle bowl with char siu and chopsticks, cartoon food icon', 'kolo mee, kolok mee, dry noodles, egg noodles, char siu, bbq pork, noodle bowl, chopsticks, breakfast, malaysian food, asian food, hawker food, street food', 7],
  ['borneo_bold_tehcspecial', 2, 'Sarawak teh C special three layer iced tea glass, cartoon drink icon', 'teh c special, three layer tea, layered tea, iced tea, milk tea, teh peng, drink, beverage, glass, straw, ice cubes, kopitiam, malaysian drink, refreshing', 4],
  ['borneo_bold_manokpansuh', 2, 'Manok pansuh chicken cooked in bamboo over fire, Iban traditional food cartoon icon', 'manok pansuh, bamboo chicken, bamboo, campfire, fire, cooking, iban food, dayak food, traditional food, gawai, ethnic food, outdoor cooking, smoke', 7],
  ['borneo_bold_midin', 2, 'Midin jungle fern fiddlehead bundle, Sarawak wild vegetable cartoon icon', 'midin, jungle fern, fiddlehead, fern, wild vegetable, vegetable, green, healthy food, organic, sarawak delicacy, plant, leaves, harvest', 14],
  ['borneo_bold_durian', 2, 'Spiky durian fruit cartoon icon, king of fruits tropical Borneo', 'durian, king of fruits, tropical fruit, fruit, spiky, thorny, exotic fruit, smelly fruit, durian season, healthy, organic, harvest, green', 7],
  ['borneo_bold_rambutan', 2, 'Hairy red rambutan fruits with peeled flesh, cartoon tropical fruit icon', 'rambutan, tropical fruit, fruit, red fruit, hairy fruit, exotic fruit, peeled fruit, sweet, juicy, fresh, healthy, organic, summer', 7],
  ['borneo_bold_terungdayak', 2, 'Terung dayak sour round eggplant with slice, Sarawak local fruit cartoon icon', 'terung dayak, terung asam, sour eggplant, round eggplant, wild eggplant, vegetable, fruit, slice, local produce, ethnic food, organic, orange, harvest', 7],
  ['borneo_bold_kuchingcat', 2, 'Cute ginger cat wearing ethnic scarf, Kuching cat city mascot cartoon icon', 'kuching, cat city, cat, kitten, ginger cat, orange cat, cute cat, pet, animal, mascot, scarf, kawaii, character', 1],
  ['borneo_bold_sunbear', 2, 'Cute sun bear face with chest marking, Borneo wildlife cartoon icon', 'sun bear, honey bear, bear, beruang madu, wildlife, animal, rainforest, jungle, conservation, endangered, face, mascot, kids', 1],
  ['borneo_bold_tarsier', 2, 'Cute tarsier with big eyes clinging to branch, Borneo wildlife cartoon icon', 'tarsier, big eyes, primate, nocturnal, small animal, wildlife, animal, rainforest, jungle, branch, kawaii, endangered, mascot', 1],
  ['borneo_bold_pygmyelephant', 2, 'Cute Borneo pygmy elephant cartoon icon, rainforest wildlife', 'pygmy elephant, elephant, baby elephant, gajah, wildlife, animal, rainforest, jungle, conservation, endangered, trunk, kids, mascot', 1],
  ['borneo_bold_birdwing', 2, 'Rajah Brooke birdwing butterfly with green bands, Borneo insect cartoon icon', 'rajah brooke birdwing, birdwing, butterfly, insect, black and green, wings, wildlife, rainforest, jungle, nature, exotic insect, symmetry, entomology', 1],
  ['borneo_bold_crocodile', 2, 'Cute smiling crocodile in river, Borneo reptile cartoon icon', 'crocodile, saltwater crocodile, reptile, alligator, river, wildlife, animal, jungle, swamp, teeth, mascot, kids, green', 1],
  ['borneo_bold_gong', 2, 'Traditional brass gong on wooden stand with mallet, Borneo music cartoon icon', 'gong, tawak, agung, brass gong, percussion, musical instrument, traditional music, dayak, gawai, ceremony, festival, heritage, ethnic', 15],
  ['borneo_bold_pangolin', 2, 'Cute pangolin with scales cartoon icon, Borneo endangered wildlife', 'pangolin, scaly anteater, tenggiling, scales, wildlife, animal, rainforest, jungle, conservation, endangered, nocturnal, mammal, kids', 1],
  ['borneo_vintage_tajau', 2, 'Vintage minimalist tajau ceramic jar illustration, Borneo heirloom pottery', 'tajau, ceramic jar, dragon jar, pottery, antique jar, heirloom, iban, dayak, heritage, handicraft, vessel, tuak, traditional', 15],
  ['borneo_vintage_sumpit', 2, 'Vintage minimalist blowpipe and dart quiver illustration, Borneo hunting tools', 'sumpit, blowpipe, blowgun, dart, quiver, hunting, traditional weapon, orang ulu, penan, dayak, tribal, heritage, ethnic', 15],
  ['borneo_vintage_manik', 2, 'Vintage minimalist beaded necklace illustration, Orang Ulu bead craft', 'beads, beaded necklace, manik, orang ulu, beadwork, handicraft, jewelry, accessories, ethnic, tribal, heritage, colorful beads, necklace', 15],
  ['borneo_vintage_ingan', 2, 'Vintage minimalist woven rattan backpack basket illustration, Borneo handicraft', 'woven basket, rattan basket, backpack basket, ingan, bamboo, weaving, handicraft, iban, dayak, ethnic, tribal pattern, heritage, craft', 15],
  ['borneo_vintage_bubu', 2, 'Vintage minimalist bamboo fish trap with fish illustration, traditional fishing', 'fish trap, bubu, bamboo trap, traditional fishing, fishing, fish, river, woven, handicraft, kampung, village life, heritage, rural', 15],
  ['borneo_vintage_baruk', 2, 'Vintage minimalist Bidayuh baruk round house illustration, Sarawak traditional architecture', 'baruk, bidayuh, round house, head house, stilt house, traditional house, architecture, village, heritage, indigenous, wooden house, kampung, conical roof', 2],
  ['borneo_vintage_tambang', 2, 'Vintage minimalist tambang river boat illustration, Kuching river ferry', 'tambang, river boat, ferry, sampan, boat, river, kuching, waterfront, river transport, sunset, sun, water, heritage', 20],
  ['borneo_vintage_bakostack', 2, 'Vintage minimalist sea stack rock formation illustration, Borneo coastal landscape', 'sea stack, rock formation, bako, national park, beach, coast, sea, ocean, landscape, nature, sun, birds, travel destination', 11],
  ['borneo_vintage_mulucave', 2, 'Vintage minimalist cave with bats flying out illustration, Borneo limestone cave', 'cave, bats, bat exodus, mulu, limestone, mountain, national park, unesco, nature, landscape, adventure, dusk, travel destination', 11],
  ['borneo_vintage_buttresstree', 2, 'Vintage minimalist rainforest tree with buttress roots illustration', 'rainforest tree, buttress roots, giant tree, tree, forest, jungle, dipterocarp, nature, ecology, environment, fern, canopy, botanical', 14],
  ['borneo_vintage_waterfall', 2, 'Vintage minimalist jungle waterfall illustration, Borneo nature landscape', 'waterfall, jungle, rainforest, cliff, river, pool, nature, landscape, adventure, hiking, tropical, water, travel destination', 11],
  ['borneo_vintage_seaturtle', 2, 'Vintage minimalist green sea turtle illustration, Borneo marine wildlife', 'sea turtle, green turtle, turtle, marine life, ocean, sea, wildlife, animal, conservation, endangered, swimming, reptile, nature', 1],
  ['borneo_vintage_dolphin', 2, 'Vintage minimalist Irrawaddy dolphin jumping illustration, Borneo marine wildlife', 'irrawaddy dolphin, dolphin, marine life, sea, ocean, river, wildlife, animal, jumping, waves, santubong, conservation, mammal', 1],
  ['borneo_vintage_pepper', 2, 'Vintage minimalist Sarawak pepper vine with peppercorns illustration', 'black pepper, pepper vine, peppercorn, sarawak pepper, spice, herb, botanical, plant, leaves, agriculture, harvest, cooking, organic', 14],
  ['borneo_vintage_kinabalu', 2, 'Vintage minimalist Mount Kinabalu mountain peaks illustration, Borneo landscape', 'mount kinabalu, mountain, peak, summit, sabah, hiking, climbing, landscape, nature, clouds, sun, travel destination, adventure', 11],
];

function toCsv(filter) {
  const esc = s => `"${String(s).replace(/"/g, '""')}"`;
  const lines = ['Filename,Title,Keywords,Category,Releases'];
  for (const r of rows.filter(filter)) {
    const [name, , title, kw, cat] = r;
    const base = name.includes('_bold_') ? boldBase : vintageBase;
    const keywords = [...new Set(`${kw}, ${base}`.split(',').map(s => s.trim()))];
    if (keywords.length > 49) throw new Error(`${name}: too many keywords`);
    lines.push([`${name}.jpg`, esc(title), esc(keywords.join(', ')), cat, ''].join(','));
  }
  return lines.join('\n') + '\n';
}

module.exports = { rows, toCsv };
