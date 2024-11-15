import React, { useEffect, useRef } from "react";

export default function PaymentModal({ paymentUrl, setShowPaymentModal }: any) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const handleIframeUrlChange = () => {
        try {
          const iframeDocument = iframeRef.current?.contentDocument;
          if (iframeDocument?.location.href.includes("/null")) {
            console.log("nulled...");
            setShowPaymentModal(false);
          }
        } catch (error) {
          console.error("Error accessing iframe document:", error);
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
            ref={iframeRef}
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
