import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

interface Member {
  universityId: string;
  name: string;
  email: string;
  phone: string;
  committee: string;
  totalHours: number;
  achievements: string;
}

export default function AdminMembers() {
  const { user, loading: authLoading } = useAuth();

  const { data: members, isLoading } = trpc.members.getAll.useQuery(
    undefined,
    { enabled: !!user && user.role === "admin" }
  );

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
            <h1 className="text-lg font-medium">الأعضاء</h1>
            <p className="text-sm text-muted-foreground">
              بيانات الأعضاء والساعات التراكمية
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
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">الإيميل</TableHead>
                <TableHead className="text-right">الجوال</TableHead>
                <TableHead className="text-right">اللجنة</TableHead>
                <TableHead className="text-right">الساعات</TableHead>
                <TableHead className="text-right">الإنجازات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : members && members.length > 0 ? (
                members.map((member: Member) => (
                  <TableRow key={member.universityId}>
                    <TableCell className="font-mono" dir="ltr">
                      {member.universityId}
                    </TableCell>
                    <TableCell>{member.name}</TableCell>
                    <TableCell dir="ltr" className="text-left">
                      {member.email}
                    </TableCell>
                    <TableCell dir="ltr" className="text-left">
                      {member.phone}
                    </TableCell>
                    <TableCell>{member.committee}</TableCell>
                    <TableCell className="font-medium">
                      {member.totalHours} ساعة
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {member.achievements || "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    لا توجد بيانات أعضاء
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 p-4 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            <strong>ملاحظة:</strong> هذه البيانات تُقرأ من Google Sheets. لتعديل
            بيانات الأعضاء، يرجى التعديل مباشرة في الشيت.
          </p>
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
