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
            <h1 className="text-lg font-medium">إدارة أنواع الإنجازات</h1>
            <p className="text-sm text-muted-foreground">
              إضافة وحذف أنواع الإنجازات والساعات
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
        {/* Add New Type Form */}
        <form
          onSubmit={handleAdd}
          className="mb-8 p-6 border rounded-lg space-y-4"
        >
          <h2 className="font-medium">إضافة نوع جديد</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الإنجاز</Label>
              <Input
                id="name"
                placeholder="مثال: حضور اليوم التعريفي"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours">عدد الساعات</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0"
                placeholder="مثال: 1"
                value={newHours}
                onChange={(e) => setNewHours(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full"
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 ml-2" />
                )}
                إضافة
              </Button>
            </div>
          </div>
        </form>

        {/* Types Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">اسم الإنجاز</TableHead>
                <TableHead className="text-right">عدد الساعات</TableHead>
                <TableHead className="text-right w-20">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : types && types.length > 0 ? (
                types.map((type: AchievementType, index: number) => (
                  <TableRow key={type.id}>
                    <TableCell>{type.name}</TableCell>
                    <TableCell>{type.hours} ساعة</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(index)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-8 text-muted-foreground"
                  >
                    لا توجد أنواع إنجازات مضافة
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container text-center text-sm text-muted-foreground">
          نادي نظم المعلومات الإدارية © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
