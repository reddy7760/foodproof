import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const signupSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (values: SignupForm) => {
    setServerError(null);
    try {
      await signup(values.name, values.email, values.password, values.phone || undefined);
      navigate("/", { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Signup failed");
    }
  };

  return (
    <div className="auth-page">
      <h2>Sign up</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label>
          Name
          <input type="text" autoComplete="name" {...register("name")} />
          {errors.name && <span className="field-error">{errors.name.message}</span>}
        </label>
        <label>
          Email
          <input type="email" autoComplete="email" {...register("email")} />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
        </label>
        <label>
          Phone (optional)
          <input type="tel" autoComplete="tel" {...register("phone")} />
        </label>
        <label>
          Password
          <input type="password" autoComplete="new-password" {...register("password")} />
          {errors.password && <span className="field-error">{errors.password.message}</span>}
        </label>
        <label>
          Confirm password
          <input type="password" autoComplete="new-password" {...register("confirmPassword")} />
          {errors.confirmPassword && (
            <span className="field-error">{errors.confirmPassword.message}</span>
          )}
        </label>
        {serverError && <p className="status status--error">{serverError}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing up…" : "Sign up"}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
