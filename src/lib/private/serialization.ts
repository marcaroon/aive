import { Timestamp } from "firebase/firestore";

/** Preserve timestamps across the server boundary without persisting locale labels. */
export function serialize(value: unknown): unknown {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof value.toMillis === "function"
  ) {
    return { __aiveTimestamp: value.toMillis() };
  }
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, serialize(item)]),
    );
  }
  return value;
}

export function deserialize<T>(value: unknown): T {
  if (
    value &&
    typeof value === "object" &&
    "__aiveTimestamp" in value &&
    typeof value.__aiveTimestamp === "number"
  ) {
    return Timestamp.fromMillis(value.__aiveTimestamp) as T;
  }
  if (Array.isArray(value)) return value.map((item) => deserialize(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, deserialize(item)]),
    ) as T;
  }
  return value as T;
}
