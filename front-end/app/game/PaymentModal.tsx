import React, { useEffect, useRef } from "react";

export default function PaymentModal({ paymentUrl, setShowPaymentModal }: any) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const handleIframeUrlChange = () => {
        if (iframeRef.current?.contentWindow?.location.href.includes("/null")) {
          setShowPaymentModal(false);
        }
      };

      iframeRef.current.addEventListener("load", handleIframeUrlChange);

      return () => {
        if (iframeRef.current) {
          iframeRef.current.removeEventListener("load", handleIframeUrlChange);
        }
      };
    }
  }, [iframeRef]);

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
