import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useAuthStore } from "#/stores/useAuthStore";
import { useEffect, useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { CippusMark } from "#/components/CippusMark";

export const Route = createFileRoute("/auth/register")({ component: RegisterPage });

const registerSchema = z.object({
    username: z.string().min(2, "Please enter a username"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "A password of 8 characters is required"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
})

type RegisterFormData = z.infer<typeof registerSchema>

type FieldProps = {
    id: string
    label: string
    type?: string
    placeholder?: string
    autoComplete?: string
    helper?: string
    prefix?: string
    error?: string
    registerProps?: React.InputHTMLAttributes<HTMLInputElement>
}

function Field({ id, label, type = "text", placeholder, autoComplete, helper, prefix, error, registerProps }: FieldProps) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label
                htmlFor={id}
                style={{ fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-text-secondary)", fontWeight: 500 }}
            >
                {label}
            </label>
            <div
                style={{ display: "flex", alignItems: "baseline", gap: 6, borderBottom: "1px solid var(--color-border)", transition: "border-color 160ms ease" }}
                onFocus={(e) => { e.currentTarget.style.borderBottomColor = "var(--color-accent)" }}
                onBlur={(e) => { e.currentTarget.style.borderBottomColor = "var(--color-border)" }}
            >
                {prefix && (
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--color-text-muted)", paddingBottom: 12 }}>
                        {prefix}
                    </span>
                )}
                <input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--color-text-primary)", background: "transparent", border: "none", padding: "10px 2px 12px", outline: "none", flex: 1, width: "100%" }}
                    {...registerProps}
                />
            </div>
            {helper && (
                <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: 12, color: "var(--color-text-muted)", fontStyle: "italic", lineHeight: 1.45 }}>
                    {helper}
                </p>
            )}
            {error && (
                <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: 12, color: "var(--color-accent)", lineHeight: 1.45 }}>
                    {error}
                </p>
            )}
        </div>
    )
}

function ClientOnly({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true) }, []);
    if (!mounted) return null;
    return <>{children}</>;
}

function RegisterPage() {
    const captchaRef = useRef<ReCAPTCHA>(null);
    const navigate = useNavigate();
    const [registerError, setRegisterError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: { username: "", email: "", password: "", confirmPassword: "" }
    })

    async function onSubmit(data: RegisterFormData) {
        const token = captchaRef.current?.getValue()
        if (!token) {
            setRegisterError("Please complete the captcha")
            return
        }
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + "/api/v1/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, captcha: token })
            });
            if (!res.ok) throw new Error("Register failed");
            const body = await res.json();
            useAuthStore.getState().setUser(body.user);
            useAuthStore.getState().setToken(body.accessToken);
            navigate({ to: "/" });
        } catch {
            setRegisterError("Something went wrong. Please try again.");
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <main className="flex-1 flex items-start md:items-center justify-center" style={{ padding: "clamp(16px, 2.5vh, 56px) 24px clamp(12px, 1.5vh, 32px)" }}>
                <section aria-labelledby="register-heading" style={{ width: "100%", maxWidth: "clamp(360px, 22vw, 480px)", display: "flex", flexDirection: "column" }}>
                    <h1 id="register-heading" style={{ position: "absolute", left: -9999 }}>Start a log on Cippus</h1>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "clamp(6px, 1.2vh, 18px)", marginBottom: "clamp(12px, 1.8vh, 40px)" }}>
                        <div
                            className="[&>svg]:w-full [&>svg]:h-full"
                            style={{ width: "clamp(60px, 9vh, 144px)", height: "clamp(60px, 9vh, 144px)" }}
                        >
                            <CippusMark size={144} />
                        </div>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "clamp(24px, 3vh, 34px)", letterSpacing: "0.02em", lineHeight: 1, color: "var(--color-text-primary)" }}>
                            Cippus
                        </div>
                        <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: "500", fontSize: "clamp(14px, 2vh, 18px)", color: "var(--color-text-secondary)", margin: 0, textAlign: "center", letterSpacing: "0.005em", lineHeight: 1.35, maxWidth: 320, marginTop: "clamp(8px, 1vh, 16px)" }}>
                            What are you working on?
                        </p>
                    </div>

                    {registerError && (
                        <p style={{ margin: "0 0 16px", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-accent)", textAlign: "center" }}>
                            {registerError}
                        </p>
                    )}

                    <form noValidate style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 1.5vh, 24px)" }} onSubmit={handleSubmit(onSubmit)}>
                        <Field id="email" label="Email" type="email" autoComplete="email" placeholder="you@workshop"
                            error={errors.email?.message} registerProps={register("email")} />

                        <Field id="username" label="Your builder name" type="text" autoComplete="username" placeholder="mara_k"
                            prefix="@" helper="What others will see when they pass through your log."
                            error={errors.username?.message} registerProps={register("username")} />

                        <Field id="password" label="Password" type="password" autoComplete="new-password" placeholder="••••••••"
                            helper="Eight characters or more. Something only you'd write."
                            error={errors.password?.message} registerProps={register("password")} />

                        <Field id="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" placeholder="••••••••"
                            error={errors.confirmPassword?.message} registerProps={register("confirmPassword")} />

                        <ClientOnly>
                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <ReCAPTCHA ref={captchaRef} sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} />
                            </div>
                        </ClientOnly>

                        <button
                            type="submit"
                            style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 15, letterSpacing: "0.05em", color: "var(--color-text-on-accent)", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-sm)", padding: "14px 18px", cursor: "pointer", textAlign: "center", lineHeight: 1, width: "100%" }}
                        >
                            Start building
                        </button>

                        <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)", textAlign: "center", lineHeight: 1.55 }}>
                            By starting, you agree to the{" "}
                            <a href="#" style={{ color: "var(--color-text-secondary)", textDecoration: "none", borderBottom: "1px solid var(--color-border)", paddingBottom: 1 }}>
                                house rules
                            </a>
                            .
                        </p>
                    </form>

                    <div style={{ marginTop: "clamp(12px, 1.8vh, 40px)", display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
                        <span style={{ height: 1, flex: 1, maxWidth: 60, background: "var(--color-border)" }} />
                        <p style={{ margin: 0, textAlign: "center", fontSize: 14, color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}>
                            Already on the road?{" "}
                            <Link to="/auth/login" style={{ color: "var(--color-text-primary)", textDecoration: "none", borderBottom: "1px solid var(--color-border)", paddingBottom: 1, marginLeft: 6 }}>
                                Log in
                            </Link>
                        </p>
                        <span style={{ height: 1, flex: 1, maxWidth: 60, background: "var(--color-border)" }} />
                    </div>
                </section>
            </main>

            <footer style={{ padding: "20px 24px 28px", color: "var(--color-text-muted)", fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", textAlign: "center", opacity: 0.7 }}>
                <span>Cippus</span>
                <span style={{ display: "inline-block", width: 3, height: 3, borderRadius: "50%", background: "currentColor", verticalAlign: "middle", margin: "0 12px" }} />
                <span>A road of makers</span>
            </footer>
        </div>
    )
}
