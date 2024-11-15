require("dotenv").config();
import axios from "axios";
import * as crypto from "crypto";
const appID = process.env.APP_ID;
const secretKey = process.env.SECRET_KEY;
const merchantID = process.env.MERCHANT_ID;
if (!appID || !secretKey || !merchantID) {
  console.log("errur");
}
// Define types for your object keys and signature
interface RequestParams {
  merchantOrderNo: string;
  orderAmount: string;
  payCurrency: string;
  userId: string;
  paymentExchange: string;
  paymentTokens: string;
  // redirectURL?: string;
  // callbackURL?: string;
  // customParam?: string;
  // expiredTime?: string;
  // payType?: string;
  // paymentNetworks?: string;
  // orderModel?: string;
  // for Traeon
}
enum OrderStatus {
  INIT = "INIT", // Waiting for user payment
  PROCESSING = "PROCESSING", // During the payment process
  COMPLETED = "COMPLETED", // Payment success
  CLOSE = "CLOSE", // Payment close
  TIMEOUT = "TIMEOUT", // Payment cancel
  FAILED = "FAILED", // Payment failure
  DELAY_SUCCESS = "DELAY_SUCCESS", // Order overtime and payment success
  DELAY_FAILED = "DELAY_FAILED", // Order overtime and payment failed
}

interface IAeonOrder {
  orderNo: string; // AEON order number, max length 64
  orderStatus: OrderStatus; // Order status, max length 32
  userId: string; // User ID (email or phone number), max length 128
  merchantOrderNo: string; // Merchant order number, max length 64
  orderCurrency: string; // Currency of order (USD/EUR), max length 32
  orderAmount: string; // Amount of order (in cents), max length 16
  payCryptoRate: string; // Rate of payment crypto (to USDT), max length 16
  payFiatRate: string; // Rate of payment fiat (to USD), max length 16
  payCryptoCurrency: string; // Cryptocurrency of payment, max length 32
  payCryptoVolume: string; // Cryptocurrency payment amount, max length 16
  payCryptoNetwork: string; // Cryptocurrency payment network, max length 32
  address: string; // Address for user transfer, max length 256
  hxAddress: string; // Hash address, max length 256
  failReason?: string; // Fail reason (optional), max length 256
  fee?: string; // Transaction fee (optional), max length 16
  customParam?: string; // Expend parameter, max length 512
  settlementAmount: string; // Amount of settlement, max length 16
  settlementCurrency: string; // Currency of settlement, max length 16
}

interface AeonOrderResponse {
  code: string;
  msg: string;
  model: IAeonOrder;
  traceId: string;
  success: boolean;
  error: boolean;
}
type IAeonResponse = {
  code: string;
  msg: string;
  model: {
    webUrl: string;
    orderNo: string;
  };
  traceId: string;
  success: boolean;
  error: boolean;
};

const URL = "https://sbx-crypto-payment-api.aeon.xyz";
// Define the API request function
export async function createAeonOrdersWithTma(
  params: RequestParams,
  customParams: { [key: string]: any } = {}
): Promise<IAeonResponse | undefined> {
  const requestParams: any = params;
  requestParams.appId = appID;
  requestParams.sign = generateSignature(JSON.parse(JSON.stringify(params)));
  const _customParams: { [key: string]: any } = customParams;
  _customParams.orderTs = String(Date.now());
  requestParams.customParam = JSON.stringify(_customParams);
  // requestParams.tgModel = "MINIAPP";
  console.log(requestParams);
  try {
    const response = await axios.post(
      `${URL}/open/api/payment`,
      requestParams,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response);
    const aeonResponse = response.data;
    return aeonResponse as IAeonResponse;
  } catch (error: any) {
    console.error("Error:", error);
  }
}

interface RequestParams {
  [key: string]: string;
}

export function generateSignature(params: RequestParams): string {
  // Remove the 'sign' parameter from the object if it exists
  const filteredParams: RequestParams = Object.keys(params)
    .filter((key) => key !== "sign")
    .reduce((obj: RequestParams, key: string) => {
      obj[key] = params[key];
      return obj;
    }, {} as RequestParams); // Ensure the initial value is of type RequestParams

  // Sort the parameters alphabetically by their keys (ASCII order)
  const sortedKeys = Object.keys(filteredParams).sort();

  // Prepare the string for concatenation in 'key=value' format joined by '&'
  const paramString = sortedKeys
    .map((key) => `${key}=${filteredParams[key]}`)
    .join("&");

  // Append the secret key to the final string
  const stringToSign = `${paramString}&key=${secretKey}`;
  // Generate SHA-512 hash using CryptoJS and convert it to uppercase
  const signature = crypto
    .createHash("sha512")
    .update(stringToSign)
    .digest("hex")
    .toUpperCase();

  return signature;
}

export const sendOrder = async (
  merchantOrderNo: string,
  userID: string
): Promise<IAeonResponse | undefined> => {
  if (appID && secretKey && merchantID) {
    return await createAeonOrdersWithTma({
      merchantOrderNo: merchantOrderNo,
      orderAmount: "10",
      payCurrency: "USD",
      paymentTokens: "USDT",
      paymentExchange: "16f021b0-f220-4bbb-aa3b-82d423301957",
      userId: userID,
    });
  }
  throw new Error("Missing environment variables");
};

interface getOrderRequestParams {
  merchantOrderNo: string;
}

export async function fetchAeonOrder(
  params: getOrderRequestParams
): Promise<AeonOrderResponse | undefined> {
  const requestParams: any = params;
  requestParams.appId = appID;
  requestParams.sign = generateSignature(JSON.parse(JSON.stringify(params)));
  try {
    const response = await axios.post(
      `${URL}/open/api/payment/query`,
      requestParams,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const aeonResponse = response.data;
    return aeonResponse;
  } catch (error) {
    console.error("Error:", error);
  }
}
