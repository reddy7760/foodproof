import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      const from = (location.state as { from?: Location })?.from?.pathname ?? "/";
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="auth-page">
      <h2>Log in</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label>
          Email
          <input type="email" autoComplete="email" {...register("email")} />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" {...register("password")} />
          {errors.password && <span className="field-error">{errors.password.message}</span>}
        </label>
        {serverError && <p className="status status--error">{serverError}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p>
        No account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
}
