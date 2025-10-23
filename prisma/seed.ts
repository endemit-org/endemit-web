import { PrismaClient } from "@prisma/client";

import { getAllRoles } from "@/domain/auth/actions/getAllRoles";
import { createPasswordHash } from "@/domain/auth/operations/createPasswordHash";

const prisma = new PrismaClient();

async function seedRoles() {
  console.log("Seeding roles...");

  const roles = getAllRoles();

  for (const roleDefinition of roles) {
    const existingRole = await prisma.role.findUnique({
      where: { slug: roleDefinition.slug },
    });

    if (existingRole) {
      // Update existing role
      await prisma.role.update({
        where: { slug: roleDefinition.slug },
        data: {
          name: roleDefinition.name,
          description: roleDefinition.description,
          permissions: roleDefinition.permissions,
          isSystem: roleDefinition.isSystem,
        },
      });
      console.log(`✓ Updated role: ${roleDefinition.name}`);
    } else {
      // Create new role
      await prisma.role.create({
        data: {
          slug: roleDefinition.slug,
          name: roleDefinition.name,
          description: roleDefinition.description,
          permissions: roleDefinition.permissions,
          isSystem: roleDefinition.isSystem,
        },
      });
      console.log(`✓ Created role: ${roleDefinition.name}`);
    }
  }

  console.log("Roles seeded successfully!");
}

async function seedUsers() {
  console.log("\nSeeding test users...");

  const testPassword = "test1234";

  const userConfigs = [
    {
      email: "admin@endemit.org",
      name: "Admin User",
      roleSlug: "admin",
      password: testPassword,
    },
    {
      email: "moderator@endemit.org",
      name: "Moderator User",
      roleSlug: "moderator",
      password: testPassword,
    },
    {
      email: "scanner@endemit.org",
      name: "Scanner User",
      roleSlug: "scanner",
      password: testPassword,
    },
    {
      email: "user@endemit.org",
      name: "Regular User",
      roleSlug: "user",
      password: testPassword,
    },
  ];

  for (const config of userConfigs) {
    // Check if user already exists

    let user = await prisma.user.findUnique({
      where: { email: config.email },
    });

    const passwordHash = await createPasswordHash(config.password);

    if (!user) {
      // Create user
      user = await prisma.user.create({
        data: {
          email: config.email,
          name: config.name,
          passwordHash,
          status: "ACTIVE",
          emailVerified: new Date(),
        },
      });
      console.log(`✓ Created user: ${config.email}`);
    } else {
      // Update password in case it changed
      await prisma.user.update({
        where: { email: config.email },
        data: {
          passwordHash,
          emailVerified: new Date(),
        },
      });
      console.log(`✓ Updated user: ${config.email}`);
    }

    // Find the role
    const role = await prisma.role.findUnique({
      where: { slug: config.roleSlug },
    });

    if (!role) {
      console.error(`✗ Role not found: ${config.roleSlug}`);
      continue;
    }

    // Check if user already has this role
    const existingUserRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
    });

    if (!existingUserRole) {
      // Assign role to user
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });
      console.log(`  ✓ Assigned role: ${config.roleSlug}`);
    } else {
      console.log(`  - Role already assigned: ${config.roleSlug}`);
    }
  }

  console.log("\nTest users seeded successfully!");
}

async function main() {
  try {
    await seedRoles();
    await seedUsers();
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
