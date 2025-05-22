import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, ArrowRight, User, MapPin, CreditCard, Smartphone, Lock, Gift } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { calculateCartTotal } from "@/lib/cart";
import { getGuestCart, clearGuestCart } from "@/lib/guestCart";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";

// Form schemas
const userInfoSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(9, "Please enter a valid phone number"),
});

const shippingSchema = z.object({
  address: z.string().min(5, "Please enter a complete address"),
  city: z.string().min(2, "Please enter a city"),
  postalCode: z.string().min(5, "Please enter a valid postal code"),
  country: z.string().min(2, "Please select a country"),
  billingIsSame: z.boolean().optional(),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),
});

const paymentSchema = z.object({
  paymentMethod: z.enum(["bizum", "card"]),
  discountCode: z.string().optional(),
});

type UserInfoForm = z.infer<typeof userInfoSchema>;
type ShippingForm = z.infer<typeof shippingSchema>;
type PaymentForm = z.infer<typeof paymentSchema>;

export default function Checkout() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userInfo, setUserInfo] = useState<UserInfoForm | null>(null);
  const [shippingInfo, setShippingInfo] = useState<ShippingForm | null>(null);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Get cart items
  const cartItems = isAuthenticated ? [] : getGuestCart(); // For now, simplified
  const subtotal = calculateCartTotal(cartItems, isAuthenticated);
  const discount = isAuthenticated ? subtotal * 0.05 : discountAmount;
  const shipping = isAuthenticated && subtotal >= 60 ? 0 : 5.99;
  const total = subtotal - discount + shipping;

  // Step 1: User Information Form
  const userInfoForm = useForm<UserInfoForm>({
    resolver: zodResolver(userInfoSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: "",
    },
  });

  // Step 2: Shipping Form
  const shippingForm = useForm<ShippingForm>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      billingIsSame: true,
      country: "Spain",
      billingCountry: "Spain",
    },
  });

  // Step 3: Payment Form
  const paymentForm = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: "bizum",
    },
  });

  const handleUserInfoSubmit = (data: UserInfoForm) => {
    setUserInfo(data);
    setCurrentStep(2);
  };

  const handleShippingSubmit = (data: ShippingForm) => {
    setShippingInfo(data);
    setCurrentStep(3);
  };

  const handlePaymentSubmit = (data: PaymentForm) => {
    // Process the order
    toast({
      title: "Order placed successfully!",
      description: "Thank you for your purchase. You will receive a confirmation email shortly.",
    });
    
    // Clear cart and redirect
    if (!isAuthenticated) {
      clearGuestCart();
    }
    setLocation("/");
  };

  const applyDiscount = () => {
    const code = paymentForm.getValues("discountCode");
    if (code?.toLowerCase() === "welcome10") {
      setDiscountApplied(true);
      setDiscountAmount(subtotal * 0.1);
      toast({
        title: "Discount applied!",
        description: "10% discount has been applied to your order.",
      });
    } else {
      toast({
        title: "Invalid discount code",
        description: "Please check your discount code and try again.",
        variant: "destructive",
      });
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some products to proceed with checkout</p>
            <Button asChild>
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep >= step 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-gray-200 text-gray-600"
                  }
                `}>
                  {step === 1 && <User className="h-4 w-4" />}
                  {step === 2 && <MapPin className="h-4 w-4" />}
                  {step === 3 && <Lock className="h-4 w-4" />}
                </div>
                <span className={`ml-2 text-sm ${currentStep >= step ? "text-primary" : "text-gray-500"}`}>
                  {step === 1 && "User Info"}
                  {step === 2 && "Shipping"}
                  {step === 3 && "Payment"}
                </span>
                {step < 3 && <ArrowRight className="ml-4 h-4 w-4 text-gray-400" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: User Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    {isAuthenticated ? "Confirm Your Information" : "Enter Your Information"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!isAuthenticated && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Already have an account? 
                        <Button variant="link" asChild className="p-0 ml-1 h-auto">
                          <Link href="/api/login">Sign in</Link>
                        </Button> 
                        for faster checkout and special benefits!
                      </p>
                    </div>
                  )}

                  <Form {...userInfoForm}>
                    <form onSubmit={userInfoForm.handleSubmit(handleUserInfoSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={userInfoForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userInfoForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={userInfoForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={userInfoForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-between pt-4">
                        <Button variant="outline" asChild>
                          <Link href="/cart">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Cart
                          </Link>
                        </Button>
                        <Button type="submit">
                          Continue to Shipping
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Shipping Information */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...shippingForm}>
                    <form onSubmit={shippingForm.handleSubmit(handleShippingSubmit)} className="space-y-4">
                      <FormField
                        control={shippingForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Street address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={shippingForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={shippingForm.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={shippingForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={shippingForm.control}
                        name="billingIsSame"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Billing address is the same as shipping address</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      {!shippingForm.watch("billingIsSame") && (
                        <div className="space-y-4 pt-4 border-t">
                          <h3 className="text-lg font-medium">Billing Address</h3>
                          
                          <FormField
                            control={shippingForm.control}
                            name="billingAddress"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Billing Address</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Street address" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={shippingForm.control}
                              name="billingCity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={shippingForm.control}
                              name="billingPostalCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Postal Code</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setCurrentStep(1)}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                        <Button type="submit">
                          Continue to Payment
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="mr-2 h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...paymentForm}>
                    <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-6">
                      <FormField
                        control={paymentForm.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Payment Method</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-1 gap-4"
                              >
                                <div className="flex items-center space-x-2 border rounded-lg p-4">
                                  <RadioGroupItem value="bizum" id="bizum" />
                                  <Label htmlFor="bizum" className="flex items-center cursor-pointer">
                                    <Smartphone className="mr-2 h-5 w-5 text-orange-500" />
                                    Bizum
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2 border rounded-lg p-4">
                                  <RadioGroupItem value="card" id="card" />
                                  <Label htmlFor="card" className="flex items-center cursor-pointer">
                                    <CreditCard className="mr-2 h-5 w-5 text-blue-500" />
                                    Credit/Debit Card
                                  </Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4">
                        <Label>Discount Code</Label>
                        <div className="flex space-x-2">
                          <FormField
                            control={paymentForm.control}
                            name="discountCode"
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input {...field} placeholder="Enter discount code" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="button" variant="outline" onClick={applyDiscount}>
                            Apply
                          </Button>
                        </div>
                        {discountApplied && (
                          <p className="text-sm text-green-600 flex items-center">
                            <Gift className="mr-1 h-4 w-4" />
                            Discount code applied successfully!
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setCurrentStep(2)}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700">
                          Complete Order - €{total.toFixed(2)}
                          <Lock className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {cartItems.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <img 
                        src={item.product?.imageUrl} 
                        alt={item.product?.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.product?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × €{item.product?.price}
                        </p>
                      </div>
                    </div>
                  ))}
                  {cartItems.length > 3 && (
                    <p className="text-sm text-muted-foreground">
                      +{cartItems.length - 3} more items
                    </p>
                  )}
                </div>

                <Separator />

                {/* Pricing */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  
                  {isAuthenticated && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Member discount (5%)</span>
                      <span>-€{discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {discountApplied && !isAuthenticated && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-€{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>
                      {shipping === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        `€${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>€{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Benefits for registered users */}
                {isAuthenticated && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center text-green-800 text-sm">
                      <Gift className="mr-2 h-4 w-4" />
                      <span className="font-medium">Member Benefits Applied!</span>
                    </div>
                    <ul className="text-xs text-green-700 mt-1 ml-6 list-disc">
                      <li>5% member discount</li>
                      {subtotal >= 60 && <li>Free shipping</li>}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}