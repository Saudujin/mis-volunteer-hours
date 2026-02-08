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
import { MIS_LOGO_URL } from "@shared/logo";

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
            <ArrowRight className="w-4 h-4 ml-2" />العودة للرئيسية
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
              <h1 className="text-lg font-semibold text-white">الأعضاء</h1>
              <p className="text-sm text-white/70">بيانات الأعضاء والساعات التراكمية</p>
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
        <div className="bg-white border border-border/50 rounded-xl shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow style={{ background: "#F9F9F9" }}>
                <TableHead className="text-right font-semibold" style={{ color: "#022D63" }}>الرقم الجامعي</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: "#022D63" }}>الاسم</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: "#022D63" }}>الإيميل</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: "#022D63" }}>الجوال</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: "#022D63" }}>اللجنة</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: "#022D63" }}>الساعات</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: "#022D63" }}>الإنجازات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: "#034CA6" }} />
                  </TableCell>
                </TableRow>
              ) : members && members.length > 0 ? (
                members.map((member: Member) => (
                  <TableRow key={member.universityId} className="hover:bg-accent/30">
                    <TableCell className="font-mono" dir="ltr">{member.universityId}</TableCell>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell dir="ltr" className="text-left">{member.email}</TableCell>
                    <TableCell dir="ltr" className="text-left">{member.phone}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(127, 174, 217, 0.3)", color: "#022D63" }}>
                        {member.committee}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-base" style={{ color: "#034CA6" }}>{member.totalHours}</span>
                      <span className="text-xs text-muted-foreground mr-1">ساعة</span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{member.achievements || "-"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">لا توجد بيانات أعضاء</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 p-4 bg-white border border-border/50 rounded-xl shadow-sm">
          <p className="text-sm text-muted-foreground">
            <strong style={{ color: "#022D63" }}>ملاحظة:</strong> هذه البيانات تُقرأ من Google Sheets. لتعديل بيانات الأعضاء، يرجى التعديل مباشرة في الشيت.
          </p>
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
