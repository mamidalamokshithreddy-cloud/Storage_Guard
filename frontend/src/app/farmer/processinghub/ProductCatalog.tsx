import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ShoppingCart, Heart, Star, Filter, Search } from "lucide-react";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface Product {
  id: string;
  name: string;
  nameTelugu: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  categoryTelugu: string;
  description: string;
  descriptionTelugu: string;
  organic: boolean;
  inStock: boolean;
  weight: string;
  farmOrigin: string;
  farmOriginTelugu: string;
  certifications: string[];
}

interface ProductCatalogProps {
  onAddToCart: (_product: Product, _quantity: number) => void;
  cartItems: { [key: string]: number };
}

const ProductCatalog = ({ onAddToCart, cartItems }: ProductCatalogProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const products: Product[] = [
    {
      id: "prod001",
      name: "Heritage Heirloom Tomatoes",
      nameTelugu: "సాంప్రదాయిక టమోటాలు",
      price: 180,
      originalPrice: 220,
      rating: 4.8,
      reviews: 156,
      image: "/api/placeholder/300/200",
      category: "vegetables",
      categoryTelugu: "కూరగాయలు",
      description: "Ancient variety tomatoes grown using traditional farming methods",
      descriptionTelugu: "సాంప్రదాయిక వ్యవసాయ పద్ధతులతో పెంచిన పురాతన రకం టమోటాలు",
      organic: true,
      inStock: true,
      weight: "1 kg",
      farmOrigin: "Warangal, Telangana",
      farmOriginTelugu: "వరంగల్, తెలంగాణ",
      certifications: ["Organic", "Native Seeds", "Zero Pesticide"]
    },
    {
      id: "prod002", 
      name: "Wild Forest Honey",
      nameTelugu: "అడవి తేనె",
      price: 650,
      originalPrice: 800,
      rating: 4.9,
      reviews: 89,
      image: "/api/placeholder/300/200",
      category: "honey",
      categoryTelugu: "తేనె",
      description: "Pure wild honey collected from Nallamala forests",
      descriptionTelugu: "నల్లమల అడవుల నుండి సేకరించిన స్వచ్ఛమైన అడవి తేనె",
      organic: true,
      inStock: true,
      weight: "500g",
      farmOrigin: "Nallamala Hills",
      farmOriginTelugu: "నల్లమల కొండలు", 
      certifications: ["Wild Harvested", "Raw & Unfiltered", "Ancient Methods"]
    },
    {
      id: "prod003",
      name: "Millets Mix (5 Ancient Grains)",
      nameTelugu: "సిరిధాన్యాలు మిక్స్",
      price: 320,
      originalPrice: 380,
      rating: 4.7,
      reviews: 203,
      image: "/api/placeholder/300/200",
      category: "grains",
      categoryTelugu: "ధాన్యాలు",
      description: "Traditional millets blend with foxtail, pearl, finger and little millets",
      descriptionTelugu: "కొర్రలు, సజ్జలు, రాగులు మరియు సామలతో సాంప్రదాయిక సిరిధాన్యాల మిశ్రమం",
      organic: true,
      inStock: true,
      weight: "2 kg",
      farmOrigin: "Anantapur, Andhra Pradesh",
      farmOriginTelugu: "అనంతపురం, ఆంధ్రప్రదేశ్",
      certifications: ["Organic", "Drought Resistant", "Climate Resilient"]
    },
    {
      id: "prod004",
      name: "Cold-Pressed Sesame Oil",
      nameTelugu: "నువ్వుల నూనె",
      price: 450,
      originalPrice: 520,
      rating: 4.6,
      reviews: 134,
      image: "/api/placeholder/300/200", 
      category: "oils",
      categoryTelugu: "నూనెలు",
      description: "Traditional wooden Ghani pressed sesame oil",
      descriptionTelugu: "సాంప్రదాయిక కలప ఘాణీతో తీసిన నువ్వుల నూనె",
      organic: true,
      inStock: true,
      weight: "1 liter",
      farmOrigin: "Karimnagar, Telangana", 
      farmOriginTelugu: "కరీంనగర్, తెలంగాణ",
      certifications: ["Cold Pressed", "Wood Pressed", "Chemical Free"]
    },
    {
      id: "prod005",
      name: "Desi Cow Ghee",
      nameTelugu: "దేశీ ఆవు నెయ్యి", 
      price: 1200,
      originalPrice: 1400,
      rating: 4.9,
      reviews: 78,
      image: "/api/placeholder/300/200",
      category: "dairy",
      categoryTelugu: "పాల ఉత్పత్తులు",
      description: "Pure A2 ghee from grass-fed indigenous cows",
      descriptionTelugu: "గడ్డిమేత దేశీ ఆవుల నుండి స్వచ్ఛమైన A2 నెయ్యి",
      organic: true,
      inStock: false,
      weight: "500g",
      farmOrigin: "Khammam, Telangana",
      farmOriginTelugu: "ఖమ్మం, తెలంగాణ",
      certifications: ["A2 Milk", "Grass Fed", "Traditional Churning"]
    },
    {
      id: "prod006",
      name: "Purple Rice (Kavuni Arisi)",
      nameTelugu: "నల్ల బియ్యం",
      price: 280,
      originalPrice: 350,
      rating: 4.5,
      reviews: 167,
      image: "/api/placeholder/300/200",
      category: "grains", 
      categoryTelugu: "ధాన్యాలు",
      description: "Antioxidant-rich ancient purple rice variety",
      descriptionTelugu: "యాంటీఆక్సిడెంట్లు పుష్కలంగా గల పురాతన నల్ల బియ్యం రకం",
      organic: true,
      inStock: true,
      weight: "1 kg",
      farmOrigin: "East Godavari, AP",
      farmOriginTelugu: "తూర్పు గోదావరి, ఆ.ప్ర.",
      certifications: ["Heirloom Variety", "High Antioxidants", "Gluten Free"]
    }
  ];

  const categories = [
    { value: "all", label: "All Products", labelTelugu: "అన్ని ఉత్పత్తులు" },
    { value: "vegetables", label: "Vegetables", labelTelugu: "కూరగాయలు" },
    { value: "grains", label: "Grains & Millets", labelTelugu: "ధాన్యాలు" },
    { value: "oils", label: "Oils", labelTelugu: "నూనెలు" },
    { value: "honey", label: "Honey", labelTelugu: "తేనె" },
    { value: "dairy", label: "Dairy", labelTelugu: "పాల ఉత్పత్తులు" }
  ];

  const filteredProducts = products
    .filter(product => 
      (selectedCategory === "all" || product.category === selectedCategory) &&
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       product.nameTelugu.includes(searchTerm))
    )
    .sort((a, b) => {
      if (sortBy === "price") return a.price - b.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Product Filters | ఉత్పత్తుల వడపోత
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products... | ఉత్పత్తులు వెతకండి..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label} | {cat.labelTelugu}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name | పేరు</SelectItem>
                <SelectItem value="price">Price | ధర</SelectItem>
                <SelectItem value="rating">Rating | రేటింగ్</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="relative">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 left-2 space-y-1">
                {product.organic && (
                  <Badge className="bg-green-500 text-white">🌱 Organic</Badge>
                )}
                {product.originalPrice && (
                  <Badge className="bg-red-500 text-white">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </Badge>
                )}
              </div>
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute top-2 right-2 bg-white/80 hover:bg-white"
              >
                <Heart className="w-4 h-4" />
              </Button>
              {!product.inStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge variant="destructive" className="text-lg">Out of Stock</Badge>
                </div>
              )}
            </div>
            
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-lg line-clamp-1">{product.name}</h3>
                  <p className="text-primary font-medium text-sm">{product.nameTelugu}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">({product.reviews})</span>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">₹{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">₹{product.originalPrice}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{product.weight}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    <strong>From:</strong> {product.farmOrigin} | {product.farmOriginTelugu}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {product.certifications.slice(0, 2).map((cert, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{cert}</Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1 agri-button-primary"
                    disabled={!product.inStock}
                    onClick={() => onAddToCart(product, 1)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {cartItems[product.id] ? `In Cart (${cartItems[product.id]})` : 'Add to Cart'}
                  </Button>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductCatalog;