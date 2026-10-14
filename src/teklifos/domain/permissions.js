export const ROLES = [
  { id: "owner", label: "Owner", hint: "Şirket ve ayarlar" },
  { id: "admin", label: "Admin", hint: "Operasyon yönetimi" },
  { id: "sales", label: "Sales", hint: "Teklif ve müşteri, maliyet gizli" },
  { id: "viewer", label: "Viewer", hint: "Salt okunur" },
];

export function canSeeCosts(role) {
  return role === "owner" || role === "admin";
}

export function canWrite(role) {
  return role === "owner" || role === "admin" || role === "sales";
}

export function canManualPrice(role) {
  return role === "owner" || role === "admin";
}

export function canManageSettings(role) {
  return role === "owner" || role === "admin";
}

export function canImportCosts(role) {
  return role === "owner" || role === "admin";
}

export function roleLabel(role) {
  return ROLES.find((item) => item.id === role)?.label || "Sales";
}
