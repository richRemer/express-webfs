const index = Symbol("indexMIME.index");

export default function indexMIME(mimedb) {
  if (!mimedb[index]) {
    mimedb[index] = {};

    for (const [type, {extensions, charset}] of Object.entries(mimedb)) {
      if (extensions) for (const ext of extensions) {
        const [media, subtype] = type.split("/");
        const content = charset && media === "text"
          ? `${type}; charset=${charset}`
          : type;

        mimedb[index][ext] = {type, media, subtype, content};
      }
    }
  }

  return mimedb[index];
}
