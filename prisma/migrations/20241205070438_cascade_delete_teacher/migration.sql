-- DropForeignKey
ALTER TABLE "Record" DROP CONSTRAINT "Record_submitedBy_fkey";

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_submitedBy_fkey" FOREIGN KEY ("submitedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
