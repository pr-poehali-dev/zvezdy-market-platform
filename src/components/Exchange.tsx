import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Icon from "@/components/ui/icon";
import { exchangeApi } from "@/lib/api";
import { toast } from "sonner";

interface ExchangeProps {
  userId: number;
  onBalanceUpdate: () => void;
}

export const Exchange = ({ userId, onBalanceUpdate }: ExchangeProps) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [tradeAmount, setTradeAmount] = useState("");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [companiesData, portfolioData] = await Promise.all([
        exchangeApi.getCompanies(),
        exchangeApi.getPortfolio(userId)
      ]);
      setCompanies(companiesData);
      setPortfolio(portfolioData);
    } catch (error: any) {
      toast.error(error.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async () => {
    if (!selectedCompany || !tradeAmount) return;

    const shares = parseInt(tradeAmount);
    if (isNaN(shares) || shares <= 0) {
      toast.error("Введите корректное количество акций");
      return;
    }

    try {
      if (tradeType === "buy") {
        await exchangeApi.buyShares(userId, selectedCompany.id, shares);
        toast.success(`Куплено ${shares} акций ${selectedCompany.ticker}!`);
      } else {
        await exchangeApi.sellShares(userId, selectedCompany.id, shares);
        toast.success(`Продано ${shares} акций ${selectedCompany.ticker}!`);
      }
      setShowTradeDialog(false);
      setTradeAmount("");
      loadData();
      onBalanceUpdate();
    } catch (error: any) {
      toast.error(error.message || "Ошибка сделки");
    }
  };

  const openTrade = (company: any, type: "buy" | "sell") => {
    setSelectedCompany(company);
    setTradeType(type);
    setShowTradeDialog(true);
  };

  const showChart = async (company: any) => {
    setSelectedCompany(company);
    try {
      const history = await exchangeApi.getPriceHistory(company.id);
      const formattedData = history.reverse().map((item: any, index: number) => ({
        time: `${index + 1}`,
        price: parseFloat(item.price)
      }));
      setPriceHistory(formattedData);
      setShowChartDialog(true);
    } catch (error: any) {
      toast.error("Ошибка загрузки графика");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  const totalPortfolioValue = portfolio.reduce((sum, item) => sum + (item.current_value || 0), 0);
  const totalProfit = portfolio.reduce((sum, item) => sum + (item.profit || 0), 0);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Портфель</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-gold">
              {totalPortfolioValue.toLocaleString()} ⭐
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Прибыль/Убыток</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-heading font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString()} ⭐
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Активных позиций</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-blue">
              {portfolio.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-heading flex items-center gap-2">
            <Icon name="TrendingUp" className="text-gold" />
            Инвестиционная биржа
          </CardTitle>
          <CardDescription>
            6 компаний с динамическими ценами. Покупайте акции и зарабатывайте на росте!
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => {
          const portfolioItem = portfolio.find(p => p.company_id === company.id);
          const change = parseFloat(company.change_percent || "0");
          const isPositive = change >= 0;

          return (
            <Card key={company.id} className="hover:border-gold/50 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-heading text-xl">{company.name}</CardTitle>
                    <Badge variant="outline" className="mt-2">{company.ticker}</Badge>
                  </div>
                  <Badge className={isPositive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                    {isPositive ? '+' : ''}{change.toFixed(2)}%
                  </Badge>
                </div>
                <CardDescription className="mt-2">{company.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Цена за акцию:</span>
                  <div className="flex items-center gap-1 font-heading font-bold text-gold">
                    <Icon name="Coins" size={16} />
                    {parseFloat(company.current_price).toLocaleString()}
                  </div>
                </div>

                {portfolioItem && (
                  <div className="p-3 bg-muted rounded-lg space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>У вас:</span>
                      <span className="font-semibold">{portfolioItem.shares} акций</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Стоимость:</span>
                      <span className="font-semibold text-gold">{portfolioItem.current_value?.toLocaleString()} ⭐</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Прибыль:</span>
                      <span className={`font-semibold ${portfolioItem.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {portfolioItem.profit >= 0 ? '+' : ''}{portfolioItem.profit?.toLocaleString()} ⭐
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => showChart(company)}
                  variant="outline"
                  className="w-full font-heading"
                  size="sm"
                >
                  <Icon name="BarChart" className="mr-2" size={16} />
                  График
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => openTrade(company, "buy")}
                    className="bg-green-500 hover:bg-green-600 text-white font-heading"
                  >
                    <Icon name="TrendingUp" className="mr-2" size={16} />
                    Купить
                  </Button>
                  <Button
                    onClick={() => openTrade(company, "sell")}
                    disabled={!portfolioItem || portfolioItem.shares === 0}
                    variant="outline"
                    className="font-heading"
                  >
                    <Icon name="TrendingDown" className="mr-2" size={16} />
                    Продать
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showChartDialog} onOpenChange={setShowChartDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {selectedCompany?.name} ({selectedCompany?.ticker})
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="hsl(var(--gold))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--gold))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Текущая цена</div>
                <div className="text-2xl font-heading font-bold text-gold">
                  {selectedCompany && parseFloat(selectedCompany.current_price).toLocaleString()} ⭐
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Изменение</div>
                <div className={`text-2xl font-heading font-bold ${parseFloat(selectedCompany?.change_percent || "0") >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {parseFloat(selectedCompany?.change_percent || "0") >= 0 ? '+' : ''}
                  {parseFloat(selectedCompany?.change_percent || "0").toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTradeDialog} onOpenChange={setShowTradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">
              {tradeType === "buy" ? "Купить" : "Продать"} акции {selectedCompany?.ticker}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Количество акций</Label>
              <Input
                type="number"
                placeholder="Введите количество"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                min="1"
              />
            </div>

            {selectedCompany && tradeAmount && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Цена за акцию:</span>
                  <span className="font-semibold">{parseFloat(selectedCompany.current_price).toLocaleString()} ⭐</span>
                </div>
                <div className="flex justify-between">
                  <span>Количество:</span>
                  <span className="font-semibold">{tradeAmount}</span>
                </div>
                <div className="flex justify-between text-lg font-heading">
                  <span>Итого:</span>
                  <span className="text-gold font-bold">
                    {(parseFloat(selectedCompany.current_price) * parseInt(tradeAmount || "0")).toLocaleString()} ⭐
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleTrade}
              className="w-full bg-gold hover:bg-gold/90 text-primary-foreground font-heading"
            >
              {tradeType === "buy" ? "Купить" : "Продать"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Exchange;