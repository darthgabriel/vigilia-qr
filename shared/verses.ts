const VERSES: Record<string, { text: string; ref: string }> = {
  "iglesia y ministerios": {
    text: "Y él dio unos como apóstoles, otros como profetas, otros como evangelistas, y otros como pastores y maestros.",
    ref: "Efesios 4:11",
  },
  "proyectos del ultimo trimestre del año 2026": {
    text: "Haz todo de corazón, como para el Señor y no para los hombres.",
    ref: "Colosenses 3:23",
  },
  venezuela: {
    text: "Si mi pueblo, que es llamado por mi nombre, se humilla, y ora, y busca mi rostro, y se aparta de sus malos caminos, yo oiré del cielo, y perdonaré su pecado, y sanaré su tierra.",
    ref: "2 Crónicas 7:14",
  },
  "naciones y jerusalén": {
    text: "Ruega por la paz de Jerusalén: prosperen los que te aman.",
    ref: "Salmo 122:6",
  },
  "pobres y desamparados": {
    text: "El que oprime al pobre insulta a su Hacedor, pero el que misericordia tiene honra al Señor.",
    ref: "Proverbios 14:31",
  },
  apartados: {
    text: "Porque yo sé los pensamientos que tengo acerca de vosotros, dice el Señor, pensamientos de paz, y no de mal, para daros el fin que esperáis.",
    ref: "Jeremías 29:11",
  },
  "destruyendo los diseños de las tinieblas": {
    text: "Porque las armas de nuestra guerra no son carnales, sino poderosas por medio de Dios para derribar fortalezas.",
    ref: "2 Corintios 10:4",
  },
  matrimonios: {
    text: "Por lo tanto, lo que Dios juntó, no lo separe el hombre.",
    ref: "Mateo 19:6",
  },
};

const FALLBACK = {
  text: "Encomienda al Señor tu camino, y confía en él, y él lo hará.",
  ref: "Salmo 37:5",
};

export function verseFor(topicTitle: string): { text: string; ref: string } {
  const key = topicTitle.trim().toLowerCase();
  return VERSES[key] ?? FALLBACK;
}
