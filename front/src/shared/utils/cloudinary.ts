/**
 * Optimiza una URL de Cloudinary agregando transformaciones.
 * Acepta un string, un array de strings, null o undefined.
 * Si es un array, optimiza la primera URL.
 */
export function getOptimizedImageUrl(
  url: string | string[] | null | undefined,
  transformations: string = "c_fill,w_300,f_auto,q_auto"
): string {
  const resolved = Array.isArray(url) ? url[0] : url;
  if (!resolved) return "/placeholder-image.png";
  if (!resolved.includes("res.cloudinary.com")) {
    return resolved;
  }
  return resolved.replace("/upload/", `/upload/${transformations}/`);
}

/**
 * Obtiene el public_id de Cloudinary a partir de una URL.
 * Acepta un string, un array de strings, null o undefined.
 * Si es un array, extrae el ID de la primera URL.
 */
export function obtenerId(url: string | string[] | null | undefined): string | null {
  const resolved = Array.isArray(url) ? url[0] : url;
  if (!resolved || !resolved.includes("res.cloudinary.com")) return null;
  const partes = resolved.split("/upload/");
  if (partes.length < 2) return null;
  const rutaPartes = partes[1].split("/");
  if (rutaPartes[0].match(/^v\d+$/)) {
    rutaPartes.shift();
  }
  const rutaLimpia = rutaPartes.join("/");
  const indexPunto = rutaLimpia.lastIndexOf(".");
  return indexPunto > -1 ? rutaLimpia.substring(0, indexPunto) : rutaLimpia;
}
