
import React, { ReactNode } from "react";
import { AuthProvider as OriginalAuthProvider } from "@/hooks/useAuth";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  return <OriginalAuthProvider>{children}</OriginalAuthProvider>;
};
