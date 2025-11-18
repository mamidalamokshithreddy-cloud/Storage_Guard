import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
// import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { useToast } from "../ui/use-toast";
import { 
  MapPin, 
  Navigation, 
  Phone, 
  Clock, 
  Star,
  Snowflake,
  Wheat,
  Truck,
  Building,
  Loader2
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface StorageLocation {
  id: string;
  name: string;
  type: 'cold_storage' | 'dry_storage' | 'transport' | 'processing';
  address: string;
  coordinates: [number, number];
  capacity: string;
  price: string;
  rating: number;
  phone?: string;
  hours?: string;
  facilities: string[];
  distance?: string;
  vendor_name?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

const StorageLocationMap = () => {
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch real storage locations from backend
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/storage-guard/locations`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched locations:', data);
          
          // Transform backend data to match our interface
          const transformedLocations = (data.locations || []).map((loc: any) => ({
            id: loc.id,
            name: loc.name,
            type: loc.storage_type || 'dry_storage',
            address: `${loc.address || ''}, ${loc.city || ''}, ${loc.state || ''} ${loc.pincode || ''}`.trim(),
            coordinates: [loc.longitude || 78.4744, loc.latitude || 17.3850] as [number, number],
            capacity: `${loc.capacity_mt || 0} MT`,
            price: `₹${loc.price_per_mt_per_month || 0}/MT/month`,
            rating: loc.rating || 4.5,
            phone: loc.contact_phone || 'N/A',
            hours: '24/7 Operations',
            facilities: loc.facilities || ['Storage', 'Security', 'Quality Control'],
            distance: 'N/A',
            vendor_name: loc.vendor_name || loc.full_name || 'N/A',
            city: loc.city,
            state: loc.state,
            pincode: loc.pincode
          }));
          
          setStorageLocations(transformedLocations);
          if (transformedLocations.length > 0) {
            setSelectedLocation(transformedLocations[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'cold_storage': return <Snowflake className="h-4 w-4 text-blue-600" />;
      case 'dry_storage': return <Wheat className="h-4 w-4 text-amber-600" />;
      case 'transport': return <Truck className="h-4 w-4 text-green-600" />;
      case 'processing': return <Building className="h-4 w-4 text-purple-600" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'cold_storage': return 'Cold Storage';
      case 'dry_storage': return 'Dry Storage';
      case 'transport': return 'Transport';
      case 'processing': return 'Processing';
      default: return 'Unknown';
    }
  };

  // Mock map functionality - replace with actual map when mapbox is available

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading storage locations...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (storageLocations.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No storage locations available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Nearest Storage & Transport Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mock Map */}
            <div className="h-96 rounded-lg overflow-hidden border bg-gradient-to-br from-green-50 to-blue-50 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <MapPin className="w-12 h-12 mx-auto text-primary" />
                  <div>
                    <h3 className="font-semibold text-lg">Storage Locations Map</h3>
                    <p className="text-sm text-muted-foreground">Interactive map showing nearby storage facilities</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {storageLocations.slice(0, 4).map((location) => (
                      <button
                        key={location.id}
                        onClick={() => setSelectedLocation(location)}
                        className="p-2 text-xs bg-white rounded border hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-1">
                          {getLocationIcon(location.type)}
                          <span className="truncate">{location.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

              {/* Selected Location Details */}
              <div className="space-y-4">
                {selectedLocation ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {getLocationIcon(selectedLocation.type)}
                        {selectedLocation.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{getTypeLabel(selectedLocation.type)}</Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{selectedLocation.rating}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm">{selectedLocation.address}</p>
                          <p className="text-xs text-muted-foreground">{selectedLocation.distance} away</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedLocation.phone}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedLocation.hours}</span>
                      </div>
                      
                      {selectedLocation.vendor_name && selectedLocation.vendor_name !== 'N/A' && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Vendor: {selectedLocation.vendor_name}</span>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Capacity: {selectedLocation.capacity}</p>
                        <p className="text-sm font-medium text-primary mb-3">{selectedLocation.price}</p>
                        
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">FACILITIES</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedLocation.facilities.map((facility, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {facility}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            const phoneNumber = selectedLocation.phone?.replace(/\D/g, '');
                            if (phoneNumber && phoneNumber !== 'N/A') {
                              window.location.href = `tel:${phoneNumber}`;
                              toast({
                                title: "📞 Calling Location",
                                description: `Calling ${selectedLocation.name}...`,
                              });
                            } else {
                              toast({
                                title: "No Contact Available",
                                description: "Contact information not available for this location",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Contact
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            const [lng, lat] = selectedLocation.coordinates;
                            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                            window.open(googleMapsUrl, '_blank');
                            toast({
                              title: "🗺️ Opening Directions",
                              description: `Getting directions to ${selectedLocation.name}`,
                            });
                          }}
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          Directions
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center h-96 border rounded-lg bg-muted/20">
                    <p className="text-muted-foreground">Click on a map marker to view details</p>
                  </div>
                )}
              </div>
            </div>
        </CardContent>
      </Card>

      {/* Location List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {storageLocations.map((location) => (
          <Card key={location.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedLocation(location)}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                {getLocationIcon(location.type)}
                {location.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{getTypeLabel(location.type)}</Badge>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs">{location.rating}</span>
                </div>
                <span className="text-xs text-muted-foreground">{location.distance}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground line-clamp-2">{location.address}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs">Capacity: {location.capacity}</span>
                <span className="text-xs font-medium text-primary">{location.price}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {location.facilities.slice(0, 2).map((facility, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {facility}
                  </Badge>
                ))}
                {location.facilities.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{location.facilities.length - 2} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StorageLocationMap;