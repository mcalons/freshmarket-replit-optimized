import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Sprout, Truck, Heart } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-green-600/90"></div>
        <img 
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600" 
          alt="Fresh organic produce display" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        <div className="relative z-10 flex items-center justify-center h-full text-center text-white px-8">
          <div className="max-w-4xl">
            <h1 className="text-5xl font-bold mb-6">Welcome to FreshMarket</h1>
            <p className="text-xl mb-8 leading-relaxed">
              Discover the finest selection of organic fruits and vegetables, delivered fresh to your doorstep. 
              Experience nature's bounty with every bite.
            </p>
            <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold">
              <Link href="/shop">
                Start Shopping
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">Why Choose FreshMarket?</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sprout className="text-primary text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">100% Organic</h3>
                  <p className="text-muted-foreground">
                    All our products are certified organic, grown without harmful pesticides or chemicals.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Truck className="text-orange-500 text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Fast Delivery</h3>
                  <p className="text-muted-foreground">
                    Same-day delivery available within city limits. Fresh produce delivered within hours.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Heart className="text-green-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Quality Guaranteed</h3>
                  <p className="text-muted-foreground">
                    We guarantee the freshness and quality of every product. Not satisfied? We'll make it right.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1506976785307-8732e854ad03?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Colorful arrangement of fresh vegetables and fruits" 
              className="rounded-2xl shadow-2xl w-full h-auto"
            />
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">Fresh!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
