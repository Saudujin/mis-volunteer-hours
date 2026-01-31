import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, ClipboardList, Users, Settings, ArrowRight, LogOut } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

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
        <p className="text-muted-foreground mb-4">
          هذه الصفحة مخصصة للمسؤولين فقط
        </p>
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
            <h1 className="text-lg font-medium">لوحة التحكم</h1>
            <p className="text-sm text-muted-foreground">
              مرحباً، {user.name || user.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowRight className="w-4 h-4 ml-2" />
                الرئيسية
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 ml-2" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pending Requests Card */}
          <Link href="/admin/requests">
            <Card className="cursor-pointer hover:border-foreground/30 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  مراجعة الطلبات
                </CardTitle>
                <CardDescription>
                  الطلبات المعلقة في انتظار الموافقة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {pendingRequests?.length ?? 0}
                </p>
                <p className="text-sm text-muted-foreground">طلب معلق</p>
              </CardContent>
            </Card>
          </Link>

          {/* Achievement Types Card */}
          <Link href="/admin/achievements">
            <Card className="cursor-pointer hover:border-foreground/30 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  أنواع الإنجازات
                </CardTitle>
                <CardDescription>
                  إدارة أنواع الإنجازات والساعات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {achievementTypes?.length ?? 0}
                </p>
                <p className="text-sm text-muted-foreground">نوع إنجاز</p>
              </CardContent>
            </Card>
          </Link>

          {/* Members Card */}
          <Link href="/admin/members">
            <Card className="cursor-pointer hover:border-foreground/30 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  الأعضاء
                </CardTitle>
                <CardDescription>
                  عرض بيانات الأعضاء والساعات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">-</p>
                <p className="text-sm text-muted-foreground">
                  عرض من Google Sheets
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Info */}
        <div className="mt-8 p-6 border rounded-lg">
          <h2 className="font-medium mb-4">معلومات سريعة</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              • الطلبات الجديدة تظهر في صفحة "مراجعة الطلبات" وتحتاج موافقتك
            </p>
            <p>
              • عند الموافقة على طلب، يتم تحديث الساعات تلقائياً في Google Sheets
            </p>
            <p>
              • يمكنك إضافة أنواع إنجازات جديدة من صفحة "أنواع الإنجازات"
            </p>
            <p>
              • بيانات الأعضاء والساعات التراكمية موجودة في Google Sheets
            </p>
          </div>
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
