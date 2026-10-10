import { ApolloClient, InMemoryCache } from "@apollo/client";

export const client = new ApolloClient({
  uri: "/graphql",
  credentials: "include", // send/receive the httpOnly auth cookie
  cache: new InMemoryCache(),
});
