import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seeding database...\n");

  // Clear existing data (in correct order to avoid FK constraints)
  console.log("🗑️ Menghapus data lama...");
  await prisma.riskMitigation.deleteMany({});
  await prisma.riskAssessmentItem.deleteMany({});
  await prisma.riskAssessment.deleteMany({});
  await prisma.riskWorksheet.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.assetCategory.deleteMany({});
  await prisma.riskMatrix.deleteMany({});
  await prisma.likelihoodScale.deleteMany({});
  await prisma.impactScale.deleteMany({});
  await prisma.riskCategory.deleteMany({});
  await prisma.konteks.deleteMany({});
  await prisma.profileChangeRequest.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.unitKerja.deleteMany({});
  await prisma.role.deleteMany({});
  console.log("✅ Data lama berhasil dihapus\n");

  // 1. Seed Roles
  console.log("📝 Seeding Roles...");
  const roleUser = await prisma.role.create({
    data: { name: "USER", description: "Role untuk pengguna biasa" },
  });
  const roleAdmin = await prisma.role.create({
    data: { name: "ADMINISTRATOR", description: "Role untuk administrator sistem" },
  });
  const roleKomitePusat = await prisma.role.create({
    data: { name: "KOMITE_PUSAT", description: "Role untuk Komite Pusat yang dapat mengelola konteks manajemen risiko" },
  });
  const rolePengelolaRisikoUker = await prisma.role.create({
    data: { name: "PENGELOLA_RISIKO_UKER", description: "Role untuk Pengelola Risiko Unit Kerja" },
  });
  console.log("✅ Roles berhasil di-seed\n");

  // 2. Seed Unit Kerja (hanya 2)
  console.log("🏢 Seeding Unit Kerja...");
  const sekretariatJenderal = await prisma.unitKerja.create({
    data: {
      name: "Sekretariat Jenderal",
      code: "SETJEN",
      email: "setjen@kementerian.go.id",
    },
  });
  const direktoratPelayananPublik = await prisma.unitKerja.create({
    data: {
      name: "Direktorat Pelayanan Publik",
      code: "DIT-PP",
      email: "pelayananpublik@kementerian.go.id",
    },
  });
  console.log(`   ✓ ${sekretariatJenderal.name} (${sekretariatJenderal.code})`);
  console.log(`   ✓ ${direktoratPelayananPublik.name} (${direktoratPelayananPublik.code})`);
  console.log("✅ Unit Kerja berhasil di-seed\n");

  // 3. Seed Users
  console.log("👤 Seeding Users...");
  const hashedPassword = await bcrypt.hash("password123", 10);
  const verifiedAt = new Date();

  // Admin di Sekretariat Jenderal (active, verified, has profile)
  const adminUser = await prisma.user.create({
    data: {
      username: "admin",
      name: "Administrator Sistem",
      email: "admin@kementerian.go.id",
      password: hashedPassword,
      isActive: true,
      isVerified: true,
      userRoles: { create: { roleId: roleAdmin.id } },
      profile: {
        create: {
          jabatan: "Kepala Bagian TIK",
          unitKerjaId: sekretariatJenderal.id,
          nomorHP: "081234567890",
          isVerified: true,
          verifiedAt: verifiedAt,
        },
      },
    },
    include: { profile: true },
  });
  console.log(`   ✓ ${adminUser.name} (ADMINISTRATOR) - Sekretariat Jenderal`);

  // Komite Pusat di Sekretariat Jenderal (active, verified, has profile)
  const komitePusatSetjen = await prisma.user.create({
    data: {
      username: "komite.setjen",
      name: "Komite Pusat Setjen",
      email: "komite.setjen@kementerian.go.id",
      password: hashedPassword,
      isActive: true,
      isVerified: true,
      userRoles: { create: { roleId: roleKomitePusat.id } },
      profile: {
        create: {
          jabatan: "Ketua Tim Manajemen Risiko",
          unitKerjaId: sekretariatJenderal.id,
          nomorHP: "081234567891",
          isVerified: true,
          verifiedAt: verifiedAt,
        },
      },
    },
    include: { profile: true },
  });
  console.log(`   ✓ ${komitePusatSetjen.name} (KOMITE_PUSAT) - Sekretariat Jenderal`);

  // Komite Pusat di Direktorat Pelayanan Publik (active, verified, has profile)
  const komitePusatDitPP = await prisma.user.create({
    data: {
      username: "komite.ditpp",
      name: "Komite Pusat Dit PP",
      email: "komite.ditpp@kementerian.go.id",
      password: hashedPassword,
      isActive: true,
      isVerified: true,
      userRoles: { create: { roleId: roleKomitePusat.id } },
      profile: {
        create: {
          jabatan: "Koordinator Risiko",
          unitKerjaId: direktoratPelayananPublik.id,
          nomorHP: "081234567892",
          isVerified: true,
          verifiedAt: verifiedAt,
        },
      },
    },
    include: { profile: true },
  });
  console.log(`   ✓ ${komitePusatDitPP.name} (KOMITE_PUSAT) - Direktorat Pelayanan Publik`);

  // Pengelola Risiko UKer di Direktorat Pelayanan Publik (active, verified, has profile)
  const pengelolaRisikoDitPP = await prisma.user.create({
    data: {
      username: "pengelola.ditpp",
      name: "Pengelola Risiko Dit PP",
      email: "pengelola.ditpp@kementerian.go.id",
      password: hashedPassword,
      isActive: true,
      isVerified: true,
      userRoles: { create: { roleId: rolePengelolaRisikoUker.id } },
      profile: {
        create: {
          jabatan: "Analis Risiko",
          unitKerjaId: direktoratPelayananPublik.id,
          nomorHP: "081234567893",
          isVerified: true,
          verifiedAt: verifiedAt,
        },
      },
    },
    include: { profile: true },
  });
  console.log(`   ✓ ${pengelolaRisikoDitPP.name} (PENGELOLA_RISIKO_UKER) - Direktorat Pelayanan Publik`);

  // Pengelola Risiko kedua di Direktorat Pelayanan Publik (untuk testing shared access)
  const pengelolaRisikoDitPP2 = await prisma.user.create({
    data: {
      username: "pengelola2.ditpp",
      name: "Pengelola Risiko 2 Dit PP",
      email: "pengelola2.ditpp@kementerian.go.id",
      password: hashedPassword,
      isActive: true,
      isVerified: true,
      userRoles: { create: { roleId: rolePengelolaRisikoUker.id } },
      profile: {
        create: {
          jabatan: "Staf Analis Risiko",
          unitKerjaId: direktoratPelayananPublik.id,
          nomorHP: "081234567894",
          isVerified: true,
          verifiedAt: verifiedAt,
        },
      },
    },
    include: { profile: true },
  });
  console.log(`   ✓ ${pengelolaRisikoDitPP2.name} (PENGELOLA_RISIKO_UKER) - Direktorat Pelayanan Publik`);

  // User INACTIVE (tidak bisa login)
  const inactiveUser = await prisma.user.create({
    data: {
      username: "user.inactive",
      name: "User Tidak Aktif",
      email: "inactive@kementerian.go.id",
      password: hashedPassword,
      isActive: false,
      isVerified: true,
      userRoles: { create: { roleId: roleUser.id } },
      profile: {
        create: {
          jabatan: "Staf",
          unitKerjaId: sekretariatJenderal.id,
          nomorHP: "081234567895",
          isVerified: true,
          verifiedAt: verifiedAt,
        },
      },
    },
    include: { profile: true },
  });
  console.log(`   ✓ ${inactiveUser.name} (USER - INACTIVE)`);

  // User tanpa profile (belum buat profile)
  const userNoProfile = await prisma.user.create({
    data: {
      username: "user.noprofile",
      name: "User Tanpa Profile",
      email: "noprofile@kementerian.go.id",
      password: hashedPassword,
      isActive: true,
      isVerified: true,
      userRoles: { create: { roleId: roleUser.id } },
    },
  });
  console.log(`   ✓ ${userNoProfile.name} (USER - NO PROFILE)`);

  // User dengan profile belum diverifikasi
  const userUnverifiedProfile = await prisma.user.create({
    data: {
      username: "user.unverified",
      name: "User Profile Belum Verified",
      email: "unverified@kementerian.go.id",
      password: hashedPassword,
      isActive: true,
      isVerified: false,
      userRoles: { create: { roleId: roleUser.id } },
      profile: {
        create: {
          jabatan: "Staf Baru",
          unitKerjaId: direktoratPelayananPublik.id,
          nomorHP: "081234567896",
          isVerified: false,
        },
      },
    },
    include: { profile: true },
  });
  console.log(`   ✓ ${userUnverifiedProfile.name} (USER - UNVERIFIED PROFILE)`);

  // Update verifiedBy
  await prisma.profile.updateMany({
    where: { isVerified: true, verifiedBy: null },
    data: { verifiedBy: adminUser.id },
  });
  console.log("✅ Users berhasil di-seed\n");

  // 4. Seed Konteks (5x5 active, 3x3 inactive, 4x4 archived)
  console.log("📋 Seeding Konteks...");

  // Konteks 5x5 (ACTIVE)
  const konteks5x5 = await prisma.konteks.create({
    data: {
      name: "Konteks Manajemen Risiko 2024-2025",
      code: "KMR-2024-5X5",
      description: "Konteks manajemen risiko dengan matriks 5x5 untuk periode 2024-2025",
      periodStart: 2024,
      periodEnd: 2025,
      matrixSize: 5,
      riskAppetiteLevel: "MEDIUM",
      riskAppetiteDescription: "Organisasi bersedia menerima risiko dengan dampak medium untuk mencapai tujuan strategis",
      status: "ACTIVE",
      createdBy: komitePusatSetjen.id,
      updatedBy: komitePusatSetjen.id,
    },
  });
  console.log(`   ✓ ${konteks5x5.name} (5x5, ACTIVE)`);

  // Risk Categories untuk 5x5
  const riskCategories5x5 = [
    { name: "Risiko Strategis", description: "Risiko yang mempengaruhi pencapaian tujuan strategis", order: 1 },
    { name: "Risiko Operasional", description: "Risiko yang timbul dari proses operasional", order: 2 },
    { name: "Risiko Keuangan", description: "Risiko yang berkaitan dengan pengelolaan keuangan", order: 3 },
    { name: "Risiko Kepatuhan", description: "Risiko terkait kepatuhan terhadap regulasi", order: 4 },
  ];

  for (const cat of riskCategories5x5) {
    const category = await prisma.riskCategory.create({
      data: { ...cat, konteksId: konteks5x5.id },
    });

    // Likelihood Scales (1-5)
    const likelihoodLabels = [
      { level: 1, label: "Sangat Jarang", description: "Kemungkinan terjadi < 5%" },
      { level: 2, label: "Jarang", description: "Kemungkinan terjadi 5% - 25%" },
      { level: 3, label: "Kadang-kadang", description: "Kemungkinan terjadi 25% - 50%" },
      { level: 4, label: "Sering", description: "Kemungkinan terjadi 50% - 75%" },
      { level: 5, label: "Sangat Sering", description: "Kemungkinan terjadi > 75%" },
    ];
    for (const ls of likelihoodLabels) {
      await prisma.likelihoodScale.create({
        data: { ...ls, riskCategoryId: category.id },
      });
    }

    // Impact Scales (1-5)
    const impactLabels = [
      { level: 1, label: "Tidak Signifikan", description: "Dampak sangat kecil, dapat diabaikan" },
      { level: 2, label: "Minor", description: "Dampak kecil, tidak mengganggu operasional" },
      { level: 3, label: "Moderat", description: "Dampak sedang, mengganggu sebagian operasional" },
      { level: 4, label: "Signifikan", description: "Dampak besar, mengganggu operasional secara serius" },
      { level: 5, label: "Katastropik", description: "Dampak sangat besar, mengancam keberlangsungan" },
    ];
    for (const is of impactLabels) {
      await prisma.impactScale.create({
        data: { ...is, riskCategoryId: category.id },
      });
    }
  }

  // Risk Matrix 5x5
  const riskLevels5x5 = {
    "1-1": "LOW", "1-2": "LOW", "1-3": "LOW", "1-4": "MEDIUM", "1-5": "MEDIUM",
    "2-1": "LOW", "2-2": "LOW", "2-3": "MEDIUM", "2-4": "MEDIUM", "2-5": "HIGH",
    "3-1": "LOW", "3-2": "MEDIUM", "3-3": "MEDIUM", "3-4": "HIGH", "3-5": "HIGH",
    "4-1": "MEDIUM", "4-2": "MEDIUM", "4-3": "HIGH", "4-4": "HIGH", "4-5": "CRITICAL",
    "5-1": "MEDIUM", "5-2": "HIGH", "5-3": "HIGH", "5-4": "CRITICAL", "5-5": "CRITICAL",
  };
  for (let l = 1; l <= 5; l++) {
    for (let i = 1; i <= 5; i++) {
      await prisma.riskMatrix.create({
        data: {
          konteksId: konteks5x5.id,
          likelihoodLevel: l,
          impactLevel: i,
          riskLevel: riskLevels5x5[`${l}-${i}`],
        },
      });
    }
  }
  console.log(`   ✓ Risk Categories, Scales, dan Matrix untuk ${konteks5x5.name} berhasil dibuat`);

  // Konteks 3x3 (INACTIVE)
  const konteks3x3 = await prisma.konteks.create({
    data: {
      name: "Konteks Manajemen Risiko 2026",
      code: "KMR-2026-3X3",
      description: "Konteks manajemen risiko dengan matriks 3x3 untuk periode 2026 (draft)",
      periodStart: 2026,
      periodEnd: 2026,
      matrixSize: 3,
      riskAppetiteLevel: "LOW",
      riskAppetiteDescription: "Organisasi memiliki toleransi risiko rendah",
      status: "INACTIVE",
      createdBy: komitePusatSetjen.id,
      updatedBy: komitePusatSetjen.id,
    },
  });
  console.log(`   ✓ ${konteks3x3.name} (3x3, INACTIVE)`);

  // Risk Categories untuk 3x3
  const riskCategories3x3 = [
    { name: "Risiko Operasional", description: "Risiko operasional sederhana", order: 1 },
    { name: "Risiko SDM", description: "Risiko sumber daya manusia", order: 2 },
  ];

  for (const cat of riskCategories3x3) {
    const category = await prisma.riskCategory.create({
      data: { ...cat, konteksId: konteks3x3.id },
    });

    // Likelihood Scales (1-3)
    const likelihoodLabels = [
      { level: 1, label: "Rendah", description: "Kemungkinan kecil" },
      { level: 2, label: "Sedang", description: "Kemungkinan sedang" },
      { level: 3, label: "Tinggi", description: "Kemungkinan tinggi" },
    ];
    for (const ls of likelihoodLabels) {
      await prisma.likelihoodScale.create({
        data: { ...ls, riskCategoryId: category.id },
      });
    }

    // Impact Scales (1-3)
    const impactLabels = [
      { level: 1, label: "Rendah", description: "Dampak kecil" },
      { level: 2, label: "Sedang", description: "Dampak sedang" },
      { level: 3, label: "Tinggi", description: "Dampak besar" },
    ];
    for (const is of impactLabels) {
      await prisma.impactScale.create({
        data: { ...is, riskCategoryId: category.id },
      });
    }
  }

  // Risk Matrix 3x3
  const riskLevels3x3 = {
    "1-1": "LOW", "1-2": "LOW", "1-3": "MEDIUM",
    "2-1": "LOW", "2-2": "MEDIUM", "2-3": "HIGH",
    "3-1": "MEDIUM", "3-2": "HIGH", "3-3": "CRITICAL",
  };
  for (let l = 1; l <= 3; l++) {
    for (let i = 1; i <= 3; i++) {
      await prisma.riskMatrix.create({
        data: {
          konteksId: konteks3x3.id,
          likelihoodLevel: l,
          impactLevel: i,
          riskLevel: riskLevels3x3[`${l}-${i}`],
        },
      });
    }
  }
  console.log(`   ✓ Risk Categories, Scales, dan Matrix untuk ${konteks3x3.name} berhasil dibuat`);

  // Konteks 4x4 (ARCHIVED) - Konteks lama yang sudah diarsipkan
  const konteks4x4Archived = await prisma.konteks.create({
    data: {
      name: "Konteks Manajemen Risiko 2022-2023",
      code: "KMR-2022-4X4",
      description: "Konteks manajemen risiko dengan matriks 4x4 untuk periode 2022-2023 (sudah diarsipkan)",
      periodStart: 2022,
      periodEnd: 2023,
      matrixSize: 4,
      riskAppetiteLevel: "MEDIUM",
      riskAppetiteDescription: "Konteks yang sudah tidak digunakan lagi",
      status: "ARCHIVED",
      createdBy: komitePusatSetjen.id,
      updatedBy: komitePusatSetjen.id,
    },
  });
  console.log(`   ✓ ${konteks4x4Archived.name} (4x4, ARCHIVED)`);

  // Risk Categories untuk 4x4 ARCHIVED
  const riskCategories4x4 = [
    { name: "Risiko Strategis Lama", description: "Risiko strategis konteks lama", order: 1 },
    { name: "Risiko Operasional Lama", description: "Risiko operasional konteks lama", order: 2 },
  ];

  for (const cat of riskCategories4x4) {
    const category = await prisma.riskCategory.create({
      data: { ...cat, konteksId: konteks4x4Archived.id },
    });

    // Likelihood Scales (1-4)
    const likelihoodLabels = [
      { level: 1, label: "Sangat Rendah", description: "Kemungkinan sangat kecil" },
      { level: 2, label: "Rendah", description: "Kemungkinan kecil" },
      { level: 3, label: "Sedang", description: "Kemungkinan sedang" },
      { level: 4, label: "Tinggi", description: "Kemungkinan tinggi" },
    ];
    for (const ls of likelihoodLabels) {
      await prisma.likelihoodScale.create({
        data: { ...ls, riskCategoryId: category.id },
      });
    }

    // Impact Scales (1-4)
    const impactLabels = [
      { level: 1, label: "Sangat Rendah", description: "Dampak sangat kecil" },
      { level: 2, label: "Rendah", description: "Dampak kecil" },
      { level: 3, label: "Sedang", description: "Dampak sedang" },
      { level: 4, label: "Tinggi", description: "Dampak besar" },
    ];
    for (const is of impactLabels) {
      await prisma.impactScale.create({
        data: { ...is, riskCategoryId: category.id },
      });
    }
  }

  // Risk Matrix 4x4
  const riskLevels4x4 = {
    "1-1": "LOW", "1-2": "LOW", "1-3": "MEDIUM", "1-4": "MEDIUM",
    "2-1": "LOW", "2-2": "MEDIUM", "2-3": "MEDIUM", "2-4": "HIGH",
    "3-1": "MEDIUM", "3-2": "MEDIUM", "3-3": "HIGH", "3-4": "HIGH",
    "4-1": "MEDIUM", "4-2": "HIGH", "4-3": "HIGH", "4-4": "CRITICAL",
  };
  for (let l = 1; l <= 4; l++) {
    for (let i = 1; i <= 4; i++) {
      await prisma.riskMatrix.create({
        data: {
          konteksId: konteks4x4Archived.id,
          likelihoodLevel: l,
          impactLevel: i,
          riskLevel: riskLevels4x4[`${l}-${i}`],
        },
      });
    }
  }
  console.log(`   ✓ Risk Categories, Scales, dan Matrix untuk ${konteks4x4Archived.name} berhasil dibuat`);

  console.log("✅ Konteks berhasil di-seed\n");

  // 5. Seed Asset Categories
  console.log("📦 Seeding Asset Categories...");
  const assetCategoriesData = [
    { name: "Perangkat Keras", description: "Komputer, server, peralatan jaringan" },
    { name: "Perangkat Lunak", description: "Aplikasi, sistem operasi, lisensi" },
    { name: "Infrastruktur", description: "Gedung, ruangan, fasilitas" },
    { name: "Data & Informasi", description: "Database, dokumen, arsip" },
    { name: "Sumber Daya Manusia", description: "Pengetahuan, keterampilan pegawai" },
    { name: "Kendaraan Dinas", description: "Mobil, motor, kendaraan operasional" },
    { name: "Peralatan Kantor", description: "Meja, kursi, alat tulis kantor" },
  ];

  const assetCategories = [];
  for (const cat of assetCategoriesData) {
    const category = await prisma.assetCategory.create({ data: cat });
    assetCategories.push(category);
    console.log(`   ✓ ${category.name}`);
  }
  console.log("✅ Asset Categories berhasil di-seed\n");

  // 6. Seed Assets (lengkap untuk kedua unit kerja)
  console.log("💼 Seeding Assets...");
  const assetsData = [
    // Sekretariat Jenderal
    { name: "Server Utama Data Center", code: "SRV-SETJEN-001", description: "Server utama data center Setjen", owner: "Bagian TIK", categoryIdx: 0, unitKerja: sekretariatJenderal, status: "ACTIVE" },
    { name: "Server Backup", code: "SRV-SETJEN-002", description: "Server backup data", owner: "Bagian TIK", categoryIdx: 0, unitKerja: sekretariatJenderal, status: "ACTIVE" },
    { name: "Aplikasi SIMPEG", code: "APP-SETJEN-001", description: "Sistem Informasi Kepegawaian", owner: "Bagian SDM", categoryIdx: 1, unitKerja: sekretariatJenderal, status: "ACTIVE" },
    { name: "Aplikasi E-Office", code: "APP-SETJEN-002", description: "Aplikasi persuratan elektronik", owner: "Bagian TIK", categoryIdx: 1, unitKerja: sekretariatJenderal, status: "ACTIVE" },
    { name: "Gedung Kantor Pusat", code: "GDG-SETJEN-001", description: "Gedung utama kantor Setjen", owner: "Bagian Umum", categoryIdx: 2, unitKerja: sekretariatJenderal, status: "ACTIVE" },
    { name: "Database Pegawai", code: "DATA-SETJEN-001", description: "Database informasi pegawai", owner: "Bagian SDM", categoryIdx: 3, unitKerja: sekretariatJenderal, status: "ACTIVE" },
    { name: "Arsip Digital", code: "DATA-SETJEN-002", description: "Sistem arsip digital", owner: "Bagian Kearsipan", categoryIdx: 3, unitKerja: sekretariatJenderal, status: "ACTIVE" },
    { name: "Tim IT Support", code: "SDM-SETJEN-001", description: "Tim pendukung TIK", owner: "Bagian TIK", categoryIdx: 4, unitKerja: sekretariatJenderal, status: "ACTIVE" },
    { name: "Mobil Dinas Sekjen", code: "KND-SETJEN-001", description: "Kendaraan dinas Sekretaris Jenderal", owner: "Bagian Umum", categoryIdx: 5, unitKerja: sekretariatJenderal, status: "ACTIVE" },
    { name: "Printer Kantor Lantai 1", code: "PRK-SETJEN-001", description: "Printer multifungsi lantai 1", owner: "Bagian Umum", categoryIdx: 6, unitKerja: sekretariatJenderal, status: "INACTIVE" },

    // Direktorat Pelayanan Publik
    { name: "Server Layanan Publik", code: "SRV-DITPP-001", description: "Server untuk layanan publik online", owner: "Seksi TIK", categoryIdx: 0, unitKerja: direktoratPelayananPublik, status: "ACTIVE" },
    { name: "Aplikasi Layanan Online", code: "APP-DITPP-001", description: "Aplikasi layanan publik online", owner: "Seksi TIK", categoryIdx: 1, unitKerja: direktoratPelayananPublik, status: "ACTIVE" },
    { name: "Aplikasi Antrian", code: "APP-DITPP-002", description: "Sistem antrian layanan", owner: "Seksi TIK", categoryIdx: 1, unitKerja: direktoratPelayananPublik, status: "ACTIVE" },
    { name: "Portal Pengaduan", code: "APP-DITPP-003", description: "Portal pengaduan masyarakat", owner: "Seksi Pengaduan", categoryIdx: 1, unitKerja: direktoratPelayananPublik, status: "ACTIVE" },
    { name: "Gedung Pelayanan Terpadu", code: "GDG-DITPP-001", description: "Gedung MPP Direktorat", owner: "Subbag Umum", categoryIdx: 2, unitKerja: direktoratPelayananPublik, status: "ACTIVE" },
    { name: "Loket Pelayanan", code: "GDG-DITPP-002", description: "Area loket pelayanan", owner: "Subbag Umum", categoryIdx: 2, unitKerja: direktoratPelayananPublik, status: "ACTIVE" },
    { name: "Database Layanan", code: "DATA-DITPP-001", description: "Database transaksi layanan", owner: "Seksi TIK", categoryIdx: 3, unitKerja: direktoratPelayananPublik, status: "ACTIVE" },
    { name: "Data Pengaduan", code: "DATA-DITPP-002", description: "Data pengaduan masyarakat", owner: "Seksi Pengaduan", categoryIdx: 3, unitKerja: direktoratPelayananPublik, status: "ACTIVE" },
    { name: "Tim Customer Service", code: "SDM-DITPP-001", description: "Tim pelayanan pelanggan", owner: "Seksi Layanan", categoryIdx: 4, unitKerja: direktoratPelayananPublik, status: "ACTIVE" },
    { name: "Mobil Operasional", code: "KND-DITPP-001", description: "Kendaraan operasional", owner: "Subbag Umum", categoryIdx: 5, unitKerja: direktoratPelayananPublik, status: "ACTIVE" },
    { name: "Komputer Loket 1-5", code: "PRK-DITPP-001", description: "Komputer untuk loket pelayanan", owner: "Seksi TIK", categoryIdx: 6, unitKerja: direktoratPelayananPublik, status: "ACTIVE" },
    { name: "Mesin Antrian Lama", code: "PRK-DITPP-002", description: "Mesin antrian (tidak digunakan)", owner: "Subbag Umum", categoryIdx: 6, unitKerja: direktoratPelayananPublik, status: "ARCHIVED" },
  ];

  for (const asset of assetsData) {
    await prisma.asset.create({
      data: {
        name: asset.name,
        code: asset.code,
        description: asset.description,
        owner: asset.owner,
        categoryId: assetCategories[asset.categoryIdx].id,
        unitKerjaId: asset.unitKerja.id,
        status: asset.status,
        createdBy: adminUser.id,
      },
    });
    console.log(`   ✓ ${asset.name} (${asset.code}) - ${asset.unitKerja.code}`);
  }
  console.log("✅ Assets berhasil di-seed\n");

  // 7. Seed Risk Worksheets
  console.log("📑 Seeding Risk Worksheets...");

  // Worksheet ACTIVE - Direktorat Pelayanan Publik
  const worksheetActive = await prisma.riskWorksheet.create({
    data: {
      name: "Kertas Kerja Risiko Q1 2024",
      description: "Kertas kerja untuk identifikasi risiko kuartal 1 tahun 2024",
      status: "ACTIVE",
      unitKerjaId: direktoratPelayananPublik.id,
      konteksId: konteks5x5.id,
      ownerId: pengelolaRisikoDitPP.id,
    },
  });
  console.log(`   ✓ ${worksheetActive.name} (ACTIVE) - Dit PP`);

  // Worksheet INACTIVE - Direktorat Pelayanan Publik
  const worksheetInactive = await prisma.riskWorksheet.create({
    data: {
      name: "Kertas Kerja Risiko Draft",
      description: "Draft kertas kerja yang belum difinalisasi",
      status: "INACTIVE",
      unitKerjaId: direktoratPelayananPublik.id,
      konteksId: konteks5x5.id,
      ownerId: pengelolaRisikoDitPP.id,
    },
  });
  console.log(`   ✓ ${worksheetInactive.name} (INACTIVE) - Dit PP`);

  // Worksheet ARCHIVED - Direktorat Pelayanan Publik
  const worksheetArchived = await prisma.riskWorksheet.create({
    data: {
      name: "Kertas Kerja Risiko 2023",
      description: "Kertas kerja risiko tahun 2023 yang sudah diarsipkan",
      status: "ARCHIVED",
      unitKerjaId: direktoratPelayananPublik.id,
      konteksId: konteks5x5.id,
      ownerId: pengelolaRisikoDitPP.id,
    },
  });
  console.log(`   ✓ ${worksheetArchived.name} (ARCHIVED) - Dit PP`);

  // Worksheet milik pengelola risiko kedua (untuk testing ownership)
  const worksheetOtherOwner = await prisma.riskWorksheet.create({
    data: {
      name: "Kertas Kerja Risiko Layanan Online",
      description: "Kertas kerja khusus untuk risiko layanan online",
      status: "INACTIVE",
      unitKerjaId: direktoratPelayananPublik.id,
      konteksId: konteks5x5.id,
      ownerId: pengelolaRisikoDitPP2.id,
    },
  });
  console.log(`   ✓ ${worksheetOtherOwner.name} (INACTIVE, owner: ${pengelolaRisikoDitPP2.name}) - Dit PP`);

  console.log("✅ Risk Worksheets berhasil di-seed\n");

  // 8. Seed Risk Assessments
  console.log("📋 Seeding Risk Assessments...");

  // Get risk categories for konteks 5x5
  const riskCategoriesForAssessment = await prisma.riskCategory.findMany({
    where: { konteksId: konteks5x5.id },
    orderBy: { order: "asc" },
  });

  // Get some assets for Dit PP
  const assetsDitPP = await prisma.asset.findMany({
    where: { unitKerjaId: direktoratPelayananPublik.id, status: "ACTIVE" },
    take: 5,
  });

  // Assessment DRAFT - belum submit
  const assessmentDraft = await prisma.riskAssessment.create({
    data: {
      worksheetId: worksheetActive.id,
      code: "RA-DIT-PP-001",
      name: "Assessment Risiko Layanan Q1 2024",
      description: "Assessment risiko untuk layanan publik kuartal 1 tahun 2024",
      status: "DRAFT",
      createdBy: pengelolaRisikoDitPP.id,
    },
  });
  console.log(`   ✓ ${assessmentDraft.name} (DRAFT)`);

  // Add items to DRAFT assessment
  const draftItems = [
    {
      riskCode: "R001",
      riskName: "Gangguan Server Layanan Online",
      riskDescription: "Risiko terjadinya downtime pada server layanan online yang mengganggu pelayanan publik",
      assetId: assetsDitPP[0]?.id || null,
      riskCategoryId: riskCategoriesForAssessment[1].id, // Risiko Operasional
      inherentLikelihood: 3,
      inherentImpact: 4,
      inherentRiskLevel: "HIGH",
      existingControls: "Monitoring server 24/7, backup server tersedia",
      controlEffectiveness: "PARTIALLY_EFFECTIVE",
      residualLikelihood: 2,
      residualImpact: 3,
      residualRiskLevel: "MEDIUM",
      treatmentOption: "MITIGATE",
      treatmentRationale: "Perlu meningkatkan kapasitas server dan failover mechanism",
      order: 1,
    },
    {
      riskCode: "R002",
      riskName: "Kebocoran Data Pengaduan Masyarakat",
      riskDescription: "Risiko terjadinya kebocoran data sensitif pengaduan masyarakat",
      assetId: assetsDitPP[1]?.id || null,
      riskCategoryId: riskCategoriesForAssessment[3].id, // Risiko Kepatuhan
      inherentLikelihood: 2,
      inherentImpact: 5,
      inherentRiskLevel: "HIGH",
      existingControls: "Enkripsi database, access control",
      controlEffectiveness: "EFFECTIVE",
      residualLikelihood: 1,
      residualImpact: 4,
      residualRiskLevel: "MEDIUM",
      treatmentOption: "ACCEPT",
      treatmentRationale: "Kontrol yang ada sudah memadai, risiko residual dapat diterima",
      order: 2,
    },
  ];

  for (const item of draftItems) {
    await prisma.riskAssessmentItem.create({
      data: { ...item, assessmentId: assessmentDraft.id },
    });
  }
  console.log(`   ✓ Added ${draftItems.length} items to DRAFT assessment`);

  // Assessment SUBMITTED - sudah diajukan, menunggu review
  const assessmentSubmitted = await prisma.riskAssessment.create({
    data: {
      worksheetId: worksheetActive.id,
      code: "RA-DIT-PP-002",
      name: "Assessment Risiko Infrastruktur 2024",
      description: "Assessment risiko infrastruktur teknologi informasi",
      status: "SUBMITTED",
      createdBy: pengelolaRisikoDitPP.id,
      submittedAt: new Date(),
      submittedBy: pengelolaRisikoDitPP.id,
    },
  });
  console.log(`   ✓ ${assessmentSubmitted.name} (SUBMITTED)`);

  // Add items to SUBMITTED assessment
  const submittedItems = [
    {
      riskCode: "R001",
      riskName: "Kegagalan Sistem Antrian",
      riskDescription: "Risiko kegagalan sistem antrian yang menyebabkan penumpukan antrian fisik",
      riskCategoryId: riskCategoriesForAssessment[1].id,
      inherentLikelihood: 4,
      inherentImpact: 3,
      inherentRiskLevel: "HIGH",
      existingControls: "Maintenance rutin bulanan",
      controlEffectiveness: "PARTIALLY_EFFECTIVE",
      residualLikelihood: 3,
      residualImpact: 2,
      residualRiskLevel: "MEDIUM",
      treatmentOption: "MITIGATE",
      treatmentRationale: "Perlu sistem backup antrian manual",
      order: 1,
    },
    {
      riskCode: "R002",
      riskName: "Keterlambatan Update Aplikasi",
      riskDescription: "Risiko keterlambatan update aplikasi yang menyebabkan vulnerability",
      riskCategoryId: riskCategoriesForAssessment[1].id,
      inherentLikelihood: 3,
      inherentImpact: 3,
      inherentRiskLevel: "MEDIUM",
      existingControls: "Jadwal update triwulanan",
      controlEffectiveness: "EFFECTIVE",
      residualLikelihood: 2,
      residualImpact: 2,
      residualRiskLevel: "LOW",
      treatmentOption: "ACCEPT",
      treatmentRationale: "Risiko dapat diterima dengan kontrol yang ada",
      order: 2,
    },
    {
      riskCode: "R003",
      riskName: "Kerusakan Perangkat Loket",
      riskDescription: "Risiko kerusakan komputer atau printer di loket pelayanan",
      riskCategoryId: riskCategoriesForAssessment[1].id,
      inherentLikelihood: 4,
      inherentImpact: 2,
      inherentRiskLevel: "MEDIUM",
      existingControls: "Spare unit tersedia",
      controlEffectiveness: "EFFECTIVE",
      residualLikelihood: 2,
      residualImpact: 1,
      residualRiskLevel: "LOW",
      treatmentOption: "ACCEPT",
      treatmentRationale: "Kontrol memadai",
      order: 3,
    },
  ];

  for (const item of submittedItems) {
    await prisma.riskAssessmentItem.create({
      data: { ...item, assessmentId: assessmentSubmitted.id },
    });
  }
  console.log(`   ✓ Added ${submittedItems.length} items to SUBMITTED assessment`);

  // Assessment APPROVED - sudah disetujui
  const assessmentApproved = await prisma.riskAssessment.create({
    data: {
      worksheetId: worksheetActive.id,
      code: "RA-DIT-PP-003",
      name: "Assessment Risiko SDM Pelayanan 2024",
      description: "Assessment risiko sumber daya manusia di unit pelayanan",
      status: "APPROVED",
      createdBy: pengelolaRisikoDitPP.id,
      submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      submittedBy: pengelolaRisikoDitPP.id,
      reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      reviewedBy: komitePusatDitPP.id,
      reviewNotes: "Assessment sudah lengkap dan sesuai dengan standar manajemen risiko",
    },
  });
  console.log(`   ✓ ${assessmentApproved.name} (APPROVED)`);

  // Add items to APPROVED assessment
  const approvedItems = [
    {
      riskCode: "R001",
      riskName: "Kekurangan Tenaga Customer Service",
      riskDescription: "Risiko kekurangan tenaga CS saat peak hour",
      riskCategoryId: riskCategoriesForAssessment[1].id,
      inherentLikelihood: 4,
      inherentImpact: 3,
      inherentRiskLevel: "HIGH",
      existingControls: "Sistem shift, backup dari unit lain",
      controlEffectiveness: "PARTIALLY_EFFECTIVE",
      residualLikelihood: 3,
      residualImpact: 2,
      residualRiskLevel: "MEDIUM",
      treatmentOption: "MITIGATE",
      treatmentRationale: "Perlu rekrutmen tambahan",
      order: 1,
    },
  ];

  for (const item of approvedItems) {
    await prisma.riskAssessmentItem.create({
      data: { ...item, assessmentId: assessmentApproved.id },
    });
  }
  console.log(`   ✓ Added ${approvedItems.length} items to APPROVED assessment`);

  // Assessment REJECTED - ditolak, perlu revisi
  const assessmentRejected = await prisma.riskAssessment.create({
    data: {
      worksheetId: worksheetActive.id,
      code: "RA-DIT-PP-004",
      name: "Assessment Risiko Keuangan 2024",
      description: "Assessment risiko pengelolaan keuangan",
      status: "REJECTED",
      createdBy: pengelolaRisikoDitPP.id,
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      submittedBy: pengelolaRisikoDitPP.id,
      reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      reviewedBy: komitePusatDitPP.id,
      reviewNotes: "Assessment kurang lengkap. Mohon tambahkan analisis kontrol yang lebih detail dan treatment rationale yang jelas untuk setiap risiko.",
    },
  });
  console.log(`   ✓ ${assessmentRejected.name} (REJECTED)`);

  // Add items to REJECTED assessment
  const rejectedItems = [
    {
      riskCode: "R001",
      riskName: "Keterlambatan Pembayaran Vendor",
      riskDescription: "Risiko keterlambatan pembayaran ke vendor",
      riskCategoryId: riskCategoriesForAssessment[2].id, // Risiko Keuangan
      inherentLikelihood: 3,
      inherentImpact: 3,
      inherentRiskLevel: "MEDIUM",
      existingControls: null, // Kurang lengkap - alasan reject
      controlEffectiveness: null,
      residualLikelihood: 2,
      residualImpact: 2,
      residualRiskLevel: "LOW",
      treatmentOption: null,
      treatmentRationale: null,
      order: 1,
    },
  ];

  for (const item of rejectedItems) {
    await prisma.riskAssessmentItem.create({
      data: { ...item, assessmentId: assessmentRejected.id },
    });
  }
  console.log(`   ✓ Added ${rejectedItems.length} items to REJECTED assessment`);

  console.log("✅ Risk Assessments berhasil di-seed\n");

  // Summary
  console.log("📊 Summary:");
  const totalRoles = await prisma.role.count();
  const totalUnitKerja = await prisma.unitKerja.count();
  const totalUsers = await prisma.user.count();
  const totalProfiles = await prisma.profile.count();
  const totalKonteks = await prisma.konteks.count();
  const konteksActive = await prisma.konteks.count({ where: { status: "ACTIVE" } });
  const konteksInactive = await prisma.konteks.count({ where: { status: "INACTIVE" } });
  const konteksArchived = await prisma.konteks.count({ where: { status: "ARCHIVED" } });
  const totalRiskCategories = await prisma.riskCategory.count();
  const totalLikelihoodScales = await prisma.likelihoodScale.count();
  const totalImpactScales = await prisma.impactScale.count();
  const totalRiskMatrices = await prisma.riskMatrix.count();
  const totalAssetCategories = await prisma.assetCategory.count();
  const totalAssets = await prisma.asset.count();
  const totalWorksheets = await prisma.riskWorksheet.count();
  const totalAssessments = await prisma.riskAssessment.count();
  const assessmentDraftCount = await prisma.riskAssessment.count({ where: { status: "DRAFT" } });
  const assessmentSubmittedCount = await prisma.riskAssessment.count({ where: { status: "SUBMITTED" } });
  const assessmentApprovedCount = await prisma.riskAssessment.count({ where: { status: "APPROVED" } });
  const assessmentRejectedCount = await prisma.riskAssessment.count({ where: { status: "REJECTED" } });
  const totalAssessmentItems = await prisma.riskAssessmentItem.count();

  console.log(`   • Total Roles: ${totalRoles}`);
  console.log(`   • Total Unit Kerja: ${totalUnitKerja}`);
  console.log(`   • Total Users: ${totalUsers}`);
  console.log(`   • Total Profiles: ${totalProfiles}`);
  console.log(`   • Total Konteks: ${totalKonteks} (ACTIVE: ${konteksActive}, INACTIVE: ${konteksInactive}, ARCHIVED: ${konteksArchived})`);
  console.log(`   • Total Risk Categories: ${totalRiskCategories}`);
  console.log(`   • Total Likelihood Scales: ${totalLikelihoodScales}`);
  console.log(`   • Total Impact Scales: ${totalImpactScales}`);
  console.log(`   • Total Risk Matrices: ${totalRiskMatrices}`);
  console.log(`   • Total Asset Categories: ${totalAssetCategories}`);
  console.log(`   • Total Assets: ${totalAssets}`);
  console.log(`   • Total Risk Worksheets: ${totalWorksheets}`);
  console.log(`   • Total Risk Assessments: ${totalAssessments} (DRAFT: ${assessmentDraftCount}, SUBMITTED: ${assessmentSubmittedCount}, APPROVED: ${assessmentApprovedCount}, REJECTED: ${assessmentRejectedCount})`);
  console.log(`   • Total Assessment Items: ${totalAssessmentItems}`);

  console.log("\n✅ Seeding selesai!");
  console.log("\n📝 Credentials untuk testing:");
  console.log("   Semua password: password123");
  console.log("");
  console.log("   SEKRETARIAT JENDERAL:");
  console.log("   • admin (ADMINISTRATOR)");
  console.log("   • komite.setjen (KOMITE_PUSAT)");
  console.log("");
  console.log("   DIREKTORAT PELAYANAN PUBLIK:");
  console.log("   • komite.ditpp (KOMITE_PUSAT)");
  console.log("   • pengelola.ditpp (PENGELOLA_RISIKO_UKER) - owner worksheets");
  console.log("   • pengelola2.ditpp (PENGELOLA_RISIKO_UKER) - second user same unit");
  console.log("");
  console.log("   LAINNYA:");
  console.log("   • user.inactive (USER - INACTIVE, tidak bisa login)");
  console.log("   • user.noprofile (USER - tanpa profile)");
  console.log("   • user.unverified (USER - profile belum diverifikasi)");
  console.log("");
  console.log("📋 Konteks Status:");
  console.log("   • KMR-2024-5X5 (5x5) - ACTIVE - dapat digunakan untuk kertas kerja");
  console.log("   • KMR-2026-3X3 (3x3) - INACTIVE - draft, bisa diedit");
  console.log("   • KMR-2022-4X4 (4x4) - ARCHIVED - tidak bisa diubah lagi");
  console.log("");
  console.log("📝 Risk Assessment Status:");
  console.log("   • RA-DIT-PP-001 - DRAFT - bisa diedit dan submit");
  console.log("   • RA-DIT-PP-002 - SUBMITTED - menunggu review KOMITE_PUSAT");
  console.log("   • RA-DIT-PP-003 - APPROVED - sudah disetujui");
  console.log("   • RA-DIT-PP-004 - REJECTED - perlu revisi (bisa edit dan submit ulang)");
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
