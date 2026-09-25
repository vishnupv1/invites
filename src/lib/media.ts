export function shrinkPhoto(file: File) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const scale = Math.min(1, 720 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Could not read that photo."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.62));
    };
    image.onerror = () => reject(new Error("Could not read that photo."));
    image.src = url;
  });
}

export function readAudio(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (file.size > 1_500_000) {
      reject(new Error("Use an audio file under 1.5 MB, or paste a link."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that audio."));
    reader.readAsDataURL(file);
  });
}

export type PlaceHit = { label: string; lat: string; lng: string };

export async function searchPlaces(query: string) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`,
    { headers: { Accept: "application/json" } },
  );
  if (!response.ok) throw new Error("Place search failed.");
  const rows = (await response.json()) as { display_name: string; lat: string; lon: string }[];
  return rows.map((row) => ({ label: row.display_name, lat: row.lat, lng: row.lon }));
}
