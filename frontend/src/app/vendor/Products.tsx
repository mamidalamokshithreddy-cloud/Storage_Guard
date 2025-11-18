'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiUpload, FiArrowLeft } from 'react-icons/fi';

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  image: string;
}

const initialProducts: Product[] = [
  {
    id: 1,
    name: 'Soil Moisture Sensor',
    category: 'IoT Sensors',
    price: 89.99,
    stock: 45,
    description: 'High-precision soil moisture sensor for agricultural applications',
    image: '/sensor.jpg'
  },
  {
    id: 2,
    name: 'Agricultural Drone X200',
    category: 'Drones',
    price: 2499.99,
    stock: 8,
    description: 'Advanced agricultural drone for crop monitoring and analysis',
    image: '/drone.jpg'
  },
  {
    id: 3,
    name: 'Automatic Harvester',
    category: 'Harvesting Equipment',
    price: 12500.00,
    stock: 3,
    description: 'Fully automatic harvesting machine for various crops',
    image: '/harvester.jpg'
  },
  {
    id: 4,
    name: 'Weather Station Pro',
    category: 'IoT Sensors',
    price: 349.99,
    stock: 15,
    description: 'Professional weather monitoring station with wireless connectivity',
    image: '/weather-station.jpg'
  }
];

export interface ProductsPageProps {}

const ProductsPage: React.FC<ProductsPageProps> = () => {
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Filter products based on search term and category
  useEffect(() => {
    let result = allProducts;
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term)
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'All Categories') {
      result = result.filter(product => product.category === selectedCategory);
    }
    
    const timer = setTimeout(() => {
      setFilteredProducts(result);
    }, 0);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, allProducts]);

  const handleAddProduct = (productData: Omit<Product, 'id' | 'image'> & { id?: number }) => {
    if (editingProduct && productData.id) {
      // Update existing product
      const updatedProducts = allProducts.map(p => 
        p.id === productData.id ? { 
          ...p,
          ...productData,
          price: typeof productData.price === 'string' ? parseFloat(productData.price) : productData.price,
          stock: typeof productData.stock === 'string' ? parseInt(productData.stock) : productData.stock,
          description: productData.description || ''
        } : p
      );
      setAllProducts(updatedProducts);
      setEditingProduct(null);
    } else {
      // Add new product
      const newProduct: Product = {
        ...productData,
        id: Math.max(0, ...allProducts.map(p => p.id)) + 1,
        image: '/placeholder-product.jpg',
        price: typeof productData.price === 'string' ? parseFloat(productData.price) : productData.price,
        stock: typeof productData.stock === 'string' ? parseInt(productData.stock) : productData.stock,
        description: productData.description || ''
      };
      setAllProducts([...allProducts, newProduct]);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (productId: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setAllProducts(allProducts.filter(product => product.id !== productId));
      if (editingProduct?.id === productId) {
        setEditingProduct(null);
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const router = useRouter();

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 sm:mb-0"
          >
            <FiArrowLeft className="mr-2" /> Back to Dashboard
          </button>
          <div className="h-10 w-36 bg-green-600 rounded-lg animate-pulse"></div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="h-48 bg-gray-200 animate-pulse"></div>
                <div className="p-4 space-y-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <AddProductModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose}
        onAddProduct={handleAddProduct}
        productToEdit={editingProduct}
      />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FiPlus className="mr-2" />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Search products..."
              />
            </div>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 min-w-[160px]"
            >
              <option value="All Categories">All Categories</option>
              {Array.from(new Set(initialProducts.map(p => p.category))).map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 p-2">
              {filteredProducts.map((product: Product) => (
                <div 
                  key={product.id} 
                  className="group bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 flex flex-col h-full w-full"
                >
                  <div className="h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjwvc3ZnPg==';
                          target.alt = 'Image not available | చిత్రం అందుబాటులో లేదు';
                        }}
                      />
                    ) : (
                      <div className="text-gray-300">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-2 flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-1.5">
                      <h3 className="text-sm font-medium text-gray-900 truncate flex-1" title={product.name}>
                        {product.name}
                      </h3>
                      <span className="text-sm font-semibold text-green-600 whitespace-nowrap ml-1">
                        ₹{product.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mb-2">{product.category}</p>
                    <div className="mt-auto">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.stock > 10 ? 'bg-green-100 text-green-800' : 
                          product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock} available
                        </span>
                        <div className="flex space-x-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProduct(product);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FiEdit2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(product.id);
                            }}
                            className="text-red-600 hover:text-red-800 ml-4"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <FiSearch size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchTerm || selectedCategory !== 'All Categories' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding a new product'}
            </p>
            {!searchTerm && selectedCategory === 'All Categories | అన్ని వర్గాలు' && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <FiPlus className="mr-2" />
                Add your first product
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// This is the main page component that will be used for the /products route
export default function ProductsPageWrapper() {
  return <ProductsPage />;
}

export interface ProductModalProps {
  id?: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  image?: string;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Omit<ProductModalProps, 'id' | 'image'> & { id?: number }) => void;
  productToEdit?: ProductModalProps | null;
}

export function AddProductModal({ 
  isOpen, 
  onClose, 
  onAddProduct,
  productToEdit 
}: AddProductModalProps) {
  const [product, setProduct] = useState<Omit<ProductModalProps, 'id' | 'image'>>({
    name: '',
    category: '',
    price: 0,
    stock: 0,
    description: ''
  });

  // Update form when productToEdit changes
  useEffect(() => {
    const newProduct = productToEdit ? 
      (() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, image: _image, ...productData } = productToEdit;
        return productData;
      })() :
      {
        name: '',
        category: '',
        price: 0,
        stock: 0,
        description: ''
      };

    // Only update if the values are different
    if (JSON.stringify(product) !== JSON.stringify(newProduct)) {
      // Use setTimeout to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        setProduct(newProduct);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productToEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddProduct({
      ...product,
      price: Number(product.price),
      stock: Number(product.stock)
    });
    onClose();
  };

  const isEditMode = !!productToEdit;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md aspect-square flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 -mr-2"
          >
            <FiX size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="space-y-4 overflow-y-auto pr-2 -mr-2">
          {isEditMode && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Editing an existing product
                  </p>
                </div>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              type="text"
              name="name"
              value={product.name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  name="price"
                  value={product.price}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <input
                type="number"
                name="stock"
                value={product.stock}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              name="category"
              value={product.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="">Select a category</option>
              <option value="IoT Sensors">IoT Sensors</option>
              <option value="Drones">Drones</option>
              <option value="Harvesting Equipment">Harvesting Equipment</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={product.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none">
                    <span>Upload a file</span>
                    <input type="file" className="sr-only" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {isEditMode ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


