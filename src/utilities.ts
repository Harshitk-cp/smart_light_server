import * as os from "node:os";

const getLocalIPv4Address = () => {
  const interfaces = os.networkInterfaces();
  const addresses = Object.values(interfaces)
    .flat()
    .filter(
      (i): i is os.NetworkInterfaceInfo =>
        i !== undefined && i.family === "IPv4"
    )
    .map((i) => i.address);
  const first = addresses[0];
  if (!first) throw new Error("Failed to find local IPv4 address.");
  return first;
};

export { getLocalIPv4Address };
