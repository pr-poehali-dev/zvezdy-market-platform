import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { getUser, marketplaceApi, exchangeApi } from "@/lib/api";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [myGifts, setMyGifts] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showAdminAccess, setShowAdminAccess] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;

    try {
      const [giftsData, portfolioData] = await Promise.all([
        marketplaceApi.getMyGifts(user.id),
        exchangeApi.getPortfolio(user.id)
      ]);
      setMyGifts(giftsData);
      setPortfolio(portfolioData);
    } catch (error: any) {
      console.error("Error loading profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount < 100000) {
      toast.error("Минимальная сумма вывода: 100 000 звезд (100 реальных звезд Telegram)");
      return;
    }

    if (!telegramUsername) {
      toast.error("Введите ваш Telegram username");
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/027633ed-b57e-4954-8451-d768fb2cfa4c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_withdrawal',
          user_id: user.id,
          amount,
          telegram_username: telegramUsername
        })
      });

      if (response.ok) {
        toast.success("Заявка на вывод создана!", {
          description: "Администратор рассмотрит её в ближайшее время"
        });
        setShowWithdraw(false);
        setWithdrawAmount("");
        setTelegramUsername("");
      } else {
        toast.error("Ошибка создания заявки");
      }
    } catch (error) {
      toast.error("Ошибка создания заявки");
    }
  };

  const handleAdminAccess = () => {
    if (adminPassword === "markadmin2025") {
      toast.success("Доступ разрешен!");
      navigate("/admin");
    } else {
      toast.error("Неверный пароль");
      setAdminPassword("");
    }
  };

  const handleListForSale = async (userGiftId: number) => {
    const price = prompt("Введите цену продажи:");
    if (!price) return;

    try {
      await marketplaceApi.listForSale(userGiftId, parseInt(price));
      toast.success("Подарок выставлен на продажу!");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Ошибка");
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Icon name="Loader2" className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  const totalGiftsValue = myGifts.reduce((sum, gift) => sum + (gift.purchase_price || 0), 0);
  const totalStocksValue = portfolio.reduce((sum, item) => sum + (item.current_value || 0), 0);
  const totalStocksProfit = portfolio.reduce((sum, item) => sum + (item.profit || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-heading font-bold text-gold">Профиль</h1>
            <Button variant="outline" onClick={() => navigate("/")}>
              <Icon name="Home" className="mr-2" size={18} />
              На главную
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-gold">
                <AvatarFallback className="bg-gold text-primary-foreground font-heading text-3xl">
                  {user.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h2 className="text-3xl font-heading font-bold mb-2">{user.username}</h2>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {user.email && (
                    <div className="flex items-center gap-1">
                      <Icon name="Mail" size={16} />
                      {user.email}
                    </div>
                  )}
                  {user.telegram_username && (
                    <div className="flex items-center gap-1">
                      <Icon name="Send" size={16} />
                      @{user.telegram_username}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Icon name="Calendar" size={16} />
                    С {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setShowWithdraw(true)}
                  className="bg-green-500 hover:bg-green-600 text-white font-heading"
                >
                  <Icon name="Download" className="mr-2" size={18} />
                  Вывести звезды
                </Button>
                <Button
                  onClick={() => setShowAdminAccess(true)}
                  variant="outline"
                  className="font-heading"
                >
                  <Icon name="Shield" className="mr-2" size={18} />
                  Админ-панель
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-heading">Баланс</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold text-gold">
                {user.balance.toLocaleString()} ⭐
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-heading">Подарков</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold text-blue">
                {myGifts.length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                ~{totalGiftsValue.toLocaleString()} ⭐
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-heading">Акций</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold text-purple-500">
                {portfolio.reduce((sum, item) => sum + item.shares, 0)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                ~{totalStocksValue.toLocaleString()} ⭐
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-heading">Прибыль</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-heading font-bold ${totalStocksProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalStocksProfit >= 0 ? '+' : ''}{totalStocksProfit.toLocaleString()} ⭐
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="gifts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="gifts">Мои подарки</TabsTrigger>
            <TabsTrigger value="stocks">Мой портфель</TabsTrigger>
          </TabsList>

          <TabsContent value="gifts" className="space-y-4">
            {myGifts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Icon name="Package" className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <p className="text-muted-foreground">У вас пока нет подарков</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {myGifts.map((gift) => (
                  <Card key={gift.id} className="hover:border-gold/50 transition-all">
                    <CardHeader>
                      <div className="flex flex-col items-center gap-3">
                        <div className="text-6xl">{gift.image_emoji || "🎁"}</div>
                        <CardTitle className="text-center text-base">{gift.name}</CardTitle>
                        {gift.is_on_sale && (
                          <Badge className="bg-green-500">На продаже</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-muted-foreground text-center">
                        Куплено: {new Date(gift.purchased_at).toLocaleDateString()}
                      </div>
                      <div className="text-center font-heading font-bold text-gold">
                        {gift.purchase_price?.toLocaleString()} ⭐
                      </div>
                      {!gift.is_on_sale && (
                        <Button
                          onClick={() => handleListForSale(gift.id)}
                          size="sm"
                          className="w-full bg-blue hover:bg-blue/90"
                        >
                          <Icon name="Tag" className="mr-2" size={14} />
                          Продать
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stocks" className="space-y-4">
            {portfolio.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Icon name="TrendingUp" className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <p className="text-muted-foreground">У вас пока нет акций</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {portfolio.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-heading font-bold">{item.name}</h3>
                            <Badge variant="outline">{item.ticker}</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Акций</div>
                              <div className="font-semibold">{item.shares}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Средняя цена</div>
                              <div className="font-semibold">{item.average_buy_price?.toLocaleString()} ⭐</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Текущая цена</div>
                              <div className="font-semibold">{item.current_price?.toLocaleString()} ⭐</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-heading font-bold text-gold mb-1">
                            {item.current_value?.toLocaleString()} ⭐
                          </div>
                          <div className={`text-lg font-semibold ${item.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {item.profit >= 0 ? '+' : ''}{item.profit?.toLocaleString()} ⭐
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Вывод звезд</DialogTitle>
            <DialogDescription>
              Минимальная сумма: 100 000 звезд (100 реальных звезд Telegram)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Сумма вывода</Label>
              <Input
                type="number"
                placeholder="100000"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="100000"
                step="1000"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {withdrawAmount && parseInt(withdrawAmount) >= 100000 
                  ? `≈ ${Math.floor(parseInt(withdrawAmount) / 1000)} реальных звезд Telegram` 
                  : ""}
              </p>
            </div>

            <div>
              <Label>Ваш Telegram username</Label>
              <Input
                placeholder="@username"
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
              />
            </div>

            <Button
              onClick={handleWithdraw}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-heading"
            >
              <Icon name="Send" className="mr-2" size={18} />
              Отправить заявку
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdminAccess} onOpenChange={setShowAdminAccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Доступ к админ-панели</DialogTitle>
            <DialogDescription>
              Введите пароль администратора
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Пароль</Label>
              <Input
                type="password"
                placeholder="Введите пароль"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminAccess()}
              />
            </div>

            <Button
              onClick={handleAdminAccess}
              className="w-full bg-gold hover:bg-gold/90 text-primary-foreground font-heading"
            >
              <Icon name="LogIn" className="mr-2" size={18} />
              Войти
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;