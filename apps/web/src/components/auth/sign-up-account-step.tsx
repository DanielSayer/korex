import { Button } from "@korex/ui/components/button";
import { Input } from "@korex/ui/components/input";
import { Label } from "@korex/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import z from "zod";
import { RouteAccent } from "@/components/brand";
import { ErrorMessage } from "@/components/error-message";
import { authClient } from "@/lib/auth-client";

const accountSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function SignUpAccountStep({ onComplete }: { onComplete: () => void }) {
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
        },
        {
          onSuccess: () => {
            onComplete();
            toast.success("Account created");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: accountSchema,
    },
  });

  return (
    <motion.div
      key="account"
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -28 }}
      className="flex flex-col gap-6"
    >
      <div>
        <p className="hidden font-display text-[11px] text-muted-foreground uppercase tracking-[0.18em] lg:block">
          Create account
        </p>
        <h1 className="font-display text-3xl lowercase leading-none tracking-tight lg:mt-2 lg:text-4xl">
          Welcome
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Create your korex account.
        </p>
        <RouteAccent className="mt-3 h-3 w-16 text-primary" />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <form.Field name="name">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Name</Label>
              <Input
                id={field.name}
                name={field.name}
                placeholder="Test User"
                value={field.state.value}
                aria-invalid={field.state.meta.errors.length > 0}
                aria-describedby={
                  field.state.meta.errors.length > 0
                    ? `${field.name}-error`
                    : undefined
                }
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              {field.state.meta.errors.length > 0 ? (
                <div id={`${field.name}-error`}>
                  {field.state.meta.errors.map((error) => (
                    <ErrorMessage
                      key={error?.message}
                      message={error?.message}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Email</Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                placeholder="hello@korex.com"
                value={field.state.value}
                aria-invalid={field.state.meta.errors.length > 0}
                aria-describedby={
                  field.state.meta.errors.length > 0
                    ? `${field.name}-error`
                    : undefined
                }
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              {field.state.meta.errors.length > 0 ? (
                <div id={`${field.name}-error`}>
                  {field.state.meta.errors.map((error) => (
                    <ErrorMessage
                      key={error?.message}
                      message={error?.message}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Password</Label>
              <Input
                id={field.name}
                name={field.name}
                type="password"
                placeholder="Enter at least 8 characters"
                value={field.state.value}
                aria-invalid={field.state.meta.errors.length > 0}
                aria-describedby={
                  field.state.meta.errors.length > 0
                    ? `${field.name}-error`
                    : undefined
                }
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              {field.state.meta.errors.length > 0 ? (
                <div id={`${field.name}-error`}>
                  {field.state.meta.errors.map((error) => (
                    <ErrorMessage
                      key={error?.message}
                      message={error?.message}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button
              type="submit"
              className="mt-2 w-full"
              disabled={!canSubmit || isSubmitting}
              loading={isSubmitting}
              loadingText="Creating"
            >
              Continue
              <ArrowRight className="size-4" />
            </Button>
          )}
        </form.Subscribe>
      </form>

      <p className="text-center text-muted-foreground text-sm">
        Already have an account?{" "}
        <Link
          to="/auth/sign-in"
          className="font-medium text-foreground hover:underline hover:underline-offset-2"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}

export { SignUpAccountStep };
