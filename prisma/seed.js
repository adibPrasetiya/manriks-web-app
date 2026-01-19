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

  const roleKomitePusat = await prisma.role.upsert({
    where: { name: "KOMITE_PUSAT" },
    update: {},
    create: {
      name: "KOMITE_PUSAT",
      description: "Role untuk Komite Pusat yang dapat mengelola konteks manajemen risiko",
    },
  });
  console.log("✅ Roles berhasil di-seed\n");

  // Store admin user id for verification references
  let adminUserId = null;

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
  const verifiedAt = new Date();

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
        nomorHP: "081234567890",
        isVerified: true,
        verifiedAt: verifiedAt,
        // verifiedBy akan di-update setelah admin user dibuat
      },
    },
    {
      username: "komite.pusat",
      name: "Komite Pusat",
      email: "komite.pusat@company.com",
      password: hashedPassword,
      isActive: true,
      isVerified: true,
      roleId: roleKomitePusat.id,
      profile: {
        jabatan: "Ketua Komite Pusat",
        unitKerjaId: unitKerjaRecords[0].id, // IT & Teknologi
        nomorHP: "081234567899",
        isVerified: true,
        verifiedAt: verifiedAt,
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
        nomorHP: "081234567891",
        isVerified: true,
        verifiedAt: verifiedAt,
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
        nomorHP: "081234567892",
        isVerified: true,
        verifiedAt: verifiedAt,
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
        nomorHP: "081234567893",
        isVerified: true,
        verifiedAt: verifiedAt,
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
        nomorHP: null, // Optional - tidak diisi
        isVerified: true,
        verifiedAt: verifiedAt,
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
        nomorHP: null,
        isVerified: false, // Profile belum diverifikasi
      },
    },
    // Users dengan profile belum terverifikasi (untuk testing verification feature)
    {
      username: "diana.miller",
      name: "Diana Miller",
      email: "diana.miller@company.com",
      password: hashedPassword,
      isActive: true,
      isVerified: false,
      roleId: roleUser.id,
      profile: {
        jabatan: "Junior Developer",
        unitKerjaId: unitKerjaRecords[0].id, // IT & Teknologi
        nomorHP: "081234567894",
        isVerified: false, // Profile belum diverifikasi - akan buat PENDING request
      },
    },
    {
      username: "evan.thomas",
      name: "Evan Thomas",
      email: "evan.thomas@company.com",
      password: hashedPassword,
      isActive: true,
      isVerified: false,
      roleId: roleUser.id,
      profile: {
        jabatan: "Accountant",
        unitKerjaId: unitKerjaRecords[1].id, // Keuangan & Akuntansi
        nomorHP: "081234567895",
        isVerified: false, // Profile belum diverifikasi - akan buat PENDING request
      },
    },
    {
      username: "fiona.garcia",
      name: "Fiona Garcia",
      email: "fiona.garcia@company.com",
      password: hashedPassword,
      isActive: true,
      isVerified: false,
      roleId: roleUser.id,
      profile: {
        jabatan: "HR Staff",
        unitKerjaId: unitKerjaRecords[2].id, // SDM & Umum
        nomorHP: "081234567896",
        isVerified: false, // Profile belum diverifikasi - akan buat REJECTED request
      },
    },
    {
      username: "george.lee",
      name: "George Lee",
      email: "george.lee@company.com",
      password: hashedPassword,
      isActive: true,
      isVerified: true,
      roleId: roleUser.id,
      profile: {
        jabatan: "Senior Operator",
        unitKerjaId: unitKerjaRecords[3].id, // Operasional
        nomorHP: "081234567897",
        isVerified: true,
        verifiedAt: verifiedAt,
        // User yang sudah verified tapi request perubahan data (CHANGE request)
      },
    },
  ];

  const createdUsers = {};

  for (const userData of usersData) {
    const { roleId, profile, ...userCreateData } = userData;

    // Cek apakah user sudah ada
    const existingUser = await prisma.user.findUnique({
      where: { email: userCreateData.email },
      include: { profile: true },
    });

    if (existingUser) {
      console.log(`   ⚠ User ${userCreateData.email} sudah ada, skip...`);
      createdUsers[userCreateData.username] = existingUser;
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

    // Simpan user untuk referensi
    createdUsers[user.username] = user;

    // Simpan adminUserId untuk referensi verifiedBy
    if (user.username === "admin") {
      adminUserId = user.id;
    }

    console.log(
      `   ✓ ${user.name} (${user.email}) - ${user.userRoles[0].role.name} - ${user.profile.jabatan}`
    );
  }

  // Update verifiedBy untuk profiles yang sudah terverifikasi
  if (adminUserId) {
    await prisma.profile.updateMany({
      where: {
        isVerified: true,
        verifiedBy: null,
      },
      data: {
        verifiedBy: adminUserId,
      },
    });
  }

  console.log("✅ Users & Profiles berhasil di-seed\n");

  // 4. Seed Profile Change Requests
  console.log("📋 Seeding Profile Change Requests...");

  // Hapus existing requests untuk fresh seed
  await prisma.profileChangeRequest.deleteMany({});

  // Buat sample ProfileChangeRequest untuk testing
  const profileChangeRequestsData = [];

  // PENDING - Initial Verification Request (diana.miller)
  if (createdUsers["diana.miller"]?.profile) {
    profileChangeRequestsData.push({
      profileId: createdUsers["diana.miller"].profile.id,
      requestType: "INITIAL_VERIFICATION",
      jabatan: "Senior Developer", // Request jabatan baru
      unitKerjaId: unitKerjaRecords[0].id, // IT & Teknologi
      nomorHP: "081234567894",
      status: "PENDING",
      requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 hari lalu
    });
  }

  // PENDING - Initial Verification Request (evan.thomas)
  if (createdUsers["evan.thomas"]?.profile) {
    profileChangeRequestsData.push({
      profileId: createdUsers["evan.thomas"].profile.id,
      requestType: "INITIAL_VERIFICATION",
      jabatan: "Senior Accountant", // Request jabatan baru
      unitKerjaId: unitKerjaRecords[1].id, // Keuangan & Akuntansi
      nomorHP: "081234567895",
      status: "PENDING",
      requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 hari lalu
    });
  }

  // REJECTED - Initial Verification Request (fiona.garcia)
  if (createdUsers["fiona.garcia"]?.profile) {
    profileChangeRequestsData.push({
      profileId: createdUsers["fiona.garcia"].profile.id,
      requestType: "INITIAL_VERIFICATION",
      jabatan: "HR Manager", // Request jabatan yang tidak sesuai
      unitKerjaId: unitKerjaRecords[2].id, // SDM & Umum
      nomorHP: "081234567896",
      status: "REJECTED",
      rejectionReason: "Jabatan yang diajukan tidak sesuai dengan posisi entry level. Silakan ajukan jabatan yang sesuai dengan pengalaman kerja.",
      requestedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 hari lalu
      processedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 hari lalu
      processedBy: adminUserId,
    });
  }

  // PENDING - Change Request (george.lee - user yang sudah verified ingin ubah data)
  if (createdUsers["george.lee"]?.profile) {
    profileChangeRequestsData.push({
      profileId: createdUsers["george.lee"].profile.id,
      requestType: "CHANGE",
      jabatan: "Operations Manager", // Request promosi
      unitKerjaId: unitKerjaRecords[3].id, // Operasional (tetap sama)
      nomorHP: "081234567897",
      status: "PENDING",
      requestedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 jam lalu
    });
  }

  // APPROVED - Change Request historical (john.doe)
  if (createdUsers["john.doe"]?.profile) {
    profileChangeRequestsData.push({
      profileId: createdUsers["john.doe"].profile.id,
      requestType: "CHANGE",
      jabatan: "IT Manager", // Dari Staff menjadi Manager (sudah diapprove)
      unitKerjaId: unitKerjaRecords[0].id, // IT & Teknologi
      nomorHP: "081234567891",
      status: "APPROVED",
      requestedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 hari lalu
      processedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), // 28 hari lalu
      processedBy: adminUserId,
    });
  }

  // PENDING - Initial Verification Request (charlie.davis)
  if (createdUsers["charlie.davis"]?.profile) {
    profileChangeRequestsData.push({
      profileId: createdUsers["charlie.davis"].profile.id,
      requestType: "INITIAL_VERIFICATION",
      jabatan: "Marketing Manager", // Request jabatan baru
      unitKerjaId: unitKerjaRecords[4].id, // Pemasaran & Komunikasi
      nomorHP: "081234567800",
      status: "PENDING",
      requestedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 hari lalu
    });
  }

  for (const requestData of profileChangeRequestsData) {
    const request = await prisma.profileChangeRequest.create({
      data: requestData,
      include: {
        profile: {
          include: {
            user: true,
          },
        },
      },
    });
    console.log(
      `   ✓ ${request.requestType} request for ${request.profile.user.name} - Status: ${request.status}`
    );
  }

  console.log("✅ Profile Change Requests berhasil di-seed\n");

  // Summary
  console.log("📊 Summary:");
  const totalRoles = await prisma.role.count();
  const totalUnitKerja = await prisma.unitKerja.count();
  const totalUsers = await prisma.user.count();
  const totalProfiles = await prisma.profile.count();
  const totalVerifiedProfiles = await prisma.profile.count({ where: { isVerified: true } });
  const totalUnverifiedProfiles = await prisma.profile.count({ where: { isVerified: false } });
  const totalProfileRequests = await prisma.profileChangeRequest.count();
  const totalPendingRequests = await prisma.profileChangeRequest.count({ where: { status: "PENDING" } });
  const totalApprovedRequests = await prisma.profileChangeRequest.count({ where: { status: "APPROVED" } });
  const totalRejectedRequests = await prisma.profileChangeRequest.count({ where: { status: "REJECTED" } });

  console.log(`   • Total Roles: ${totalRoles}`);
  console.log(`   • Total Unit Kerja: ${totalUnitKerja}`);
  console.log(`   • Total Users: ${totalUsers}`);
  console.log(`   • Total Profiles: ${totalProfiles}`);
  console.log(`     - Verified: ${totalVerifiedProfiles}`);
  console.log(`     - Unverified: ${totalUnverifiedProfiles}`);
  console.log(`   • Total Profile Requests: ${totalProfileRequests}`);
  console.log(`     - Pending: ${totalPendingRequests}`);
  console.log(`     - Approved: ${totalApprovedRequests}`);
  console.log(`     - Rejected: ${totalRejectedRequests}`);

  console.log("\n✅ Seeding selesai!");
  console.log("\n📝 Credentials untuk testing:");
  console.log("   • Username: admin | Password: password123 (ADMINISTRATOR)");
  console.log("   • Username: komite.pusat | Password: password123 (KOMITE_PUSAT)");
  console.log("   • Username: john.doe | Password: password123 (USER - Verified)");
  console.log("   • Username: jane.smith | Password: password123 (USER - Verified)");
  console.log("   • Username: bob.wilson | Password: password123 (USER - Verified)");
  console.log("   • Username: alice.brown | Password: password123 (USER - Verified)");
  console.log("   • Username: charlie.davis | Password: password123 (USER - Unverified, has PENDING request)");
  console.log("   • Username: diana.miller | Password: password123 (USER - Unverified, has PENDING request)");
  console.log("   • Username: evan.thomas | Password: password123 (USER - Unverified, has PENDING request)");
  console.log("   • Username: fiona.garcia | Password: password123 (USER - Unverified, has REJECTED request)");
  console.log("   • Username: george.lee | Password: password123 (USER - Verified, has PENDING change request)");
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
