import { Input } from "@korex/ui/components/input";
import { Label } from "@korex/ui/components/label";
import { useId } from "react";
import { ErrorMessage } from "@/components/error-message";

type FieldError = { message?: string } | undefined;

type AccountFieldApi<TError extends FieldError> = {
  name: string;
  state: {
    value: string;
    meta: {
      errors: TError[];
    };
  };
  handleBlur: () => void;
  handleChange: (value: string) => void;
};

type AccountFieldProps<TError extends FieldError> = {
  field: AccountFieldApi<TError>;
  label: string;
  placeholder: string;
  type?: "email" | "password" | "text";
};

function AccountField<TError extends FieldError>({
  field,
  label,
  placeholder,
  type = "text",
}: AccountFieldProps<TError>) {
  const id = useId();
  const errorId = `${id}-error`;
  const hasErrors = field.state.meta.errors.length > 0;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={field.name}
        type={type}
        placeholder={placeholder}
        value={field.state.value}
        aria-invalid={hasErrors}
        aria-describedby={hasErrors ? errorId : undefined}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
      />
      {hasErrors ? (
        <div id={errorId}>
          {field.state.meta.errors.map((error) => (
            <ErrorMessage key={error?.message} message={error?.message} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { AccountField };
