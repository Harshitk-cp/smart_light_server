import * as os from "node:os";

const getLocalIPv4Address = () => {
  const interfaces = os.networkInterfaces();
  const addresses = Object.values(interfaces)
    .flat()
    .filter((i): i is os.NetworkInterfaceInfo => i !== undefined && i.family === "IPv4")
    .map((i) => i.address);
  const first = addresses[0];
  if (!first) throw new Error("Failed to find local IPv4 address.");
  return first;
}

const isGoodCommand = (
  command: unknown
): command is { id: number; method: string; params: (string | number)[] } => {
  try {
    const casted = command as Record<string, unknown>;
    if (typeof casted.id !== "number") return false;
    if (typeof casted.method !== "string") return false;
    if (!Array.isArray(casted.params)) return false;
    for (const item of casted.params) {
      if (!["number", "string"].includes(typeof item)) return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};

export { getLocalIPv4Address, isGoodCommand };
