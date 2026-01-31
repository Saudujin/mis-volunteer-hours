import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, CheckCircle, Loader2 } from "lucide-react";

interface AchievementType {
  id: string;
  name: string;
  hours: number;
}

// Convert Arabic numerals to English
function convertArabicToEnglish(str: string): string {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  let result = str;
  arabicNumerals.forEach((arabic, index) => {
    result = result.replace(new RegExp(arabic, "g"), index.toString());
  });
  return result;
}

export default function Home() {
  const [universityId, setUniversityId] = useState("");
  const [achievementType, setAchievementType] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch achievement types from Google Sheets
  const { data: achievementTypes, isLoading: typesLoading } =
    trpc.achievements.getTypes.useQuery();

  const submitMutation = trpc.achievements.submit.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
      setUniversityId("");
      setAchievementType("");
      setImageFile(null);
      setImagePreview(null);
      toast.success("تم إرسال طلبك بنجاح!");
      setTimeout(() => setIsSuccess(false), 3000);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "حدث خطأ أثناء الإرسال");
    },
  });

  const handleUniversityIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const converted = convertArabicToEnglish(e.target.value);
    // Only allow numbers
    const numbersOnly = converted.replace(/[^0-9]/g, "");
    setUniversityId(numbersOnly);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!universityId || !achievementType || !imageFile) {
      toast.error("يرجى تعبئة جميع الحقول");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await submitMutation.mutateAsync({
          universityId,
          achievementType,
          imageBase64: base64,
          fileName: imageFile.name,
        });
        setIsSubmitting(false);
      };
      reader.readAsDataURL(imageFile);
    } catch {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">تم إرسال طلبك بنجاح</h2>
          <p className="text-muted-foreground">
            سيتم مراجعة طلبك من قبل فريق الموارد البشرية
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b py-4">
        <div className="container">
          <h1 className="text-lg font-medium">تسجيل الساعات التطوعية</h1>
          <p className="text-sm text-muted-foreground">
            نادي نظم المعلومات الإدارية
          </p>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          {/* University ID */}
          <div className="space-y-2">
            <Label htmlFor="universityId">الرقم الجامعي</Label>
            <Input
              id="universityId"
              type="text"
              inputMode="numeric"
              placeholder="مثال: 445101413"
              value={universityId}
              onChange={handleUniversityIdChange}
              className="text-left"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              يمكنك كتابة الرقم بالعربي أو الإنجليزي
            </p>
          </div>

          {/* Achievement Type */}
          <div className="space-y-2">
            <Label htmlFor="achievementType">نوع الإنجاز</Label>
            <Select value={achievementType} onValueChange={setAchievementType}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع الإنجاز" />
              </SelectTrigger>
              <SelectContent>
                {typesLoading ? (
                  <SelectItem value="loading" disabled>
                    جاري التحميل...
                  </SelectItem>
                ) : achievementTypes && achievementTypes.length > 0 ? (
                  achievementTypes.map((type: AchievementType) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.hours} ساعة)
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    لا توجد أنواع متاحة
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>صورة الإثبات</Label>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-foreground/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="space-y-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-40 mx-auto rounded"
                  />
                  <p className="text-sm text-muted-foreground">
                    اضغط لتغيير الصورة
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    اضغط لرفع صورة الإثبات
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !universityId || !achievementType || !imageFile}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              "إرسال الطلب"
            )}
          </Button>
        </form>
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
