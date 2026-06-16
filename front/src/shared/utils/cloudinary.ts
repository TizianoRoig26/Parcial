export function getOptimizedImageUrl(
  url: string | null | undefined,
  transformations: string = "c_fill,w_300,f_auto,q_auto"
): string {
  if (!url) return "/placeholder-image.png";
  if (!url.includes("res.cloudinary.com")) {
    return url;
  }
  return url.replace("/upload/", `/upload/${transformations}/`);
}

export function obtenerId(url: string | null | undefined): string | null {
  if (!url || !url.includes("res.cloudinary.com")) return null;
  const partes = url.split("/upload/");
  if (partes.length < 2) return null;
  const rutaPartes = partes[1].split("/");
  if (rutaPartes[0].match(/^v\d+$/)) {
    rutaPartes.shift();
  }
  const rutaLimpia = rutaPartes.join("/");
  const indexPunto = rutaLimpia.lastIndexOf(".");
  return indexPunto > -1 ? rutaLimpia.substring(0, indexPunto) : rutaLimpia;
}
