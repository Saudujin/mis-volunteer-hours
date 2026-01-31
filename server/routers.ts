import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getAchievementTypes,
  addAchievementType,
  deleteAchievementType,
  uploadImageToDrive,
  submitRequest,
  getPendingRequests,
  getAllRequests,
  approveRequest,
  rejectRequest,
  getMembers,
} from "./googleSheets";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Achievement types management (for admin to set hours)
  achievements: router({
    // Get all achievement types (public - for reference)
    getTypes: publicProcedure.query(async () => {
      return await getAchievementTypes();
    }),

    // Add new achievement type (admin only)
    addType: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          hours: z.number().positive(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Check if user is admin
        if (ctx.user.role !== "admin") {
          throw new Error("غير مصرح لك بهذا الإجراء");
        }
        const success = await addAchievementType(input.name, input.hours);
        if (!success) {
          throw new Error("فشل في إضافة نوع الإنجاز");
        }
        return { success: true };
      }),

    // Delete achievement type (admin only)
    deleteType: protectedProcedure
      .input(z.object({ rowIndex: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("غير مصرح لك بهذا الإجراء");
        }
        const success = await deleteAchievementType(input.rowIndex);
        if (!success) {
          throw new Error("فشل في حذف نوع الإنجاز");
        }
        return { success: true };
      }),

    // Submit a new volunteer hours request (public)
    submit: publicProcedure
      .input(
        z.object({
          universityId: z.string().min(1),
          description: z.string().min(1),
          imageBase64: z.string().min(1),
          fileName: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        // Upload image to Google Drive
        const imageLink = await uploadImageToDrive(
          input.imageBase64,
          input.fileName
        );

        // Submit request to Google Sheets
        const success = await submitRequest({
          universityId: input.universityId,
          description: input.description,
          imageLink,
        });

        if (!success) {
          throw new Error("فشل في إرسال الطلب");
        }

        // Notify HR admins
        await notifyOwner({
          title: "طلب ساعات تطوعية جديد",
          content: `تم استلام طلب جديد من الطالب رقم ${input.universityId}\nالوصف: ${input.description}`,
        });

        return { success: true };
      }),
  }),

  // HR Admin - Request management
  requests: router({
    // Get pending requests (admin only)
    getPending: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("غير مصرح لك بهذا الإجراء");
      }
      return await getPendingRequests();
    }),

    // Get all requests (admin only)
    getAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("غير مصرح لك بهذا الإجراء");
      }
      return await getAllRequests();
    }),

    // Approve a request (admin only)
    approve: protectedProcedure
      .input(z.object({ rowIndex: z.number(), hours: z.number().positive() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("غير مصرح لك بهذا الإجراء");
        }
        const success = await approveRequest(
          input.rowIndex,
          input.hours,
          ctx.user.name || ctx.user.email || "Admin"
        );
        if (!success) {
          throw new Error("فشل في الموافقة على الطلب");
        }
        return { success: true };
      }),

    // Reject a request (admin only)
    reject: protectedProcedure
      .input(z.object({ rowIndex: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("غير مصرح لك بهذا الإجراء");
        }
        const success = await rejectRequest(input.rowIndex);
        if (!success) {
          throw new Error("فشل في رفض الطلب");
        }
        return { success: true };
      }),
  }),

  // Members management
  members: router({
    // Get all members (admin only)
    getAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("غير مصرح لك بهذا الإجراء");
      }
      return await getMembers();
    }),
  }),
});

export type AppRouter = typeof appRouter;
