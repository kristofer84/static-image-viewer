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
    const json = (await data.json()) as {
      [country: string]: {
        [location: string]: number[];
      };
    };
    for (const [country, places] of Object.entries(json)) {
      for (const [location, coords] of Object.entries(places)) {
        tree?.insert({ country, location, lat: coords[0], lon: coords[1] } as Place);
      }
    }
  });

  await fetch("./data/se.json").then(async (data) => {
    const places = (await data.json()) as {
      [location: string]: number[];
    };
    for (const [location, coords] of Object.entries(places)) {
      tree?.insert({ location, lat: coords[0], lon: coords[1] } as Place);
    }
  });

  console.log("Geo tree initialized.");
  geoInit.value = false;
}

export function nearest(lat: number, lon: number) {
  if (!tree) throw new Error("Geo tree not initialized. Call initGeo() first.");
  return tree.nearest({ lat, lon } as Place, 1)[0][0];
}
