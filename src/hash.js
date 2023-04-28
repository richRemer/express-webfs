import {createHash} from "crypto";

export default function hash(...values) {
  const hash = createHash("sha256");

  for (let value of values) {
    if (value instanceof Date) {
      value = String(value.getTime());
    } else if (typeof value === "number") {
      value = String(value);
    }

    hash.update(value);
  }

  return hash.digest("hex");
}
