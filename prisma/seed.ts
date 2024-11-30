const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // Seed Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "super@canteen.com",
        password: "securepassword",
        name: "Ama Owusu",
        phone: "0241234567",
        role: "Master",
      },
    }),
    prisma.user.create({
      data: {
        email: "kwame.nkrumah@example.com",
        password: "password1",
        name: "Kwame Nkrumah",
        phone: "0542335678",
        role: "Teacher",
      },
    }),
    prisma.user.create({
      data: {
        email: "efia.adutwumwaa@example.com",
        password: "password",
        name: "Efia Adutwumwaa",
        phone: "0203456789",
        role: "Teacher",
      },
    }),
  ]);

  console.log("Seeded users:", users);

  // Seed Classes
  const classes = await Promise.all([
    prisma.class.create({
      data: {
        name: "JS1",
        description: "This is the js1 class",
        supervisorId: users[0].id, // Ama Owusu as supervisor
      },
    }),
    prisma.class.create({
      data: {
        name: "JS2",
        description: "This is jhs2",
        supervisorId: users[1].id, // Kwame Nkrumah as supervisor
      },
    }),
  ]);

  console.log("Seeded classes:", classes);

  // Seed Students
  const students = await Promise.all([
    prisma.student.create({
      data: {
        name: "Kofi Mensah",
        age: 20,
        classId: classes[0].id,
        parentPhone: "0239483021",
        gender: "male",
      },
    }),
    prisma.student.create({
      data: {
        name: "Akua Serwah",
        age: 22,
        classId: classes[1].id,
        parentPhone: "0259483043",
        gender: "female",
      },
    }),
    prisma.student.create({
      data: {
        name: "Yaw Boateng",
        age: 19,
        classId: classes[0].id,
        parentPhone: "02984830302",
        gender: "male",
      },
    }),
  ]);

  console.log("Seeded students:", students);

  // Seed Records
  const records = await Promise.all([
    prisma.record.create({
      data: {
        amount: 100,
        submitedBy: users[2].id, // Efia Adutwumwaa submits a record
      },
    }),
    prisma.record.create({
      data: {
        amount: 150,
        submitedBy: users[2].id, // Efia Adutwumwaa submits another record
      },
    }),
  ]);

  console.log("Seeded records:", records);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
