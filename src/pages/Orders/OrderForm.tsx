import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ShoppingCart, Save, ArrowLeft, Camera, Plus, Minus, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import ProductSearchBar from '@/components/ProductSearchBar';
import ProductSelectionDialog from '@/components/ProductSelectionDialog';

interface Product {
  ID: number;
  product_name: string;
  product_code: string;
  bar_code_case: string;
  bar_code_unit: string;
  price: number;
  retail_price: number;
  category: string;
  supplier: string;
  quantity_in_stock: number;
  unit_per_case: number;
  weight: number;
  weight_unit: string;
}

interface OrderItem {
  product: Product;
  quantity: number;
  unitType: string;
  subtotal: number;
}

interface OrderFormData {
  order_number: string;
  station: string;
  notes: string;
  items: OrderItem[];
  total_amount: number;
}

const OrderForm: React.FC = () => {
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [formData, setFormData] = useState<OrderFormData>({
    order_number: '',
    station: 'MOBIL',
    notes: '',
    items: [],
    total_amount: 0
  });
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [matchedProducts, setMatchedProducts] = useState<Product[]>([]);
  const [selectedQuantity, setSelectedQuantity] = useState<{[key: number]: number;}>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();

  const stations = ['MOBIL', 'AMOCO ROSEDALE', 'AMOCO BROOKLYN'];

  // Enhanced barcode scanner with camera access
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef) {
        videoRef.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions."
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const searchProductsByBarcode = async (barcode: string) => {
    try {
      setLoading(true);

      // Search for products matching the barcode
      const { data, error } = await window.ezsite.apis.tablePage('11726', {
        PageNo: 1,
        PageSize: 10,
        Filters: [
        { name: 'bar_code_case', op: 'Equal', value: barcode },
        { name: 'bar_code_unit', op: 'Equal', value: barcode }]

      });

      if (error) throw error;

      const products = data?.List || [];
      setMatchedProducts(products);

      if (products.length === 0) {
        toast({
          title: "No Products Found",
          description: `No products found with barcode: ${barcode}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Products Found",
          description: `Found ${products.length} product(s) matching barcode: ${barcode}`
        });
      }
    } catch (error) {
      console.error('Error searching products:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateBarcodeCapture = () => {
    // Simulate barcode detection for demo purposes
    // In production, this would use a real barcode detection library
    const simulatedBarcode = '123456789012';
    searchProductsByBarcode(simulatedBarcode);
    setScannerOpen(false);
    stopCamera();
  };

  const addProductToOrder = (product: Product, quantity: number = 1, unitType: string = 'pieces') => {
    let pricePerUnit = product.price;

    // Adjust price based on unit type
    if (unitType === 'cases' && product.unit_per_case > 0) {
      pricePerUnit = product.price * product.unit_per_case;
    }

    const subtotal = pricePerUnit * quantity;

    const newItem: OrderItem = {
      product,
      quantity,
      unitType,
      subtotal
    };

    // Check if product already exists in order with same unit type
    const existingItemIndex = formData.items.findIndex(
      (item) => item.product.ID === product.ID && item.unitType === unitType
    );

    let updatedItems;
    if (existingItemIndex >= 0) {
      // Update existing item
      updatedItems = [...formData.items];
      const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
      let newPricePerUnit = updatedItems[existingItemIndex].product.price;

      if (unitType === 'cases' && product.unit_per_case > 0) {
        newPricePerUnit = product.price * product.unit_per_case;
      }

      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: newQuantity,
        subtotal: newPricePerUnit * newQuantity
      };
    } else {
      // Add new item
      updatedItems = [...formData.items, newItem];
    }

    const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      total_amount: newTotal
    }));

    setMatchedProducts([]);
    setSelectedQuantity({});

    toast({
      title: "Product Added",
      description: `${quantity} ${unitType} of ${product.product_name} added to order`
    });
  };

  const updateItemQuantity = (itemIndex: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemIndex);
      return;
    }

    const updatedItems = [...formData.items];
    const item = updatedItems[itemIndex];
    let pricePerUnit = item.product.price;

    if (item.unitType === 'cases' && item.product.unit_per_case > 0) {
      pricePerUnit = item.product.price * item.product.unit_per_case;
    }

    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      quantity: newQuantity,
      subtotal: pricePerUnit * newQuantity
    };

    const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      total_amount: newTotal
    }));
  };

  const removeItem = (itemIndex: number) => {
    const updatedItems = formData.items.filter((_, index) => index !== itemIndex);
    const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      total_amount: newTotal
    }));
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setShowSelectionDialog(true);
  };

  const handleProductConfirm = (product: Product, quantity: number, unitType: string) => {
    addProductToOrder(product, quantity, unitType);
    setShowSelectionDialog(false);
    setSelectedProduct(null);
  };

  const generateOrderNumber = () => {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    return `ORD-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}-${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one product to the order",
        variant: "destructive"
      });
      return;
    }

    if (!formData.station) {
      toast({
        title: "Error",
        description: "Please select a delivery station",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const orderNumber = formData.order_number || generateOrderNumber();

      const orderData = {
        order_number: orderNumber,
        vendor_id: 1, // Default vendor for barcode orders
        order_date: new Date().toISOString(),
        station: formData.station,
        total_amount: formData.total_amount,
        status: 'Pending',
        notes: formData.notes + `\n\nItems:\n${formData.items.map((item) =>
        `- ${item.product.product_name} (${item.product.product_code}) x${item.quantity} ${item.unitType} = $${item.subtotal.toFixed(2)}`
        ).join('\n')}`,
        created_by: 1
      };

      const { error } = await window.ezsite.apis.tableCreate('11730', orderData);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Order created successfully"
      });

      navigate('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Station Selection Card - Primary Selection */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="w-6 h-6" />
                <span>Create Order - Station Selection</span>
              </CardTitle>
              <CardDescription>
                First, select the station for this order, then add products
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate('/orders')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="station-selector" className="text-lg font-semibold">Select Delivery Station *</Label>
              <Select
                value={selectedStation}
                onValueChange={(value) => {
                  setSelectedStation(value);
                  setFormData((prev) => ({ ...prev, station: value }));
                }}>
                <SelectTrigger className="text-lg p-4 h-12">
                  <SelectValue placeholder="Choose a station to begin creating your order" />
                </SelectTrigger>
                <SelectContent>
                  {stations.map((station) =>
                  <SelectItem key={station} value={station} className="text-lg p-3">
                      {station}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            {selectedStation &&
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  📍 Selected Station: <span className="font-bold">{selectedStation}</span>
                </p>
                <p className="text-green-600 text-sm mt-1">
                  You can now add products to your order for this station.
                </p>
              </div>
            }
          </div>
        </CardContent>
      </Card>

      {/* Content Section - Only show when station is selected */}
      {selectedStation &&
      <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="w-6 h-6" />
                  <span>Order for {selectedStation}</span>
                </CardTitle>
                <CardDescription>
                  Scan product barcodes or search manually to add items to your order
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        <CardContent>
          {/* Barcode Scanner Section */}
          <div className="space-y-6">
            <Card className="border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <Camera className="w-12 h-12 mx-auto text-primary" />
                  <h3 className="text-lg font-semibold">Barcode Scanner</h3>
                  <p className="text-muted-foreground">
                    Click to open camera and scan product barcodes
                  </p>
                  <Button
                    onClick={() => {
                      setScannerOpen(true);
                      setTimeout(startCamera, 100);
                    }}
                    className="w-full sm:w-auto"
                    disabled={loading}>

                    <Camera className="w-4 h-4 mr-2" />
                    Open Barcode Scanner
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Manual Product Search */}
            <ProductSearchBar onProductSelect={handleProductSelect} />

            {/* Camera Dialog */}
            {scannerOpen &&
            <Card className="border-primary">
                <CardHeader>
                  <CardTitle>Barcode Scanner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative w-full max-w-md mx-auto aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                      ref={(ref) => setVideoRef(ref)}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover" />

                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="border-2 border-white border-dashed w-48 h-24 rounded-lg"></div>
                      </div>
                    </div>
                    <div className="flex space-x-2 justify-center">
                      <Button onClick={simulateBarcodeCapture} disabled={loading}>
                        Capture Barcode
                      </Button>
                      <Button
                      variant="outline"
                      onClick={() => {
                        setScannerOpen(false);
                        stopCamera();
                      }}>

                        Cancel
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Position the barcode within the frame and click Capture
                    </p>
                  </div>
                </CardContent>
              </Card>
            }

            {/* Matched Products Section */}
            {matchedProducts.length > 0 &&
            <Card>
                <CardHeader>
                  <CardTitle>Found Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {matchedProducts.map((product) =>
                  <div key={product.ID} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold">{product.product_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Code: {product.product_code} | Category: {product.category}
                          </p>
                          <p className="text-sm font-medium text-green-600">
                            Price: ${product.price.toFixed(2)} | Stock: {product.quantity_in_stock}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`qty-${product.ID}`} className="text-sm">Qty:</Label>
                            <NumberInput
                          id={`qty-${product.ID}`}
                          value={selectedQuantity[product.ID] || 1}
                          onChange={(value) => setSelectedQuantity((prev) => ({
                            ...prev,
                            [product.ID]: value
                          }))}
                          min={1}
                          max={product.quantity_in_stock}
                          className="w-20" />

                          </div>
                          <Button
                        size="sm"
                        onClick={() => addProductToOrder(product)}
                        className="flex items-center space-x-1">

                            <Plus className="w-4 h-4" />
                            <span>Add</span>
                          </Button>
                        </div>
                      </div>
                  )}
                  </div>
                </CardContent>
              </Card>
            }

            {/* Order Items Section */}
            {formData.items.length > 0 &&
            <Card>
                <CardHeader>
                  <CardTitle>Order Items ({formData.items.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {formData.items.map((item, index) =>
                  <div key={`${item.product.ID}-${index}`} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.product.product_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.product.product_code} | ${(item.subtotal / item.quantity).toFixed(2)} per {item.unitType}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Unit Type: {item.unitType}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateItemQuantity(index, item.quantity - 1)}>

                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity} {item.unitType}</span>
                            <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateItemQuantity(index, item.quantity + 1)}>

                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="text-right min-w-[80px]">
                            <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
                          </div>
                          <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeItem(index)}>

                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                  )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total Amount:</span>
                        <span>${formData.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            }

            {/* Order Details Form */}
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="order_number">Order Number</Label>
                      <Input
                        id="order_number"
                        value={formData.order_number}
                        onChange={(e) => setFormData((prev) => ({ ...prev, order_number: e.target.value }))}
                        placeholder="Auto-generated if left empty" />

                    </div>

                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Label className="text-blue-800 font-medium">Delivery Station</Label>
                        <p className="text-blue-600 font-semibold text-lg">{selectedStation}</p>
                        <p className="text-blue-500 text-sm">Selected at the top of the page</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Enter any additional notes about this order..." />

                  </div>

                  <div className="flex items-center justify-end space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/orders')}>

                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading || formData.items.length === 0}>
                      {loading ? 'Creating...' :
                      <>
                          <Save className="w-4 h-4 mr-2" />
                          Create Order
                        </>
                      }
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      }

      {/* Product Selection Dialog */}
      <ProductSelectionDialog
        isOpen={showSelectionDialog}
        onClose={() => {
          setShowSelectionDialog(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onConfirm={handleProductConfirm} />

    </div>);

};

export default OrderForm;