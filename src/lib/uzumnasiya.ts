export const UZUM_API_URL = "https://checkout.uzumnasiya.uz"; // Assuming this is the production URL based on their docs

interface UzumProduct {
  amount: number;
  name: string;
  price: number;
  category: number;
  unit_id: number;
  product_id?: number;
}

interface CreateOrderData {
  user_id: number;
  period: string;
  callback?: string;
  ext_order_id?: string;
  products: UzumProduct[];
}

export async function createUzumOrder(data: CreateOrderData) {
  const token = process.env.UZUM_PARTNER_TOKEN;
  if (!token) throw new Error("UZUM_PARTNER_TOKEN is missing");

  const response = await fetch(`${UZUM_API_URL}/api/v1/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to create order: ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

export async function checkContractStatus(contractId: string) {
  const token = process.env.UZUM_PARTNER_TOKEN;
  if (!token) throw new Error("UZUM_PARTNER_TOKEN is missing");

  const response = await fetch(`${UZUM_API_URL}/api/v1/contracts/check-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ contract_id: contractId }),
  });

  if (!response.ok) {
    throw new Error("Failed to check contract status");
  }

  return response.json();
}

export async function confirmContract(contractId: string) {
  const token = process.env.UZUM_PARTNER_TOKEN;
  if (!token) throw new Error("UZUM_PARTNER_TOKEN is missing");

  const response = await fetch(`${UZUM_API_URL}/api/v1/contracts/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ contract_id: contractId }),
  });

  if (!response.ok) {
    throw new Error("Failed to confirm contract");
  }

  return response.json();
}
