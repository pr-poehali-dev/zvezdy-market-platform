import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";
import { marketplaceApi } from "@/lib/api";
import { toast } from "sonner";

interface P2PMarketProps {
  userId: number;
  onBalanceUpdate: () => void;
}

export const P2PMarket = ({ userId, onBalanceUpdate }: P2PMarketProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await marketplaceApi.getP2PItems();
      setItems(data);
    } catch (error: any) {
      toast.error(error.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (userGiftId: number, price: number) => {
    try {
      await marketplaceApi.buyFromUser(userId, userGiftId);
      toast.success(`Подарок куплен за ${price.toLocaleString()} звезд!`);
      loadItems();
      onBalanceUpdate();
    } catch (error: any) {
      toast.error(error.message || "Ошибка покупки");
    }
  };

  const handleShowHistory = async (giftId: number) => {
    try {
      const data = await marketplaceApi.getHistory(giftId);
      setHistory(data);
      setShowHistory(true);
    } catch (error: any) {
      toast.error(error.message || "Ошибка загрузки истории");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-heading flex items-center gap-2">
            <Icon name="Users" className="text-blue" />
            P2P Торговая площадка
          </CardTitle>
          <CardDescription>
            Покупайте уникальные подарки у других пользователей с историей владения
          </CardDescription>
        </CardHeader>
      </Card>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon name="Package" className="mx-auto mb-4 text-muted-foreground" size={48} />
            <p className="text-muted-foreground">Пока нет подарков на продажу</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <Card
              key={item.user_gift_id}
              className="group hover:border-blue/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue/20 hover:-translate-y-2 cursor-pointer"
            >
              <CardHeader>
                <div className="flex flex-col items-center gap-3">
                  <div className="text-7xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">
                    {item.image_emoji || "🎁"}
                  </div>
                  <Badge variant="outline" className="border-blue/50 text-blue text-xs">
                    {item.category}
                  </Badge>
                  <CardTitle className="text-center font-heading text-base">{item.name}</CardTitle>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="User" size={14} />
                    <span>{item.seller_name}</span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShowHistory(item.id)}
                    className="text-xs"
                  >
                    <Icon name="History" className="mr-1" size={12} />
                    История ({item.transaction_count || 0})
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center justify-center gap-2 text-xl font-heading font-bold">
                  <Icon name="Coins" className="text-gold" size={18} />
                  <span className="text-gold">{item.sale_price?.toLocaleString()}</span>
                </div>
                <Button
                  onClick={() => handleBuy(item.user_gift_id, item.sale_price)}
                  className="w-full bg-blue hover:bg-blue/90 text-white font-heading"
                >
                  <Icon name="ShoppingCart" className="mr-2" size={16} />
                  Купить
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">История владения</DialogTitle>
            <DialogDescription>Все транзакции с этим подарком</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {history.map((tx, index) => (
              <Card key={tx.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">
                        {tx.buyer_name} ← {tx.seller_name || "Магазин"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-heading font-bold text-gold">
                      <Icon name="Coins" size={16} />
                      {tx.price.toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default P2PMarket;