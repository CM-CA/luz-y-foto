// Las pruebas dependen de la zona horaria (la hora de la puesta se calcula en la del dispositivo):
// se fija antes de que arranquen los procesos de prueba, que la heredan.
export function setup() {
  process.env.TZ = "Europe/Madrid";
}
