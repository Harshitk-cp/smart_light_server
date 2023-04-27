import * as os from "node:os";

const getExternalIP = () => {
  const interfaces = Object.values(os.networkInterfaces()).flat();
  const addresses = interfaces
    .filter((i): i is os.NetworkInterfaceInfo => i !== undefined)
    .map((i) => i.address);
  return addresses.find((a) => a.startsWith("192.168."));
};

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

export { getExternalIP, isGoodCommand };
