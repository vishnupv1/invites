export function purchaseEventKey(templateId: string, transactionId?: string, coupon?: string) {
  if (transactionId) return `paid:${transactionId}`;
  return `zero:${templateId}:${coupon ?? ""}`;
}
