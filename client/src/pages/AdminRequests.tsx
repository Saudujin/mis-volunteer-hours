import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Check, X, Image, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { useState } from "react";

interface PendingRequest {
  rowIndex: number;
  universityId: string;
  description: string;
  hours: number;
  imageLink: string;
  date: string;
  approved: boolean;
}

export default function AdminRequests() {
  const { user, loading: authLoading } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [approveDialog, setApproveDialog] = useState<{
    open: boolean;
    request: PendingRequest | null;
  }>({ open: false, request: null });
  const [hoursInput, setHoursInput] = useState("");

  const utils = trpc.useUtils();

  const { data: requests, isLoading } = trpc.requests.getPending.useQuery(
    undefined,
    { enabled: !!user && user.role === "admin" }
  );

  const approveMutation = trpc.requests.approve.useMutation({
    onSuccess: () => {
      toast.success("تمت الموافقة على الطلب");
      utils.requests.getPending.invalidate();
      setApproveDialog({ open: false, request: null });
      setHoursInput("");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "فشل في الموافقة على الطلب");
    },
  });

  const rejectMutation = trpc.requests.reject.useMutation({
    onSuccess: () => {
      toast.success("تم رفض الطلب");
      utils.requests.getPending.invalidate();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "فشل في رفض الطلب");
    },
  });

  const handleApproveClick = (request: PendingRequest) => {
    setApproveDialog({ open: true, request });
    setHoursInput("");
  };

  const handleApproveConfirm = () => {
    if (!approveDialog.request || !hoursInput) {
      toast.error("يرجى إدخال عدد الساعات");
      return;
    }
    const hours = parseFloat(hoursInput);
    if (isNaN(hours) || hours <= 0) {
      toast.error("يرجى إدخال عدد ساعات صحيح");
      return;
    }
    approveMutation.mutate({ rowIndex: approveDialog.request.rowIndex, hours });
  };

  const handleReject = (rowIndex: number) => {
    if (confirm("هل أنت متأكد من رفض هذا الطلب؟")) {
      rejectMutation.mutate({ rowIndex });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Convert Google Drive view link to embeddable image link
  const getImageUrl = (link: string) => {
    const match = link.match(/\/d\/([^/]+)/);
    if (match) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
    }
    return link;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-medium mb-4">يرجى تسجيل الدخول</h1>
        <Button asChild>
          <a href={getLoginUrl()}>تسجيل الدخول</a>
        </Button>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-medium mb-4">غير مصرح لك بالوصول</h1>
        <Link href="/">
          <Button variant="outline">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للرئيسية
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b py-4">
        <div className="container flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium">مراجعة الطلبات</h1>
            <p className="text-sm text-muted-foreground">
              الطلبات المعلقة في انتظار الموافقة
            </p>
          </div>
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowRight className="w-4 h-4 ml-2" />
              لوحة التحكم
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الرقم الجامعي</TableHead>
                <TableHead className="text-right">وصف الإنجاز</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الإثبات</TableHead>
                <TableHead className="text-right w-32">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : requests && requests.length > 0 ? (
                requests.map((request: PendingRequest) => (
                  <TableRow key={request.rowIndex}>
                    <TableCell className="font-mono" dir="ltr">
                      {request.universityId}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {request.description}
                    </TableCell>
                    <TableCell>{formatDate(request.date)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedImage(request.imageLink)}
                        >
                          <Image className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={request.imageLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveClick(request)}
                          disabled={approveMutation.isPending}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(request.rowIndex)}
                          disabled={rejectMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    لا توجد طلبات معلقة
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>صورة الإثبات</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center">
              <img
                src={getImageUrl(selectedImage)}
                alt="Proof"
                className="max-h-[70vh] rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog with Hours Input */}
      <Dialog
        open={approveDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setApproveDialog({ open: false, request: null });
            setHoursInput("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>الموافقة على الطلب</DialogTitle>
          </DialogHeader>
          {approveDialog.request && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p>
                  <strong>الرقم الجامعي:</strong>{" "}
                  {approveDialog.request.universityId}
                </p>
                <p>
                  <strong>الوصف:</strong> {approveDialog.request.description}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">عدد الساعات التطوعية</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="مثال: 1.5"
                  value={hoursInput}
                  onChange={(e) => setHoursInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  حدد عدد الساعات التطوعية لهذا الإنجاز
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialog({ open: false, request: null })}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleApproveConfirm}
              disabled={approveMutation.isPending || !hoursInput}
            >
              {approveMutation.isPending ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : null}
              موافقة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container text-center text-sm text-muted-foreground">
          نادي نظم المعلومات الإدارية © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
