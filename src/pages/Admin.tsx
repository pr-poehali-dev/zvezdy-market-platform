import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { adminApi, getUser } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [stats, setStats] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskReward, setNewTaskReward] = useState("");
  
  const [selectedUserId, setSelectedUserId] = useState("");
  const [addBalanceAmount, setAddBalanceAmount] = useState("");
  const [addBalanceReason, setAddBalanceReason] = useState("");

  useEffect(() => {
    if (!user || !user.is_admin) {
      toast.error("Доступ запрещен");
      navigate("/");
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;

    try {
      const [statsData, withdrawalsData, usersData] = await Promise.all([
        adminApi.getStats(user.id),
        adminApi.getWithdrawals(user.id),
        adminApi.getUsers(user.id)
      ]);
      setStats(statsData);
      setWithdrawals(withdrawalsData);
      setUsers(usersData);
    } catch (error: any) {
      toast.error(error.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!user || !newTaskTitle || !newTaskReward) {
      toast.error("Заполните все поля");
      return;
    }

    try {
      await adminApi.addTask(user.id, newTaskTitle, newTaskDesc, parseInt(newTaskReward), "manual");
      toast.success("Задание добавлено!");
      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskReward("");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddBalance = async () => {
    if (!user || !selectedUserId || !addBalanceAmount) {
      toast.error("Заполните все поля");
      return;
    }

    try {
      await adminApi.addBalance(user.id, parseInt(selectedUserId), parseInt(addBalanceAmount), addBalanceReason);
      toast.success("Баланс обновлен!");
      setSelectedUserId("");
      setAddBalanceAmount("");
      setAddBalanceReason("");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Icon name="Loader2" className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-heading font-bold text-gold">Админ-панель</h1>
            <Button variant="outline" onClick={() => navigate("/")}>
              <Icon name="Home" className="mr-2" size={18} />
              На главную
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-heading">Пользователей</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold text-gold">
                {stats?.total_users || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-heading">Всего звезд</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold text-blue">
                {stats?.total_balance?.toLocaleString() || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-heading">Транзакций</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold text-green-500">
                {stats?.total_transactions || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-heading">Заявок на вывод</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold text-orange-500">
                {stats?.pending_withdrawals || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="withdrawals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-muted">
            <TabsTrigger value="withdrawals">Выводы</TabsTrigger>
            <TabsTrigger value="users">Пользователи</TabsTrigger>
            <TabsTrigger value="tasks">Задания</TabsTrigger>
            <TabsTrigger value="balance">Баланс</TabsTrigger>
          </TabsList>

          <TabsContent value="withdrawals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Запросы на вывод</CardTitle>
                <CardDescription>Обработка заявок пользователей</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {withdrawals.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Нет заявок</p>
                ) : (
                  withdrawals.map(w => (
                    <Card key={w.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{w.username}</div>
                            <div className="text-sm text-muted-foreground">
                              Telegram: {w.telegram_username}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(w.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-2xl font-heading font-bold text-gold">
                                {w.amount.toLocaleString()} ⭐
                              </div>
                              <Badge>{w.status}</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Топ пользователей</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-semibold">{u.username}</div>
                      <div className="text-sm text-muted-foreground">{u.email || "Нет email"}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-heading font-bold text-gold">
                        {u.balance.toLocaleString()} ⭐
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {u.id}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Добавить задание</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Название</Label>
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Например: Пригласить 3 друзей"
                  />
                </div>
                <div>
                  <Label>Описание</Label>
                  <Textarea
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    placeholder="Подробное описание задания"
                  />
                </div>
                <div>
                  <Label>Награда (звезды)</Label>
                  <Input
                    type="number"
                    value={newTaskReward}
                    onChange={(e) => setNewTaskReward(e.target.value)}
                    placeholder="500"
                  />
                </div>
                <Button onClick={handleAddTask} className="w-full bg-gold hover:bg-gold/90 text-primary-foreground font-heading">
                  <Icon name="Plus" className="mr-2" size={18} />
                  Добавить задание
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Начислить звезды</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>ID пользователя</Label>
                  <Input
                    type="number"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label>Количество звезд</Label>
                  <Input
                    type="number"
                    value={addBalanceAmount}
                    onChange={(e) => setAddBalanceAmount(e.target.value)}
                    placeholder="1000"
                  />
                </div>
                <div>
                  <Label>Причина</Label>
                  <Input
                    value={addBalanceReason}
                    onChange={(e) => setAddBalanceReason(e.target.value)}
                    placeholder="Бонус от администрации"
                  />
                </div>
                <Button onClick={handleAddBalance} className="w-full bg-blue hover:bg-blue/90 text-white font-heading">
                  <Icon name="Coins" className="mr-2" size={18} />
                  Начислить
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;