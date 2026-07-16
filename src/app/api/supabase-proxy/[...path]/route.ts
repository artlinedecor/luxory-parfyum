import { NextRequest, NextResponse } from "next/server";

export async function ANY(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/");
  const method = req.method;
  
  const isRead = method === "GET" || method === "HEAD" || method === "OPTIONS";
  const isProducts = path.startsWith("rest/v1/products");
  const isOrderSubmit = method === "POST" && path.startsWith("rest/v1/orders");

  // Allow public access to GET products, and POST orders
  const isPublicAllowed = (isRead && isProducts) || isOrderSubmit;

  if (!isPublicAllowed) {
    // Check for admin session
    const session = req.cookies.get("admin_session")?.value;
    if (session !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Forward the request to the real Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ 
      error: "Server configuration error", 
      supabaseUrl: !!supabaseUrl, 
      anonKey: !!anonKey 
    }, { status: 500 });
  }

  const targetUrl = `${supabaseUrl}/${path}${req.nextUrl.search}`;
  
  // Copy only specific headers or clean up problematic ones
  const headers = new Headers();
  headers.set("apikey", anonKey);
  headers.set("Authorization", `Bearer ${anonKey}`);
  headers.set("Content-Type", req.headers.get("Content-Type") || "application/json");
  headers.set("Accept", req.headers.get("Accept") || "*/*");
  if (req.headers.has("Prefer")) {
    headers.set("Prefer", req.headers.get("Prefer")!);
  }

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body: method !== "GET" && method !== "HEAD" ? await req.text() : undefined,
    });

    const data = await response.text();
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");

    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    require("fs").writeFileSync("proxy-error.txt", error.stack || error.message);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, ctx: any) { return ANY(req, ctx); }
export async function POST(req: NextRequest, ctx: any) { return ANY(req, ctx); }
export async function PATCH(req: NextRequest, ctx: any) { return ANY(req, ctx); }
export async function PUT(req: NextRequest, ctx: any) { return ANY(req, ctx); }
export async function DELETE(req: NextRequest, ctx: any) { return ANY(req, ctx); }
export async function OPTIONS(req: NextRequest, ctx: any) { return ANY(req, ctx); }
