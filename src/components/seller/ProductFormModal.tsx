import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ProductImagesUpload } from "@/components/seller/ProductImagesUpload";
import { toast } from "sonner";
import type { SellerProduct } from "@/types/seller";

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
  images: z.array(z.string()).optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

const DEFAULT_CATEGORY_OPTIONS = ["Food", "Toys", "Accessories"];

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: SellerProduct | null;
  onSave: (values: ProductFormValues) => void | Promise<void>;
  /** Categories from API (admin-managed); if not provided, uses default list */
  categories?: { id: string; name: string }[];
}

export function ProductFormModal({ open, onOpenChange, product, onSave, categories = [] }: ProductFormModalProps) {
  const isEdit = Boolean(product);
  const categoryOptions = categories.length > 0 ? categories.map((c) => c.name) : DEFAULT_CATEGORY_OPTIONS;
  const defaultCategory = categoryOptions[0] ?? "Food";

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: defaultCategory,
      price: 0,
      discount: 0,
      stock: 0,
      lowStockThreshold: 5,
      status: "active",
      description: "",
      tags: "",
      images: [],
    },
  });

  useEffect(() => {
    if (!open) return;
    if (product) {
      form.reset({
        name: product.name,
        category: product.category,
        price: product.price,
        discount: product.discount ?? 0,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold ?? 5,
        status: product.status,
        description: product.description ?? "",
        tags: product.tags.join(", "),
        images: product.images ?? [],
      });
    } else {
      form.reset({
        name: "",
        category: defaultCategory,
        price: 0,
        discount: 0,
        stock: 0,
        lowStockThreshold: 5,
        status: "active",
        description: "",
        tags: "",
        images: [],
      });
    }
  }, [open, product, form, defaultCategory]);

  async function onSubmit(values: ProductFormValues) {
    try {
      await Promise.resolve(onSave(values));
      toast.success(isEdit ? "Product updated" : "Product created");
      onOpenChange(false);
    } catch {
      // Error already surfaced by parent (e.g. toast)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="data-[state=open]:duration-300 data-[state=closed]:duration-200"
        className="fixed inset-0 z-50 w-screen h-screen max-w-none max-h-none rounded-none border-0 translate-x-0 translate-y-0 left-0 top-0 overflow-y-auto bg-white dark:bg-gray-950 p-6 md:p-8 transition-all ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:duration-300 data-[state=closed]:duration-200 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-95"
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isEdit ? "Edit product" : "Add product"}
          </DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Name, category, price, stock, status, description. Upload product images below.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-4">
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
                      {categoryOptions.map((name) => (
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
                    <Textarea placeholder="Product description" className="rounded-xl min-h-[80px]" {...field} />
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
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product images</FormLabel>
                  <FormControl>
                    <ProductImagesUpload
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={() => onOpenChange(false)}
                aria-label="Back to products"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to products
              </Button>
              <Button type="submit" className="rounded-lg ml-auto">
                {isEdit ? "Save changes" : "Create product"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
