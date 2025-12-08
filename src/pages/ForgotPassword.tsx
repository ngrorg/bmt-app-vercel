import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsLoading(false);
    setIsSubmitted(true);

    toast({
      title: "Email sent!",
      description: "Check your inbox for the password reset code.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col gradient-surface">
      {/* Header */}
      <div className="p-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-elevated p-8">
            {!isSubmitted ? (
              <>
                <div className="text-center mb-8">
                  <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                    <Mail className="h-8 w-8 text-accent" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Forgot your password?
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    Don't worry! Enter your email and we'll send you a code to
                    reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12"
                      autoComplete="email"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Code"
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-success" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                  Check your email
                </h1>
                <p className="text-muted-foreground mt-2 mb-6">
                  We've sent a password reset code to{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
                <Link to="/reset-password">
                  <Button className="w-full h-12 text-base font-semibold">
                    Enter Reset Code
                  </Button>
                </Link>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="mt-4 text-sm text-accent hover:underline"
                >
                  Didn't receive it? Try again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
