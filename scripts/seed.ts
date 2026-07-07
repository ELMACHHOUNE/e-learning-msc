import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/e-learning-msc";

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  const db = mongoose.connection.db!;
  await db.dropDatabase();
  console.log("Database dropped.\n");

  const password = await bcrypt.hash("password123", 12);

  // ── Admin ──
  const admin = await db.collection("users").insertOne({
    name: "Admin",
    email: "admin@elearning.msc",
    password,
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(`✓ Admin created: admin@elearning.msc`);

  // ── Instructors ──
  const instructors = await db.collection("users").insertMany([
    { name: "Sarah Chen", email: "sarah@elearning.msc", password, role: "instructor", createdAt: new Date(), updatedAt: new Date() },
    { name: "Marcus Johnson", email: "marcus@elearning.msc", password, role: "instructor", createdAt: new Date(), updatedAt: new Date() },
    { name: "Elena Rodriguez", email: "elena@elearning.msc", password, role: "instructor", createdAt: new Date(), updatedAt: new Date() },
  ]);
  const instructorIds = Object.values(instructors.insertedIds);
  console.log(`✓ ${instructors.insertedCount} instructors created`);

  // ── Students ──
  const studentNames = [
    "Alice Johnson", "Bob Smith", "Carol White", "David Brown", "Eve Davis",
    "Frank Miller", "Grace Wilson", "Henry Taylor", "Iris Martinez", "Jack Anderson",
    "Karen Thomas", "Leo Garcia", "Mona Clark", "Nathan Lewis", "Olivia Hall",
    "Paul Young", "Quinn King", "Rachel Wright", "Sam Lopez", "Tina Hill",
    "Uma Scott", "Victor Green", "Wendy Adams", "Xander Baker", "Yara Nelson",
    "Zane Carter", "Aria Mitchell", "Blake Roberts", "Chloe Turner", "Dylan Phillips",
  ];

  const students = await db.collection("users").insertMany(
    studentNames.map((name) => ({
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@elearning.msc`,
      password,
      role: "student",
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );
  const studentIds = Object.values(students.insertedIds);
  console.log(`✓ ${students.insertedCount} students created`);

  // ── Courses ──
  const coursesData = [
    {
      title: "15-Month Software Engineering Program",
      description: "Comprehensive full-stack development track covering frontend, backend, databases, and DevOps. Build production-ready applications from the ground up.",
      durationInMonths: 15,
      totalSessions: 194,
      content: [
        {
          title: "Introduction to Problem Solving",
          chapters: [
            {
              title: "Foundations of Computing",
              lessons: [
                { title: "What is Problem Solving?", content: "Introduction to computational thinking and problem-solving methodologies.", type: "lesson" },
                { title: "Algorithmic Thinking", content: "Breaking down complex problems into manageable steps.", type: "lesson" },
                { title: "Checkpoint 1", content: "Problem-solving fundamentals assessment.", type: "checkpoint" },
              ],
            },
            {
              title: "Data Structures Basics",
              lessons: [
                { title: "Arrays & Strings", content: "Understanding array manipulation and string algorithms.", type: "lesson" },
                { title: "Linked Lists", content: "Singly and doubly linked list implementations.", type: "lesson" },
              ],
            },
          ],
        },
        {
          title: "Practical Software Engineering",
          chapters: [
            {
              title: "SDLC & Methodologies",
              lessons: [
                { title: "Waterfall vs Agile", content: "Comparing software development lifecycle models.", type: "lesson" },
                { title: "Scrum Fundamentals", content: "Sprints, stand-ups, and retrospectives.", type: "lesson" },
                { title: "Workshop: Sprint Planning", content: "Hands-on sprint planning exercise.", type: "workshop" },
              ],
            },
          ],
        },
        {
          title: "Front End UI UX Development",
          chapters: [
            {
              title: "Design Principles",
              lessons: [
                { title: "Color Theory", content: "Understanding color psychology and accessibility.", type: "lesson" },
                { title: "Typography Basics", content: "Font pairing, hierarchy, and readability.", type: "lesson" },
                { title: "Checkpoint 2", content: "Design principles assessment.", type: "checkpoint" },
              ],
            },
          ],
        },
      ],
    },
    {
      title: "Data Science & Analytics Bootcamp",
      description: "Statistics, machine learning, data engineering, and visualization. Turn raw data into actionable intelligence.",
      durationInMonths: 12,
      totalSessions: 150,
      content: [
        {
          title: "Statistics Fundamentals",
          chapters: [
            {
              title: "Descriptive Statistics",
              lessons: [
                { title: "Measures of Central Tendency", content: "Mean, median, mode, and their applications.", type: "lesson" },
                { title: "Probability Distributions", content: "Normal, binomial, and Poisson distributions.", type: "lesson" },
              ],
            },
          ],
        },
        {
          title: "Machine Learning",
          chapters: [
            {
              title: "Supervised Learning",
              lessons: [
                { title: "Linear Regression", content: "Understanding regression analysis and prediction.", type: "lesson" },
                { title: "Classification Algorithms", content: "Decision trees, random forests, and SVM.", type: "lesson" },
                { title: "Workshop: Model Training", content: "Build and evaluate a classification model.", type: "workshop" },
              ],
            },
          ],
        },
      ],
    },
    {
      title: "UI/UX Design Masterclass",
      description: "Design thinking, user research, prototyping, and visual design. Create interfaces that users love.",
      durationInMonths: 6,
      totalSessions: 72,
      content: [
        {
          title: "Design Thinking",
          chapters: [
            {
              title: "Empathize & Define",
              lessons: [
                { title: "User Research Methods", content: "Interviews, surveys, and observation techniques.", type: "lesson" },
                { title: "Problem Framing", content: "How to define the right problem to solve.", type: "lesson" },
              ],
            },
          ],
        },
        {
          title: "Visual Design",
          chapters: [
            {
              title: "Layout & Composition",
              lessons: [
                { title: "Grid Systems", content: "Understanding layout grids and spacing.", type: "lesson" },
                { title: "Visual Hierarchy", content: "Guiding the user's attention through design.", type: "lesson" },
                { title: "Checkpoint 3", content: "Visual design principles assessment.", type: "checkpoint" },
              ],
            },
          ],
        },
      ],
    },
  ];

  const courses = await db.collection("courses").insertMany(
    coursesData.map((c) => ({ ...c, createdAt: new Date(), updatedAt: new Date() }))
  );
  const courseIds = Object.values(courses.insertedIds);
  console.log(`✓ ${courses.insertedCount} courses created`);

  // ── Guilds (Groups) ──
  const guildsData = [
    { name: "Achilles Vengeance", courseId: courseIds[0], instructorId: instructorIds[0], skillsTotal: 9210, skillsAchieved: 5583, currentSession: 54 },
    { name: "Spartan Cohort", courseId: courseIds[0], instructorId: instructorIds[0], skillsTotal: 9210, skillsAchieved: 4102, currentSession: 42 },
    { name: "Phoenix Rising", courseId: courseIds[1], instructorId: instructorIds[1], skillsTotal: 7200, skillsAchieved: 3200, currentSession: 38 },
    { name: "Data Wizards", courseId: courseIds[1], instructorId: instructorIds[1], skillsTotal: 7200, skillsAchieved: 1800, currentSession: 22 },
    { name: "Design Collective", courseId: courseIds[2], instructorId: instructorIds[2], skillsTotal: 3600, skillsAchieved: 1200, currentSession: 15 },
  ];

  const guilds = await db.collection("guilds").insertMany(
    guildsData.map((g) => ({ ...g, studentIds: [], createdAt: new Date(), updatedAt: new Date() }))
  );
  const guildIds = Object.values(guilds.insertedIds);
  console.log(`✓ ${guilds.insertedCount} guilds created`);

  // ── Assign students to guilds ──
  const studentsPerGuild = Math.floor(studentIds.length / guildIds.length);
  for (let i = 0; i < guildIds.length; i++) {
    const start = i * studentsPerGuild;
    const end = i === guildIds.length - 1 ? studentIds.length : start + studentsPerGuild;
    const members = studentIds.slice(start, end);
    await db.collection("guilds").updateOne(
      { _id: guildIds[i] },
      { $set: { studentIds: members } }
    );
    console.log(`  → ${guildsData[i].name}: ${members.length} students`);
  }

  // ── Session Logs ──
  const sessionLogs = [];
  for (const guildId of guildIds) {
    const guild = await db.collection("guilds").findOne({ _id: guildId });
    const memberIds = guild?.studentIds || [];
    for (let s = 1; s <= Math.min(guild?.currentSession || 0, 10); s++) {
      const date = new Date();
      date.setDate(date.getDate() - (guild?.currentSession || 0) * 7 + s * 7);
      const records = memberIds.map((sid: mongoose.ObjectId) => ({
        studentId: sid,
        status: (["present", "present", "present", "absent", "late"] as const)[Math.floor(Math.random() * 5)],
      }));
      sessionLogs.push({ guildId, sessionNumber: s, date, records, createdAt: new Date(), updatedAt: new Date() });
    }
  }
  await db.collection("sessionlogs").insertMany(sessionLogs);
  console.log(`✓ ${sessionLogs.length} session logs created`);

  console.log("\n── Seed complete ──");
  console.log("Email format:  name@elearning.msc");
  console.log("Password for all accounts:  password123");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
