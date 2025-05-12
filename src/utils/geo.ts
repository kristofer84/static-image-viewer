import { kdTree } from "kd-tree-javascript";
import { ref } from "vue";

type Place = {
  location: string;
  country?: string;
  lat: number;
  lon: number;
};

const distance = (a: Place, b: Place) => Math.pow(a.lat - b.lat, 2) + Math.pow(a.lon - b.lon, 2);
export const geoInit = ref(true);
export const geoStatus = ref("");
const dimensions: (keyof Place)[] = ["lat", "lon"];

let tree: kdTree<Place> | null = null;

export async function initGeo() {
  geoStatus.value = "Loading global geo data...";
  tree = new kdTree<Place>([], distance, dimensions);

  await import("../data/data.json").then((data) => {
    const d = data as { default: { [country: string]: Place[] } };
    for (const [country, places] of Object.entries(d.default)) {
      for (const place of places) {
        tree?.insert({ ...place, country } as Place);
      }
    }
  });

  geoStatus.value = "Loading local geo data for SE..";
  await import("../data/se.json").then((data) => {
    const places = data as { default: Place[] };
    for (const place of places.default) {
      tree?.insert(place);
    }
  });

  geoStatus.value = "Geo data loaded";
  console.log("Geo tree initialized.");
  geoInit.value = false;
}

export function nearest(lat: number, lon: number) {
  if (!tree) throw new Error("Geo tree not initialized. Call initGeo() first.");
  return tree.nearest({ lat, lon } as Place, 1)[0][0];
}
