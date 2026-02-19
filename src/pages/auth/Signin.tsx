import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/PasswordInput";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { setStoredUser, setToken } from "@/lib/auth";
import { signin as signinApi } from "@/lib/api/auth";

const signinSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

type SigninForm = z.infer<typeof signinSchema>;

export default function Signin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");

  const form = useForm<SigninForm>({
    resolver: zodResolver(signinSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  async function onSubmit(values: SigninForm) {
    try {
      const { user, token } = await signinApi(values.email, values.password);
      setToken(token);
      setStoredUser(user);
      toast.success("Signed in successfully.");
      const safeRedirect = redirect && redirect.startsWith("/") && !redirect.startsWith("//");
      if (safeRedirect) {
        navigate(redirect);
      } else if (user.role === "admin") {
        navigate("/dashboard/admin");
      } else if (user.role === "seller") {
        navigate("/dashboard/seller");
      } else if (user.role === "shelter") {
        navigate("/dashboard/shelter");
      } else if (user.role === "adopter") {
        navigate("/profile");
      } else {
        navigate("/");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sign in failed.";
      toast.error(msg);
      form.setError("root", { message: msg });
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Sign in to your account."
      footerLink={{ to: "/auth/signup", label: "Don't have an account? Sign up" }}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="signin-email">Email</FormLabel>
                <FormControl>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-required
                    className="rounded-lg transition-colors focus-visible:ring-2"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="signin-password">Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    id="signin-password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    aria-required
                    className="rounded-lg"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center justify-between gap-4">
            <FormField
              control={form.control}
              name="remember"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      id="signin-remember"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Remember me"
                    />
                  </FormControl>
                  <FormLabel htmlFor="signin-remember" className="!mt-0 cursor-pointer font-normal">
                    Remember me
                  </FormLabel>
                </FormItem>
              )}
            />
            <Link
              to="#"
              className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Forgot password?
            </Link>
          </div>
          <Button
            type="submit"
            className="w-full rounded-lg h-11 font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Sign in
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
