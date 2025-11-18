import { useState } from 'react';
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Star, ShoppingCart, Heart, Eye, MapPin, Calendar, Award, Search } from "lucide-react";
import { useShoppingCart } from "../marketconnect/ShoppingCartContext";
import { toast } from "../../hooks/use-toast";


const products = [
  {
    id: "cotton-001",
    name: "Premium Cotton",
    nameTelugu: "ప్రీమియం పత్తి",
    price: 6200,
    originalPrice: 6500,
    image: "/premium-cotton.jpg",
    weight: "100 quintals",
    grade: "A Grade",
    farmOrigin: "Warangal, Telangana",
    farmOriginTelugu: "వరంగల్, తెలంగాణ",
    farmer: "Ravi Kumar",
    rating: 4.8,
    reviews: 156,
    description: "High quality Bt Cotton with excellent fiber strength and micronaire value. Organic certified.",
    harvestDate: "Dec 15, 2024",
    certifications: ["Organic", "BCI", "Export Quality"],
    category: "Cotton",
    featured: true,
    discount: 5
  },
  {
    id: "soybean-001", 
    name: "Organic Soybean",
    nameTelugu: "సేంద్రీయ సోయాబీన్",
    price: 4800,
    originalPrice: 5000,
    image: "/organic-soybean.jpg",
    weight: "80 quintals",
    grade: "FAQ Grade",
    farmOrigin: "Nizamabad, Telangana",
    farmOriginTelugu: "నిజామాబాద్, తెలంగాణ",
    farmer: "Lakshmi Devi",
    rating: 4.6,
    reviews: 89,
    description: "Premium quality soybean with high protein content. Perfect for oil extraction.",
    harvestDate: "Nov 28, 2024",
    certifications: ["Organic", "Non-GMO"],
    category: "Soybean",
    featured: false,
    discount: 4
  },
  {
    id: "maize-001",
    name: "Yellow Maize",
    nameTelugu: "పసుపు మొక్కజొన్న",
    price: 2100,
    originalPrice: 2200,
    image: "/yellow-maize.jpg",
    weight: "150 quintals",
    grade: "Grade I",
    farmOrigin: "Karimnagar, Telangana",
    farmOriginTelugu: "కరీంనగర్, తెలంగాణ",
    farmer: "Suresh Reddy",
    rating: 4.5,
    reviews: 123,
    description: "Fresh yellow maize with low moisture content. Ideal for poultry feed.",
    harvestDate: "Jan 5, 2025",
    certifications: ["Quality Assured"],
    category: "Maize",
    featured: true,
    discount: 5
  },
  {
    id: "rice-001",
    name: "Basmati Rice",
    nameTelugu: "బాస్మతి బియ్యం",
    price: 5500,
    originalPrice: 5800,
    image: "/basmati-rice.jpg",
    weight: "60 quintals",
    grade: "Premium",
    farmOrigin: "Nalgonda, Telangana",
    farmOriginTelugu: "నల్గొండ, తెలంగాణ",
    farmer: "Venkat Rao",
    rating: 4.9,
    reviews: 234,
    description: "Aromatic long grain basmati rice with excellent cooking quality.",
    harvestDate: "Dec 10, 2024",
    certifications: ["Export Quality", "Organic"],
    category: "Rice",
    featured: true,
    discount: 5
  },
  {
    id: "wheat-001",
    name: "Durum Wheat",
    nameTelugu: "దురుమ్ గోధుమ",
    price: 2800,
    originalPrice: 2950,
    image: "/durum-wheat.jpg",
    weight: "120 quintals",
    grade: "Grade A",
    farmOrigin: "Medak, Telangana",
    farmOriginTelugu: "మెడక్, తెలంగాణ",
    farmer: "Krishna Murthy",
    rating: 4.4,
    reviews: 67,
    description: "High protein durum wheat perfect for pasta and semolina production.",
    harvestDate: "Feb 20, 2024",
    certifications: ["Quality Assured"],
    category: "Wheat",
    featured: false,
    discount: 5
  },
  {
    id: "tomato-001",
    name: "Fresh Tomatoes",
    nameTelugu: "తాజా టమోటాలు",
    price: 3200,
    originalPrice: 3400,
    image: "/fresh-tomatoes.jpg",
    weight: "50 quintals",
    grade: "Grade I",
    farmOrigin: "Rangareddy, Telangana",
    farmOriginTelugu: "రంగారెడ్డి, తెలంగాణ",
    farmer: "Madhavi Reddy",
    rating: 4.7,
    reviews: 198,
    description: "Fresh, ripe tomatoes with excellent color and taste. Pesticide-free.",
    harvestDate: "Jan 15, 2025",
    certifications: ["Pesticide-Free", "Fresh"],
    category: "Vegetables",
    featured: false,
    discount: 6
  }
];

const categories = ["All", "Cotton", "Soybean", "Maize", "Rice", "Wheat", "Vegetables"];
const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest First" }
];

export default function ProductGrid() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const { addToCart } = useShoppingCart();

  const filteredProducts = products
    .filter(product => {
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.nameTelugu.includes(searchQuery) ||
                           product.farmer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "newest":
          return new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime();
        case "featured":
        default:
          return Number(b.featured) - Number(a.featured);
      }
    });

  const handleAddToCart = (product: any, quantity = 1) => {
    addToCart(product, quantity);
    toast({
      title: "Added to Cart",
      description: `${product.name} (${quantity} quintal${quantity > 1 ? 's' : ''}) added to cart.`,
    });
  };

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products, farmers, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory === category ? "agri-button-primary" : ""}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <Card key={product.id} className="agri-card hover:shadow-lg transition-shadow duration-300 group">
            <div className="relative">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              
              {/* Overlay badges */}
              <div className="absolute top-2 left-2 space-y-1">
                {product.featured && (
                  <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                )}
                {product.discount > 0 && (
                  <Badge className="bg-destructive text-destructive-foreground">
                    {product.discount}% OFF
                  </Badge>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0"
                  onClick={() => toggleFavorite(product.id)}
                >
                  <Heart className={`h-4 w-4 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    {selectedProduct && (
                      <>
                        <DialogHeader>
                          <DialogTitle className="text-2xl">{selectedProduct.name}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <img 
                              src={selectedProduct.image} 
                              alt={selectedProduct.name}
                              className="w-full h-64 object-cover rounded-lg"
                            />
                          </div>
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-3xl font-bold text-primary">₹{selectedProduct.price.toLocaleString()}</span>
                                {selectedProduct.originalPrice > selectedProduct.price && (
                                  <span className="text-lg text-muted-foreground line-through">₹{selectedProduct.originalPrice.toLocaleString()}</span>
                                )}
                              </div>
                              <p className="text-muted-foreground">per quintal • {selectedProduct.weight} available</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(selectedProduct.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">({selectedProduct.reviews} reviews)</span>
                            </div>
                            
                            <p className="text-sm">{selectedProduct.description}</p>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Farmer</p>
                                <p className="font-semibold">{selectedProduct.farmer}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Grade</p>
                                <p className="font-semibold">{selectedProduct.grade}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Origin</p>
                                <p className="font-semibold">{selectedProduct.farmOrigin}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Harvest Date</p>
                                <p className="font-semibold">{selectedProduct.harvestDate}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-1">
                              {selectedProduct.certifications.map((cert: string) => (
                                <Badge key={cert} variant="outline" className="text-xs">
                                  <Award className="h-3 w-3 mr-1" />
                                  {cert}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                className="flex-1 agri-button-primary"
                                onClick={() => handleAddToCart(selectedProduct, 1)}
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Add to Cart
                              </Button>
                              <Button variant="outline" className="flex-1">
                                Contact Farmer
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-sm text-accent font-medium">{product.nameTelugu}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">({product.reviews})</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{product.farmOrigin}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Harvested: {product.harvestDate}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-primary">₹{product.price.toLocaleString()}</span>
                  {product.originalPrice > product.price && (
                    <span className="text-sm text-muted-foreground line-through ml-2">₹{product.originalPrice.toLocaleString()}</span>
                  )}
                  <p className="text-xs text-muted-foreground">per quintal</p>
                </div>
                <Badge variant="outline">{product.grade}</Badge>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {product.certifications.slice(0, 2).map(cert => (
                  <Badge key={cert} variant="secondary" className="text-xs">
                    {cert}
                  </Badge>
                ))}
                {product.certifications.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{product.certifications.length - 2} more
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground">
                Available: {product.weight} • Farmer: {product.farmer}
              </p>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1 agri-button-primary"
                  onClick={() => handleAddToCart(product, 1)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="sm" className="px-3">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}