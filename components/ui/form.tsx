"use client";

import * as React from "react";
import { useFormContext, Controller, FormProvider } from "react-hook-form";

export function Form({ children, ...props }: React.PropsWithChildren<{}>) {
  return <form {...props}>{children}</form>;
}

export function FormField({ name, control, render }: any) {
  return <Controller name={name} control={control} render={render} />;
}

export function FormItem({ children }: React.PropsWithChildren<{}>) {
  return <div className="space-y-2">{children}</div>;
}

export function FormLabel({ children }: React.PropsWithChildren<{}>) {
  return <label className="block text-sm font-medium">{children}</label>;
}

export function FormControl({ children }: React.PropsWithChildren<{}>) {
  return <div>{children}</div>;
}

export function FormMessage({ children }: React.PropsWithChildren<{}>) {
  const { formState } = useFormContext();
  // This is a placeholder; you may want to improve error handling
  return (
    <span className="text-xs text-red-500">
      {children ||
        (typeof formState.errors?.message === "string"
          ? formState.errors?.message
          : "")}
    </span>
  );
}
