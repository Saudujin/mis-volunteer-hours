import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, ClipboardList, Users, Settings, ArrowRight, LogOut } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { MIS_LOGO_URL } from "@shared/logo";

export default function Admin() {
  const { user, loading: authLoading, logout } = useAuth();

  const { data: pendingRequests } = trpc.requests.getPending.useQuery(
    undefined,
    { enabled: !!user && user.role === "admin" }
  );

  const { data: achievementTypes } = trpc.achievements.getTypes.useQuery();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
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
        <p className="text-muted-foreground mb-4">هذه الصفحة مخصصة للمسؤولين فقط</p>
        <Link href="/">
          <Button variant="outline"><ArrowRight className="w-4 h-4 ml-2" />العودة للرئيسية</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F9F9F9" }}>
      <header style={{ background: "linear-gradient(135deg, #022D63 0%, #034CA6 100%)" }} className="py-5 shadow-md">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={MIS_LOGO_URL} alt="MIS Logo" className="h-10 w-auto brightness-0 invert" />
            <div>
              <h1 className="text-lg font-semibold text-white">لوحة التحكم</h1>
              <p className="text-sm text-white/70">مرحباً، {user.name || user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
                <ArrowRight className="w-4 h-4 ml-2" />الرئيسية
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" onClick={handleLogout}>
              <LogOut className="w-4 h-4 ml-2" />خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/requests">
            <Card className="cursor-pointer hover:shadow-md transition-all duration-200 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "#034CA6" }}>
                    <ClipboardList className="w-5 h-5 text-white" />
                  </div>
                  <span style={{ color: "#022D63" }}>مراجعة الطلبات</span>
                </CardTitle>
                <CardDescription>الطلبات المعلقة في انتظار الموافقة</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold" style={{ color: "#034CA6" }}>{pendingRequests?.length ?? 0}</p>
                <p className="text-sm text-muted-foreground mt-1">طلب معلق</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/achievements">
            <Card className="cursor-pointer hover:shadow-md transition-all duration-200 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "#7FAED9" }}>
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <span style={{ color: "#022D63" }}>أنواع الإنجازات</span>
                </CardTitle>
                <CardDescription>إدارة أنواع الإنجازات والساعات</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold" style={{ color: "#034CA6" }}>{achievementTypes?.length ?? 0}</p>
                <p className="text-sm text-muted-foreground mt-1">نوع إنجاز</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/members">
            <Card className="cursor-pointer hover:shadow-md transition-all duration-200 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "#022D63" }}>
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <span style={{ color: "#022D63" }}>الأعضاء</span>
                </CardTitle>
                <CardDescription>عرض بيانات الأعضاء والساعات</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold" style={{ color: "#034CA6" }}>-</p>
                <p className="text-sm text-muted-foreground mt-1">عرض من Google Sheets</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-8 p-6 bg-white border border-border/50 rounded-xl shadow-sm">
          <h2 className="font-semibold mb-4" style={{ color: "#022D63" }}>معلومات سريعة</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>• الطلبات الجديدة تظهر في صفحة "مراجعة الطلبات" وتحتاج موافقتك</p>
            <p>• عند الموافقة على طلب، يتم تحديث الساعات تلقائياً في Google Sheets</p>
            <p>• يمكنك إضافة أنواع إنجازات جديدة من صفحة "أنواع الإنجازات"</p>
            <p>• بيانات الأعضاء والساعات التراكمية موجودة في Google Sheets</p>
          </div>
        </div>
      </main>

      <footer className="py-4" style={{ background: "#022D63" }}>
        <div className="container flex items-center justify-center gap-3">
          <img src={MIS_LOGO_URL} alt="MIS" className="h-5 w-auto brightness-0 invert opacity-50" />
          <p className="text-sm text-white/50">نادي نظم المعلومات الإدارية © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
