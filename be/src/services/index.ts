export const services = ["profiles", "engine", "validation", "billing", "compliance"] as const;
export type ServiceName = (typeof services)[number];
