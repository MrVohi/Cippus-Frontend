import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod";
import { useAuthStore } from "#/stores/useAuthStore";
import { Label } from "#/components/ui/label";
import { Input } from "#/components/ui/input";
import { useState } from "react";

export const Route = createFileRoute("/auth/login")({ component: LoginPage })

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(1, "A password is required")
})

type LoginFormData = z.infer<typeof loginSchema>

function LoginPage() {

    const navigate = useNavigate();
    const [loginError, setLoginError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" }
    })

    async function onSubmit(data: LoginFormData) {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + "/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
            if (!(res.ok)) throw new Error("Login failed");
            const body = await res.json();
            useAuthStore.getState().setUser(body.user);
            useAuthStore.getState().setToken(body.accessToken);

            navigate({ to: "/" });
        } catch (error) {
            setLoginError("Invalid credentials");
        }


    }

    return <div className="flex flex-col flex-1">

        <div className="items-center flex flex-col pt-12 gap-10">
            <div className="pt-10">logo</div>
            <h1 className="font-display text-5xl pt-5">Cippus</h1>

            <h2 className="italic">Welcome back to the road.</h2>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center pb-40">
            {loginError && <p>{loginError}</p>}
            <form className="w-full  max-w-xs mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>

                <div className="flex flex-col gap-1">
                    <Label htmlFor="email" className="label">EMAIL</Label>
                    <Input id="email" placeholder="you@workshop" className="border-0 border-b border-(--color-border) rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0" {...register("email")} />
                    {errors.email && <p>{errors.email?.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="password" className="label">PASSWORD</Label>
                        <Link to="/auth/password-reset">Forgot it?</Link>
                    </div>
                    <Input id="password" type="password" className="border-0 border-b border-(--color-border) rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0" {...register("password")} />
                    {errors.password && <p>{errors.password?.message}</p>}
                </div>

                <button type="submit" className="btn-primary w-full">Continue building</button>
            </form >
            <p>First time here? <Link className="underline" to="/auth/register">Start a log</Link></p>
        </div>

        <footer>
            <p className="text-center label">
                CIPPUS • A ROAD OF MAKERS
            </p>
        </footer>
    </div>
}