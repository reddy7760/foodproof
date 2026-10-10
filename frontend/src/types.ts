import type { RestaurantsQuery } from "./generated/graphql";

export type Restaurant = RestaurantsQuery["restaurants"][number];
export type Dish = Restaurant["dishes"][number];
