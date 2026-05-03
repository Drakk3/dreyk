"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@dreyk/shared/supabase/browserClient";

interface LoginFormState {
  email: string;
  password: string;
  error: string | null;
  isLoading: boolean;
}

export default function LoginPage() {
  const [state, setState] = useState<LoginFormState>({
    email: "",
    password: "",
    error: null,
    isLoading: false,
  });

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setState((prev) => ({ ...prev, email: e.target.value, error: null }));
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setState((prev) => ({ ...prev, password: e.target.value, error: null }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const supabase = getSupabaseBrowserClient({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    });
    const { error } = await supabase.auth.signInWithPassword({
      email: state.email,
      password: state.password,
    });

    if (error !== null) {
      setState((prev) => ({ ...prev, isLoading: false, error: error.message }));
      return;
    }

    // El middleware redirige al dashboard tras sesión válida
    setState((prev) => ({ ...prev, isLoading: false }));
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>dreyk</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={state.email}
              onChange={handleEmailChange}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={state.password}
              onChange={handlePasswordChange}
            />
          </div>
          {state.error !== null && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={state.isLoading}>
            {state.isLoading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
