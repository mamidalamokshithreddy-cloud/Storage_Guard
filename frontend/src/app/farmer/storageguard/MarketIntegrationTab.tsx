import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { 
  TrendingUp, DollarSign, Users, Package, 
  ShoppingCart, CheckCircle, XCircle, MessageSquare,
  AlertCircle, Clock, Eye, BarChart3
} from "lucide-react";

interface MarketIntegrationTabProps {
  userId: string;
  bookings: any[];
  apiBase: string;
  toast: any;
}

interface Listing {
  _id: string;
  crop_type: string;
  quantity_quintals: number;
  target_price: number;
  minimum_price: number;
  current_market_price: number;
  listing_status: string;
  matched_buyers: any[];
  offers: any[];
  created_at: string;
  storage_booking_id: string;
}

interface MandiPrice {
  crop: string;
  current_price: number;
  min_price: number;
  max_price: number;
  average_price: number;
  price_trend: string;
  price_change_percent: number;
  source: string;
  data_quality: string;
  timestamp: string;
}

const MarketIntegrationTab = ({ userId, bookings, apiBase, toast }: MarketIntegrationTabProps) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [showListingModal, setShowListingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [listingForm, setListingForm] = useState({
    minimumPrice: '',
    targetPrice: '',
    visibility: 'PUBLIC',
    autoAccept: false
  });
  const [priceAlerts, setPriceAlerts] = useState<any[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [counterOfferForm, setCounterOfferForm] = useState<{[key: string]: string}>({});
  const [mandiPrices, setMandiPrices] = useState<Map<string, MandiPrice>>(new Map());
  const [loadingMandi, setLoadingMandi] = useState(false);

  // Fetch my listings
  const fetchMyListings = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/market-integration/my-listings?farmer_id=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setListings(data.listings);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch price alerts
  const fetchPriceAlerts = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`${apiBase}/market-integration/price-alerts?farmer_id=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setPriceAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Error fetching price alerts:', error);
    }
  };

  // Fetch live mandi prices for farmer's crops
  const fetchMandiPrices = async () => {
    if (!userId) return;
    
    setLoadingMandi(true);
    try {
      // Get unique crop types from bookings and listings
      const crops = new Set<string>();
      bookings.forEach(b => crops.add(b.crop_type.toLowerCase()));
      listings.forEach(l => crops.add(l.crop_type.toLowerCase()));
      
      console.log('📊 Fetching mandi prices for crops:', Array.from(crops));
      
      if (crops.size === 0) {
        console.log('⚠️ No crops found to fetch prices for');
        setLoadingMandi(false);
        return;
      }
      
      const pricesMap = new Map<string, MandiPrice>();
      
      // Fetch prices for each crop
      const cropArray = Array.from(crops);
      for (let i = 0; i < cropArray.length; i++) {
        const crop = cropArray[i];
        try {
          console.log(`🌾 Fetching price for: ${crop}`);
          const response = await fetch(`${apiBase}/mandi/prices?crop=${encodeURIComponent(crop)}&limit=10`);
          const data = await response.json();
          
          console.log(`✅ Mandi data for ${crop}:`, data);
          
          if (data.status === 'success' && data.market_data && data.market_data.current_price) {
            pricesMap.set(crop, {
              crop,
              current_price: data.market_data.current_price || 0,
              min_price: data.market_data.min_price || 0,
              max_price: data.market_data.max_price || 0,
              average_price: data.market_data.average_price || 0,
              price_trend: data.market_data.price_trend || 'stable',
              price_change_percent: data.market_data.price_change_percent || 0,
              source: data.market_data.source || 'data.gov.in',
              data_quality: data.market_data.data_quality || 'unknown',
              timestamp: data.timestamp
            });
          } else {
            console.log(`⚠️ Skipping ${crop} - no price data available`);
          }
        } catch (error) {
          console.error(`Error fetching mandi price for ${crop}:`, error);
        }
      }
      
      console.log(`📊 Total prices fetched: ${pricesMap.size}`, pricesMap);
      setMandiPrices(pricesMap);
    } catch (error) {
      console.error('Error fetching mandi prices:', error);
    } finally {
      setLoadingMandi(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMyListings();
      fetchPriceAlerts();
    }
  }, [userId]);

  // Separate effect for mandi prices when bookings change
  useEffect(() => {
    if (userId && bookings.length > 0) {
      fetchMandiPrices();
    }
  }, [userId, bookings]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (userId) {
        fetchMyListings();
        fetchPriceAlerts();
        fetchMandiPrices();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [userId]);

  // Get bookings that can be listed for sale (PENDING, CONFIRMED, or ACTIVE)
  const availableBookings = bookings.filter(b => 
    ['PENDING', 'CONFIRMED', 'ACTIVE'].includes(b.booking_status) && 
    !b.listed_for_sale
  );

  // Handle create listing
  const handleCreateListing = async () => {
    if (!selectedBooking || !listingForm.minimumPrice || !listingForm.targetPrice) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const minPrice = parseFloat(listingForm.minimumPrice);
    const targetPrice = parseFloat(listingForm.targetPrice);

    if (minPrice >= targetPrice) {
      toast({
        title: "Invalid Prices",
        description: "Target price must be higher than minimum price",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${apiBase}/market-integration/listings/from-storage?farmer_id=${userId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storage_booking_id: selectedBooking.id,
            minimum_price: minPrice,
            target_price: targetPrice,
            visibility: listingForm.visibility,
            auto_accept_at_target: listingForm.autoAccept
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "✅ Listed Successfully!",
          description: `${data.crop_type} listed for sale. ${data.matched_buyers} buyers matched.`,
        });
        
        setShowListingModal(false);
        setListingForm({ minimumPrice: '', targetPrice: '', visibility: 'PUBLIC', autoAccept: false });
        fetchMyListings();
      } else {
        // Handle detail which might be a string or validation error object
        const detail = typeof data.detail === 'string' 
          ? data.detail 
          : JSON.stringify(data.detail);
        throw new Error(detail || 'Failed to create listing');
      }
    } catch (error: any) {
      let errorMessage = 'Failed to create listing';
      
      if (typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.detail) {
        errorMessage = typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail);
      }
      
      toast({
        title: "Error Creating Listing",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle offer action (accept/reject/counter)
  const handleOfferAction = async (listingId: string, offerId: string, action: string, counterPrice?: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${apiBase}/market-integration/offers/${offerId}/action`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listing_id: listingId,
            farmer_id: userId,
            action: action,
            counter_price: counterPrice,
            rejection_reason: action === 'REJECT' ? 'Price not acceptable' : undefined
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: `Offer ${action}ed`,
          description: data.message,
        });
        
        fetchMyListings();
        setShowOffersModal(false);
      } else {
        // Handle detail which might be a string or validation error object
        const detail = typeof data.detail === 'string' 
          ? data.detail 
          : JSON.stringify(data.detail);
        throw new Error(detail || 'Failed to process offer');
      }
    } catch (error: any) {
      let errorMessage = 'Failed to process offer';
      
      if (typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.detail) {
        errorMessage = typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail);
      }
      
      toast({
        title: "Error Processing Offer",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Mandi Rates Section */}
      {mandiPrices.size > 0 && (
        <Card className="border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Live Mandi Rates (Today)
            </CardTitle>
            <CardDescription>
              Real-time market prices from data.gov.in for your crops
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMandi ? (
              <div className="text-center py-4 text-muted-foreground">Loading live prices...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from(mandiPrices.entries()).map(([crop, data]) => (
                  <Card key={crop} className="bg-white border-2 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg capitalize">{crop}</CardTitle>
                        <Badge 
                          variant={data.price_trend === 'rising' ? 'default' : data.price_trend === 'falling' ? 'destructive' : 'secondary'}
                          className="flex items-center gap-1"
                        >
                          {data.price_trend === 'rising' ? '📈' : data.price_trend === 'falling' ? '📉' : '➡️'}
                          {data.price_trend}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Current Price - Highlighted */}
                      <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-2 border-green-300">
                        <p className="text-xs text-green-700 font-semibold mb-1">CURRENT MANDI RATE</p>
                        <p className="text-2xl font-bold text-green-800">
                          ₹{data.current_price.toFixed(0)}
                          <span className="text-sm font-normal text-green-600">/quintal</span>
                        </p>
                        {data.price_change_percent !== 0 && (
                          <p className={`text-xs font-semibold mt-1 ${data.price_change_percent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {data.price_change_percent > 0 ? '↑' : '↓'} {Math.abs(data.price_change_percent).toFixed(1)}% from last week
                          </p>
                        )}
                      </div>

                      {/* Price Range */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="text-xs text-muted-foreground">Min Rate</p>
                          <p className="font-semibold text-gray-700">₹{data.min_price.toFixed(0)}</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="text-xs text-muted-foreground">Max Rate</p>
                          <p className="font-semibold text-gray-700">₹{data.max_price.toFixed(0)}</p>
                        </div>
                      </div>

                      {/* Average Price */}
                      <div className="p-2 bg-blue-50 rounded border border-blue-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-blue-700 font-medium">Average Rate</span>
                          <span className="font-semibold text-blue-800">₹{data.average_price.toFixed(0)}/q</span>
                        </div>
                      </div>

                      {/* Data Source */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>Source: {data.source}</span>
                        <Badge variant="outline" className="text-xs">
                          {data.data_quality === 'EXCELLENT' ? '🟢' : data.data_quality === 'GOOD' ? '🟡' : '🔵'} {data.data_quality}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
              <p className="text-sm text-blue-800">
                <strong>💡 Pricing Tip:</strong> Set your target price 5-10% above the current mandi rate to maximize profit while staying competitive. Monitor the trend - if rising, you can aim higher!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Alerts Section */}
      {priceAlerts.length > 0 && (
        <Card className="border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Price Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {priceAlerts.map((alert, idx) => (
                <div key={idx} className="p-3 bg-white rounded-lg border border-green-200">
                  <p className="font-semibold text-green-700">{alert.message}</p>
                  <p className="text-sm text-muted-foreground">
                    Current: ₹{alert.current_price}/q | Target: ₹{alert.target_price}/q
                  </p>
                  <Badge className="mt-1">{alert.recommendation}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Bookings to List */}
      {availableBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Ready for Market ({availableBookings.length})
            </CardTitle>
            <CardDescription>
              Your confirmed storage bookings that can be listed for sale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableBookings.map((booking) => (
                <Card key={booking.id} className="border-2">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{booking.crop_type}</CardTitle>
                        <CardDescription>
                          {(booking.quantity_kg / 100).toFixed(1)} quintals
                        </CardDescription>
                      </div>
                      <Badge>{booking.booking_status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <p>Grade: {booking.grade || 'Ungraded'}</p>
                      <p>Storage Cost: ₹{booking.total_price?.toFixed(0)}</p>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowListingModal(true);
                      }}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      List for Sale
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Listings */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                My Market Listings ({listings.length})
              </CardTitle>
              <CardDescription>
                Track your crops listed for sale and manage offers
              </CardDescription>
            </div>
            <Button onClick={fetchMyListings} disabled={loading} variant="outline">
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No active listings yet</p>
              <p className="text-sm">List your stored crops to connect with buyers</p>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => (
                <Card key={listing._id} className="border-2">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{listing.crop_type}</CardTitle>
                        <CardDescription>
                          {listing.quantity_quintals.toFixed(1)} quintals
                        </CardDescription>
                      </div>
                      <Badge 
                        className={
                          listing.listing_status === 'SOLD' ? 'bg-green-500' :
                          listing.listing_status === 'NEGOTIATING' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }
                      >
                        {listing.listing_status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Pricing Info */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="p-2 bg-muted rounded">
                        <p className="text-muted-foreground text-xs">Minimum</p>
                        <p className="font-semibold">₹{listing.minimum_price}/q</p>
                      </div>
                      <div className="p-2 bg-primary/10 rounded">
                        <p className="text-muted-foreground text-xs">Target</p>
                        <p className="font-semibold text-primary">₹{listing.target_price}/q</p>
                      </div>
                      <div className="p-2 bg-green-50 rounded border border-green-200">
                        <p className="text-muted-foreground text-xs">Live Market Rate</p>
                        <p className="font-semibold text-green-700">
                          {(() => {
                            const cropKey = listing.crop_type.toLowerCase();
                            const mandiPrice = mandiPrices.get(cropKey);
                            if (mandiPrice && mandiPrice.current_price > 0) {
                              return `₹${mandiPrice.current_price.toFixed(0)}/q`;
                            }
                            return listing.current_market_price > 0 ? `₹${listing.current_market_price}` : 'N/A';
                          })()}
                        </p>
                        {(() => {
                          const cropKey = listing.crop_type.toLowerCase();
                          const mandiPrice = mandiPrices.get(cropKey);
                          if (mandiPrice && mandiPrice.price_trend) {
                            return (
                              <p className="text-xs mt-0.5">
                                {mandiPrice.price_trend === 'rising' ? '📈' : mandiPrice.price_trend === 'falling' ? '📉' : '➡️'} {mandiPrice.price_trend}
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                    {/* Price Competitiveness Indicator */}
                    {(() => {
                      const cropKey = listing.crop_type.toLowerCase();
                      const mandiPrice = mandiPrices.get(cropKey);
                      if (mandiPrice && mandiPrice.current_price > 0) {
                        const percentAboveMarket = ((listing.target_price - mandiPrice.current_price) / mandiPrice.current_price * 100);
                        let message = '';
                        let bgColor = '';
                        let icon = '';
                        
                        if (percentAboveMarket > 15) {
                          message = `Your target is ${percentAboveMarket.toFixed(1)}% above market - May reduce buyer interest`;
                          bgColor = 'bg-yellow-50 border-yellow-200';
                          icon = '⚠️';
                        } else if (percentAboveMarket > 5) {
                          message = `Your target is ${percentAboveMarket.toFixed(1)}% above market - Good premium pricing`;
                          bgColor = 'bg-green-50 border-green-200';
                          icon = '✅';
                        } else if (percentAboveMarket > -5) {
                          message = `Your target is competitive with market rate (${percentAboveMarket >= 0 ? '+' : ''}${percentAboveMarket.toFixed(1)}%)`;
                          bgColor = 'bg-blue-50 border-blue-200';
                          icon = '💰';
                        } else {
                          message = `Your target is ${Math.abs(percentAboveMarket).toFixed(1)}% below market - Consider raising price`;
                          bgColor = 'bg-orange-50 border-orange-200';
                          icon = '📊';
                        }
                        
                        return (
                          <div className={`p-2 rounded border ${bgColor}`}>
                            <p className="text-xs font-medium">{icon} {message}</p>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Matched Buyers */}
                    {listing.matched_buyers?.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Users className="w-4 h-4" />
                        <span>{listing.matched_buyers.length} buyers matched</span>
                      </div>
                    )}

                    {/* Offers */}
                    {listing.offers?.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            {listing.offers.length} Offer(s)
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedListing(listing);
                              setShowOffersModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Offers
                          </Button>
                        </div>
                        
                        {/* Show pending offers count */}
                        <div className="text-xs text-muted-foreground">
                          {listing.offers.filter(o => o.offer_status === 'PENDING').length} pending |{' '}
                          {listing.offers.filter(o => o.offer_status === 'ACCEPTED').length} accepted |{' '}
                          {listing.offers.filter(o => o.offer_status === 'REJECTED').length} rejected
                        </div>
                      </div>
                    )}

                    {/* Listed Time */}
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Listed: {new Date(listing.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Listing Modal */}
      <Dialog open={showListingModal} onOpenChange={setShowListingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>List Crop for Sale</DialogTitle>
            <DialogDescription>
              {selectedBooking && `${selectedBooking.crop_type} - ${(selectedBooking.quantity_kg / 100).toFixed(1)} quintals`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Show Live Mandi Rate for this crop */}
            {selectedBooking && mandiPrices.has(selectedBooking.crop_type.toLowerCase()) && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-blue-800 flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    Today's Mandi Rate
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {mandiPrices.get(selectedBooking.crop_type.toLowerCase())?.price_trend === 'rising' ? '📈 Rising' : 
                     mandiPrices.get(selectedBooking.crop_type.toLowerCase())?.price_trend === 'falling' ? '📉 Falling' : '➡️ Stable'}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  ₹{mandiPrices.get(selectedBooking.crop_type.toLowerCase())?.current_price.toFixed(0)}
                  <span className="text-sm font-normal text-blue-700">/quintal</span>
                </p>
                <div className="flex justify-between text-xs text-blue-700 mt-2">
                  <span>Min: ₹{mandiPrices.get(selectedBooking.crop_type.toLowerCase())?.min_price.toFixed(0)}</span>
                  <span>Max: ₹{mandiPrices.get(selectedBooking.crop_type.toLowerCase())?.max_price.toFixed(0)}</span>
                  <span>Avg: ₹{mandiPrices.get(selectedBooking.crop_type.toLowerCase())?.average_price.toFixed(0)}</span>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  💡 Suggested: Set target 5-10% above current rate (₹{(mandiPrices.get(selectedBooking.crop_type.toLowerCase())!.current_price * 1.05).toFixed(0)} - ₹{(mandiPrices.get(selectedBooking.crop_type.toLowerCase())!.current_price * 1.10).toFixed(0)})
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="minimumPrice">Minimum Price (₹/quintal)</Label>
              <Input
                id="minimumPrice"
                type="number"
                placeholder="e.g., 2500"
                value={listingForm.minimumPrice}
                onChange={(e) => setListingForm({ ...listingForm, minimumPrice: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetPrice">Target Price (₹/quintal)</Label>
              <Input
                id="targetPrice"
                type="number"
                placeholder="e.g., 3000"
                value={listingForm.targetPrice}
                onChange={(e) => setListingForm({ ...listingForm, targetPrice: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <select
                id="visibility"
                className="w-full p-2 border rounded"
                value={listingForm.visibility}
                onChange={(e) => setListingForm({ ...listingForm, visibility: e.target.value })}
              >
                <option value="PUBLIC">Public (All Buyers)</option>
                <option value="VERIFIED_BUYERS">Verified Buyers Only</option>
                <option value="PRIVATE">Private (Invitation Only)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoAccept"
                checked={listingForm.autoAccept}
                onChange={(e) => setListingForm({ ...listingForm, autoAccept: e.target.checked })}
              />
              <Label htmlFor="autoAccept" className="text-sm">
                Auto-accept offers at target price
              </Label>
            </div>

            {/* Profit Projection */}
            {listingForm.targetPrice && selectedBooking && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-green-700">Profit Projection</p>
                <p className="text-lg font-bold text-green-800">
                  ₹{(
                    parseFloat(listingForm.targetPrice) * (selectedBooking.quantity_kg / 100) - 
                    selectedBooking.total_price
                  ).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  If sold at target price (after storage costs)
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowListingModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateListing} disabled={loading}>
              {loading ? 'Creating...' : 'Create Listing'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Offers Modal */}
      <Dialog open={showOffersModal} onOpenChange={setShowOffersModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buyer Offers</DialogTitle>
            <DialogDescription>
              {selectedListing && `${selectedListing.crop_type} - ${selectedListing.quantity_quintals.toFixed(1)} quintals`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedListing?.offers?.map((offer) => (
              <Card key={offer.offer_id} className="border-2">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{offer.buyer_name}</CardTitle>
                      <CardDescription>{offer.buyer_type}</CardDescription>
                    </div>
                    <Badge 
                      className={
                        offer.offer_status === 'PENDING' ? 'bg-yellow-500' :
                        offer.offer_status === 'ACCEPTED' ? 'bg-green-500' :
                        offer.offer_status === 'REJECTED' ? 'bg-red-500' :
                        'bg-blue-500'
                      }
                    >
                      {offer.offer_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Price Comparison Bar */}
                  <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-center flex-1">
                        <p className="text-xs text-muted-foreground">Your Target</p>
                        <p className="font-bold text-sm">₹{selectedListing.target_price}</p>
                      </div>
                      <div className="text-center flex-1 border-x px-2">
                        <p className="text-xs text-muted-foreground">Buyer Offer</p>
                        <p className="font-bold text-lg text-primary">₹{offer.offered_price}</p>
                      </div>
                      <div className="text-center flex-1">
                        <p className="text-xs text-muted-foreground">Market Rate</p>
                        <p className="font-bold text-sm text-green-600">
                          {(() => {
                            const cropKey = selectedListing.crop_type.toLowerCase();
                            const mandiPrice = mandiPrices.get(cropKey);
                            return mandiPrice ? `₹${mandiPrice.current_price.toFixed(0)}` : 'N/A';
                          })()}
                        </p>
                      </div>
                    </div>
                    {/* Offer evaluation */}
                    {(() => {
                      const cropKey = selectedListing.crop_type.toLowerCase();
                      const mandiPrice = mandiPrices.get(cropKey);
                      if (mandiPrice) {
                        const vsMarket = ((offer.offered_price - mandiPrice.current_price) / mandiPrice.current_price * 100);
                        const vsTarget = ((offer.offered_price - selectedListing.target_price) / selectedListing.target_price * 100);
                        return (
                          <div className="text-xs text-center mt-2 space-y-1">
                            <p className={vsMarket >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {vsMarket >= 0 ? '✅' : '⚠️'} {Math.abs(vsMarket).toFixed(1)}% {vsMarket >= 0 ? 'above' : 'below'} market rate
                            </p>
                            <p className={vsTarget >= 0 ? 'text-green-600' : 'text-orange-600'}>
                              {vsTarget >= 0 ? '🎯' : '📊'} {Math.abs(vsTarget).toFixed(1)}% {vsTarget >= 0 ? 'above' : 'below'} your target
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Offered Price</p>
                      <p className="text-lg font-bold text-primary">₹{offer.offered_price}/quintal</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Amount</p>
                      <p className="text-lg font-bold">₹{offer.total_amount.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-semibold">{offer.quantity_quintals} quintals</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment Terms</p>
                      <p className="font-semibold text-xs">{offer.payment_terms}</p>
                    </div>
                  </div>

                  <div className="text-sm">
                    <p className="text-muted-foreground">Pickup Timeline</p>
                    <p>{offer.pickup_timeline}</p>
                  </div>

                  <div className="text-sm">
                    <p className="text-muted-foreground">Buyer Contact</p>
                    <p className="font-medium">{offer.buyer_contact}</p>
                  </div>

                  {offer.notes && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Notes</p>
                      <p className="text-xs">{offer.notes}</p>
                    </div>
                  )}

                  {/* Action Buttons for Pending Offers */}
                  {offer.offer_status === 'PENDING' && (
                    <div className="space-y-2 pt-2">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleOfferAction(selectedListing._id, offer.offer_id, 'ACCEPT')}
                          disabled={loading}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept Offer
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleOfferAction(selectedListing._id, offer.offer_id, 'REJECT')}
                          disabled={loading}
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                      
                      {/* Counter Offer Section */}
                      <div className="border-t pt-2">
                        <p className="text-xs font-semibold mb-2 text-muted-foreground">Or send counter-offer:</p>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Counter price/quintal"
                            value={counterOfferForm[offer.offer_id] || ''}
                            onChange={(e) => setCounterOfferForm({...counterOfferForm, [offer.offer_id]: e.target.value})}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const counterPrice = parseFloat(counterOfferForm[offer.offer_id]);
                              if (counterPrice && counterPrice > 0) {
                                handleOfferAction(selectedListing._id, offer.offer_id, 'COUNTER', counterPrice);
                              } else {
                                toast({
                                  title: "Invalid Price",
                                  description: "Please enter a valid counter price",
                                  variant: "destructive",
                                });
                              }
                            }}
                            disabled={loading || !counterOfferForm[offer.offer_id]}
                          >
                            Send Counter
                          </Button>
                        </div>
                        {counterOfferForm[offer.offer_id] && (
                          <p className="text-xs text-muted-foreground mt-1">
                            New total: ₹{(parseFloat(counterOfferForm[offer.offer_id]) * offer.quantity_quintals).toFixed(0)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Show counter price if countered */}
                  {offer.counter_price && (
                    <div className="p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm font-semibold text-blue-700">
                        Counter Offer Sent: ₹{offer.counter_price}/quintal
                      </p>
                    </div>
                  )}

                  {/* Show acceptance details if accepted */}
                  {offer.offer_status === 'ACCEPTED' && (
                    <div className="p-2 bg-green-50 rounded border border-green-200">
                      <p className="text-sm font-semibold text-green-700">
                        ✅ Offer Accepted - Contract Created
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Accepted on: {new Date(offer.accepted_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {selectedListing?.offers?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No offers yet</p>
                <p className="text-sm">Buyers will submit offers soon</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowOffersModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketIntegrationTab;
