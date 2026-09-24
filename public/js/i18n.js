// One string table for the whole site. Keys are used in the HTML as
// data-i18n="key" (text), data-i18n-aria="key" (aria-label) and
// data-i18n-alt="key" (alt text). "\n" becomes a line break.
// Telugu and Tamil are drafts: have native speakers proofread before launch.

const en = {
  'names.groom': 'Ranganadh',
  'names.bride': 'Gaayathri',
  'names.short': 'Ranga & Gaayu',

  'open.touch': 'Touch the rings',
  'open.tap': 'Tap to open your invitation',
  'open.button': 'Open your invitation',
  'open.scroll': 'Scroll to begin',

  'inv.lead': 'With joy in our hearts, we invite you to our wedding',
  'inv.date': 'Sunday, 1 November 2026',
  'inv.muhurtham': 'Muhurtham at 7:54 in the morning',
  'inv.ritual': 'Jeelakarra Bellam',
  'inv.addr': 'Haryana Bhavan, 1-8-179, S.D. Road, Paradise\nSecunderabad, Hyderabad',
  'inv.until': 'Until the muhurtham',
  'cd.days': 'days',
  'cd.hours': 'hours',
  'cd.minutes': 'minutes',
  'cd.seconds': 'seconds',

  'story.title': 'Our story',
  'story.text': 'A few quiet moments on the backwaters. The rest of our story is still being written.',

  'gate.title': 'The celebrations',
  'gate.text': "Keep scrolling. We'll take you there.",

  'sg.when': 'Friday night',
  'sg.title': 'Sangeeth',
  'sg.sub': 'An evening of music and dance under the moon',
  'sg.hint': 'Scroll to reveal the night',
  'sg.star': 'Light a star',
  'sg.l1': 'Friday, 30 October 2026',
  'sg.l2': 'From 6 in the evening',
  'sg.l3': 'Haryana Bhavan, Secunderabad',
  'sg.l4': 'Performances by family and friends',
  'sg.l5': 'And a DJ to keep you dancing',
  'sg.all': 'Light them all',
  'sg.mem': 'A little closer to the stars',
  'sg.trans': 'The night fades. Morning is waiting in the desert.',

  'wear.title': 'What to wear',
  'wear.hint': 'Scroll to turn the swatches.',
  'wear.sg.lead': 'Glamour and glitter, in western wear.',
  'wear.sg.1.n': 'Sequins', 'wear.sg.1.t': 'Silver, gold or midnight. They catch every light on the dance floor.',
  'wear.sg.2.n': 'Velvet', 'wear.sg.2.t': 'Deep jewel tones look beautiful at night.',
  'wear.sg.3.n': 'Satin', 'wear.sg.3.t': 'Fluid gowns, slip dresses or a satin shirt.',
  'wear.sg.4.n': 'Metallics', 'wear.sg.4.t': 'Gold, silver or rose gold. Go as shiny as you dare.',
  'wear.sg.5.n': 'Glitter', 'wear.sg.5.t': 'A little sparkle or a lot. Suits with shimmer count too.',

  'hd.when': 'Saturday morning',
  'hd.title': 'Haldi',
  'hd.sub': 'Turmeric, laughter and a lot of colour',
  'hd.hint': 'Scroll to throw colour',
  'hd.all': 'Throw it all',
  'hd.l1': 'Saturday, 31 October 2026',
  'hd.l2': 'From 9:30 in the morning',
  'hd.l3': 'Haryana Bhavan, Secunderabad',
  'hd.l4': 'Come ready to get colourful',
  'hd.palette': 'Haldi yellow, marigold, mustard, lemon and sunflower',
  'hd.mem': 'Sunshine and good company',
  'hd.trans': 'Across the sand, the sea. And a temple waiting for sunrise.',
  'wear.hd.lead': 'Yellow, and ethnic.',
  'wear.hd.1.n': 'Cotton mul', 'wear.hd.1.t': 'Soft, breathable, and happy to take a splash of colour.',
  'wear.hd.2.n': 'Bandhani', 'wear.hd.2.t': 'Tie-dye dots in marigold and turmeric.',
  'wear.hd.3.n': 'Chanderi', 'wear.hd.3.t': 'Light and airy, with small gold motifs.',
  'wear.hd.4.n': 'Gota patti', 'wear.hd.4.t': 'A bright border for a festive touch.',
  'wear.hd.5.n': 'Linen kurta', 'wear.hd.5.t': 'Easy kurtas and pyjamas in mustard or lemon.',

  'wd.when': 'Sunday, at dawn',
  'wd.title': 'The Wedding',
  'wd.sub': 'By the sea, as the sun rises',
  'wd.hint': 'Scroll to light the morning',
  'wd.t1.time': '6:00 am', 'wd.t1.text': 'The rituals begin',
  'wd.t2.time': '7:54 am', 'wd.t2.text': 'Jeelakarra Bellam, the muhurtham',
  'wd.t3.time': '12:00 noon', 'wd.t3.text': 'Lunch',
  'wd.lamp': 'Light the lamp',
  'wd.addr': 'Haryana Bhavan, 1-8-179, S.D. Road, Paradise, Secunderabad',
  'wd.mem': 'Where it all comes together',
  'wear.wd.lead': 'South Indian traditional.',
  'wear.wd.1.n': 'Kanjivaram silk', 'wear.wd.1.t': 'Pattu and Kanjivaram sarees in rich colours.',
  'wear.wd.2.n': 'Pattu pancha', 'wear.wd.2.t': 'A veshti or pancha with a zari border, with a kurta or shirt.',
  'wear.wd.3.n': 'Half saree', 'wear.wd.3.t': 'Langa voni in bright silk.',
  'wear.wd.4.n': 'Silk kurta', 'wear.wd.4.t': 'A silk kurta with an angavastram.',
  'wear.wd.5.n': 'Temple gold', 'wear.wd.5.t': 'Temple jewellery, and jasmine in the hair.',

  'vr.title': 'Vratham',
  'vr.hint': 'Scroll for the lamp',
  'vr.l1': 'Monday, 2 November 2026',
  'vr.l2': 'From 9 in the morning',
  'vr.l3': 'Lunch at 12 noon',
  'vr.l4': 'Eluru, Andhra Pradesh',

  'venue.title': 'See you in Hyderabad',
  'venue.addr': 'Haryana Bhavan, 1-8-179, S.D. Road, Paradise\nSecunderabad, Hyderabad',
  'venue.btn': 'Get directions',

  'gift.title': 'Gifts',
  'gift.hint': 'Pull the ribbon',
  'gift.text': "Your presence and blessings mean the most to us. If you'd like to give something more, we've made a registry.",
  'gift.btn': 'Open our registry',

  'rsvp.title': 'Will you join us?',
  'rsvp.name': 'Your name',
  'rsvp.count': 'How many of you are coming?',
  'rsvp.less': 'One fewer',
  'rsvp.more': 'One more',
  'rsvp.send': 'Send RSVP',
  'rsvp.thanks': "Thank you, {name}. We can't wait to see you.",
  'rsvp.change': 'Change my response',
  'rsvp.errName': "Please add your name so we know who's coming.",
  'rsvp.errNet': "That didn't go through. Check your connection and send it again.",

  'mem.title': 'Memories',
  'mem.text': "Share photos of us, of you, or of the celebrations. They appear here once we've seen them.",
  'mem.add': 'Add photos',
  'mem.empty': 'No photos yet. Yours could be the first.',
  'mem.sending': 'Sending {n} photo(s)…',
  'mem.thanks': "Thank you. Your photos will appear once we've seen them.",
  'mem.err': "Some photos didn't upload. Check your connection and try again.",
  'mem.closed': 'Photo uploads open once the website is live.',

  'close.love': 'With love',

  'dot.invite': 'Invitation',
  'dot.story': 'Our story',
  'dot.sangeeth': 'Sangeeth',
  'dot.haldi': 'Haldi',
  'dot.wedding': 'Wedding',
  'dot.vratham': 'Vratham',
  'dot.rsvp': 'RSVP',

  'ui.sound': 'Sound',
  'ui.sections': 'Sections',
  'alt.ring': 'Ranganadh and Gaayathri, foreheads almost touching, holding two rings up to the light',
  'alt.blue': 'Ranganadh and Gaayathri among palm trees',
  'alt.birds': 'Ranganadh and Gaayathri laughing under a sky full of pigeons',
  'alt.court': 'Ranganadh and Gaayathri in a courtyard with heliconia flowers',
  'alt.charminar': 'Ranganadh and Gaayathri walking toward the Charminar',
  'alt.story': 'Ranganadh and Gaayathri on a wooden boat in the misty backwaters',
};

const te = {
  'names.groom': 'రంగనాథ్',
  'names.bride': 'గాయత్రి',
  'names.short': 'రంగా & గాయు',

  'open.touch': 'ఉంగరాలను తాకండి',
  'open.tap': 'మీ ఆహ్వానాన్ని తెరవడానికి తాకండి',
  'open.button': 'మీ ఆహ్వానాన్ని తెరవండి',
  'open.scroll': 'మొదలుపెట్టడానికి స్క్రోల్ చేయండి',

  'inv.lead': 'సంతోషం నిండిన హృదయాలతో, మా పెళ్లికి మిమ్మల్ని ఆహ్వానిస్తున్నాం',
  'inv.date': 'ఆదివారం, 1 నవంబర్ 2026',
  'inv.muhurtham': 'ఉదయం 7:54కి ముహూర్తం',
  'inv.ritual': 'జీలకర్ర బెల్లం',
  'inv.addr': 'హర్యానా భవన్, 1-8-179, ఎస్.డి. రోడ్, ప్యారడైజ్\nసికింద్రాబాద్, హైదరాబాద్',
  'inv.until': 'ముహూర్తానికి ఇంకా',
  'cd.days': 'రోజులు',
  'cd.hours': 'గంటలు',
  'cd.minutes': 'నిమిషాలు',
  'cd.seconds': 'సెకన్లు',

  'story.title': 'మా కథ',
  'story.text': 'బ్యాక్‌వాటర్స్‌లో కొన్ని ప్రశాంతమైన క్షణాలు. మా కథలో మిగిలినది ఇంకా రాయబడుతూనే ఉంది.',

  'gate.title': 'వేడుకలు',
  'gate.text': 'స్క్రోల్ చేస్తూ ఉండండి. మిమ్మల్ని అక్కడికి తీసుకెళ్తాం.',

  'sg.when': 'శుక్రవారం రాత్రి',
  'sg.title': 'సంగీత్',
  'sg.sub': 'చంద్రుని వెన్నెలలో సంగీతం, నృత్యాల సాయంత్రం',
  'sg.hint': 'రాత్రిని చూడటానికి స్క్రోల్ చేయండి',
  'sg.star': 'ఒక నక్షత్రాన్ని వెలిగించండి',
  'sg.l1': 'శుక్రవారం, 30 అక్టోబర్ 2026',
  'sg.l2': 'సాయంత్రం 6 గంటల నుండి',
  'sg.l3': 'హర్యానా భవన్, సికింద్రాబాద్',
  'sg.l4': 'కుటుంబం, స్నేహితుల ప్రదర్శనలు',
  'sg.l5': 'మిమ్మల్ని ఆడించడానికి ఒక DJ కూడా',
  'sg.all': 'అన్నింటినీ వెలిగించండి',
  'sg.mem': 'నక్షత్రాలకు ఇంకొంచెం దగ్గరగా',
  'sg.trans': 'రాత్రి కరిగిపోతోంది. ఎడారిలో ఉదయం ఎదురుచూస్తోంది.',

  'wear.title': 'ఏం వేసుకోవాలి',
  'wear.hint': 'బట్టల నమూనాలను తిప్పడానికి స్క్రోల్ చేయండి.',
  'wear.sg.lead': 'గ్లామర్, మెరుపులు, వెస్టర్న్ దుస్తుల్లో.',
  'wear.sg.1.n': 'సీక్విన్స్', 'wear.sg.1.t': 'వెండి, బంగారు లేదా మిడ్‌నైట్ రంగుల్లో. డాన్స్ ఫ్లోర్‌పై ప్రతి వెలుగునూ పట్టుకుంటాయి.',
  'wear.sg.2.n': 'వెల్వెట్', 'wear.sg.2.t': 'గాఢమైన రత్నాల రంగులు రాత్రివేళ అందంగా కనిపిస్తాయి.',
  'wear.sg.3.n': 'శాటిన్', 'wear.sg.3.t': 'జాలువారే గౌన్లు, స్లిప్ డ్రెస్‌లు లేదా ఒక శాటిన్ షర్ట్.',
  'wear.sg.4.n': 'మెటాలిక్స్', 'wear.sg.4.t': 'బంగారు, వెండి లేదా రోజ్ గోల్డ్. మీకు నచ్చినంత మెరవండి.',
  'wear.sg.5.n': 'గ్లిట్టర్', 'wear.sg.5.t': 'కొంచెం మెరుపైనా, ఎక్కువైనా సరే. మెరిసే సూట్లు కూడా.',

  'hd.when': 'శనివారం ఉదయం',
  'hd.title': 'హల్దీ',
  'hd.sub': 'పసుపు, నవ్వులు, బోలెడన్ని రంగులు',
  'hd.hint': 'రంగులు చల్లడానికి స్క్రోల్ చేయండి',
  'hd.all': 'అన్నీ చల్లేయండి',
  'hd.l1': 'శనివారం, 31 అక్టోబర్ 2026',
  'hd.l2': 'ఉదయం 9:30 నుండి',
  'hd.l3': 'హర్యానా భవన్, సికింద్రాబాద్',
  'hd.l4': 'రంగుల్లో తడవడానికి సిద్ధంగా రండి',
  'hd.palette': 'హల్దీ పసుపు, బంతిపూల రంగు, ఆవాల రంగు, నిమ్మ పసుపు, పొద్దుతిరుగుడు పసుపు',
  'hd.mem': 'ఎండ, మంచి తోడు',
  'hd.trans': 'ఇసుక దాటితే సముద్రం. సూర్యోదయం కోసం ఎదురుచూస్తున్న ఒక ఆలయం.',
  'wear.hd.lead': 'పసుపు రంగు, సంప్రదాయ దుస్తులు.',
  'wear.hd.1.n': 'కాటన్ మల్', 'wear.hd.1.t': 'మెత్తగా, గాలి ఆడేలా, రంగు చిందినా హాయిగా ఉంటుంది.',
  'wear.hd.2.n': 'బంధని', 'wear.hd.2.t': 'బంతిపూల, పసుపు రంగుల్లో టై-డై చుక్కలు.',
  'wear.hd.3.n': 'చందేరి', 'wear.hd.3.t': 'తేలికగా, గాలిలా, చిన్న బంగారు బుటాలతో.',
  'wear.hd.4.n': 'గోటా పట్టీ', 'wear.hd.4.t': 'పండుగ కళ కోసం మెరిసే అంచు.',
  'wear.hd.5.n': 'లినెన్ కుర్తా', 'wear.hd.5.t': 'ఆవాల పసుపు లేదా నిమ్మ పసుపులో సౌకర్యవంతమైన కుర్తాలు, పైజామాలు.',

  'wd.when': 'ఆదివారం, తెల్లవారుజామున',
  'wd.title': 'పెళ్లి',
  'wd.sub': 'సముద్రం ఒడ్డున, సూర్యుడు ఉదయిస్తుండగా',
  'wd.hint': 'ఉదయాన్ని వెలిగించడానికి స్క్రోల్ చేయండి',
  'wd.t1.time': 'ఉదయం 6:00', 'wd.t1.text': 'పూజా కార్యక్రమాలు మొదలు',
  'wd.t2.time': 'ఉదయం 7:54', 'wd.t2.text': 'జీలకర్ర బెల్లం, ముహూర్తం',
  'wd.t3.time': 'మధ్యాహ్నం 12:00', 'wd.t3.text': 'భోజనం',
  'wd.lamp': 'దీపం వెలిగించండి',
  'wd.addr': 'హర్యానా భవన్, 1-8-179, ఎస్.డి. రోడ్, ప్యారడైజ్, సికింద్రాబాద్',
  'wd.mem': 'అంతా ఒక్కటయ్యే చోటు',
  'wear.wd.lead': 'దక్షిణ భారత సంప్రదాయ దుస్తులు.',
  'wear.wd.1.n': 'కంచి పట్టు', 'wear.wd.1.t': 'నిండైన రంగుల్లో పట్టు, కంచి పట్టు చీరలు.',
  'wear.wd.2.n': 'పట్టు పంచె', 'wear.wd.2.t': 'జరీ అంచు పంచె, కుర్తా లేదా షర్ట్‌తో.',
  'wear.wd.3.n': 'లంగా ఓణీ', 'wear.wd.3.t': 'మెరిసే పట్టులో లంగా ఓణీ.',
  'wear.wd.4.n': 'పట్టు కుర్తా', 'wear.wd.4.t': 'అంగవస్త్రంతో పట్టు కుర్తా.',
  'wear.wd.5.n': 'టెంపుల్ జ్యువెలరీ', 'wear.wd.5.t': 'టెంపుల్ ఆభరణాలు, జడలో మల్లెపూలు.',

  'vr.title': 'వ్రతం',
  'vr.hint': 'దీపం కోసం స్క్రోల్ చేయండి',
  'vr.l1': 'సోమవారం, 2 నవంబర్ 2026',
  'vr.l2': 'ఉదయం 9 గంటల నుండి',
  'vr.l3': 'మధ్యాహ్నం 12 గంటలకు భోజనం',
  'vr.l4': 'ఏలూరు, ఆంధ్రప్రదేశ్',

  'venue.title': 'హైదరాబాద్‌లో కలుద్దాం',
  'venue.addr': 'హర్యానా భవన్, 1-8-179, ఎస్.డి. రోడ్, ప్యారడైజ్\nసికింద్రాబాద్, హైదరాబాద్',
  'venue.btn': 'దారి చూడండి',

  'gift.title': 'కానుకలు',
  'gift.hint': 'రిబ్బన్ లాగండి',
  'gift.text': 'మీ రాక, మీ ఆశీస్సులే మాకు అన్నిటికంటే విలువైనవి. మీరు ఇంకేదైనా ఇవ్వాలనుకుంటే, మేము ఒక రిజిస్ట్రీ ఏర్పాటు చేశాం.',
  'gift.btn': 'మా రిజిస్ట్రీని తెరవండి',

  'rsvp.title': 'మీరు వస్తున్నారా?',
  'rsvp.name': 'మీ పేరు',
  'rsvp.count': 'మీరు ఎంత మంది వస్తున్నారు?',
  'rsvp.less': 'ఒకరు తక్కువ',
  'rsvp.more': 'ఒకరు ఎక్కువ',
  'rsvp.send': 'RSVP పంపండి',
  'rsvp.thanks': 'ధన్యవాదాలు, {name}. మిమ్మల్ని చూడటానికి ఎదురుచూస్తున్నాం.',
  'rsvp.change': 'నా సమాధానం మార్చండి',
  'rsvp.errName': 'ఎవరు వస్తున్నారో తెలియడానికి దయచేసి మీ పేరు రాయండి.',
  'rsvp.errNet': 'అది చేరలేదు. మీ ఇంటర్నెట్ కనెక్షన్ చూసి మళ్ళీ పంపండి.',

  'mem.title': 'జ్ఞాపకాలు',
  'mem.text': 'మా ఫోటోలు, మీ ఫోటోలు, లేదా వేడుకల ఫోటోలు పంచుకోండి. మేము చూసిన తర్వాత అవి ఇక్కడ కనిపిస్తాయి.',
  'mem.add': 'ఫోటోలు జోడించండి',
  'mem.empty': 'ఇంకా ఫోటోలు లేవు. మొదటిది మీదే కావచ్చు.',
  'mem.sending': '{n} ఫోటో(లు) పంపుతున్నాం…',
  'mem.thanks': 'ధన్యవాదాలు. మేము చూసిన తర్వాత మీ ఫోటోలు కనిపిస్తాయి.',
  'mem.err': 'కొన్ని ఫోటోలు అప్‌లోడ్ కాలేదు. మీ కనెక్షన్ చూసి మళ్ళీ ప్రయత్నించండి.',
  'mem.closed': 'వెబ్‌సైట్ ప్రారంభమయ్యాక ఫోటో అప్‌లోడ్‌లు తెరుచుకుంటాయి.',

  'close.love': 'ప్రేమతో',

  'dot.invite': 'ఆహ్వానం',
  'dot.story': 'మా కథ',
  'dot.sangeeth': 'సంగీత్',
  'dot.haldi': 'హల్దీ',
  'dot.wedding': 'పెళ్లి',
  'dot.vratham': 'వ్రతం',
  'dot.rsvp': 'RSVP',

  'ui.sound': 'శబ్దం',
  'ui.sections': 'విభాగాలు',
  'alt.ring': 'రంగనాథ్, గాయత్రి, నుదుళ్లు దాదాపు తాకుతూ, రెండు ఉంగరాలను వెలుగుకు ఎత్తి పట్టుకున్నారు',
  'alt.blue': 'తాటిచెట్ల మధ్య రంగనాథ్, గాయత్రి',
  'alt.birds': 'పావురాలతో నిండిన ఆకాశం కింద నవ్వుతున్న రంగనాథ్, గాయత్రి',
  'alt.court': 'హెలికోనియా పూలున్న ప్రాంగణంలో రంగనాథ్, గాయత్రి',
  'alt.charminar': 'చార్మినార్ వైపు నడుస్తున్న రంగనాథ్, గాయత్రి',
  'alt.story': 'పొగమంచు బ్యాక్‌వాటర్స్‌లో చెక్క పడవపై రంగనాథ్, గాయత్రి',
};

const ta = {
  'names.groom': 'ரங்கநாத்',
  'names.bride': 'காயத்ரி',
  'names.short': 'ரங்கா & காயு',

  'open.touch': 'மோதிரங்களைத் தொடுங்கள்',
  'open.tap': 'உங்கள் அழைப்பைத் திறக்கத் தொடுங்கள்',
  'open.button': 'உங்கள் அழைப்பைத் திறக்கவும்',
  'open.scroll': 'தொடங்க ஸ்க்ரோல் செய்யுங்கள்',

  'inv.lead': 'மகிழ்ச்சி நிறைந்த இதயங்களுடன், எங்கள் திருமணத்திற்கு உங்களை அழைக்கிறோம்',
  'inv.date': 'ஞாயிறு, 1 நவம்பர் 2026',
  'inv.muhurtham': 'காலை 7:54 மணிக்கு முகூர்த்தம்',
  'inv.ritual': 'ஜீலகர்ர பெல்லம்',
  'inv.addr': 'ஹரியானா பவன், 1-8-179, எஸ்.டி. ரோடு, பாரடைஸ்\nசெகந்திராபாத், ஹைதராபாத்',
  'inv.until': 'முகூர்த்தம் வரை',
  'cd.days': 'நாட்கள்',
  'cd.hours': 'மணி',
  'cd.minutes': 'நிமிடங்கள்',
  'cd.seconds': 'விநாடிகள்',

  'story.title': 'எங்கள் கதை',
  'story.text': 'உப்பங்கழியில் சில அமைதியான தருணங்கள். எங்கள் கதையின் மீதி இன்னும் எழுதப்பட்டுக்கொண்டிருக்கிறது.',

  'gate.title': 'கொண்டாட்டங்கள்',
  'gate.text': 'தொடர்ந்து ஸ்க்ரோல் செய்யுங்கள். உங்களை அங்கே அழைத்துச் செல்கிறோம்.',

  'sg.when': 'வெள்ளி இரவு',
  'sg.title': 'சங்கீத்',
  'sg.sub': 'நிலவொளியில் இசையும் நடனமும் நிறைந்த ஒரு மாலை',
  'sg.hint': 'இரவை வெளிப்படுத்த ஸ்க்ரோல் செய்யுங்கள்',
  'sg.star': 'ஒரு நட்சத்திரத்தை ஒளிரச் செய்யுங்கள்',
  'sg.l1': 'வெள்ளி, 30 அக்டோபர் 2026',
  'sg.l2': 'மாலை 6 மணி முதல்',
  'sg.l3': 'ஹரியானா பவன், செகந்திராபாத்',
  'sg.l4': 'குடும்பத்தினர், நண்பர்களின் நிகழ்ச்சிகள்',
  'sg.l5': 'உங்களை ஆட வைக்க ஒரு DJ-யும்',
  'sg.all': 'அனைத்தையும் ஒளிரச் செய்யுங்கள்',
  'sg.mem': 'நட்சத்திரங்களுக்கு இன்னும் கொஞ்சம் அருகில்',
  'sg.trans': 'இரவு மங்குகிறது. பாலைவனத்தில் காலை காத்திருக்கிறது.',

  'wear.title': 'என்ன அணியலாம்',
  'wear.hint': 'துணிகளைப் புரட்ட ஸ்க்ரோல் செய்யுங்கள்.',
  'wear.sg.lead': 'கவர்ச்சியும் மினுமினுப்பும், மேற்கத்திய உடையில்.',
  'wear.sg.1.n': 'சீக்வின்ஸ்', 'wear.sg.1.t': 'வெள்ளி, தங்கம் அல்லது நள்ளிரவு நீலம். நடன மேடையின் ஒவ்வொரு ஒளியையும் பிடிக்கும்.',
  'wear.sg.2.n': 'வெல்வெட்', 'wear.sg.2.t': 'அடர்ந்த ரத்தின நிறங்கள் இரவில் அழகாகத் தெரியும்.',
  'wear.sg.3.n': 'சாட்டின்', 'wear.sg.3.t': 'நெகிழ்ந்து விழும் கவுன்கள், ஸ்லிப் டிரெஸ்கள் அல்லது ஒரு சாட்டின் சட்டை.',
  'wear.sg.4.n': 'மெட்டாலிக்', 'wear.sg.4.t': 'தங்கம், வெள்ளி அல்லது ரோஸ் கோல்ட். எவ்வளவு மின்னினாலும் சரி.',
  'wear.sg.5.n': 'கிளிட்டர்', 'wear.sg.5.t': 'கொஞ்சம் மினுமினுப்போ, நிறையவோ. மின்னும் சூட்களும் சரிதான்.',

  'hd.when': 'சனி காலை',
  'hd.title': 'ஹல்தி',
  'hd.sub': 'மஞ்சள், சிரிப்பு, நிறைய வண்ணங்கள்',
  'hd.hint': 'வண்ணம் தூவ ஸ்க்ரோல் செய்யுங்கள்',
  'hd.all': 'எல்லாவற்றையும் தூவுங்கள்',
  'hd.l1': 'சனி, 31 அக்டோபர் 2026',
  'hd.l2': 'காலை 9:30 மணி முதல்',
  'hd.l3': 'ஹரியானா பவன், செகந்திராபாத்',
  'hd.l4': 'வண்ணங்களில் நனையத் தயாராக வாருங்கள்',
  'hd.palette': 'ஹல்தி மஞ்சள், சாமந்தி, கடுகு, எலுமிச்சை, சூரியகாந்தி',
  'hd.mem': 'சூரிய ஒளியும் இனிய நட்பும்',
  'hd.trans': 'மணலைத் தாண்டினால் கடல். சூரிய உதயத்திற்காகக் காத்திருக்கும் ஒரு கோயில்.',
  'wear.hd.lead': 'மஞ்சள் நிறம், பாரம்பரிய உடை.',
  'wear.hd.1.n': 'காட்டன் மல்', 'wear.hd.1.t': 'மென்மையானது, காற்றோட்டமானது, வண்ணம் தெறித்தாலும் கவலையில்லை.',
  'wear.hd.2.n': 'பாந்தனி', 'wear.hd.2.t': 'சாமந்தி, மஞ்சள் நிறங்களில் டை-டை புள்ளிகள்.',
  'wear.hd.3.n': 'சந்தேரி', 'wear.hd.3.t': 'லேசானது, காற்றோட்டமானது, சிறிய தங்க வேலைப்பாடுகளுடன்.',
  'wear.hd.4.n': 'கோட்டா பட்டி', 'wear.hd.4.t': 'பண்டிகைத் தோற்றத்திற்கு ஒரு பளிச்சென்ற பார்டர்.',
  'wear.hd.5.n': 'லினன் குர்தா', 'wear.hd.5.t': 'கடுகு அல்லது எலுமிச்சை மஞ்சளில் எளிய குர்தாக்களும் பைஜாமாக்களும்.',

  'wd.when': 'ஞாயிறு, விடியற்காலையில்',
  'wd.title': 'திருமணம்',
  'wd.sub': 'கடலோரத்தில், சூரியன் உதிக்கும் வேளையில்',
  'wd.hint': 'காலையை ஒளிரச் செய்ய ஸ்க்ரோல் செய்யுங்கள்',
  'wd.t1.time': 'காலை 6:00', 'wd.t1.text': 'சடங்குகள் தொடங்குகின்றன',
  'wd.t2.time': 'காலை 7:54', 'wd.t2.text': 'ஜீலகர்ர பெல்லம், முகூர்த்தம்',
  'wd.t3.time': 'மதியம் 12:00', 'wd.t3.text': 'மதிய உணவு',
  'wd.lamp': 'விளக்கை ஏற்றுங்கள்',
  'wd.addr': 'ஹரியானா பவன், 1-8-179, எஸ்.டி. ரோடு, பாரடைஸ், செகந்திராபாத்',
  'wd.mem': 'எல்லாம் ஒன்றுசேரும் இடம்',
  'wear.wd.lead': 'தென்னிந்தியப் பாரம்பரிய உடை.',
  'wear.wd.1.n': 'காஞ்சிப் பட்டு', 'wear.wd.1.t': 'செழுமையான நிறங்களில் பட்டு, காஞ்சிப் பட்டுப் புடவைகள்.',
  'wear.wd.2.n': 'பட்டு வேட்டி', 'wear.wd.2.t': 'ஜரிகை பார்டருடன் வேட்டி, குர்தா அல்லது சட்டையுடன்.',
  'wear.wd.3.n': 'பாவாடை தாவணி', 'wear.wd.3.t': 'பளிச்சென்ற பட்டில் பாவாடை தாவணி.',
  'wear.wd.4.n': 'பட்டு குர்தா', 'wear.wd.4.t': 'அங்கவஸ்திரத்துடன் ஒரு பட்டு குர்தா.',
  'wear.wd.5.n': 'கோயில் நகைகள்', 'wear.wd.5.t': 'கோயில் நகைகள், கூந்தலில் மல்லிகைப்பூ.',

  'vr.title': 'விரதம்',
  'vr.hint': 'விளக்கிற்காக ஸ்க்ரோல் செய்யுங்கள்',
  'vr.l1': 'திங்கள், 2 நவம்பர் 2026',
  'vr.l2': 'காலை 9 மணி முதல்',
  'vr.l3': 'மதியம் 12 மணிக்கு மதிய உணவு',
  'vr.l4': 'ஏலூரு, ஆந்திரப் பிரதேசம்',

  'venue.title': 'ஹைதராபாத்தில் சந்திப்போம்',
  'venue.addr': 'ஹரியானா பவன், 1-8-179, எஸ்.டி. ரோடு, பாரடைஸ்\nசெகந்திராபாத், ஹைதராபாத்',
  'venue.btn': 'வழியைப் பாருங்கள்',

  'gift.title': 'பரிசுகள்',
  'gift.hint': 'ரிப்பனை இழுங்கள்',
  'gift.text': 'உங்கள் வருகையும் ஆசீர்வாதமுமே எங்களுக்கு எல்லாவற்றையும் விட முக்கியம். இன்னும் ஏதாவது தர விரும்பினால், நாங்கள் ஒரு பரிசுப் பட்டியலை உருவாக்கியுள்ளோம்.',
  'gift.btn': 'எங்கள் பரிசுப் பட்டியலைத் திறக்கவும்',

  'rsvp.title': 'நீங்கள் வருகிறீர்களா?',
  'rsvp.name': 'உங்கள் பெயர்',
  'rsvp.count': 'எத்தனை பேர் வருகிறீர்கள்?',
  'rsvp.less': 'ஒருவர் குறைவு',
  'rsvp.more': 'ஒருவர் கூடுதல்',
  'rsvp.send': 'RSVP அனுப்பு',
  'rsvp.thanks': 'நன்றி, {name}. உங்களைச் சந்திக்க ஆவலுடன் காத்திருக்கிறோம்.',
  'rsvp.change': 'என் பதிலை மாற்று',
  'rsvp.errName': 'யார் வருகிறார்கள் என்று தெரிய, உங்கள் பெயரைச் சேர்க்கவும்.',
  'rsvp.errNet': 'அது சென்று சேரவில்லை. இணைப்பைச் சரிபார்த்து மீண்டும் அனுப்பவும்.',

  'mem.title': 'நினைவுகள்',
  'mem.text': 'எங்கள் புகைப்படங்கள், உங்கள் புகைப்படங்கள், அல்லது கொண்டாட்டங்களின் புகைப்படங்களைப் பகிருங்கள். நாங்கள் பார்த்த பிறகு அவை இங்கே தோன்றும்.',
  'mem.add': 'புகைப்படங்களைச் சேர்க்கவும்',
  'mem.empty': 'இன்னும் புகைப்படங்கள் இல்லை. முதல் புகைப்படம் உங்களுடையதாக இருக்கலாம்.',
  'mem.sending': '{n} புகைப்படம்(கள்) அனுப்பப்படுகிறது…',
  'mem.thanks': 'நன்றி. நாங்கள் பார்த்த பிறகு உங்கள் புகைப்படங்கள் தோன்றும்.',
  'mem.err': 'சில புகைப்படங்கள் பதிவேறவில்லை. இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.',
  'mem.closed': 'இணையதளம் தொடங்கியதும் புகைப்படப் பதிவேற்றம் திறக்கப்படும்.',

  'close.love': 'அன்புடன்',

  'dot.invite': 'அழைப்பு',
  'dot.story': 'எங்கள் கதை',
  'dot.sangeeth': 'சங்கீத்',
  'dot.haldi': 'ஹல்தி',
  'dot.wedding': 'திருமணம்',
  'dot.vratham': 'விரதம்',
  'dot.rsvp': 'RSVP',

  'ui.sound': 'ஒலி',
  'ui.sections': 'பகுதிகள்',
  'alt.ring': 'ரங்கநாத்தும் காயத்ரியும், நெற்றிகள் ஏறக்குறைய தொட, இரண்டு மோதிரங்களை ஒளியை நோக்கி உயர்த்திப் பிடித்திருக்கிறார்கள்',
  'alt.blue': 'பனை மரங்களுக்கு இடையே ரங்கநாத்தும் காயத்ரியும்',
  'alt.birds': 'புறாக்கள் நிறைந்த வானத்தின் கீழ் சிரிக்கும் ரங்கநாத்தும் காயத்ரியும்',
  'alt.court': 'ஹெலிகோனியா மலர்கள் உள்ள முற்றத்தில் ரங்கநாத்தும் காயத்ரியும்',
  'alt.charminar': 'சார்மினாரை நோக்கி நடக்கும் ரங்கநாத்தும் காயத்ரியும்',
  'alt.story': 'பனிமூட்டமான உப்பங்கழியில் மரப்படகில் ரங்கநாத்தும் காயத்ரியும்',
};

export const STRINGS = { en, te, ta };
export const LANGS = ['en', 'te', 'ta'];

let current = 'en';
const listeners = new Set();

export function t(key, vars) {
  let s = (STRINGS[current] && STRINGS[current][key]) ?? en[key] ?? key;
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
}

export const lang = () => current;
export const onLang = (fn) => listeners.add(fn);

function setText(el, s) {
  // "\n" -> <br>, without ever parsing strings as HTML.
  el.textContent = '';
  s.split('\n').forEach((part, i) => {
    if (i) el.appendChild(document.createElement('br'));
    el.appendChild(document.createTextNode(part));
  });
}

export function apply(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => setText(el, t(el.dataset.i18n)));
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  root.querySelectorAll('[data-i18n-alt]').forEach((el) => el.setAttribute('alt', t(el.dataset.i18nAlt)));
}

export function setLang(code, save = true) {
  if (!STRINGS[code]) code = 'en';
  current = code;
  document.documentElement.lang = code;
  apply();
  if (save) { try { localStorage.setItem('ragaa.lang', code); } catch (e) { /* private mode */ } }
  listeners.forEach((fn) => fn(code));
}

export function initialLang() {
  try { return localStorage.getItem('ragaa.lang') || 'en'; } catch (e) { return 'en'; }
}
