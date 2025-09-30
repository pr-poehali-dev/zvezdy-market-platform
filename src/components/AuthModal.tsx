import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import { authApi, saveUser, type User } from "@/lib/api";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (user: User) => void;
}

export const AuthModal = ({ open, onOpenChange, onSuccess }: AuthModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regTelegram, setRegTelegram] = useState("");

  const handleLogin = async () => {
    if (!loginUsername.trim()) {
      toast.error("Введите имя пользователя");
      return;
    }

    setIsLoading(true);
    try {
      const user = await authApi.login(loginUsername);
      saveUser(user);
      onSuccess(user);
      toast.success(`Добро пожаловать, ${user.username}!`);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Ошибка входа");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regUsername.trim()) {
      toast.error("Введите имя пользователя");
      return;
    }

    setIsLoading(true);
    try {
      const user = await authApi.register(regUsername, regEmail, regTelegram);
      saveUser(user);
      onSuccess(user);
      toast.success(`Аккаунт создан! Добро пожаловать, ${user.username}!`);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Ошибка регистрации");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="text-4xl">⭐</div>
            <DialogTitle className="text-2xl font-heading bg-gradient-to-r from-gold to-blue bg-clip-text text-transparent">
              Звезд Маркет
            </DialogTitle>
          </div>
          <DialogDescription className="text-center">
            Играйте и зарабатывайте реальные звезды Telegram!
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="register">Регистрация</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username">Имя пользователя</Label>
              <Input
                id="login-username"
                placeholder="Введите ваш никнейм"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-gold hover:bg-gold/90 text-primary-foreground font-heading"
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" className="mr-2 animate-spin" size={16} />
                  Вход...
                </>
              ) : (
                <>
                  <Icon name="LogIn" className="mr-2" size={16} />
                  Войти
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-username">Имя пользователя *</Label>
              <Input
                id="reg-username"
                placeholder="Придумайте никнейм"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-email">Email (опционально)</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="your@email.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-telegram">Telegram username (опционально)</Label>
              <Input
                id="reg-telegram"
                placeholder="@username"
                value={regTelegram}
                onChange={(e) => setRegTelegram(e.target.value)}
              />
            </div>

            <Button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full bg-blue hover:bg-blue/90 text-white font-heading"
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" className="mr-2 animate-spin" size={16} />
                  Регистрация...
                </>
              ) : (
                <>
                  <Icon name="UserPlus" className="mr-2" size={16} />
                  Создать аккаунт
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Новые пользователи начинают с 0 звезд
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;