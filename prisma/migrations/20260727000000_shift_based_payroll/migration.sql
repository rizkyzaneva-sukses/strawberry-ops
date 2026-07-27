-- Shift-based payroll system
-- Replace wageType/wageRate/minHours with wageNgabedug/wageNyore on employees
-- Replace clockIn/clockOut/durationHours with shiftNgabedug/shiftNyore/lemburHours on payroll_records

-- Employees: drop old wage columns, add new ones
ALTER TABLE "employees" DROP COLUMN IF EXISTS "wage_type";
ALTER TABLE "employees" DROP COLUMN IF EXISTS "wage_rate";
ALTER TABLE "employees" DROP COLUMN IF EXISTS "min_hours";
ALTER TABLE "employees" ADD COLUMN "wage_ngabedug" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "employees" ADD COLUMN "wage_nyore" INTEGER NOT NULL DEFAULT 0;

-- PayrollRecords: drop old clock columns, add shift columns
ALTER TABLE "payroll_records" DROP COLUMN IF EXISTS "clock_in";
ALTER TABLE "payroll_records" DROP COLUMN IF EXISTS "clock_out";
ALTER TABLE "payroll_records" DROP COLUMN IF EXISTS "duration_hours";
ALTER TABLE "payroll_records" ADD COLUMN "shift_ngabedug" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "payroll_records" ADD COLUMN "shift_nyore" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "payroll_records" ADD COLUMN "lembur_hours" DOUBLE PRECISION NOT NULL DEFAULT 0;
