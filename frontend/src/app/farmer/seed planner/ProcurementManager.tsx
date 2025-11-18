import { useEffect, useState, useCallback } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  Users, 
  MapPin, 
  Star,
  Truck,
  FileText,
  Package,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Phone,
  Mail
} from "lucide-react";
// import PageHeader from "../PageHeader";
// import AgriAgentsSidebar from "../AgriAgentsSidebar";
import AgriChatAgent from "../AgriChatAgent";
import AgriAIPilotSidePeek from "../AgriAIPilotSidePeek";

interface ProcurementManagerProps {
  onBackToSeedPlanner?: () => void;
}

const ProcurementManager = ({ onBackToSeedPlanner }: ProcurementManagerProps = {}) => {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [rfqSent, setRfqSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Backend data states
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [priceComparison, setPriceComparison] = useState<any>(null);

  const loadProcurementData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all procurement data in parallel
      const [vendorsRes, rfqsRes, jobsRes, invoicesRes] = await Promise.all([
        fetch(`${API_BASE}/vendors`),
        fetch(`${API_BASE}/rfqs`),
        fetch(`${API_BASE}/jobs`),
        fetch(`${API_BASE}/invoices`)
      ]);

      if (vendorsRes.ok) {
        const vendorsData = await vendorsRes.json();
        setSuppliers(vendorsData.vendors || []);
      }

      if (rfqsRes.ok) {
        const rfqsData = await rfqsRes.json();
        setRfqs(rfqsData.rfqs || []);
        // If we have RFQs, fetch bids for the first one
        if (rfqsData.rfqs && rfqsData.rfqs.length > 0) {
          const firstRfqId = rfqsData.rfqs[0].id;
          const bidsRes = await fetch(`${API_BASE}/rfqs/${firstRfqId}/bids`);
          if (bidsRes.ok) {
            const bidsData = await bidsRes.json();
            setBids(bidsData.bids || []);
          }
        }
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setOrders(jobsData.jobs || []);
      }

      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData.invoices || []);
      }
    } catch (err) {
      console.error('Error loading procurement data:', err);
      setError('Failed to load procurement data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data from backend on mount
  useEffect(() => {
    loadProcurementData();
  }, [loadProcurementData]);

  const loadPriceComparison = async (productType: string = 'cotton') => {
    try {
  const res = await fetch(`${API_BASE}/price-comparison?product_type=${encodeURIComponent(productType)}`);
      if (res.ok) {
        const data = await res.json();
        setPriceComparison(data);
      }
    } catch (err) {
      console.error('Error loading price comparison:', err);
    }
  };

  // RFQ Items - only show if we have actual RFQ data
  const rfqItems = rfqs.length > 0 && rfqs[0].description 
    ? [{ item: rfqs[0].description, quantity: "As specified", specification: rfqs[0].service_needed }]
    : [];

  const toggleSupplierSelection = (supplierId: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId) 
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  return (
    <div className="min-h-screen field-gradient">
      {/* <AgriAgentsSidebar /> */}
      <AgriChatAgent />
      <AgriAIPilotSidePeek
        agentType="Procurement"
        agentName="Procurement Manager"
        agentNameTelugu="సేకరణ నిర్వాహకుడు"
        services={[]}
      />
      
      <div className="ml-0 min-h-screen">
        {/* <PageHeader
          title="Procurement Manager"
          titleTelugu="సేకరణ నిర్వాహకుడు"
          icon={ShoppingCart}
          backButton={{ label: "Crop Planning", route: "/seed-planner/crop-planning" }}
        /> */}

        <div className="max-w-full mx-auto px-1 py-2">
          <Tabs defaultValue="suppliers" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
              <TabsTrigger value="compare">Price Compare</TabsTrigger>
              <TabsTrigger value="rfq">RFQ & Bidding</TabsTrigger>
              <TabsTrigger value="orders">Order Tracking</TabsTrigger>
              <TabsTrigger value="invoices">GST Invoices</TabsTrigger>
            </TabsList>

            {/* Suppliers Tab */}
            <TabsContent value="suppliers">
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading suppliers...</p>
                  </div>
                </div>
              ) : suppliers.length === 0 ? (
                <Card className="agri-card">
                  <div className="p-12 text-center">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Suppliers Available</h3>
                    <p className="text-muted-foreground">No verified suppliers found in the system.</p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Nearby Suppliers | సమీప సరఫరాదారులు</h2>
                    <Button className="agri-button-secondary" onClick={loadProcurementData}>
                      <MapPin className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {suppliers.map((supplier) => (
                    <Card key={supplier.id} className={`agri-card ${selectedSuppliers.includes(supplier.id) ? 'ring-2 ring-primary' : ''}`}>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold">{supplier.name}</h3>
                            <p className="text-accent font-semibold">{supplier.type}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-semibold">{supplier.rating}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">{supplier.distance}</span>
                            </div>
                          </div>
                          <Badge variant={supplier.priceRange === 'Premium' ? 'default' : 'secondary'}>
                            {supplier.priceRange}
                          </Badge>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{supplier.location}</span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span>{supplier.phone}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {supplier.certifications && supplier.certifications.map((cert: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {cert}
                              </Badge>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">Delivery</p>
                              <p className="font-semibold">{supplier.deliveryTime}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Payment</p>
                              <p className="font-semibold">{supplier.paymentTerms}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-sm font-semibold">Specialties:</p>
                          <div className="flex flex-wrap gap-1">
                            {supplier.specialties && supplier.specialties.map((specialty: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            className={selectedSuppliers.includes(supplier.id) ? "agri-button-primary flex-1" : "agri-button-secondary flex-1"}
                            onClick={() => toggleSupplierSelection(supplier.id)}
                          >
                            {selectedSuppliers.includes(supplier.id) ? 'Selected' : 'Select'}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Price Compare Tab */}
            <TabsContent value="compare">
              <Card className="agri-card">
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Price Comparison | ధర పోలిక</h2>
                  
                  <div className="mb-4 flex gap-2">
                    <Input 
                      type="text" 
                      placeholder="Search product (e.g., cotton, rice, seeds)" 
                      className="max-w-md"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          loadPriceComparison(input.value);
                        }
                      }}
                    />
                    <Button onClick={() => {
                      const input = document.querySelector('input[placeholder*="Search product"]') as HTMLInputElement;
                      loadPriceComparison(input?.value || 'cotton');
                    }}>
                      Compare
                    </Button>
                  </div>

                  {!priceComparison ? (
                    <div className="text-center p-12">
                      <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">Search for Price Comparison</h3>
                      <p className="text-muted-foreground">Enter a product type to compare prices across vendors</p>
                    </div>
                  ) : priceComparison.comparison && priceComparison.comparison.length === 0 ? (
                    <div className="text-center p-12">
                      <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">No Products Found</h3>
                      <p className="text-muted-foreground">No vendors have listed "{priceComparison.product_type}" in their inventory</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3">Product</th>
                              <th className="text-left py-3">Vendor</th>
                              <th className="text-left py-3">Price</th>
                              <th className="text-left py-3">Stock</th>
                              <th className="text-left py-3">Rating</th>
                            </tr>
                          </thead>
                          <tbody>
                            {priceComparison.comparison.map((item: any, idx: number) => (
                              <tr key={idx} className="border-b border-border/50">
                                <td className="py-3 font-semibold">{item.product_name}</td>
                                <td className="py-3">{item.vendor_name}</td>
                                <td className={`py-3 ${idx === 0 ? 'text-success font-semibold' : ''}`}>
                                  {item.price_display}
                                </td>
                                <td className="py-3 text-sm">{item.stock}</td>
                                <td className="py-3">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <span>{item.vendor_rating.toFixed(1)}</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {priceComparison.best_price && (
                        <div className="mt-6 p-4 bg-success/10 rounded-lg border border-success/20">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-success" />
                            <span className="font-semibold text-success">Best Deal</span>
                          </div>
                          <p className="text-sm">
                            <strong>{priceComparison.best_price.vendor_name}</strong> offers the best price at{' '}
                            <strong>{priceComparison.best_price.price_display}</strong> for{' '}
                            {priceComparison.best_price.product_name}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* RFQ & Bidding Tab */}
            <TabsContent value="rfq">
              <div className="space-y-6">
                <Card className="agri-card">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold">Request for Quotation | కోట్ కోసం అభ్యర్థన</h2>
                      <Badge variant={rfqSent ? "default" : "secondary"}>
                        {rfqSent ? "RFQ Sent" : "Draft"}
                      </Badge>
                    </div>

                    {rfqItems.length === 0 ? (
                      <div className="text-center p-8 mb-6">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No RFQ items available. Create an RFQ to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 mb-6">
                        {rfqItems.map((item, index) => (
                          <div key={index} className="p-4 border border-border rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label className="text-sm font-semibold">Item</Label>
                                <p>{item.item}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-semibold">Quantity</Label>
                                <p>{item.quantity}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-semibold">Specification</Label>
                                <p className="text-sm text-muted-foreground">{item.specification}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-4">
                      <Button 
                        className="agri-button-primary"
                        onClick={() => setRfqSent(true)}
                        disabled={selectedSuppliers.length === 0}
                      >
                        Send RFQ to {selectedSuppliers.length} Suppliers
                      </Button>
                      <Button variant="outline">
                        Add More Items
                      </Button>
                    </div>

                    {selectedSuppliers.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Please select suppliers from the Suppliers tab to send RFQ
                      </p>
                    )}
                  </div>
                </Card>

                {/* Received Bids */}
                {(rfqSent || bids.length > 0) && (
                  <Card className="agri-card">
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-4">Received Bids | అందిన కోట్లు</h3>
                      
                      {bids.length === 0 ? (
                        <div className="text-center p-8">
                          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No bids received yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {bids.map((bid, index) => (
                          <div key={index} className={`p-4 border rounded-lg ${index === 0 ? 'border-success bg-success/5' : 'border-border'}`}>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="font-bold">{bid.supplierName}</h4>
                                <p className="text-2xl font-bold text-primary">{bid.totalAmount}</p>
                              </div>
                              <div className="text-right">
                                <Badge className="mb-2">Score: {bid.score}%</Badge>
                                <p className="text-sm text-muted-foreground">{bid.deliveryDays} days delivery</p>
                              </div>
                            </div>

                            <div className="space-y-2 mb-4 text-sm">
                              <div className="flex justify-between">
                                <span>Payment Terms:</span>
                                <span className="font-semibold">{bid.paymentTerms}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Valid Until:</span>
                                <span className="font-semibold">{bid.validityDays} days</span>
                              </div>
                              <div className="flex justify-between">
                                <span>GST:</span>
                                <span className="font-semibold">{bid.gstIncluded ? 'Included' : 'Extra'}</span>
                              </div>
                            </div>

                            <Button 
                              className={index === 0 ? "agri-button-primary w-full" : "agri-button-secondary w-full"}
                              onClick={() => {
                                console.log('Contract awarded/bid selected');
                                // In real implementation, this would handle contract awarding
                                // For now, navigate back to seed planner
                                onBackToSeedPlanner?.();
                              }}
                            >
                              {index === 0 ? 'Award Contract' : 'Select Bid'}
                            </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Order Tracking Tab */}
            <TabsContent value="orders">
              <Card className="agri-card">
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Order Tracking | ఆర్డర్ ట్రాకింగ్</h2>
                  
                  {orders.length === 0 ? (
                    <div className="text-center p-12">
                      <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">No Active Orders</h3>
                      <p className="text-muted-foreground">You don't have any orders yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-bold">{order.orderId}</h4>
                            <p className="text-accent font-semibold">{order.supplier}</p>
                            <p className="text-sm text-muted-foreground">{order.items}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">{order.amount}</p>
                            <Badge variant={
                              order.status === 'Delivered' ? 'default' :
                              order.status === 'In Transit' ? 'secondary' : 'destructive'
                            }>
                              {order.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm">
                            {order.status === 'In Transit' ? (
                              <>
                                <div className="flex items-center gap-1">
                                  <Truck className="w-4 h-4 text-primary" />
                                  <span>Expected: {order.expectedDelivery}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Package className="w-4 h-4 text-muted-foreground" />
                                  <span>Tracking: {order.trackingId}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-success" />
                                <span>Delivered: {order.deliveredDate}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            {order.status === 'In Transit' && (
                              <Button size="sm" variant="outline">Track</Button>
                            )}
                            {order.invoiceGenerated && (
                              <Button size="sm" variant="outline">
                                <FileText className="w-4 h-4 mr-1" />
                                Invoice
                              </Button>
                            )}
                          </div>
                        </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* GST Invoices Tab */}
            <TabsContent value="invoices">
              <Card className="agri-card">
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-6">GST Invoices | జీఎస్టీ బిల్లులు</h2>
                  
                  {invoices.length === 0 ? (
                    <div className="text-center p-12">
                      <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">No Invoices</h3>
                      <p className="text-muted-foreground">You don't have any invoices yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {invoices.map((invoice, index) => (
                        <div key={index} className="p-4 border border-border rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-bold">{invoice.invoice_number}</h4>
                              <p className="text-accent font-semibold">{invoice.supplier_name}</p>
                              <p className="text-sm text-muted-foreground">GST: {invoice.gst_number}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold">{invoice.total_amount}</p>
                              <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                                {invoice.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <p className="text-muted-foreground">Invoice Date</p>
                              <p className="font-semibold">
                                {invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Due Date</p>
                              <p className="font-semibold">
                                {invoice.due_at ? new Date(invoice.due_at).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">CGST (9%)</p>
                              <p className="font-semibold">{invoice.cgst}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">SGST (9%)</p>
                              <p className="font-semibold">{invoice.sgst}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <FileText className="w-4 h-4 mr-1" />
                              Download PDF
                            </Button>
                            <Button size="sm" variant="outline">Print</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProcurementManager;

