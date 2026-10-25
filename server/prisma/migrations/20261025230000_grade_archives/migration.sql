-- 年级切换：历史年级学习记录封存（docs/12 v1.1 ADR-003，key=年级+学期）
-- CreateTable
CREATE TABLE "grade_archives" (
    "family_id" TEXT NOT NULL,
    "grade_key" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grade_archives_pkey" PRIMARY KEY ("family_id","grade_key")
);

-- AddForeignKey
ALTER TABLE "grade_archives" ADD CONSTRAINT "grade_archives_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
