import { useState } from "react";
import { useQuery } from "@apollo/client";
import { RESTAURANTS_QUERY } from "../queries";
import type { RestaurantsQuery, RestaurantsQueryVariables } from "../generated/graphql";
import { RestaurantCard } from "../RestaurantCard";

export default function BrowsePage() {
  const [city, setCity] = useState("");
  const [search, setSearch] = useState("");

  const { data, loading, error } = useQuery<RestaurantsQuery, RestaurantsQueryVariables>(
    RESTAURANTS_QUERY,
    {
      variables: {
        city: city.trim() || undefined,
        search: search.trim() || undefined,
      },
    },
  );

  return (
    <>
      <div className="filters">
        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <input
          type="text"
          placeholder="Search restaurants"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p className="status">Loading restaurants…</p>}
      {error && <p className="status status--error">Failed to load: {error.message}</p>}
      {data && data.restaurants.length === 0 && <p className="status">No restaurants found.</p>}

      <div className="restaurant-list">
        {data?.restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
    </>
  );
}
