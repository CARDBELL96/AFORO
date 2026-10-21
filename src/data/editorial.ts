import { PHOTO, unsplash, type Accent, type GenreId } from './events';

export interface EditorialCategory {
  id: GenreId;
  index: string;
  title: string;
  subtitle: string;
  sonicDescriptor: string;
  gridSpanClass: 'span-7' | 'span-5' | 'span-4' | 'span-8';
  image: { photo: string; poster: string; alt: string };
  accent: Accent;
  featuredArtistsSample: string[];
}

export interface PeruCityScene {
  city: string;
  regionCode: string;
  coordinates: string;
  altitude: string;
  headline: string;
  culturalPerspective: string;
  keyVenues: string[];
  sonicIdentity: string[];
  image: { photo: string; poster: string; alt: string };
  accent: Accent;
}

export interface DemoUserTicket {
  ticketId: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  artist: string;
  city: string;
  venue: string;
  dateFormatted: string;
  doorsTime: string;
  zoneName: string;
  seatOrAccess: string;
  holderName: string;
  pricePaid: number;
  status: 'ACTIVA_DEMO' | 'USADA_DEMO';
  pulseHash: string;
  createdAt: string;
}

export const EDITORIAL_CATEGORIES: EditorialCategory[] = [
  {
    id: 'electronica',
    index: '01',
    title: 'Electrónica & pulso nocturno',
    subtitle: 'Bajo profundo, láseres de altura y sesiones 360° donde la percusión afroperuana y los sintetizadores colisionan.',
    sonicDescriptor: 'MODULAR · TECHNO DE ALTURA · SISTEMA 360°',
    gridSpanClass: 'span-7',
    image: {
      photo: unsplash(PHOTO.crowdWarm, 1200),
      poster: '/img/events/altiplano-sound.webp',
      alt: 'Multitud iluminada por luces cálidas en un concierto nocturno en vivo',
    },
    accent: 'orange',
    featuredArtistsSample: ['Colectivo Marejada', 'Apu Frequencies', 'Núcleo 3200'],
  },
  {
    id: 'rock-indie',
    index: '02',
    title: 'Rock & Indie',
    subtitle: 'Shoegaze limeño, post-punk del sur andino, guitarras al límite de saturación y salas íntimas.',
    sonicDescriptor: 'DISTORSIÓN · REVERB · SELLOS INDEPENDIENTES',
    gridSpanClass: 'span-5',
    image: {
      photo: unsplash(PHOTO.guitarBacklit, 1000),
      poster: '/img/events/sotano-distorsion.webp',
      alt: 'Guitarrista en contraluz sobre escenario con humo y reflectores',
    },
    accent: 'blue',
    featuredArtistsSample: ['Bruma de Sillar', 'Marea Baja', 'Perros del Misti'],
  },
  {
    id: 'cumbia-chicha',
    index: '03',
    title: 'Cumbia & Chicha',
    subtitle: 'Psicodelia amazónica, chicha con enchufe, órgano Farfisa en loop y timbales hasta el amanecer.',
    sonicDescriptor: 'GUITARRA PSICODÉLICA · TIMBAL · TROPICALISMO FUTURISTA',
    gridSpanClass: 'span-4',
    image: {
      photo: unsplash(PHOTO.stageTropical, 900),
      poster: '/img/events/cumbia-cosmica.webp',
      alt: 'Escenario vibrante con iluminación cálida y público bailando',
    },
    accent: 'lime',
    featuredArtistsSample: ['Los Mirlos del Futuro', 'Órgano Solar', 'Conjunto Voltaje'],
  },
  {
    id: 'urbana',
    index: '04',
    title: 'Música urbana & Cypher',
    subtitle: 'Barras crudas, beats de club, R&B nocturno y los colectivos que redefinen el galpón y la calle.',
    sonicDescriptor: '808 SUB-BASS · CYPHER EN VIVO · CALDERA 360°',
    gridSpanClass: 'span-4',
    image: {
      photo: unsplash(PHOTO.urbanMic, 900),
      poster: '/img/events/techno-altura.webp',
      alt: 'Artista urbano en escenario con micrófono bajo haz de luz intensa',
    },
    accent: 'magenta',
    featuredArtistsSample: ['Killa Bass Collective', 'Sombra 14', 'Norte Crudo'],
  },
  {
    id: 'festivales',
    index: '05',
    title: 'Festivales',
    subtitle: 'Múltiples escenarios de sol a madrugada entre los acantilados de la costa, el norte y los Andes.',
    sonicDescriptor: 'MULTIESCENARIO · EXPERIENCIA DE JORNADA COMPLETA',
    gridSpanClass: 'span-4',
    image: {
      photo: unsplash(PHOTO.festivalLasers, 900),
      poster: '/img/events/pulso-festival.webp',
      alt: 'Gran escenario de festival al aire libre con haces de luz cruzando el cielo nocturno',
    },
    accent: 'teal',
    featuredArtistsSample: ['Pulso Festival', 'Cordillera Magnética', 'Trópico Norte'],
  },
  {
    id: 'cultura',
    index: '06',
    title: 'Carnaval, Cultura & Raíz',
    subtitle: 'Comparsas en la calle, sesiones electroacústicas en casonas virreinales, cantos amazónicos y teatro sonoro.',
    sonicDescriptor: 'ARQUITECTURA VIVA · PATIOS HISTÓRICOS · AFORO ÍNTIMO',
    gridSpanClass: 'span-8',
    image: {
      photo: unsplash(PHOTO.lightInstall, 1200),
      poster: '/img/events/noche-de-teatro.webp',
      alt: 'Instalación lumínica y audiencia en espacio cultural contemporáneo',
    },
    accent: 'amber',
    featuredArtistsSample: ['Illariy Huamán', 'Clara Vértiz', 'Coro Ribereño'],
  },
];

export const PERU_CITY_SCENES: PeruCityScene[] = [
  {
    city: 'Lima',
    regionCode: 'LIM · 01',
    coordinates: '12°02′S 77°01′W',
    altitude: '154 m s. n. m.',
    headline: 'Acantilado, galpón industrial y circuito nocturno.',
    culturalPerspective:
      'De las casonas republicanas del Centro Histórico a los domos frente al mar en Costa Verde y Barranco, la capital articula grandes aforos con sótanos de culto.',
    keyVenues: ['Barranco Arena', 'Anfiteatro Parque de la Exposición', 'Explanada del Pulso'],
    sonicIdentity: ['Post-punk & Shoegaze', 'Electrónica 360° & Salsa dura', 'Fusión afroperuana contemporánea'],
    image: {
      photo: unsplash(PHOTO.bigStage, 1000),
      poster: '/img/events/pulso-festival.webp',
      alt: 'Escenario de gran formato iluminado en noche de concierto en Lima',
    },
    accent: 'orange',
  },
  {
    city: 'Arequipa',
    regionCode: 'AQP · 04',
    coordinates: '16°24′S 71°32′W',
    altitude: '2 335 m s. n. m.',
    headline: 'Sillar volcánico, guitarras densas y noches de teatro.',
    culturalPerspective:
      'Al pie del Misti, la escena arequipeña ha consolidado uno de los circuitos de rock alternativo, ruido subterráneo y música de cámara más exigentes y fieles del país.',
    keyVenues: ['Teatro Municipal de Arequipa', 'La Cripta', 'Patio Cultural Yanahuara'],
    sonicIdentity: ['Indie rock volcánico & Shoegaze', 'Garage & Punk de sótano', 'Orquesta joven contemporánea'],
    image: {
      photo: unsplash(PHOTO.nightSession, 1000),
      poster: '/img/events/sotano-distorsion.webp',
      alt: 'Sesión musical nocturna con iluminación dramática en Arequipa',
    },
    accent: 'cream',
  },
  {
    city: 'Cusco',
    regionCode: 'CUS · 08',
    coordinates: '13°31′S 71°58′W',
    altitude: '3 399 m s. n. m.',
    headline: 'Electrónica andina, piedra viva y psicodelia de altura.',
    culturalPerspective:
      'Entre hangares industriales y el centro histórico, productores de downtempo, sound systems de altura y artistas visuales transforman los Andes en laboratorios acústicos.',
    keyVenues: ['Centro de Convenciones Cusco', 'Hangar Apu', 'Foro Valle Sagrado'],
    sonicIdentity: ['Downtempo & dub andino', 'Techno a 3 400 metros', 'Experiencias lumínicas'],
    image: {
      photo: unsplash(PHOTO.visuals, 1000),
      poster: '/img/events/altiplano-sound.webp',
      alt: 'Concierto con visuales proyectados y atmósfera nocturna en Cusco',
    },
    accent: 'teal',
  },
  {
    city: 'Trujillo',
    regionCode: 'TRU · 13',
    coordinates: '08°06′S 79°01′W',
    altitude: '34 m s. n. m.',
    headline: 'Brisa norteña, chicha con enchufe y sesiones frente al mar.',
    culturalPerspective:
      'El eje entre el centro de Trujillo y la costa de Huanchaco impulsa festivales al atardecer frente a los caballitos de totora y noches de chicha eléctrica.',
    keyVenues: ['Explanada Costera Huanchaco', 'Coliseo Norte', 'Casona Orbegoso Viva'],
    sonicIdentity: ['Chicha eléctrica & Guitarra surf', 'Bronces tropicales & Funk costero', 'Sesiones sunset'],
    image: {
      photo: unsplash(PHOTO.sunsetFest, 1000),
      poster: '/img/events/chicha-voltaje.webp',
      alt: 'Público al atardecer frente a escenario abierto en festival costero de Trujillo',
    },
    accent: 'lime',
  },
  {
    city: 'Ayacucho',
    regionCode: 'AYA · 05',
    coordinates: '13°09′S 74°13′W',
    altitude: '2 761 m s. n. m.',
    headline: 'Cuerdas contemporáneas, memoria viva y vanguardia serrana.',
    culturalPerspective:
      'Huamanga reinventa su herencia musical con cantautores bilingües (quechua-castellano), arpas procesadas y encuentros íntimos en patios de piedra coloniales.',
    keyVenues: ['Patio de Piedra San Cristóbal', 'Huamanga Club Cultural', 'Auditorio Los Andes'],
    sonicIdentity: ['Canción andina contemporánea', 'Arpa & guitarra ayacuchana', 'Poesía sonora bilingüe'],
    image: {
      photo: unsplash(PHOTO.intimate, 1000),
      poster: '/img/events/noche-de-teatro.webp',
      alt: 'Escenario íntimo con iluminación cálida y cuerdas en vivo en Ayacucho',
    },
    accent: 'amber',
  },
];

export const INITIAL_DEMO_TICKETS: DemoUserTicket[] = [
  {
    ticketId: 'AFR-TK-9042',
    eventId: 'evt-pacifico-nocturno',
    eventSlug: 'pulso-pacifico',
    eventTitle: 'Pulso Pacífico: Sesión de Medianoche',
    artist: 'Colectivo Marejada + Orquesta Abismo',
    city: 'Lima',
    venue: 'Barranco Arena',
    dateFormatted: 'SÁB 14 NOV · 21:00',
    doorsTime: 'Puertas 19:30',
    zoneName: 'Pista Pulso (frente a escenario)',
    seatOrAccess: 'ACCESO GENERAL PISTA · PUERTA B',
    holderName: 'VALERIA MENDOZA · DEMO',
    pricePaid: 145,
    status: 'ACTIVA_DEMO',
    pulseHash: 'PULSO-LIM-9042-88F1',
    createdAt: '2026-10-15',
  },
  {
    ticketId: 'AFR-TK-7731',
    eventId: 'evt-cordillera-fest',
    eventSlug: 'cordillera-magnetica',
    eventTitle: 'Festival Cordillera Magnética',
    artist: '14 artistas en 2 escenarios · Edición Valle & Altura',
    city: 'Cusco',
    venue: 'Centro de Convenciones Cusco',
    dateFormatted: 'SÁB 05 DIC · 15:00',
    doorsTime: 'Puertas 14:00',
    zoneName: 'Pase Jornada Completa',
    seatOrAccess: 'ABONO GENERAL · ACCESO PRINCIPAL',
    holderName: 'VALERIA MENDOZA · DEMO',
    pricePaid: 120,
    status: 'ACTIVA_DEMO',
    pulseHash: 'PULSO-CUS-7731-42C9',
    createdAt: '2026-10-12',
  },
];
