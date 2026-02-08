import { useState } from "react";
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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Trash2, Plus, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { MIS_LOGO_URL } from "@shared/logo";

interface AchievementType {
  id: string;
  name: string;
  hours: number;
}

export default function AdminAchievements() {
  const { user, loading: authLoading } = useAuth();
  const [newName, setNewName] = useState("");
  const [newHours, setNewHours] = useState("");

  const utils = trpc.useUtils();

  const { data: types, isLoading } = trpc.achievements.getTypes.useQuery();

  const addMutation = trpc.achievements.addType.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة نوع الإنجاز بنجاح");
      setNewName("");
      setNewHours("");
      utils.achievements.getTypes.invalidate();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "فشل في إضافة نوع الإنجاز");
    },
  });

  const deleteMutation = trpc.achievements.deleteType.useMutation({
    onSuccess: () => {
      toast.success("تم حذف نوع الإنجاز بنجاح");
      utils.achievements.getTypes.invalidate();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "فشل في حذف نوع الإنجاز");
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newHours) {
      toast.error("يرجى تعبئة جميع الحقول");
      return;
    }
    addMutation.mutate({ name: newName, hours: parseFloat(newHours) });
  };

  const handleDelete = (rowIndex: number) => {
    if (confirm("هل أنت متأكد من حذف هذا النوع؟")) {
      deleteMutation.mutate({ rowIndex });
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
          <Button variant="outline">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للرئيسية
          </Button>
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
              <h1 className="text-lg font-semibold text-white">إدارة أنواع الإنجازات</h1>
              <p className="text-sm text-white/70">إضافة وحذف أنواع الإنجازات والساعات</p>
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
        {/* Add New Type Form */}
        <form onSubmit={handleAdd} className="mb-8 p-6 bg-white border border-border/50 rounded-xl shadow-sm space-y-4">
          <h2 className="font-semibold" style={{ color: "#022D63" }}>إضافة نوع جديد</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-medium">اسم الإنجاز</Label>
              <Input id="name" placeholder="مثال: حضور اليوم التعريفي" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours" className="font-medium">عدد الساعات</Label>
              <Input id="hours" type="number" step="0.5" min="0" placeholder="مثال: 1" value={newHours} onChange={(e) => setNewHours(e.target.value)} className="bg-white" />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={addMutation.isPending} style={{ background: "#034CA6" }}>
                {addMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Plus className="w-4 h-4 ml-2" />}
                إضافة
              </Button>
            </div>
          </div>
        </form>

        {/* Types Table */}
        <div className="bg-white border border-border/50 rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow style={{ background: "#F9F9F9" }}>
                <TableHead className="text-right font-semibold" style={{ color: "#022D63" }}>اسم الإنجاز</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: "#022D63" }}>عدد الساعات</TableHead>
                <TableHead className="text-right w-20 font-semibold" style={{ color: "#022D63" }}>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: "#034CA6" }} />
                  </TableCell>
                </TableRow>
              ) : types && types.length > 0 ? (
                types.map((type: AchievementType, index: number) => (
                  <TableRow key={type.id} className="hover:bg-accent/30">
                    <TableCell>{type.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(127, 174, 217, 0.3)", color: "#022D63" }}>
                        {type.hours} ساعة
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(index)} disabled={deleteMutation.isPending} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">لا توجد أنواع إنجازات مضافة</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

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
