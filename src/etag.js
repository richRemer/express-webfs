export function match(req, etag) {
  let match;

  switch (req.method) {
    case "HEAD":
    case "GET":
    case "PUT":
      match = req.get("If-Match");
      return match ? match === etag : true;
    case "DELETE":
      match = req.get("If-Match");
      return match ? match === etag : true;
    default:
      return true;
  }
}

export function noneMatch(req, etag) {
  let noneMatch;

  switch (req.method) {
    case "HEAD":
    case "GET":
      noneMatch = req.get("If-None-Match");
      return noneMatch ? noneMatch !== etag : true;
    case "PUT":
      noneMatch = req.get("If-None-Match");
      return noneMatch === "*"
        ? Boolean(etag)
        : (noneMatch ? noneMatch !== etag : true);
    default:
      return true;
  }
}
