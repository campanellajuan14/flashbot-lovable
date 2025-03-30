
import React, { ReactNode } from "react";
import { Toaster } from "sonner";

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  return (
    <>
      <Toaster position="top-right" richColors />
      {children}
    </>
  );
};
