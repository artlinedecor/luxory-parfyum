"use client";

import { useState, useEffect } from "react";
import { Product } from "@/lib/types";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [type, setType] = useState<"lux_copy" | "original">("lux_copy");
  const [imageUrl, setImageUrl] = useState("");
  const [stock, setStock] = useState("10");
  const [uploading, setUploading] = useState(false);

  const fetchProducts = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (e) {
      console.error("Error fetching database products in inventory:", e);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setTitle(product.title);
      setDescription(product.description || "");
      setPrice(product.price_usd.toString());
      const rawCost = (product as unknown as Record<string, unknown>).cost_price_usd;
      setCostPrice(rawCost !== undefined && rawCost !== null ? rawCost.toString() : "0");
      setType(product.product_type);
      setImageUrl(product.image_url || "");
      setStock(product.stock !== undefined ? product.stock.toString() : "10");
    } else {
      setEditingProduct(null);
      setTitle("");
      setDescription("");
      setPrice("");
      setCostPrice("");
      setType("lux_copy");
      setImageUrl("");
      setStock("10");
    }
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      setUploading(true);

      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setImageUrl(data.publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Rasm yuklashda xatolik yuz berdi!');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    
    const productData = {
      title,
      description: description || null,
      price_usd: Number(price),
      cost_price_usd: Number(costPrice) || 0,
      product_type: type,
      image_url: imageUrl || null,
      stock: Number(stock),
      is_available: true,
    };

    try {
      const isUUID = editingProduct && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingProduct.id);

      if (editingProduct && isUUID) {
        // Update product in Supabase
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;
        
        // Also update local state
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id
              ? { ...p, ...productData }
              : p
          )
        );
      } else {
        // Insert new product in Supabase (handles new creations and mock product conversions)
        const { data, error } = await supabase
          .from("products")
          .insert([productData])
          .select();

        if (error) throw error;
        
        if (data && data[0]) {
          if (editingProduct && !isUUID) {
            // Remove mock product from list and put the new database product in its place
            setProducts((prev) =>
              prev.map((p) => (p.id === editingProduct.id ? data[0] : p))
            );
          } else {
            // Simply prepend the new product
            setProducts([data[0], ...products]);
          }
        } else {
          fetchProducts();
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving product in database:", error);
      alert("Mahsulotni saqlashda xatolik yuz berdi!");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Rostdan ham ushbu mahsulotni o'chirmoqchimisiz?")) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      try {
        if (isUUID) {
          const supabase = createClient();
          const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", id);

          if (error) throw error;
        }
        
        // Always remove from local state regardless of database presence
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } catch (error) {
        console.error("Error deleting product in database:", error);
        alert("Mahsulotni o'chirishda xatolik yuz berdi!");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">
            <span className="text-gradient-gold">Omborxona</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mahsulotlarni qo&apos;shish, tahrirlash va o&apos;chirish
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 rounded-xl bg-gradient-gold text-black font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Yangi Qo&apos;shish
        </button>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/20">
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Rasm</th>
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Nomi</th>
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Turi</th>
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Narxi</th>
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Qoldiq (Soni)</th>
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-3">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-secondary">
                      <img
                        src={product.image_url || "/products/default.png"}
                        alt={product.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/products/default.png";
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-foreground max-w-[200px] truncate">{product.title}</td>
                  <td className="px-6 py-3">
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gold/10 text-gold uppercase">
                      {product.product_type === "original" ? "Original" : "Lux Copy"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm font-semibold text-gradient-gold">${product.price_usd}</td>
                  <td className="px-6 py-3 text-sm text-foreground">
                    <span className={`font-semibold px-2.5 py-1 rounded-full text-xs ${product.stock !== undefined && product.stock > 3 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {product.stock !== undefined ? `${product.stock} ta` : "10 ta"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleOpenModal(product)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">
                    Mahsulotlar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 relative animate-scale-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {editingProduct ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Nomi</label>
                <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-gold/50" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Tavsif</label>
                <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-gold/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Sotish Narxi ($)</label>
                  <input required type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-gold/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Tan Narxi ($)</label>
                  <input required type="number" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="0" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-gold/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Turi</label>
                  <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-gold/50 appearance-none">
                    <option value="lux_copy">Lux Copy</option>
                    <option value="original">Original</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Soni (Ombordagi qoldiq)</label>
                  <input required type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-gold/50" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Rasm Yuklash</label>
                <div className="flex items-center gap-3">
                  {imageUrl && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-secondary border border-border flex-shrink-0">
                      <Image src={imageUrl} alt="Preview" fill className="object-cover" sizes="48px" />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gold/10 file:text-gold hover:file:bg-gold/20 transition-all cursor-pointer" 
                  />
                </div>
                {uploading && <p className="text-[10px] text-gold mt-1 animate-pulse">Yuklanmoqda...</p>}
              </div>
              <button disabled={uploading} type="submit" className="w-full py-3 mt-2 rounded-xl bg-gradient-gold text-black font-bold uppercase tracking-wider text-sm hover:opacity-90 transition-all shadow-lg shadow-gold/20 disabled:opacity-50">
                Saqlash
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
