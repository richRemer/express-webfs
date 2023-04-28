import {extname} from "path";
import {indexMIME, fullURL} from "@welib/express-webfs/lib";

export function acceptable(mimedb) {
  const mime = indexMIME(mimedb);

  return function acceptable(req, res, next) {
    const ext = extname(fullURL(req).pathname).slice(1);
    const exttype = mime[ext]?.type || "application/octet-stream";

    // TODO: handle Accept-Encoding (or support re-encoding)
    // TODO: handle Accept-Language

    if (req.accepts(exttype)) {
      next();
    } else {
      res.sendStatus(406);
    }
  }
}

export function allowable(readOnly) {
  const allow = readOnly ? "GET,HEAD" : "GET,HEAD,PUT,DELETE";
  const allowed = allow.split(",").reduce((a,m) => ({...a, [m]: true}), {});

  return function allowable(req, res, next) {
    if (allowed[req.method]) {
      next();
    } else {
      res.set("Allow", allow);
      res.sendStatus(405);
    }
  }
}

export function limited(size) {
  return function limited(req, res, next) {
    const length = req.get("Content-Length") || NaN;

    if (req.method === "PUT" && isNaN(length)) {
      res.sendStatus(411);
    } else if (parseInt(length) > size) {
      res.sendStatus(413);
    } else {
      next();
    }
  }
}

export function supported(mimedb) {
  const mime = indexMIME(mimedb);

  return function supported(req, res, next) {
    const ext = extname(fullURL(req).pathname).slice(1);
    const exttype = mime[ext]?.type || "application/octet-stream";
    const content = req.get("Content-Type") || "";
    const type = content.split("/")[0];

    // TODO: verify Content-Encoding is supported

    if (!type || type === exttype || req.method !== "PUT") {
      next();
    } else {
      res.sendStatus(415);
    }
  }
}
