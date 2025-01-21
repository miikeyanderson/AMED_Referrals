import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export default function AuthPage() {
  const { toast } = useToast();
  const { login, register } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>, mode: "login" | "register") {
    try {
      setIsLoading(true);
      const result = await (mode === "login" ? login(values) : register(values));
      
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
        return;
      }

      toast({
        title: "Success",
        description: mode === "login" ? "Logged in successfully" : "Registered successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">ARM Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter username" {...field} />
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <TabsContent value="login">
                  <Button
                    type="button"
                    className="w-full"
                    disabled={isLoading}
                    onClick={() => onSubmit(form.getValues(), "login")}
                  >
                    Login
                  </Button>
                </TabsContent>
                <TabsContent value="register">
                  <Button
                    type="button"
                    className="w-full"
                    disabled={isLoading}
                    onClick={() => onSubmit(form.getValues(), "register")}
                  >
                    Register
                  </Button>
                </TabsContent>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
