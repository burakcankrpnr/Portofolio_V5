/**
 * @param {string[]} usernames
 * @param {string} [filename]
 */
export function exportUsernamesCsv(usernames, filename = "followscope.csv") {
  const lines = ["username,profile_url"];
  for (const username of usernames) {
    const safe = String(username).replaceAll('"', '""');
    lines.push(`"${safe}","https://www.instagram.com/${safe}/"`);
  }
  const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
