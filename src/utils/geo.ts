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
const dimensions: (keyof Place)[] = ["lat", "lon"];

let tree: kdTree<Place> | null = null;

export async function initGeo() {
  tree = new kdTree<Place>([], distance, dimensions);

  await fetch("./data/data.json").then(async (data) => {
    const json = (await data.json()) as { [country: string]: Place[] };
    for (const [country, places] of Object.entries(json)) {
      for (const place of places) {
        tree?.insert({ ...place, country } as Place);
      }
    }
  });

  await fetch("./data/se.json").then(async (data) => {
    const places = (await data.json()) as Place[];
    for (const place of places) {
      tree?.insert(place);
    }
  });

  console.log("Geo tree initialized.");
  geoInit.value = false;
}

export function nearest(lat: number, lon: number) {
  if (!tree) throw new Error("Geo tree not initialized. Call initGeo() first.");
  return tree.nearest({ lat, lon } as Place, 1)[0][0];
}
