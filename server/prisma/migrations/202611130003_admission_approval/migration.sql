CREATE TABLE "AdmissionApproval" (
  "paymentId" UUID NOT NULL,
  "notifiedById" UUID NOT NULL,
  "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdmissionApproval_pkey" PRIMARY KEY ("paymentId"),
  CONSTRAINT "AdmissionApproval_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AdmissionApproval_notifiedById_fkey" FOREIGN KEY ("notifiedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "AdmissionApproval_notifiedById_idx" ON "AdmissionApproval"("notifiedById");
