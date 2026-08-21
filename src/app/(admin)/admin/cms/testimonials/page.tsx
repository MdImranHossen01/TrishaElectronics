'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Edit,
  Trash,
  Loader2,
  Star,
  User as UserIcon,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import Swal from 'sweetalert2';

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: 'Verified Buyer',
    content: '',
    image: '',
    rating: 5
  });

  const fetchTestimonials = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/testimonials');
      if (!response.ok) throw new Error('Failed to fetch testimonials');
      const data = await response.json();
      setTestimonials(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchTestimonials();
    };
    loadData();
  }, [fetchTestimonials]);

  const openAddDialog = () => {
    setEditingId(null);
    setFormData({
      name: '',
      role: 'Verified Buyer',
      content: '',
      image: '',
      rating: 5
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (testimonial: any) => {
    setEditingId(testimonial._id);
    setFormData({
      name: testimonial.name,
      role: testimonial.role,
      content: testimonial.content,
      image: testimonial.image,
      rating: testimonial.rating || 5
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.content) {
      toast.error('Name and Content are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...formData, id: editingId } : formData;

      const response = await fetch('/api/admin/testimonials', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to save testimonial');

      toast.success(editingId ? 'Testimonial updated' : 'Testimonial added');
      setIsDialogOpen(false);
      fetchTestimonials();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete testimonial from "${name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00D1B2',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      background: '#fff',
      customClass: {
        popup: 'rounded-xl',
        confirmButton: 'rounded-lg px-4 py-2 font-bold',
        cancelButton: 'rounded-lg px-4 py-2 font-bold'
      }
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch('/api/admin/testimonials', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) throw new Error('Failed to delete');

        toast.success('Deleted successfully');
        fetchTestimonials();
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Testimonials</h1>
          <p className="text-muted-foreground text-sm">Manage feedback displayed on your storefront</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Testimonial
        </Button>
      </div>

      <div className="rounded-md border bg-background overflow-hidden shadow-sm">
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[80px]">User</TableHead>
                <TableHead>Customer Info</TableHead>
                <TableHead className="max-w-[400px]">Testimonial Content</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28 rounded" />
                        <Skeleton className="h-3 w-20 rounded" />
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[400px]">
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-full rounded" />
                        <Skeleton className="h-3 w-3/4 rounded" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-20 rounded" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : testimonials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                      <p className="text-lg font-medium">No testimonials yet</p>
                      <p className="text-sm text-muted-foreground">Add customer feedback to build trust with new visitors.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                testimonials.map((t) => (
                  <TableRow key={t._id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={t.image} alt={t.name} />
                        <AvatarFallback><UserIcon className="size-4" /></AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{t.name}</span>
                        <span className="text-xs text-muted-foreground">{t.role}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[400px]">
                      <p className="text-sm line-clamp-2 italic text-muted-foreground">&quot;{t.content}&quot;</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex text-yellow-500">
                        {[...Array(t.rating || 5)].map((_, i) => (
                          <Star key={i} className="fill-current size-3" />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-primary hover:bg-primary/10"
                          onClick={() => openEditDialog(t)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(t._id, t.name)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-border">
          {loading ? (
            <div className="space-y-3 p-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 border rounded-xl space-y-2.5 animate-pulse">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28 rounded" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full rounded" />
                </div>
              ))}
            </div>
          ) : testimonials.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 px-4 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
              <p className="text-base font-medium">No testimonials yet</p>
              <p className="text-xs text-muted-foreground">Add customer feedback to build trust with new visitors.</p>
            </div>
          ) : (
            testimonials.map((t) => (
              <div key={t._id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar className="h-10 w-10 border shrink-0">
                      <AvatarImage src={t.image} alt={t.name} />
                      <AvatarFallback><UserIcon className="size-4" /></AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm text-slate-900 truncate">{t.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate">{t.role}</span>
                    </div>
                  </div>

                  <div className="flex text-yellow-500 shrink-0">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="fill-current size-3" />
                    ))}
                  </div>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg border border-muted/50">
                  <p className="text-xs italic text-muted-foreground line-clamp-4">&quot;{t.content}&quot;</p>
                </div>

                <div className="flex justify-end gap-2 mt-1 pt-2 border-t border-muted/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 hover:text-primary hover:bg-primary/10"
                    onClick={() => openEditDialog(t)}
                  >
                    <Edit className="h-4 w-4 mr-1.5" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    onClick={() => handleDelete(t._id, t.name)}
                  >
                    <Trash className="h-4 w-4 mr-1.5" /> Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Testimonial' : 'Add New Testimonial'}</DialogTitle>
              <DialogDescription>
                Fill in the details below to showcase customer feedback.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Customer Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role / Label</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Verified Buyer"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Testimonial Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="What did the customer say?"
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (1-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Customer Image (Optional)</Label>
                  <ImageUpload
                    value={formData.image}
                    onUpload={(url) => setFormData({ ...formData, image: url })}
                    className="h-24"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? 'Update Testimonial' : 'Save Testimonial'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
