import React from "react";

function PaymentcancelledPage() {
  return (
    <div className="container text-center mt-5">
      <h2>❌ Payment Cancelled</h2>
      <p>You cancelled the payment process. Feel free to try again.</p>
      <a href="/" className="btn btn-outline-secondary mt-3">
        Back to Listings
      </a>
    </div>
  );
}

export default PaymentcancelledPage;
