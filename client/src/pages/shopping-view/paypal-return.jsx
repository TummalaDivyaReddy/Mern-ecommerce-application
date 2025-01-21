import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { capturePayment } from "@/store/shop/order-slice";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import axios from "axios";

function PaypalReturnPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const paymentId = params.get("paymentId");
  const payerId = params.get("PayerID");

  const [totalAmount, setTotalAmount] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(true); // Track loading state
  const [isOrderPlaced, setIsOrderPlaced] = useState(false); // Track if order is placed

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const orderId = JSON.parse(sessionStorage.getItem("currentOrderId"));

      if (orderId) {
        try {
          // Fetch order details from the backend
          const response = await axios.get(`/api/orders/${orderId}`);
          setTotalAmount(response.data.totalAmount); // Set the totalAmount state
          setPaymentMethod(response.data.paymentMethod); // Set the paymentMethod state
        } catch (error) {
          console.error("Error fetching order details:", error);
        } finally {
          setLoading(false); // Set loading to false once data is fetched
        }
      }
    };

    fetchOrderDetails();
  }, []);

  useEffect(() => {
    if (paymentId && payerId && totalAmount !== null) {
      const orderId = JSON.parse(sessionStorage.getItem("currentOrderId"));

      // If totalAmount is 0 or paymentMethod is not PayPal, skip PayPal payment processing
      if (totalAmount === 0 || paymentMethod !== "paypal") {
        // Directly confirm the order (no PayPal processing)
        dispatch(capturePayment({ paymentId: null, payerId: null, orderId })).then((data) => {
          if (data?.payload?.success) {
            setIsOrderPlaced(true); // Set order placed flag to true
            sessionStorage.removeItem("currentOrderId");
            window.location.href = "/shop/payment-success"; // Redirect to success page
          }
        });
      } else {
        // If PayPal payment, continue processing
        dispatch(capturePayment({ paymentId, payerId, orderId })).then((data) => {
          if (data?.payload?.success) {
            setIsOrderPlaced(true); // Set order placed flag to true
            sessionStorage.removeItem("currentOrderId");
            window.location.href = "/shop/payment-success"; // Redirect to success page
          }
        });
      }
    }
  }, [paymentId, payerId, dispatch, totalAmount, paymentMethod]);

  // While loading, show a loading indicator
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading order details... Please wait!</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        {isOrderPlaced ? (
          <CardTitle>Order successfully placed!</CardTitle>
        ) : (
          <CardTitle>Processing Payment... Please wait!</CardTitle>
        )}
      </CardHeader>

      {/* Display the "Processing Paypal Payment..." button only if PayPal is being processed */}
      {!isOrderPlaced && paymentMethod === "paypal" && (
        <div className="mt-4 w-full">
          <button
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
            disabled
          >
            Processing Paypal Payment...
          </button>
        </div>
      )}
    </Card>
  );
}

export default PaypalReturnPage;
