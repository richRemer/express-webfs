import {promises as fs} from "fs";
import {basename, extname, join, resolve} from "path";
import {Router} from "express";
import mimedb from "mime-db";
import bytesized from "bytesized";

import {
  indexMIME, WebRoot, acceptable, allowable, limited, supported,
  HEAD, GET, PUT, DELETE
} from "@welib/express-webfs/lib";

export default function webfs(root, {
  readOnly=false,
  simpleUpdate=false,
  temp=join(root, ".tmp"),
  mime=mimedb,
  maxSize = bytesized("20 MiB")
}={}) {
  const router = Router();
  const mimedb = indexMIME(mime);
  const webroot = new WebRoot(root, temp);

  router.use(allowable(readOnly))
  router.use(supported(mimedb))
  router.use(acceptable(mimedb))
  router.use(limited(maxSize))

  router.route("*")
    .head(HEAD(webroot, mimedb))
    .get(GET(webroot, mimedb))
    .put(PUT(webroot, simpleUpdate))
    .delete(DELETE(webroot, simpleUpdate));

  return router;
}
