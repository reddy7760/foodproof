import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { RESTAURANTS_QUERY, RESTAURANT_FILTER_OPTIONS_QUERY } from "../queries";
import type {
  RestaurantFilterOptionsQuery,
  RestaurantsQuery,
  RestaurantsQueryVariables,
} from "../generated/graphql";
import { RestaurantCard } from "../RestaurantCard";
import { SearchableDropdown } from "../SearchableDropdown";

const AREA_CITY_SEPARATOR = "|";

export default function BrowsePage() {
  const [areaCity, setAreaCity] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [selectedDish, setSelectedDish] = useState<string | undefined>(undefined);

  const [area, city] = areaCity ? areaCity.split(AREA_CITY_SEPARATOR) : [undefined, undefined];

  // Unfiltered, so the dropdown options always reflect the full set of restaurants —
  // independent of whatever city/search filter is currently applied.
  const { data: filterOptionsData } = useQuery<RestaurantFilterOptionsQuery>(
    RESTAURANT_FILTER_OPTIONS_QUERY,
  );

  const areaCityOptions = useMemo(() => {
    const labelByValue = new Map<string, string>();
    for (const r of filterOptionsData?.restaurants ?? []) {
      if (!r.address) continue;
      labelByValue.set(`${r.address}${AREA_CITY_SEPARATOR}${r.city}`, `${r.address}, ${r.city}`);
    }
    return [...labelByValue.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [filterOptionsData]);

  const restaurantOptions = useMemo(
    () =>
      [...(filterOptionsData?.restaurants ?? [])]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((r) => ({ value: r.name, label: r.name })),
    [filterOptionsData],
  );

  const { data, loading, error } = useQuery<RestaurantsQuery, RestaurantsQueryVariables>(
    RESTAURANTS_QUERY,
    {
      variables: { city, search },
    },
  );

  // `city` is applied server-side (as before); `area` narrows the result further,
  // client-side, since the dataset is small enough that a dedicated backend param
  // isn't worth it yet.
  const displayedRestaurants = useMemo(() => {
    const all = data?.restaurants ?? [];
    return area ? all.filter((r) => r.address === area) : all;
  }, [data, area]);

  const resolvedRestaurant = displayedRestaurants.length === 1 ? displayedRestaurants[0] : null;

  const dishOptions = useMemo(
    () => (resolvedRestaurant?.dishes ?? []).map((d) => ({ value: d.name, label: d.name })),
    [resolvedRestaurant],
  );

  useEffect(() => {
    setSelectedDish(undefined);
  }, [resolvedRestaurant?.id]);

  return (
    <>
      <div className="filters">
        <SearchableDropdown
          inputId="area-city-filter"
          options={areaCityOptions}
          value={areaCity}
          onChange={setAreaCity}
          placeholder="Area, City"
        />
        <SearchableDropdown
          inputId="restaurant-filter"
          options={restaurantOptions}
          value={search}
          onChange={setSearch}
          placeholder="Search restaurants"
        />
        <SearchableDropdown
          inputId="dish-filter"
          options={dishOptions}
          value={selectedDish}
          onChange={setSelectedDish}
          placeholder={resolvedRestaurant ? "Dish" : "Select a restaurant first"}
          isDisabled={!resolvedRestaurant}
        />
      </div>

      {loading && <p className="status">Loading restaurants…</p>}
      {error && <p className="status status--error">Failed to load: {error.message}</p>}
      {data && displayedRestaurants.length === 0 && <p className="status">No restaurants found.</p>}

      <div className="restaurant-list">
        {displayedRestaurants.map((restaurant) => {
          const reviews = selectedDish
            ? restaurant.reviews.filter((r) => r.dishName === selectedDish)
            : restaurant.reviews;
          return <RestaurantCard key={restaurant.id} restaurant={{ ...restaurant, reviews }} />;
        })}
      </div>
    </>
  );
}
