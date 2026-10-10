import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ApolloProvider } from "@apollo/client";
import { BrowserRouter } from "react-router-dom";
import { client } from "./apolloClient";
import { AuthProvider } from "./AuthContext";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ApolloProvider>
  </StrictMode>,
);
