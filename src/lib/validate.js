export function sanitizeString(str) {
  return String(str)
    .replace(/[<>]/g, "")        // anti XSS
    .replace(/script/gi, "");    // blok <script>
}

export function isValidId(id) {
  return Number.isInteger(id) && id > 0;
}

export function isValidDate(dateStr) {
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

// Validasi biodata sebelum insert/update
export function validateBiodata(body) {
  const required = [
    "nama",
    "nickname",
    "tanggal_lahir",
    "tempat_lahir",
    "jabatan",
    "jenis_kelamin",
    "prov",
    "kab",
    "kec",
    "kel",
  ];

  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      return `${field} wajib diisi`;
    }
  }

  if (!isValidDate(body.tanggal_lahir)) {
    return "tanggal_lahir tidak valid";
  }

  return null;
}
