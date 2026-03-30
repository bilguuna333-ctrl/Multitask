const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 12);

  // ===== TENANT 1: Acme Corp =====
  const workspace1 = await prisma.workspace.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      themeColor: '#4F46E5',
      plan: 'pro',
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'alice@acme.com',
      passwordHash,
      firstName: 'Alice',
      lastName: 'Johnson',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'bob@acme.com',
      passwordHash,
      firstName: 'Bob',
      lastName: 'Smith',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'carol@acme.com',
      passwordHash,
      firstName: 'Carol',
      lastName: 'Williams',
    },
  });

  await prisma.membership.createMany({
    data: [
      { userId: user1.id, workspaceId: workspace1.id, role: 'OWNER' },
      { userId: user2.id, workspaceId: workspace1.id, role: 'ADMIN' },
      { userId: user3.id, workspaceId: workspace1.id, role: 'MEMBER' },
    ],
  });

  const project1 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Complete redesign of the company website with modern UI/UX',
      status: 'ACTIVE',
      workspaceId: workspace1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App v2',
      description: 'Second major version of the mobile application',
      status: 'ACTIVE',
      workspaceId: workspace1.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'API Migration',
      description: 'Migrate legacy APIs to new microservices architecture',
      status: 'ON_HOLD',
      workspaceId: workspace1.id,
    },
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: project1.id, userId: user1.id },
      { projectId: project1.id, userId: user2.id },
      { projectId: project1.id, userId: user3.id },
      { projectId: project2.id, userId: user1.id },
      { projectId: project2.id, userId: user3.id },
      { projectId: project3.id, userId: user2.id },
    ],
  });

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);
  const nextWeek = new Date(now.getTime() + 7 * 86400000);
  const yesterday = new Date(now.getTime() - 86400000);

  const tasks1 = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Design new homepage layout',
        description: 'Create wireframes and mockups for the new homepage',
        status: 'DONE',
        priority: 'HIGH',
        dueDate: yesterday,
        tags: 'design,homepage',
        position: 0,
        workspaceId: workspace1.id,
        projectId: project1.id,
        assigneeId: user2.id,
        creatorId: user1.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Implement responsive navigation',
        description: 'Build responsive navbar with mobile hamburger menu',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: tomorrow,
        tags: 'frontend,navigation',
        position: 1,
        workspaceId: workspace1.id,
        projectId: project1.id,
        assigneeId: user3.id,
        creatorId: user1.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Set up CI/CD pipeline',
        description: 'Configure GitHub Actions for automated deployment',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: nextWeek,
        tags: 'devops,ci-cd',
        position: 2,
        workspaceId: workspace1.id,
        projectId: project1.id,
        assigneeId: user1.id,
        creatorId: user1.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Write unit tests for auth module',
        description: 'Achieve 80% code coverage for authentication module',
        status: 'REVIEW',
        priority: 'MEDIUM',
        dueDate: tomorrow,
        tags: 'testing,auth',
        position: 0,
        workspaceId: workspace1.id,
        projectId: project1.id,
        assigneeId: user2.id,
        creatorId: user2.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Optimize database queries',
        description: 'Review and optimize slow database queries identified in monitoring',
        status: 'TODO',
        priority: 'URGENT',
        dueDate: yesterday,
        tags: 'backend,performance',
        position: 3,
        workspaceId: workspace1.id,
        projectId: project1.id,
        assigneeId: user1.id,
        creatorId: user1.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Design app onboarding flow',
        description: 'Create onboarding screens for new mobile app users',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: nextWeek,
        tags: 'design,mobile',
        position: 0,
        workspaceId: workspace1.id,
        projectId: project2.id,
        assigneeId: user3.id,
        creatorId: user1.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Implement push notifications',
        description: 'Add push notification support using Firebase Cloud Messaging',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: nextWeek,
        tags: 'mobile,notifications',
        position: 1,
        workspaceId: workspace1.id,
        projectId: project2.id,
        assigneeId: user1.id,
        creatorId: user1.id,
      },
    }),
  ]);

  // Add comments to first task
  await prisma.taskComment.createMany({
    data: [
      { content: 'I have finished the initial wireframes. Please review.', taskId: tasks1[0].id, userId: user2.id },
      { content: 'Looks great! Small suggestion: make the CTA button larger.', taskId: tasks1[0].id, userId: user1.id },
      { content: 'Updated. Ready for final approval.', taskId: tasks1[0].id, userId: user2.id },
    ],
  });

  await prisma.taskComment.create({
    data: { content: 'Working on the mobile menu animation now.', taskId: tasks1[1].id, userId: user3.id },
  });

  // Activity logs for workspace 1
  await prisma.activityLog.createMany({
    data: [
      { action: 'PROJECT_CREATED', entityType: 'PROJECT', entityId: project1.id, details: JSON.stringify({ name: 'Website Redesign' }), workspaceId: workspace1.id, userId: user1.id },
      { action: 'PROJECT_CREATED', entityType: 'PROJECT', entityId: project2.id, details: JSON.stringify({ name: 'Mobile App v2' }), workspaceId: workspace1.id, userId: user1.id },
      { action: 'TASK_CREATED', entityType: 'TASK', entityId: tasks1[0].id, details: JSON.stringify({ title: 'Design new homepage layout' }), workspaceId: workspace1.id, userId: user1.id },
      { action: 'TASK_UPDATED', entityType: 'TASK', entityId: tasks1[0].id, details: JSON.stringify({ status: 'DONE' }), workspaceId: workspace1.id, userId: user2.id },
      { action: 'COMMENT_ADDED', entityType: 'TASK', entityId: tasks1[0].id, details: JSON.stringify({ comment: 'review' }), workspaceId: workspace1.id, userId: user1.id },
    ],
  });

  // Notifications for workspace 1
  await prisma.notification.createMany({
    data: [
      { type: 'TASK_ASSIGNED', title: 'Task Assigned', message: 'You have been assigned to "Design new homepage layout"', workspaceId: workspace1.id, userId: user2.id },
      { type: 'COMMENT_ADDED', title: 'New Comment', message: 'Alice commented on "Design new homepage layout"', workspaceId: workspace1.id, userId: user2.id },
      { type: 'TASK_ASSIGNED', title: 'Task Assigned', message: 'You have been assigned to "Implement responsive navigation"', workspaceId: workspace1.id, userId: user3.id },
    ],
  });

  // Invitation for workspace 1
  await prisma.invitation.create({
    data: {
      email: 'dave@example.com',
      role: 'MEMBER',
      token: uuidv4(),
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      workspaceId: workspace1.id,
      invitedBy: user1.id,
    },
  });

  // ===== TENANT 2: Startup Inc =====
  const workspace2 = await prisma.workspace.create({
    data: {
      name: 'Startup Inc',
      slug: 'startup-inc',
      themeColor: '#059669',
      plan: 'free',
    },
  });

  const user4 = await prisma.user.create({
    data: {
      email: 'eve@startup.io',
      passwordHash,
      firstName: 'Eve',
      lastName: 'Davis',
    },
  });

  const user5 = await prisma.user.create({
    data: {
      email: 'frank@startup.io',
      passwordHash,
      firstName: 'Frank',
      lastName: 'Miller',
    },
  });

  await prisma.membership.createMany({
    data: [
      { userId: user4.id, workspaceId: workspace2.id, role: 'OWNER' },
      { userId: user5.id, workspaceId: workspace2.id, role: 'MEMBER' },
    ],
  });

  const project4 = await prisma.project.create({
    data: {
      name: 'MVP Launch',
      description: 'Build and launch our minimum viable product',
      status: 'ACTIVE',
      workspaceId: workspace2.id,
    },
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: project4.id, userId: user4.id },
      { projectId: project4.id, userId: user5.id },
    ],
  });

  await Promise.all([
    prisma.task.create({
      data: {
        title: 'Set up landing page',
        description: 'Create a compelling landing page for the product',
        status: 'DONE',
        priority: 'HIGH',
        dueDate: yesterday,
        position: 0,
        workspaceId: workspace2.id,
        projectId: project4.id,
        assigneeId: user4.id,
        creatorId: user4.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Implement user authentication',
        description: 'Set up JWT auth with login and registration',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        dueDate: tomorrow,
        position: 1,
        workspaceId: workspace2.id,
        projectId: project4.id,
        assigneeId: user5.id,
        creatorId: user4.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Design database schema',
        description: 'Design and document the database schema for MVP',
        status: 'REVIEW',
        priority: 'HIGH',
        dueDate: tomorrow,
        position: 2,
        workspaceId: workspace2.id,
        projectId: project4.id,
        assigneeId: user4.id,
        creatorId: user4.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Set up payment integration',
        description: 'Integrate Stripe for payment processing',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: nextWeek,
        position: 3,
        workspaceId: workspace2.id,
        projectId: project4.id,
        assigneeId: user5.id,
        creatorId: user4.id,
      },
    }),
  ]);

  await prisma.activityLog.createMany({
    data: [
      { action: 'PROJECT_CREATED', entityType: 'PROJECT', entityId: project4.id, details: JSON.stringify({ name: 'MVP Launch' }), workspaceId: workspace2.id, userId: user4.id },
    ],
  });

  console.log('Seed completed!');
  console.log('');
  console.log('=== Demo Accounts ===');
  console.log('Tenant 1 - Acme Corp:');
  console.log('  Owner: alice@acme.com / Password123!');
  console.log('  Admin: bob@acme.com / Password123!');
  console.log('  Member: carol@acme.com / Password123!');
  console.log('');
  console.log('Tenant 2 - Startup Inc:');
  console.log('  Owner: eve@startup.io / Password123!');
  console.log('  Member: frank@startup.io / Password123!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
