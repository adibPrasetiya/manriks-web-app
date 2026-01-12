import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seeding database...\n");

  // 1. Seed Roles
  console.log("📝 Seeding Roles...");
  const roleUser = await prisma.role.upsert({
    where: { name: "USER" },
    update: {},
    create: {
      name: "USER",
      description: "Role untuk pengguna biasa",
    },
  });

  const roleAdmin = await prisma.role.upsert({
    where: { name: "ADMINISTRATOR" },
    update: {},
    create: {
      name: "ADMINISTRATOR",
      description: "Role untuk administrator sistem",
    },
  });
  console.log("✅ Roles berhasil di-seed\n");

  // 2. Seed Unit Kerja
  console.log("🏢 Seeding Unit Kerja...");
  const unitKerjaData = [
    {
      name: "Divisi IT & Teknologi",
      code: "IT-001",
      email: "it@company.com",
    },
    {
      name: "Divisi Keuangan & Akuntansi",
      code: "FIN-001",
      email: "finance@company.com",
    },
    {
      name: "Divisi SDM & Umum",
      code: "HRD-001",
      email: "hrd@company.com",
    },
    {
      name: "Divisi Operasional",
      code: "OPS-001",
      email: "operations@company.com",
    },
    {
      name: "Divisi Pemasaran & Komunikasi",
      code: "MKT-001",
      email: "marketing@company.com",
    },
  ];

  const unitKerjaRecords = [];
  for (const data of unitKerjaData) {
    const unitKerja = await prisma.unitKerja.upsert({
      where: { code: data.code },
      update: {},
      create: data,
    });
    unitKerjaRecords.push(unitKerja);
    console.log(`   ✓ ${data.name} (${data.code})`);
  }
  console.log("✅ Unit Kerja berhasil di-seed\n");

  // 3. Seed Users dengan Profiles
  console.log("👤 Seeding Users & Profiles...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  const usersData = [
    {
      username: "admin",
      name: "Administrator Sistem",
      email: "admin@company.com",
      password: hashedPassword,
      isActive: true,
      isVerified: true,
      roleId: roleAdmin.id,
      profile: {
        jabatan: "System Administrator",
        unitKerjaId: unitKerjaRecords[0].id, // IT & Teknologi
        email: "admin.personal@gmail.com",
        nomorHP: "081234567890",
      },
    },
    {
      username: "john.doe",
      name: "John Doe",
      email: "john.doe@company.com",
      password: hashedPassword,
      isActive: true,
      isVerified: true,
      roleId: roleUser.id,
      profile: {
        jabatan: "IT Manager",
        unitKerjaId: unitKerjaRecords[0].id, // IT & Teknologi
        email: "john.doe.personal@gmail.com",
        nomorHP: "081234567891",
      },
    },
    {
      username: "jane.smith",
      name: "Jane Smith",
      email: "jane.smith@company.com",
      password: hashedPassword,
      isActive: true,
      isVerified: true,
      roleId: roleUser.id,
      profile: {
        jabatan: "Finance Manager",
        unitKerjaId: unitKerjaRecords[1].id, // Keuangan & Akuntansi
        email: "jane.smith.personal@gmail.com",
        nomorHP: "081234567892",
      },
    },
    {
      username: "bob.wilson",
      name: "Bob Wilson",
      email: "bob.wilson@company.com",
      password: hashedPassword,
      isActive: true,
      isVerified: true,
      roleId: roleUser.id,
      profile: {
        jabatan: "HR Manager",
        unitKerjaId: unitKerjaRecords[2].id, // SDM & Umum
        email: null, // Optional - tidak diisi
        nomorHP: "081234567893",
      },
    },
    {
      username: "alice.brown",
      name: "Alice Brown",
      email: "alice.brown@company.com",
      password: hashedPassword,
      isActive: true,
      isVerified: true,
      roleId: roleUser.id,
      profile: {
        jabatan: "Operations Supervisor",
        unitKerjaId: unitKerjaRecords[3].id, // Operasional
        email: "alice.personal@gmail.com",
        nomorHP: null, // Optional - tidak diisi
      },
    },
    {
      username: "charlie.davis",
      name: "Charlie Davis",
      email: "charlie.davis@company.com",
      password: hashedPassword,
      isActive: true,
      isVerified: false, // User yang belum verified
      roleId: roleUser.id,
      profile: {
        jabatan: "Marketing Executive",
        unitKerjaId: unitKerjaRecords[4].id, // Pemasaran & Komunikasi
        email: null,
        nomorHP: null,
      },
    },
  ];

  for (const userData of usersData) {
    const { roleId, profile, ...userCreateData } = userData;

    // Cek apakah user sudah ada
    const existingUser = await prisma.user.findUnique({
      where: { email: userCreateData.email },
    });

    if (existingUser) {
      console.log(`   ⚠ User ${userCreateData.email} sudah ada, skip...`);
      continue;
    }

    // Buat user dengan profile dan role
    const user = await prisma.user.create({
      data: {
        ...userCreateData,
        profile: {
          create: profile,
        },
        userRoles: {
          create: {
            roleId: roleId,
          },
        },
      },
      include: {
        profile: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    console.log(
      `   ✓ ${user.name} (${user.email}) - ${user.userRoles[0].role.name} - ${user.profile.jabatan}`
    );
  }

  console.log("✅ Users & Profiles berhasil di-seed\n");

  // Summary
  console.log("📊 Summary:");
  const totalRoles = await prisma.role.count();
  const totalUnitKerja = await prisma.unitKerja.count();
  const totalUsers = await prisma.user.count();
  const totalProfiles = await prisma.profile.count();

  console.log(`   • Total Roles: ${totalRoles}`);
  console.log(`   • Total Unit Kerja: ${totalUnitKerja}`);
  console.log(`   • Total Users: ${totalUsers}`);
  console.log(`   • Total Profiles: ${totalProfiles}`);

  console.log("\n✅ Seeding selesai!");
  console.log("\n📝 Credentials untuk testing:");
  console.log("   • Username: admin | Password: password123");
  console.log("   • Username: john.doe | Password: password123");
  console.log("   • Username: jane.smith | Password: password123");
  console.log("   • Username: bob.wilson | Password: password123");
  console.log("   • Username: alice.brown | Password: password123");
  console.log("   • Username: charlie.davis | Password: password123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error saat seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
