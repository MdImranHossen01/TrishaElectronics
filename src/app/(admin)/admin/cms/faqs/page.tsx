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
import { Plus, Edit, Trash, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFaqs = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/faqs');
      if (!response.ok) {
        toast.error(`Failed to fetch FAQs: ${response.status} ${response.statusText}`);
        return;
      }
      const data = await response.json();
      setFaqs(data);
    } catch (error) {
      toast.error('Failed to fetch FAQs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchFaqs();
    };
    loadData();
  }, [fetchFaqs]);

  const handleDelete = async (id: string, question: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete the FAQ: "${question}". This action cannot be undone!`,
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
        const response = await fetch(`/api/admin/faqs/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('FAQ deleted successfully');
          fetchFaqs();
        } else {
          toast.error('Failed to delete FAQ');
        }
      } catch (error) {
        toast.error('Error deleting FAQ');
      }
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/faqs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`FAQ ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchFaqs();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FAQ Management</h1>
          <p className="text-muted-foreground text-sm">Manage frequently asked questions for the storefront</p>
        </div>
        <Link href="/admin/cms/faqs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add FAQ
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-background overflow-hidden shadow-sm">
        <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[400px]">Question</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-48 rounded" />
                      <Skeleton className="h-3 w-72 rounded" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-10 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : faqs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-lg font-medium">No FAQs found</p>
                    <p className="text-sm text-muted-foreground">Add your first FAQ to get started.</p>
                    <Link href="/admin/cms/faqs/new" className="mt-2">
                      <Button variant="outline" size="sm">Add FAQ</Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              faqs.map((faq) => (
                <TableRow key={faq._id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <span className="font-semibold line-clamp-2">{faq.question}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {faq.order}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button 
                      onClick={() => toggleStatus(faq._id, faq.isActive)}
                      className="transition-opacity hover:opacity-80"
                    >
                      <Badge variant={faq.isActive ? 'default' : 'secondary'} className="cursor-pointer">
                        {faq.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/cms/faqs/${faq._id}/edit`}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:text-primary hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                        onClick={() => handleDelete(faq._id, faq.question)}
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
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-full rounded" />
                </div>
              ))}
            </div>
          ) : faqs.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-base font-medium">No FAQs found</p>
              <p className="text-xs text-muted-foreground">Add your first FAQ to get started.</p>
              <Link href="/admin/cms/faqs/new" className="mt-2">
                <Button variant="outline" size="sm">Add FAQ</Button>
              </Link>
            </div>
          ) : (
            faqs.map((faq) => (
              <div key={faq._id} className="p-4 flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <span className="font-bold text-sm leading-snug">{faq.question}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      Order: <Badge variant="outline" className="font-mono text-[10px] px-1">{faq.order}</Badge>
                    </span>
                    <button 
                      onClick={() => toggleStatus(faq._id, faq.isActive)}
                      className="transition-opacity hover:opacity-80 shrink-0"
                    >
                      <Badge variant={faq.isActive ? 'default' : 'secondary'} className="cursor-pointer text-[10px] px-1.5 py-0">
                        {faq.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-1 pt-3 border-t border-muted/50">
                  <Link href={`/admin/cms/faqs/${faq._id}/edit`}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 hover:text-primary hover:bg-primary/10"
                    >
                      <Edit className="h-4 w-4 mr-1.5" /> Edit
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50" 
                    onClick={() => handleDelete(faq._id, faq.question)}
                  >
                    <Trash className="h-4 w-4 mr-1.5" /> Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

