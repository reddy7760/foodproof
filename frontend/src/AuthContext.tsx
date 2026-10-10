import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { LOGIN_MUTATION, LOGOUT_MUTATION, ME_QUERY, SIGNUP_MUTATION } from "./queries";
import type {
  LoginMutation,
  LoginMutationVariables,
  MeQuery,
  SignupMutation,
  SignupMutationVariables,
} from "./generated/graphql";

type AuthUser = MeQuery["me"];

interface AuthContextValue {
  user: AuthUser;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, loading, refetch } = useQuery<MeQuery>(ME_QUERY, { fetchPolicy: "network-only" });
  const [loginMutation] = useMutation<LoginMutation, LoginMutationVariables>(LOGIN_MUTATION);
  const [signupMutation] = useMutation<SignupMutation, SignupMutationVariables>(SIGNUP_MUTATION);
  const [logoutMutation] = useMutation(LOGOUT_MUTATION);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: data?.me ?? null,
      loading,
      login: async (email: string, password: string) => {
        await loginMutation({ variables: { email, password } });
        await refetch();
      },
      signup: async (name: string, email: string, password: string, phone?: string) => {
        await signupMutation({ variables: { name, email, password, phone } });
        await refetch();
      },
      logout: async () => {
        await logoutMutation();
        await refetch();
      },
    }),
    [data, loading, loginMutation, signupMutation, logoutMutation, refetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
