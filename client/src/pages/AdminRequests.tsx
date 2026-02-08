import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, ArrowRight, Eye, Clock } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { MIS_LOGO_URL } from "@shared/logo";

interface PendingRequest {
  rowIndex: number;
  universityId: string;
  description: string;
  imageLink: string;
  date: string;
  hours: number;
  approved: boolean;
}

export default function AdminRequests() {
  const { user, loading: authLoading } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [hoursInputs, setHoursInputs] = useState<Record<number, string>>({});

  const utils = trpc.useUtils();

  const { data: requests, isLoading } = trpc.requests.getPending.useQuery(
    undefined,
    { enabled: !!user && user.role === "admin" }
  );

  const approveMutation = trpc.requests.approve.useMutation({
    onSuccess: () => {
      toast.success("تم اعتماد الطلب بنجاح");
      utils.requests.getPending.invalidate();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "فشل في اعتماد الطلب");
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

  const handleApprove = (rowIndex: number) => {
    const hours = parseFloat(hoursInputs[rowIndex] || "0");
    if (!hours || hours <= 0) {
      toast.error("يرجى إدخال عدد الساعات");
      return;
    }
    approveMutation.mutate({ rowIndex, hours });
  };

  const handleReject = (rowIndex: number) => {
    if (confirm("هل أنت متأكد من رفض هذا الطلب؟")) {
      rejectMutation.mutate({ rowIndex });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F9F9F9" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#034CA6" }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: "#F9F9F9" }}>
        <img src={MIS_LOGO_URL} alt="MIS" className="h-16 mb-6" />
        <h1 className="text-xl font-semibold mb-4" style={{ color: "#022D63" }}>يرجى تسجيل الدخول</h1>
        <Button asChild style={{ background: "#034CA6" }}>
          <a href={getLoginUrl()}>تسجيل الدخول</a>
        </Button>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: "#F9F9F9" }}>
        <h1 className="text-xl font-semibold mb-4" style={{ color: "#022D63" }}>غير مصرح لك بالوصول</h1>
        <Link href="/">
          <Button variant="outline"><ArrowRight className="w-4 h-4 ml-2" />العودة للرئيسية</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F9F9F9" }}>
      {/* Header */}
      <header style={{ background: "linear-gradient(135deg, #022D63 0%, #034CA6 100%)" }} className="py-5 shadow-md">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={MIS_LOGO_URL} alt="MIS Logo" className="h-10 w-auto brightness-0 invert" />
            <div>
              <h1 className="text-lg font-semibold text-white">مراجعة الطلبات</h1>
              <p className="text-sm text-white/70">الطلبات المعلقة في انتظار الموافقة</p>
            </div>
          </div>
          <Link href="/admin">
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
              <ArrowRight className="w-4 h-4 ml-2" />لوحة التحكم
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container py-8">
        {/* Stats */}
        <div className="mb-6 flex items-center gap-3 p-4 bg-white rounded-xl border border-border/50 shadow-sm">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "#034CA6" }}>
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: "#034CA6" }}>{requests?.length ?? 0}</p>
            <p className="text-sm text-muted-foreground">طلب في انتظار المراجعة</p>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white border border-border/50 rounded-xl shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow style={{ background: "#F9F9F9" }}>
                <TableHead className="text-right font-semibold" style={{ color: "#022D63" }}>الرقم الجامعي</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: "#022D63" }}>وصف الإنجاز</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: "#022D63" }}>التاريخ</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: "#022D63" }}>الإثبات</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: "#022D63" }}>الساعات</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: "#022D63" }}>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: "#034CA6" }} />
                  </TableCell>
                </TableRow>
              ) : requests && requests.length > 0 ? (
                requests.map((req: PendingRequest) => (
                  <TableRow key={req.rowIndex} className="hover:bg-accent/30">
                    <TableCell className="font-mono" dir="ltr">{req.universityId}</TableCell>
                    <TableCell className="max-w-xs">{req.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{req.date}</TableCell>
                    <TableCell>
                      {req.imageLink ? (
                        <Button variant="ghost" size="sm" onClick={() => setSelectedImage(req.imageLink)} style={{ color: "#034CA6" }}>
                          <Eye className="w-4 h-4 ml-1" />عرض
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">لا يوجد</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="0"
                        value={hoursInputs[req.rowIndex] || ""}
                        onChange={(e) => setHoursInputs((prev) => ({ ...prev, [req.rowIndex]: e.target.value }))}
                        className="w-20 h-8 text-center bg-white"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(req.rowIndex)}
                          disabled={approveMutation.isPending}
                          className="text-white"
                          style={{ background: "#034CA6" }}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReject(req.rowIndex)}
                          disabled={rejectMutation.isPending}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <div className="space-y-2">
                      <CheckCircle className="w-10 h-10 mx-auto" style={{ color: "#7FAED9" }} />
                      <p>لا توجد طلبات معلقة</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Image Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>صورة الإثبات</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img src={selectedImage} alt="Proof" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="py-4" style={{ background: "#022D63" }}>
        <div className="container flex items-center justify-center gap-3">
          <img src={MIS_LOGO_URL} alt="MIS" className="h-5 w-auto brightness-0 invert opacity-50" />
          <p className="text-sm text-white/50">نادي نظم المعلومات الإدارية © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
