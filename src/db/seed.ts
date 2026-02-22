import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { organizations } from './schema/organizations';
import { departments } from './schema/departments';
import { users } from './schema/users';
import { pipRecords, pipGoals, pipCheckins, pipComments } from './schema/pip';
import { leaveTypes } from './schema/attendance';
import { kpiCategories } from './schema/assessments';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Create organization
  const [org] = await db.insert(organizations).values({
    name: 'ClickBroker',
    slug: 'clickbroker',
  }).returning();
  console.log('✅ Organization created');

  // 2. Create departments (without manager first)
  const deptMap: Record<string, string> = {};
  const deptData = [
    { name: 'ฝ่ายขาย', mockId: 'd1' },
    { name: 'ฝ่ายปฏิบัติการ', mockId: 'd2' },
    { name: 'ฝ่ายทรัพยากรบุคคล', mockId: 'd3' },
    { name: 'ฝ่ายการตลาด', mockId: 'd4' },
    { name: 'ฝ่ายบริหาร', mockId: 'd5' },
  ];

  for (const d of deptData) {
    const [dept] = await db.insert(departments).values({
      name: d.name,
      organizationId: org.id,
    }).returning();
    deptMap[d.mockId] = dept.id;
  }
  console.log('✅ Departments created');

  // Map department names to IDs for user creation
  const deptNameToId: Record<string, string> = {};
  for (const d of deptData) {
    deptNameToId[d.name] = deptMap[d.mockId];
  }

  // 3. Create users (without managerId first)
  const userMap: Record<string, string> = {};
  const mockUsersData = [
    { mockId: 'u1', name: 'สมศรี จันทร์สว่าง', email: 'somsri@clickbroker.co.th', role: 'admin' as const, department: 'ฝ่ายทรัพยากรบุคคล', position: 'HR Manager' },
    { mockId: 'u2', name: 'วิชัย สุขใจ', email: 'wichai@clickbroker.co.th', role: 'manager' as const, department: 'ฝ่ายขาย', position: 'Sales Manager' },
    { mockId: 'u3', name: 'สมชาย มั่นคง', email: 'somchai@clickbroker.co.th', role: 'employee' as const, department: 'ฝ่ายขาย', position: 'Sales Executive' },
    { mockId: 'u4', name: 'นภา แสงทอง', email: 'napa@clickbroker.co.th', role: 'employee' as const, department: 'ฝ่ายขาย', position: 'Sales Executive' },
    { mockId: 'u5', name: 'ธนา เจริญสุข', email: 'tana@clickbroker.co.th', role: 'manager' as const, department: 'ฝ่ายปฏิบัติการ', position: 'Operations Manager' },
    { mockId: 'u6', name: 'พรทิพย์ รักดี', email: 'porntip@clickbroker.co.th', role: 'employee' as const, department: 'ฝ่ายปฏิบัติการ', position: 'Operations Staff' },
    { mockId: 'u7', name: 'อนุชา วงศ์ดี', email: 'anucha@clickbroker.co.th', role: 'employee' as const, department: 'ฝ่ายการตลาด', position: 'Marketing Executive' },
    { mockId: 'u8', name: 'กมล ศรีสุข', email: 'kamol@clickbroker.co.th', role: 'super_admin' as const, department: 'ฝ่ายบริหาร', position: 'CEO' },
  ];

  for (const u of mockUsersData) {
    const [user] = await db.insert(users).values({
      name: u.name,
      email: u.email,
      role: u.role,
      departmentId: deptNameToId[u.department],
      position: u.position,
      organizationId: org.id,
      employeeCode: u.mockId.toUpperCase(),
    }).returning();
    userMap[u.mockId] = user.id;
  }
  console.log('✅ Users created');

  // 4. Update manager references
  const managerMapping: Record<string, string | null> = {
    u1: null, u2: 'u1', u3: 'u2', u4: 'u2', u5: 'u1', u6: 'u5', u7: 'u5', u8: null,
  };
  const { eq } = await import('drizzle-orm');
  for (const [mockId, managerId] of Object.entries(managerMapping)) {
    if (managerId) {
      await db.update(users).set({ managerId: userMap[managerId] }).where(eq(users.id, userMap[mockId]));
    }
  }

  // Update department managers
  const deptManagerMap: Record<string, string> = { d1: 'u2', d2: 'u5', d3: 'u1', d4: 'u5', d5: 'u8' };
  for (const [deptMockId, managerMockId] of Object.entries(deptManagerMap)) {
    await db.update(departments).set({ managerId: userMap[managerMockId] }).where(eq(departments.id, deptMap[deptMockId]));
  }
  console.log('✅ Manager references updated');

  // 5. Create PIPs
  const pipMap: Record<string, string> = {};
  const pipData = [
    { mockId: 'pip1', employeeId: 'u3', managerId: 'u2', status: 'active' as const, duration: 60, startDate: '2026-01-15', endDate: '2026-03-15', reason: 'ยอดขายต่ำกว่าเป้าหมาย 3 เดือนติดต่อกัน ไม่ถึง 50% ของเป้าที่กำหนด', overallRating: null, result: null, resultNote: null, createdAt: '2026-01-14', updatedAt: '2026-02-18' },
    { mockId: 'pip2', employeeId: 'u4', managerId: 'u2', status: 'active' as const, duration: 30, startDate: '2026-02-01', endDate: '2026-03-03', reason: 'อัตราการติดตามลูกค้าต่ำ ไม่มีการ follow up ลูกค้าที่สนใจ ทำให้เสียโอกาสขาย', overallRating: null, result: null, resultNote: null, createdAt: '2026-01-31', updatedAt: '2026-02-15' },
    { mockId: 'pip3', employeeId: 'u6', managerId: 'u5', status: 'completed' as const, duration: 90, startDate: '2025-10-01', endDate: '2025-12-30', reason: 'การประมวลผลเอกสารล่าช้า ข้อผิดพลาดในการคีย์ข้อมูลสูงเกินมาตรฐาน', overallRating: 4, result: 'passed' as const, resultNote: 'พนักงานพัฒนาตัวเองได้ดี ผลงานดีขึ้นอย่างเห็นได้ชัด', createdAt: '2025-09-30', updatedAt: '2025-12-30' },
    { mockId: 'pip4', employeeId: 'u7', managerId: 'u5', status: 'failed' as const, duration: 60, startDate: '2025-11-01', endDate: '2025-12-31', reason: 'ผลงาน content marketing ต่ำกว่ามาตรฐาน engagement rate ไม่ถึงเป้า', overallRating: 2, result: 'failed' as const, resultNote: 'พนักงานไม่สามารถพัฒนาผลงานได้ตามเป้าหมาย แนะนำพิจารณาย้ายแผนกหรือดำเนินการตามนโยบายบริษัท', createdAt: '2025-10-31', updatedAt: '2025-12-31' },
    { mockId: 'pip5', employeeId: 'u3', managerId: 'u2', status: 'pending' as const, duration: 30, startDate: '2026-03-01', endDate: '2026-03-31', reason: 'ต่ออายุ PIP รอบที่ 2 หลังจาก PIP รอบแรกยังไม่ถึงเป้า', overallRating: null, result: null, resultNote: null, createdAt: '2026-02-19', updatedAt: '2026-02-19' },
  ];

  for (const p of pipData) {
    const [pip] = await db.insert(pipRecords).values({
      employeeId: userMap[p.employeeId],
      managerId: userMap[p.managerId],
      status: p.status,
      duration: p.duration,
      startDate: p.startDate,
      endDate: p.endDate,
      reason: p.reason,
      overallRating: p.overallRating,
      result: p.result,
      resultNote: p.resultNote,
      organizationId: org.id,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }).returning();
    pipMap[p.mockId] = pip.id;
  }
  console.log('✅ PIPs created');

  // 6. Create PIP Goals
  const goalMap: Record<string, string> = {};
  const goalsData = [
    // pip1 goals
    { mockId: 'g1', pipId: 'pip1', title: 'เพิ่มยอดขายรายเดือน', description: 'ปิดการขายกรมธรรม์ประกันภัยให้ได้ตามเป้า', kpiTarget: 'ยอดขาย', kpiUnit: 'บาท', currentValue: 180000, targetValue: 300000, rating: null, status: 'in_progress' as const },
    { mockId: 'g2', pipId: 'pip1', title: 'เพิ่มจำนวนลูกค้าใหม่', description: 'หาลูกค้าใหม่ผ่านช่องทาง online และ offline', kpiTarget: 'จำนวนลูกค้าใหม่', kpiUnit: 'ราย', currentValue: 8, targetValue: 15, rating: null, status: 'in_progress' as const },
    { mockId: 'g3', pipId: 'pip1', title: 'พัฒนาทักษะการนำเสนอ', description: 'เข้าอบรมการขายและฝึกนำเสนอกับหัวหน้า', kpiTarget: 'ชั่วโมงอบรม', kpiUnit: 'ชั่วโมง', currentValue: 6, targetValue: 12, rating: null, status: 'in_progress' as const },
    // pip2 goals
    { mockId: 'g4', pipId: 'pip2', title: 'เพิ่มอัตราการติดตามลูกค้า', description: 'ติดตามลูกค้าที่สนใจภายใน 24 ชั่วโมง', kpiTarget: 'อัตรา follow up', kpiUnit: '%', currentValue: 65, targetValue: 90, rating: null, status: 'in_progress' as const },
    { mockId: 'g5', pipId: 'pip2', title: 'ปรับปรุงการบันทึกข้อมูลลูกค้า', description: 'บันทึกข้อมูลลูกค้าใน CRM ให้ครบถ้วนทุกราย', kpiTarget: 'ความครบถ้วน CRM', kpiUnit: '%', currentValue: 70, targetValue: 100, rating: null, status: 'in_progress' as const },
    // pip3 goals
    { mockId: 'g6', pipId: 'pip3', title: 'ลดเวลาประมวลผลเอกสาร', description: 'ประมวลผลเอกสารให้เสร็จภายใน 2 วันทำการ', kpiTarget: 'เวลาเฉลี่ย', kpiUnit: 'วัน', currentValue: 1.5, targetValue: 2, rating: 4, status: 'achieved' as const },
    { mockId: 'g7', pipId: 'pip3', title: 'ลดอัตราข้อผิดพลาด', description: 'ลดข้อผิดพลาดในการคีย์ข้อมูลให้ต่ำกว่า 2%', kpiTarget: 'อัตราข้อผิดพลาด', kpiUnit: '%', currentValue: 1.5, targetValue: 2, rating: 5, status: 'achieved' as const },
    // pip4 goals
    { mockId: 'g8', pipId: 'pip4', title: 'เพิ่ม engagement rate', description: 'เพิ่ม engagement rate ของ social media content', kpiTarget: 'Engagement rate', kpiUnit: '%', currentValue: 1.8, targetValue: 3.5, rating: 2, status: 'not_achieved' as const },
    { mockId: 'g9', pipId: 'pip4', title: 'เพิ่มจำนวน leads จาก content', description: 'สร้าง content ที่ดึงดูด leads เข้ามาในระบบ', kpiTarget: 'จำนวน leads', kpiUnit: 'ราย', currentValue: 12, targetValue: 30, rating: 1, status: 'not_achieved' as const },
  ];

  for (const g of goalsData) {
    const [goal] = await db.insert(pipGoals).values({
      pipId: pipMap[g.pipId],
      title: g.title,
      description: g.description,
      kpiTarget: g.kpiTarget,
      kpiUnit: g.kpiUnit,
      currentValue: String(g.currentValue),
      targetValue: String(g.targetValue),
      rating: g.rating,
      status: g.status,
    }).returning();
    goalMap[g.mockId] = goal.id;
  }
  console.log('✅ PIP Goals created');

  // 7. Create Check-ins
  const checkinsData = [
    { pipId: 'pip1', weekNumber: 1, date: '2026-01-22', managerNote: 'สมชายเริ่มปรับตัวได้ดี มีการวางแผนการขายเป็นระบบมากขึ้น', employeeNote: 'เริ่มใช้ระบบ CRM ในการติดตามลูกค้า รู้สึกว่าช่วยให้จัดการได้ดีขึ้น', createdBy: 'u2', goalUpdates: [{ goalId: 'g1', previousValue: 100000, currentValue: 120000, note: 'ปิดการขายได้ 3 ราย' }, { goalId: 'g2', previousValue: 3, currentValue: 5, note: 'หาลูกค้าใหม่ได้ 2 ราย' }, { goalId: 'g3', previousValue: 0, currentValue: 3, note: 'เข้าอบรม Sales Technique' }] },
    { pipId: 'pip1', weekNumber: 2, date: '2026-01-29', managerNote: 'ยอดขายเพิ่มขึ้นต่อเนื่อง แต่ยังต้องพัฒนาทักษะการปิดการขาย', employeeNote: 'พยายามติดต่อลูกค้ามากขึ้น แต่ยังปิดการขายไม่ค่อยได้', createdBy: 'u2', goalUpdates: [{ goalId: 'g1', previousValue: 120000, currentValue: 145000, note: 'ปิดการขายเพิ่ม 2 ราย' }, { goalId: 'g2', previousValue: 5, currentValue: 6, note: 'ลูกค้าใหม่ 1 ราย' }, { goalId: 'g3', previousValue: 3, currentValue: 4, note: 'ฝึก role-play กับหัวหน้า 1 ชม.' }] },
    { pipId: 'pip1', weekNumber: 3, date: '2026-02-05', managerNote: 'เห็นพัฒนาการที่ดี สมชายมีความมั่นใจในการนำเสนอมากขึ้น', employeeNote: 'เริ่มมั่นใจมากขึ้น ลูกค้าตอบรับดี', createdBy: 'u2', goalUpdates: [{ goalId: 'g1', previousValue: 145000, currentValue: 180000, note: 'เดือนนี้ดีขึ้นมาก' }, { goalId: 'g2', previousValue: 6, currentValue: 8, note: 'ลูกค้าใหม่จาก referral 2 ราย' }, { goalId: 'g3', previousValue: 4, currentValue: 6, note: 'เข้าอบรม Closing Technique' }] },
  ];

  for (const ci of checkinsData) {
    await db.insert(pipCheckins).values({
      pipId: pipMap[ci.pipId],
      weekNumber: ci.weekNumber,
      date: ci.date,
      managerNote: ci.managerNote,
      employeeNote: ci.employeeNote,
      goalUpdates: ci.goalUpdates,
      createdBy: userMap[ci.createdBy],
    });
  }
  console.log('✅ Check-ins created');

  // 8. Create Comments
  const commentsData = [
    { pipId: 'pip1', userId: 'u2', content: 'สมชาย ขอให้ focus ที่การ follow up ลูกค้าเก่าด้วยนะครับ ไม่ใช่แค่หาลูกค้าใหม่', createdAt: '2026-02-10T10:30:00' },
    { pipId: 'pip1', userId: 'u3', content: 'รับทราบครับ จะปรับแผนเพิ่มการ follow up ลูกค้าเดิมด้วย', createdAt: '2026-02-10T11:15:00' },
    { pipId: 'pip1', userId: 'u1', content: 'แนะนำให้จัด weekly coaching session เพิ่มเติมด้วยค่ะ', createdAt: '2026-02-12T09:00:00' },
  ];

  for (const c of commentsData) {
    await db.insert(pipComments).values({
      pipId: pipMap[c.pipId],
      userId: userMap[c.userId],
      content: c.content,
      createdAt: new Date(c.createdAt),
    });
  }
  console.log('✅ Comments created');

  // 9. Create default leave types
  await db.insert(leaveTypes).values([
    { name: 'ลาป่วย', description: 'วันลาป่วย', maxDaysPerYear: 30, isPaid: true, organizationId: org.id },
    { name: 'ลาพักร้อน', description: 'วันลาพักร้อนประจำปี', maxDaysPerYear: 10, isPaid: true, organizationId: org.id },
    { name: 'ลากิจ', description: 'วันลากิจส่วนตัว', maxDaysPerYear: 5, isPaid: true, organizationId: org.id },
    { name: 'ลาคลอด', description: 'วันลาคลอดบุตร', maxDaysPerYear: 90, isPaid: true, organizationId: org.id },
    { name: 'ลาบวช', description: 'วันลาบวช', maxDaysPerYear: 15, isPaid: true, organizationId: org.id },
    { name: 'ลาไม่รับเงินเดือน', description: 'วันลาไม่รับค่าจ้าง', maxDaysPerYear: 30, isPaid: false, organizationId: org.id },
  ]);
  console.log('✅ Leave types created');

  // 10. Create default KPI categories
  await db.insert(kpiCategories).values([
    { name: 'ผลงาน (Work Output)', description: 'คุณภาพและปริมาณของงานที่ส่งมอบ', defaultWeight: '40', organizationId: org.id },
    { name: 'ทักษะ (Skills)', description: 'ความสามารถและทักษะในการทำงาน', defaultWeight: '25', organizationId: org.id },
    { name: 'พฤติกรรม (Behavior)', description: 'พฤติกรรมการทำงานและการทำงานร่วมกับผู้อื่น', defaultWeight: '20', organizationId: org.id },
    { name: 'การมาทำงาน (Attendance)', description: 'ความตรงต่อเวลาและความสม่ำเสมอ', defaultWeight: '15', organizationId: org.id },
  ]);
  console.log('✅ KPI categories created');

  console.log('🎉 Seeding completed!');
  process.exit(0);
}

seed().catch((e) => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});
