/**
 * Mapa de sinónimos semánticos.
 * Clave: término canónico normalizado (sin tildes, minúsculas).
 * Valor: lista de términos relacionados que se usarán en la búsqueda expandida.
 *
 * Para agregar nuevas entradas simplemente añade una clave nueva aquí;
 * no es necesario tocar la lógica de búsqueda.
 */
export const SYNONYM_MAP: Record<string, string[]> = {
  perro: [
    'perro', 'perros', 'mascota', 'mascotas', 'canino', 'caninos',
    'cachorro', 'cachorros', 'animal', 'animales',
    'veterinaria', 'veterinario', 'pet',
  ],
  gato: [
    'gato', 'gatos', 'mascota', 'mascotas', 'felino', 'felinos',
    'gatito', 'gatitos', 'animal', 'animales', 'veterinaria',
  ],
  auto: [
    'auto', 'autos', 'coche', 'carro', 'carros', 'vehiculo', 'vehiculos',
    'automovil', 'automoviles', 'usado',
  ],
  moto: [
    'moto', 'motos', 'motocicleta', 'motocicletas', 'scooter', 'ciclomotor',
  ],
  celular: [
    'celular', 'celulares', 'smartphone', 'telefono', 'telefonos',
    'movil', 'moviles', 'iphone', 'android',
  ],
  computadora: [
    'computadora', 'computadoras', 'laptop', 'notebook', 'notebooks',
    'pc', 'computacion', 'portatil',
  ],
  televisor: [
    'televisor', 'televisores', 'tv', 'tele', 'smart tv', 'television',
    'smarttv',
  ],
  ropa: [
    'ropa', 'vestimenta', 'indumentaria', 'remera', 'pantalon',
    'vestido', 'calzado', 'zapatos', 'zapatillas',
  ],
  bicicleta: [
    'bicicleta', 'bicicletas', 'bici', 'bicis', 'ciclismo',
  ],
  mueble: [
    'mueble', 'muebles', 'silla', 'mesa', 'sillas', 'mesas',
    'sofa', 'sofas', 'escritorio', 'cama', 'placard',
  ],
  camioneta: [
    'camioneta', 'camionetas', 'pickup', 'suv', 'todoterreno',
  ],
  moto_acua: [
    'nautica', 'lancha', 'bote', 'embarcacion', 'yate', 'kayak',
  ],
  audio: [
    'audio', 'parlante', 'parlantes', 'altavoz', 'auricular', 'auriculares',
    'audifonos', 'sonido', 'equipo de sonido',
  ],
  camara: [
    'camara', 'camaras', 'fotografia', 'reflex', 'mirrorless', 'gopro',
    'drone', 'tripode',
  ],
  consola: [
    'consola', 'consolas', 'playstation', 'xbox', 'nintendo', 'ps4', 'ps5',
    'videojuego', 'videojuegos', 'gaming',
  ],
  herramienta: [
    'herramienta', 'herramientas', 'taladro', 'sierra', 'martillo',
    'tornillo', 'construccion',
  ],
  deporte: [
    'deporte', 'deportes', 'fitness', 'gimnasio', 'entrenamiento',
    'pesa', 'pesas', 'cinta', 'eliptica',
  ],
  libro: [
    'libro', 'libros', 'revista', 'revistas', 'manga', 'comic',
    'educacion', 'estudio',
  ],
  instrumento: [
    'instrumento', 'instrumentos', 'guitarra', 'piano', 'bateria',
    'bajo', 'violín', 'violin', 'trompeta', 'musica',
  ],
}
