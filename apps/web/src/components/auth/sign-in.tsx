import { Button } from "@korex/ui/components/button";
import { Input } from "@korex/ui/components/input";
import { Label } from "@korex/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { toast } from "sonner";
import z from "zod";
import { RouteAccent } from "@/components/brand";
import { authClient } from "@/lib/auth-client";
import { ErrorMessage } from "../error-message";

const SignUpSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function SignIn() {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            navigate({
              to: "/dashboard",
            });
            toast.success("Sign in successful");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: SignUpSchema,
    },
  });

  return (
    <MotionConfig
      transition={{
        type: "tween",
        duration: 0.15,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <div className="flex w-full max-w-sm flex-col gap-6 md:max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={"title"}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <p className="hidden font-display text-[11px] text-muted-foreground uppercase tracking-[0.18em] lg:block">
              Account access
            </p>
            <h1 className="font-display text-4xl lowercase leading-none tracking-tight lg:mt-2 lg:text-5xl">
              Welcome back
            </h1>
            <p className="mt-2 text-muted-foreground text-sm">
              Your trail starts here.
            </p>
            <RouteAccent className="mt-3 h-3 w-16 text-primary" />
          </motion.div>
        </AnimatePresence>
        <div className="flex flex-col gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="flex flex-col gap-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
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
                      onChange={(e) => field.handleChange(e.target.value)}
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
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <form.Field name="password">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Password</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      placeholder="••••••••••••"
                      value={field.state.value}
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-describedby={
                        field.state.meta.errors.length > 0
                          ? `${field.name}-error`
                          : undefined
                      }
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
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
            </motion.div>
            <motion.div
              className="mt-2 w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <form.Subscribe
                selector={(state) => ({
                  canSubmit: state.canSubmit,
                  isSubmitting: state.isSubmitting,
                })}
              >
                {({ canSubmit, isSubmitting }) => (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!canSubmit || isSubmitting}
                    loading={isSubmitting}
                    loadingText="Submitting..."
                  >
                    Sign in
                  </Button>
                )}
              </form.Subscribe>
            </motion.div>
          </form>
          <p className="w-full text-center text-muted-foreground text-sm">
            Need an account?{" "}
            <Link
              to="/auth/sign-up"
              className="hover:text-accent-foreground hover:underline hover:underline-offset-1"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </MotionConfig>
  );
}

export { SignIn };
