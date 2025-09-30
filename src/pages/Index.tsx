import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import AuthModal from "@/components/AuthModal";
import P2PMarket from "@/components/P2PMarket";
import Exchange from "@/components/Exchange";
import { getUser, clearUser, saveUser, type User, tasksApi, marketplaceApi } from "@/lib/api";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [balance, setBalance] = useState(0);
  const [tasks, setTasks] = useState<any[]>([]);
  const [gifts, setGifts] = useState([
    { id: 1, name: "Леденец", price: 100, image: "🍭", rating: 2, category: "Starter", description: "Маленький и сладкий подарок для начинающих" },
    { id: 2, name: "Шоколадка", price: 250, image: "🍫", rating: 2, category: "Starter", description: "Вкусный шоколад поднимет настроение" },
    { id: 3, name: "Воздушный шар", price: 500, image: "🎈", rating: 3, category: "Classic", description: "Яркий и веселый подарок на праздник" },
    { id: 4, name: "Цветок", price: 800, image: "🌺", rating: 3, category: "Classic", description: "Красивый тропический цветок" },
    { id: 5, name: "Торт", price: 1200, image: "🎂", rating: 3, category: "Classic", description: "Праздничный торт для особого случая" },
    { id: 6, name: "Розы", price: 1500, image: "🌹", rating: 3, category: "Classic", description: "Букет красных роз - символ любви" },
    { id: 7, name: "Плюшевый мишка", price: 2000, image: "🧸", rating: 3, category: "Classic", description: "Милый плюшевый мишка для дорогих людей" },
    { id: 8, name: "Подарочная коробка", price: 3000, image: "🎁", rating: 4, category: "Premium", description: "Красиво упакованный сюрприз" },
    { id: 9, name: "Шампанское", price: 4000, image: "🍾", rating: 4, category: "Premium", description: "Бутылка игристого для торжества" },
    { id: 10, name: "Золотая звезда", price: 5000, image: "⭐", rating: 4, category: "Premium", description: "Сияющая звезда успеха" },
    { id: 11, name: "Ракета", price: 6500, image: "🚀", rating: 4, category: "Premium", description: "Символ амбиций и движения вперёд" },
    { id: 12, name: "Огонь", price: 8000, image: "🔥", rating: 5, category: "Exclusive", description: "Пламя страсти и энергии" },
    { id: 13, name: "Трофей победителя", price: 10000, image: "🏆", rating: 5, category: "Exclusive", description: "Кубок чемпиона для лучших из лучших" },
    { id: 14, name: "Бриллиант", price: 15000, image: "💎", rating: 5, category: "Exclusive", description: "Драгоценный камень вечной ценности" },
    { id: 15, name: "Единорог", price: 20000, image: "🦄", rating: 5, category: "Luxury", description: "Магическое мифическое существо" },
    { id: 16, name: "Корона", price: 25000, image: "👑", rating: 5, category: "Luxury", description: "Королевская корона власти и величия" },
    { id: 17, name: "Замок", price: 35000, image: "🏰", rating: 5, category: "Luxury", description: "Роскошный замок мечты" },
    { id: 18, name: "Дракон", price: 50000, image: "🐉", rating: 5, category: "Legendary", description: "Легендарный восточный дракон удачи" },
    { id: 19, name: "Космический корабль", price: 75000, image: "🛸", rating: 5, category: "Legendary", description: "Межгалактический звездолёт" },
    { id: 20, name: "Галактика", price: 100000, image: "🌌", rating: 5, category: "Legendary", description: "Целая галактика в подарок - символ бесконечности" }
  ]);

  const [leaderboard] = useState([
    { rank: 1, name: "CryptoKing", balance: 950000, avatar: "CK" },
    { rank: 2, name: "StarTrader", balance: 820000, avatar: "ST" },
    { rank: 3, name: "MoonWalker", balance: 750000, avatar: "MW" },
    { rank: 4, name: "DiamondHands", balance: 640000, avatar: "DH" },
    { rank: 5, name: "GoldMiner", balance: 580000, avatar: "GM" }
  ]);

  const [rouletteSpinning, setRouletteSpinning] = useState(false);

  useEffect(() => {
    const savedUser = getUser();
    if (savedUser) {
      setUser(savedUser);
      setBalance(savedUser.balance);
      loadTasks(savedUser.id);
      loadGifts();
    } else {
      setShowAuthModal(true);
    }
  }, []);

  const loadTasks = async (userId: number) => {
    try {
      const tasksData = await tasksApi.getTasks(userId);
      setTasks(tasksData);
    } catch (error: any) {
      console.error("Error loading tasks:", error);
    }
  };

  const loadGifts = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/86554048-1434-46fd-8aff-9dc6b8e47047?action=store_gifts');
      const data = await response.json();
      if (data.success && data.gifts) {
        const formattedGifts = data.gifts.map((g: any) => ({
          id: g.id,
          name: g.name,
          price: g.price,
          image: g.image,
          rating: 4,
          category: g.category || 'Classic',
          description: g.description || ''
        }));
        setGifts(formattedGifts);
      }
    } catch (error) {
      console.error("Error loading gifts:", error);
    }
  };

  const handleAuthSuccess = (newUser: User) => {
    setUser(newUser);
    setBalance(newUser.balance);
    loadTasks(newUser.id);
  };

  const handleLogout = () => {
    clearUser();
    setUser(null);
    setBalance(0);
    setShowAuthModal(true);
    toast.success("Вы вышли из аккаунта");
  };

  const handleBalanceUpdate = async () => {
    if (!user) return;
    const response = await fetch(`https://functions.poehali.dev/243a37ce-9933-4e76-a713-fe60061b34ba?user_id=${user.id}`);
    const data = await response.json();
    if (data.id) {
      setBalance(data.balance);
      const updatedUser = { ...user, balance: data.balance };
      setUser(updatedUser);
      saveUser(updatedUser);
    }
  };

  const handleTaskComplete = async (taskId: number, reward: number) => {
    if (!user) return;

    try {
      const result = await tasksApi.verifyTask(user.id, taskId);
      if (result.verified) {
        setBalance(result.new_balance);
        const updatedUser = { ...user, balance: result.new_balance };
        setUser(updatedUser);
        saveUser(updatedUser);
        toast.success(`Задание выполнено! +${reward} звезд`, {
          description: "Награда зачислена на ваш баланс"
        });
        loadTasks(user.id);
      }
    } catch (error: any) {
      toast.error(error.message || "Ошибка выполнения задания");
    }
  };

  const handleBuyGift = async (giftId: number, price: number) => {
    if (!user) return;

    if (balance < price) {
      toast.error("Недостаточно звезд");
      return;
    }

    try {
      await marketplaceApi.buyFromStore(user.id, giftId);
      toast.success("Подарок куплен!");
      handleBalanceUpdate();
    } catch (error: any) {
      toast.error(error.message || "Ошибка покупки");
    }
  };

  const handleRouletteSpin = () => {
    if (balance < 100) {
      toast.error("Недостаточно звезд", {
        description: "Минимальная ставка: 100 звезд"
      });
      return;
    }

    setRouletteSpinning(true);
    setBalance(prev => prev - 100);

    setTimeout(() => {
      const prizes = [50, 100, 200, 500, 1000];
      const prize = prizes[Math.floor(Math.random() * prizes.length)];
      setBalance(prev => prev + prize);
      setRouletteSpinning(false);
      toast.success(`Выигрыш: ${prize} звезд!`, {
        description: "Поздравляем с победой!"
      });
    }, 3000);
  };

  if (!user) {
    return (
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={handleAuthSuccess}
      />

      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">⭐</div>
              <h1 className="text-2xl font-heading font-bold bg-gradient-to-r from-gold to-blue bg-clip-text text-transparent">
                Звезд Маркет
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Card className="bg-muted border-gold/20">
                <CardContent className="p-3 flex items-center gap-2">
                  <Icon name="Coins" className="text-gold" size={20} />
                  <span className="font-heading font-bold text-lg text-foreground">
                    {balance.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground text-sm">звезд</span>
                </CardContent>
              </Card>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.location.href = '/profile'}
                  title="Профиль"
                >
                  <Avatar className="border-2 border-gold w-10 h-10 cursor-pointer">
                    <AvatarFallback className="bg-gold text-primary-foreground font-heading">
                      {user.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Выйти"
                >
                  <Icon name="LogOut" size={20} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-muted">
            <TabsTrigger value="tasks" className="data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
              <Icon name="CheckSquare" className="mr-2" size={18} />
              Задания
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
              <Icon name="ShoppingBag" className="mr-2" size={18} />
              Магазин
            </TabsTrigger>
            <TabsTrigger value="p2p" className="data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
              <Icon name="Users" className="mr-2" size={18} />
              P2P
            </TabsTrigger>
            <TabsTrigger value="exchange" className="data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
              <Icon name="TrendingUp" className="mr-2" size={18} />
              Биржа
            </TabsTrigger>
            <TabsTrigger value="roulette" className="data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
              <Icon name="Circle" className="mr-2" size={18} />
              Рулетка
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
              <Icon name="Trophy" className="mr-2" size={18} />
              Топ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4 animate-fade-in">
            <div className="grid gap-4 md:grid-cols-2">
              {tasks.map(task => (
                <Card key={task.id} className="group hover:border-gold/50 transition-all hover:shadow-lg hover:shadow-gold/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gold/10">
                          <Icon name={task.icon as any} className="text-gold" size={24} />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-heading">{task.title}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Icon name="Coins" size={14} className="text-gold" />
                            <span className="text-gold font-semibold">+{task.reward} звезд</span>
                          </CardDescription>
                        </div>
                      </div>
                      {task.completed && (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                          <Icon name="Check" size={14} className="mr-1" />
                          Выполнено
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!task.completed ? (
                      <Button 
                        onClick={() => handleTaskComplete(task.id, task.reward)}
                        className="w-full bg-gold hover:bg-gold/90 text-primary-foreground font-heading"
                      >
                        <Icon name="Play" className="mr-2" size={16} />
                        Выполнить
                      </Button>
                    ) : (
                      <Button disabled className="w-full">
                        Завершено
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-4 animate-fade-in">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {gifts.map(gift => (
                <Card key={gift.id} className="group hover:border-gold/50 transition-all duration-300 hover:shadow-xl hover:shadow-gold/20 hover:-translate-y-2 cursor-pointer overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-7xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">
                        {gift.image}
                      </div>
                      <Badge variant="outline" className="border-gold/50 text-gold text-xs">
                        {gift.category}
                      </Badge>
                      <CardTitle className="text-center font-heading text-base">{gift.name}</CardTitle>
                      <CardDescription className="text-center text-xs min-h-[40px]">
                        {gift.description}
                      </CardDescription>
                      <div className="flex gap-1">
                        {Array.from({ length: gift.rating }).map((_, i) => (
                          <Icon key={i} name="Star" size={14} className="text-gold fill-gold" />
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex items-center justify-center gap-2 text-xl font-heading font-bold">
                      <Icon name="Coins" className="text-gold" size={18} />
                      <span className="text-gold">{gift.price.toLocaleString()}</span>
                    </div>
                    <Button
                      onClick={() => handleBuyGift(gift.id, gift.price)}
                      className="w-full bg-blue hover:bg-blue/90 text-white font-heading transition-all duration-300"
                    >
                      <Icon name="ShoppingCart" className="mr-2" size={16} />
                      Купить
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="p2p" className="animate-fade-in">
            <P2PMarket userId={user.id} onBalanceUpdate={handleBalanceUpdate} />
          </TabsContent>

          <TabsContent value="exchange" className="animate-fade-in">
            <Exchange userId={user.id} onBalanceUpdate={handleBalanceUpdate} />
          </TabsContent>

          <TabsContent value="roulette" className="space-y-4 animate-fade-in">
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-heading">Колесо Фортуны</CardTitle>
                <CardDescription>Испытайте удачу! Ставка: 100 звезд</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                    <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-gold" />
                  </div>
                  
                  <div className="relative w-72 h-72">
                    <div className={`w-full h-full rounded-full border-8 border-gold shadow-2xl shadow-gold/20 ${rouletteSpinning ? 'animate-spin-slow' : ''}`}
                         style={{
                           background: `conic-gradient(
                             from 0deg,
                             hsl(var(--gold)) 0deg 60deg,
                             hsl(var(--blue)) 60deg 120deg,
                             hsl(var(--gold)) 120deg 180deg,
                             hsl(var(--blue)) 180deg 240deg,
                             hsl(var(--gold)) 240deg 300deg,
                             hsl(var(--blue)) 300deg 360deg
                           )`
                         }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-background border-4 border-gold flex items-center justify-center">
                          <div className="text-5xl">🎰</div>
                        </div>
                      </div>
                      
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xl font-bold text-primary-foreground">
                        1000
                      </div>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xl font-bold text-primary-foreground">
                        500
                      </div>
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-white">
                        200
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-white">
                        100
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Возможные призы:</span>
                    <span className="text-gold font-semibold">50 - 1000 звезд</span>
                  </div>
                  <Progress value={balance >= 100 ? 100 : (balance / 100) * 100} className="h-2" />
                </div>

                <Button 
                  onClick={handleRouletteSpin}
                  disabled={rouletteSpinning || balance < 100}
                  className="w-full bg-gold hover:bg-gold/90 text-primary-foreground font-heading text-lg py-6"
                >
                  {rouletteSpinning ? (
                    <>
                      <Icon name="Loader2" className="mr-2 animate-spin" size={20} />
                      Вращение...
                    </>
                  ) : (
                    <>
                      <Icon name="Play" className="mr-2" size={20} />
                      Крутить колесо (-100 ⭐)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-heading flex items-center gap-2">
                  <Icon name="Trophy" className="text-gold" size={28} />
                  Топ игроков
                </CardTitle>
                <CardDescription>Лучшие по балансу звезд</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {leaderboard.map(player => (
                  <div 
                    key={player.rank}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors border border-transparent hover:border-gold/30"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`text-2xl font-heading font-bold ${
                        player.rank === 1 ? 'text-gold' : 
                        player.rank === 2 ? 'text-gray-400' : 
                        player.rank === 3 ? 'text-amber-700' : 'text-muted-foreground'
                      }`}>
                        #{player.rank}
                      </div>
                      
                      <Avatar className="border-2 border-gold/50">
                        <AvatarFallback className="bg-gold/20 text-gold font-heading">
                          {player.avatar}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="font-heading font-semibold">{player.name}</div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Icon name="Coins" size={14} className="text-gold" />
                          <span className="text-gold font-semibold">{player.balance.toLocaleString()}</span>
                          <span>звезд</span>
                        </div>
                      </div>
                    </div>

                    {player.rank <= 3 && (
                      <Icon 
                        name="Medal" 
                        className={
                          player.rank === 1 ? 'text-gold' : 
                          player.rank === 2 ? 'text-gray-400' : 
                          'text-amber-700'
                        } 
                        size={24} 
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;