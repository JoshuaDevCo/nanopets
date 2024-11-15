import React from "react";

export default function PaymentModal({ paymentUrl }: any) {
  return (
    <div>
      <div className='sm:max-w-[600px] h-[80vh]'>
        <div>
          <div>Complete Your Purchase</div>
        </div>
        {paymentUrl ? (
          <iframe
            src={paymentUrl}
            className='w-full h-full border-0'
            allow='payment'
          />
        ) : (
          <div className='flex items-center justify-center h-full'>
            <p>...loading</p>
          </div>
        )}
      </div>
    </div>
  );
}
