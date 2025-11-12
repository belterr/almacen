// Tipos compartidos para las APIs

// Request para verificar stock con el intermediario
export interface ProductItem {
  productId: string;
  externalId: string;
  quantity: number;
}

export interface VerificarStockRequest {
  orderId: string;
  sessionId: string;
  products: ProductItem[];
  totalAmount: number;
  webhookUrl: string;
}

export interface VerificarStockResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

// Webhook del almacén
export interface ProductResponse {
  productId: string;
  quantity: number;
  availableStock?: number;
}

export interface AlmacenWebhookRequest {
  orderId: string;
  sessionId: string;
  hasStock: boolean;
  products?: ProductResponse[];
  message?: string;
}

export interface AlmacenWebhookResponse {
  success: boolean;
  message: string;
  data?: {
    orderId: string;
    sessionId: string;
    status: "confirmed" | "rejected";
    reason?: string;
    receivedAt: string;
  };
}
