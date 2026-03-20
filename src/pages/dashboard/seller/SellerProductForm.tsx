import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WaveSeparator } from "@/components/seller/WaveSeparator";
import { fetchCategories } from "@/lib/api/categories";
import { fetchProducts } from "@/lib/api/products";
import { onCategoriesChanged } from "@/lib/socket";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const DEFAULT_CATEGORIES = ["Food", "Toys", "Accessories"];

const productSchema = z.object({
  name: z.string().min(1, "Name is required").min(2, "At least 2 characters"),
  category: z.string().min(1, "Category is required"),
  price: z.coerce.number().min(0, "Price must be ≥ 0"),
  discount: z.coerce.number().min(0).max(100).optional(),
  stock: z.coerce.number().min(0, "Stock must be ≥ 0"),
  lowStockThreshold: z.coerce.number().min(0).optional(),
  status: z.enum(["active", "hidden"]),
  description: z.string().optional(),
  tags: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function SellerProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [existing, setExisting] = useState<{ name: string; category: string; price: number; discount?: number; stock: number; lowStockThreshold: number; status: "active" | "hidden"; description: string; tags: string[] } | null>(null);
  const [loading, setLoading] = useState(isEdit);

  const categoryNames = categories.length > 0 ? categories.map((c) => c.name) : DEFAULT_CATEGORIES;
  const defaultCategory = categoryNames[0] ?? "Food";

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);
  useEffect(() => {
    const unsubscribe = onCategoriesChanged(() => fetchCategories().then(setCategories));
    return unsubscribe;
  }, []);
  useEffect(() => {
    if (!isEdit || !id) return;
    fetchProducts()
      .then((list) => {
        const p = list.find((x) => x.id === id);
        if (p) setExisting(p);
      })
      .catch(() => toast.error("Failed to load product"))
      .finally(() => setLoading(false));
  }, [isEdit, id]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: existing
      ? {
          name: existing.name,
          category: existing.category,
          price: existing.price,
          discount: existing.discount ?? 0,
          stock: existing.stock,
          lowStockThreshold: existing.lowStockThreshold ?? 5,
          status: existing.status,
          description: existing.description ?? "",
          tags: existing.tags.join(", "),
        }
      : {
          name: "",
          category: defaultCategory,
          price: 0,
          discount: 0,
          stock: 0,
          lowStockThreshold: 5,
          status: "active",
          description: "",
          tags: "",
        },
  });

  useEffect(() => {
    if (existing) {
      form.reset({
        name: existing.name,
        category: existing.category,
        price: existing.price,
        discount: existing.discount ?? 0,
        stock: existing.stock,
        lowStockThreshold: existing.lowStockThreshold ?? 5,
        status: existing.status,
        description: existing.description ?? "",
        tags: existing.tags.join(", "),
      });
    }
  }, [existing, form]);

  function onSubmit(values: ProductFormValues) {
    const tags = values.tags ? values.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    if (isEdit) {
      toast.success("Product updated");
    } else {
      toast.success("Product created");
    }
    navigate("/dashboard/seller/products");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <WaveSeparator />
      <Button variant="ghost" size="sm" className="rounded-full -ml-2" asChild>
        <Link to="/dashboard/seller/products" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to products
        </Link>
      </Button>

      <Card className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden">
        <CardHeader>
          <h2 className="text-lg font-semibold font-display">{isEdit ? "Edit product" : "Add product"}</h2>
          <p className="text-sm text-muted-foreground">Name, category, price, stock, status, description. Images: mock uploader (not wired).</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Premium Dog Food" className="rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryNames.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (LKR)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={1} className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={100} className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Low stock threshold</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="hidden">Hidden</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Product description" className="rounded-xl min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="dog, food, premium" className="rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="text-xs text-muted-foreground">Images: mock uploader not wired.</p>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="rounded-xl transition-transform active:scale-95">
                  {isEdit ? "Save changes" : "Create product"}
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate("/dashboard/seller/products")}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
