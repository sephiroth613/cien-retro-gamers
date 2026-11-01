// =====================================================================
//  CIEN RETRO GAMERS DIJERON — archivo de configuración y preguntas
//  Edita solo este archivo. Guarda y recarga la página (F5).
// =====================================================================

const CONFIG = {
  // Usa | para partir el título en dos líneas
  titulo: "CIEN RETRO GAMERS|DIJERON",
  subtitulo: "EDICIÓN RETRO",

  equipos: [
    {
      nombre: "PLAYER 1",
      jugadores: ["Jugador 1", "Jugador 2", "Jugador 3", "Jugador 4", "Jugador 5"]
    },
    {
      nombre: "PLAYER 2",
      jugadores: ["Jugador 1", "Jugador 2", "Jugador 3", "Jugador 4", "Jugador 5"]
    }
  ]
};

// ---------------------------------------------------------------------
//  PREGUNTAS
//  - respuestas: ["TEXTO", gamers que respondieron eso]  (máx. 6, de mayor a menor)
//  - mult: 1 normal, 2 puntos dobles, 3 puntos triples (opcional, por defecto 1)
//  - Puntos de cada respuesta = gamers × mult
//  (Estas son de EJEMPLO, reemplázalas por las tuyas)
// ---------------------------------------------------------------------
const PREGUNTAS = [
  {
    pregunta: "¿Cómo se llama el héroe de The Legend of Zelda?",
    mult: 1,
    respuestas: [["Link", 62], ["Zelda", 21], ["Ganon", 7], ["Navi", 5], ["Epona", 3], ["Tingle", 2]]
  },
  {
    pregunta: "Nombra una consola de los años 90",
    mult: 1,
    respuestas: [["Super Nintendo", 38], ["PlayStation", 27], ["Sega Genesis", 15], ["Nintendo 64", 11], ["Game Boy", 6], ["Sega Saturn", 3]]
  },
  {
    pregunta: "¿Qué come Pac-Man?",
    mult: 1,
    respuestas: [["Puntos / bolitas", 55], ["Fantasmas", 25], ["Frutas", 14], ["Cerezas", 6]]
  },
  {
    pregunta: "Nombra un enemigo de Mario",
    mult: 2,
    respuestas: [["Bowser", 41], ["Goomba", 24], ["Koopa", 16], ["Boo", 9], ["Planta piraña", 6], ["Wario", 4]]
  },
  {
    pregunta: "Nombra un luchador de Street Fighter II",
    mult: 3,
    respuestas: [["Ryu", 35], ["Ken", 22], ["Chun-Li", 18], ["Blanka", 11], ["Guile", 8], ["Dhalsim", 6]]
  }
];
