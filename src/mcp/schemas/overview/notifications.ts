import { z } from "zod";

export const notificationItemSchema = z.object({
    service_id: z.string(),
    label: z.string(),
    count: z.number(),
    title: z.string().optional(),
    description: z.string().optional(),
});

export const notificationsSchema = z.object({
    notifications: z.array(notificationItemSchema),
});

export type NotificationItem = z.infer<typeof notificationItemSchema>;
export type Notifications = z.infer<typeof notificationsSchema>;
