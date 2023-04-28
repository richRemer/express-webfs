export default function fullURL(req) {
  if (!req.fullURL) {
    req.fullURL = new URL(`${req.protocol}://${req.get("host")}${req.url}`);
  }

  return req.fullURL;
}
