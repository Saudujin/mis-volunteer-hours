import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, CheckCircle, Loader2, ImageIcon } from "lucide-react";
import { MIS_LOGO_URL } from "@shared/logo";

function convertArabicToEnglish(str: string): string {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  let result = str;
  arabicNumerals.forEach((arabic, index) => {
    result = result.replace(new RegExp(arabic, "g"), index.toString());
  });
  return result;
}

async function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedBase64);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default function Home() {
  const [universityId, setUniversityId] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitMutation = trpc.achievements.submit.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
      setUniversityId("");
      setDescription("");
      setImageFile(null);
      setImagePreview(null);
      setUploadProgress("");
      toast.success("تم إرسال طلبك بنجاح!");
      setTimeout(() => setIsSuccess(false), 4000);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "حدث خطأ أثناء الإرسال");
      setUploadProgress("");
    },
  });

  const handleUniversityIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const converted = convertArabicToEnglish(e.target.value);
    const numbersOnly = converted.replace(/[^0-9]/g, "");
    setUniversityId(numbersOnly);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!universityId || !description || !imageFile) {
      toast.error("يرجى تعبئة جميع الحقول");
      return;
    }
    setIsSubmitting(true);
    try {
      setUploadProgress("جاري ضغط الصورة...");
      const compressedBase64 = await compressImage(imageFile);
      setUploadProgress("جاري رفع الصورة...");
      await submitMutation.mutateAsync({
        universityId,
        description,
        imageBase64: compressedBase64,
        fileName: imageFile.name,
      });
    } catch {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #F9F9F9 0%, #e8f0fa 100%)" }}>
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center" style={{ background: "#034CA6" }}>
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-semibold" style={{ color: "#022D63" }}>تم إرسال طلبك بنجاح</h2>
          <p className="text-muted-foreground text-base">سيتم مراجعة طلبك من قبل فريق الموارد البشرية</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F9F9F9" }}>
      {/* Header */}
      <header style={{ background: "linear-gradient(135deg, #022D63 0%, #034CA6 100%)" }} className="py-5 shadow-md">
        <div className="container flex items-center gap-4">
          <img src={MIS_LOGO_URL} alt="MIS Logo" className="h-10 w-auto brightness-0 invert" />
          <div>
            <h1 className="text-lg font-semibold text-white">تسجيل الساعات التطوعية</h1>
            <p className="text-sm text-white/70">نادي نظم المعلومات الإدارية</p>
          </div>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-sm border border-border/50 p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-1 pb-2">
              <h2 className="text-lg font-semibold" style={{ color: "#022D63" }}>تسجيل إنجاز جديد</h2>
              <p className="text-sm text-muted-foreground">أدخل بياناتك وارفق الإثبات</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* University ID */}
              <div className="space-y-2">
                <Label htmlFor="universityId" className="font-medium">الرقم الجامعي</Label>
                <Input
                  id="universityId"
                  type="text"
                  inputMode="numeric"
                  placeholder="مثال: 445101413"
                  value={universityId}
                  onChange={handleUniversityIdChange}
                  className="text-left h-11 bg-white"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">يمكنك كتابة الرقم بالعربي أو الإنجليزي</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="font-medium">وصف الإنجاز</Label>
                <Textarea
                  id="description"
                  placeholder="اكتب وصف لما قمت به، مثال: حضرت اليوم التعريفي للنادي"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="bg-white resize-none"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="font-medium">صورة الإثبات</Label>
                <div
                  className="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 hover:border-primary/50 hover:bg-accent/30"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img src={imagePreview} alt="Preview" className="max-h-36 mx-auto rounded-lg" />
                      <p className="text-xs text-muted-foreground">اضغط لتغيير الصورة</p>
                    </div>
                  ) : (
                    <div className="space-y-3 py-2">
                      <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{ background: "rgba(127, 174, 217, 0.2)" }}>
                        <ImageIcon className="w-6 h-6" style={{ color: "#034CA6" }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "#034CA6" }}>اضغط لرفع صورة الإثبات</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG حتى 10MB</p>
                      </div>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 text-base font-medium"
                style={{ background: isSubmitting ? "#7FAED9" : "#034CA6" }}
                disabled={isSubmitting || !universityId || !description || !imageFile}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    {uploadProgress || "جاري الإرسال..."}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 ml-2" />
                    إرسال الطلب
                  </>
                )}
              </Button>
            </form>
          </div>
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
