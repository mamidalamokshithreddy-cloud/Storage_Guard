import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { TrendingUp, TrendingDown, Activity, BarChart3, IndianRupee } from "lucide-react";

const CommodityMarketBoard = () => {
  const commodities = [
    {
      name: "Cotton",
      nameTelugu: "పత్తి",
      symbol: "COTTON",
      currentPrice: "₹6,350",
      change: "+185",
      changePercent: "+3.0%",
      volume: "45,230",
      high: "₹6,400",
      low: "₹6,165",
      market: "Hyderabad APMC",
      marketTelugu: "హైదరాబాద్ APMC",
      trend: "up"
    },
    {
      name: "Rice (Basmati)",
      nameTelugu: "బాస్మతి బియ్యం",
      symbol: "RICE-B",
      currentPrice: "₹4,750",
      change: "+125",
      changePercent: "+2.7%",
      volume: "32,450",
      high: "₹4,780",
      low: "₹4,625",
      market: "Delhi APMC",
      marketTelugu: "దిల్లీ APMC",
      trend: "up"
    },
    {
      name: "Wheat",
      nameTelugu: "గోధుమలు",
      symbol: "WHEAT",
      currentPrice: "₹2,240",
      change: "-35",
      changePercent: "-1.5%",
      volume: "28,960",
      high: "₹2,275",
      low: "₹2,210",
      market: "Punjab Mandi",
      marketTelugu: "పంజాబ్ మండి",
      trend: "down"
    },
    {
      name: "Soybean",
      nameTelugu: "సోయాబీన్",
      symbol: "SOYBEAN",
      currentPrice: "₹4,825",
      change: "+95",
      changePercent: "+2.0%",
      volume: "18,750",
      high: "₹4,850",
      low: "₹4,730",
      market: "Indore Mandi",
      marketTelugu: "ఇందోర్ మండి",
      trend: "up"
    },
    {
      name: "Maize",
      nameTelugu: "మొక్కజొన్న",
      symbol: "MAIZE",
      currentPrice: "₹2,180",
      change: "+75",
      changePercent: "+3.6%",
      volume: "25,840",
      high: "₹2,195",
      low: "₹2,105",
      market: "Karimnagar",
      marketTelugu: "కరీంనగర్",
      trend: "up"
    },
    {
      name: "Groundnut",
      nameTelugu: "వేరుశెనగ",
      symbol: "G-NUT",
      currentPrice: "₹5,650",
      change: "-120",
      changePercent: "-2.1%",
      volume: "14,230",
      high: "₹5,770",
      low: "₹5,620",
      market: "Gujarat APMC",
      marketTelugu: "గుజరాత్ APMC",
      trend: "down"
    },
    {
      name: "Sugarcane",
      nameTelugu: "చెరకు",
      symbol: "S-CANE",
      currentPrice: "₹340",
      change: "+12",
      changePercent: "+3.7%",
      volume: "67,890",
      high: "₹345",
      low: "₹328",
      market: "UP Sugar Mills",
      marketTelugu: "UP షుగర్ మిల్లులు",
      trend: "up"
    },
    {
      name: "Turmeric",
      nameTelugu: "పసుపు",
      symbol: "TURMERIC",
      currentPrice: "₹8,450",
      change: "+250",
      changePercent: "+3.0%",
      volume: "8,960",
      high: "₹8,480",
      low: "₹8,200",
      market: "Salem Market",
      marketTelugu: "సేలం మార్కెట్",
      trend: "up"
    },
    {
      name: "Red Chilli",
      nameTelugu: "ఎర్ర మిర్చి",
      symbol: "R-CHILLI",
      currentPrice: "₹14,200",
      change: "-350",
      changePercent: "-2.4%",
      volume: "12,450",
      high: "₹14,550",
      low: "₹14,100",
      market: "Guntur Yard",
      marketTelugu: "గుంటూరు యార్డ్",
      trend: "down"
    },
    {
      name: "Onion",
      nameTelugu: "ఉల్లిపాయలు",
      symbol: "ONION",
      currentPrice: "₹2,850",
      change: "+180",
      changePercent: "+6.7%",
      volume: "34,560",
      high: "₹2,890",
      low: "₹2,670",
      market: "Nashik APMC",
      marketTelugu: "నాసిక్ APMC",
      trend: "up"
    },
    {
      name: "Tomato",
      nameTelugu: "టమోటా",
      symbol: "TOMATO",
      currentPrice: "₹3,200",
      change: "-450",
      changePercent: "-12.3%",
      volume: "28,740",
      high: "₹3,650",
      low: "₹3,150",
      market: "Bangalore Market",
      marketTelugu: "బెంగళూరు మార్కెట్",
      trend: "down"
    },
    {
      name: "Potato",
      nameTelugu: "బంగాళాదుంపలు",
      symbol: "POTATO",
      currentPrice: "₹1,450",
      change: "+85",
      changePercent: "+6.2%",
      volume: "45,670",
      high: "₹1,480",
      low: "₹1,365",
      market: "Agra Mandi",
      marketTelugu: "ఆగ్రా మండి",
      trend: "up"
    }
  ];

  const marketSummary = {
    totalVolume: "₹2,34,56,890",
    activeStocks: 42,
    gainers: 28,
    losers: 14
  };

  return (
    <div className="space-y-6">
      {/* Market Summary */}
      <Card className="agri-card">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Agricultural Commodity Exchange | వ్యవసాయ వస్తువుల మార్కెట్
            </h2>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Market Status</p>
              <Badge variant="default" className="bg-success text-success-foreground">
                <Activity className="w-3 h-3 mr-1" />
                OPEN
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-field rounded-lg">
              <p className="text-sm text-muted-foreground">Total Volume</p>
              <p className="text-lg font-bold text-primary">{marketSummary.totalVolume}</p>
            </div>
            <div className="text-center p-4 bg-gradient-field rounded-lg">
              <p className="text-sm text-muted-foreground">Active Commodities</p>
              <p className="text-lg font-bold">{marketSummary.activeStocks}</p>
            </div>
            <div className="text-center p-4 bg-gradient-field rounded-lg">
              <p className="text-sm text-muted-foreground">Gainers</p>
              <p className="text-lg font-bold text-success">{marketSummary.gainers}</p>
            </div>
            <div className="text-center p-4 bg-gradient-field rounded-lg">
              <p className="text-sm text-muted-foreground">Losers</p>
              <p className="text-lg font-bold text-destructive">{marketSummary.losers}</p>
            </div>
          </div>

          {/* Commodity Table Header */}
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="grid grid-cols-8 gap-2 p-3 bg-muted/50 rounded-t-lg font-semibold text-sm border-b">
                <div>Commodity</div>
                <div>Symbol</div>
                <div className="text-right">Price</div>
                <div className="text-right">Change</div>
                <div className="text-right">% Change</div>
                <div className="text-right">Volume</div>
                <div className="text-right">High/Low</div>
                <div>Market</div>
              </div>

              {/* Commodity Rows */}
              <div className="space-y-1">
                {commodities.map((commodity, index) => (
                  <div 
                    key={index} 
                    className="grid grid-cols-8 gap-2 p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="font-semibold">{commodity.name}</p>
                      <p className="text-xs text-accent">{commodity.nameTelugu}</p>
                    </div>
                    
                    <div>
                      <p className="font-mono text-sm font-semibold">{commodity.symbol}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-lg">{commodity.currentPrice}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className={`flex items-center justify-end gap-1 ${
                        commodity.trend === 'up' ? 'text-success' : 'text-destructive'
                      }`}>
                        {commodity.trend === 'up' ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span className="font-semibold">{commodity.change}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge 
                        variant={commodity.trend === 'up' ? 'default' : 'destructive'}
                        className={commodity.trend === 'up' ? 'bg-success text-success-foreground' : ''}
                      >
                        {commodity.changePercent}
                      </Badge>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">{commodity.volume}</p>
                      <p className="text-xs text-muted-foreground">quintals</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-success">{commodity.high}</p>
                      <p className="text-xs text-destructive">{commodity.low}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">{commodity.market}</p>
                      <p className="text-xs text-accent">{commodity.marketTelugu}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                hour12: true,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })} IST
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <IndianRupee className="w-4 h-4 mr-2" />
                Price Alerts
              </Button>
              <Button size="sm" className="agri-button-primary">
                <Activity className="w-4 h-4 mr-2" />
                Live Trading
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CommodityMarketBoard;