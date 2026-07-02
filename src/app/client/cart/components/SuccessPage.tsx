'use client';

interface SuccessPageProps {
  orderNumber: string;
  onTrackOrder: () => void;
  onContinueShopping: () => void;
  onShareReceipt: () => void;
}

export default function SuccessPage({ orderNumber, onTrackOrder, onContinueShopping, onShareReceipt }: SuccessPageProps) {
  return (
    <div className="success-page">
      <div className="success-ring"><i className="fas fa-check"></i></div>
      <h2>Order Confirmed!</h2>
      <p>Your order has been placed successfully. You will receive a confirmation email shortly.</p>
      <div className="order-number">Order #{orderNumber}</div>
      <div className="success-actions">
        <button className="btn btn-primary" onClick={onTrackOrder}>
          <i className="fas fa-truck"></i> Track Order
        </button>
        <button className="btn btn-secondary" onClick={onContinueShopping}>
          <i className="fas fa-bag-shopping"></i> Continue Shopping
        </button>
        <button className="btn btn-ghost" onClick={onShareReceipt}>
          <i className="fas fa-share-nodes"></i> Share Receipt
        </button>
      </div>
    </div>
  );
}
