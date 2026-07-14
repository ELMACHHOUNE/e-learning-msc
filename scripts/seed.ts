import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from '@/models/User'
import Course from '@/models/Course'
import Guild from '@/models/Guild'
import SessionLog from '@/models/SessionLog'
import LabPhase from '@/models/LabPhase'
import Category from '@/models/Category'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-learning-msc'

async function main() {
  console.log('Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('Connected.\n')

  const db = mongoose.connection.db!
  await db.dropDatabase()
  console.log('Database dropped.\n')

  const password = await bcrypt.hash('password123', 12)

  // ── Categories ──
  const categoryNames = ['Data Science', 'Information Technology', 'Graphic Design', 'Digital Marketing']
  const categoryDocs = await Category.insertMany(categoryNames.map((name) => ({ name })))
  console.log(`✓ ${categoryDocs.length} categories created`)

  // ── Admin ──
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@elearning.msc',
    password,
    role: 'admin',
  })
  console.log(`✓ Admin created: admin@elearning.msc`)

  // ── Instructors ──
  const instructors = await User.create([
    { name: 'Sarah Chen', email: 'sarah@elearning.msc', password, role: 'instructor' },
    { name: 'Marcus Johnson', email: 'marcus@elearning.msc', password, role: 'instructor' },
    { name: 'Elena Rodriguez', email: 'elena@elearning.msc', password, role: 'instructor' },
  ])
  console.log(`✓ ${instructors.length} instructors created`)

  // ── Students (30 names) ──
  const studentNames = [
    'Alice Johnson', 'Bob Smith', 'Carol White', 'David Brown', 'Eve Davis',
    'Frank Miller', 'Grace Wilson', 'Henry Taylor', 'Iris Martinez', 'Jack Anderson',
    'Karen Thomas', 'Leo Garcia', 'Mona Clark', 'Nathan Lewis', 'Olivia Hall',
    'Paul Young', 'Quinn King', 'Rachel Wright', 'Sam Lopez', 'Tina Hill',
    'Uma Scott', 'Victor Green', 'Wendy Adams', 'Xander Baker', 'Yara Nelson',
    'Zane Carter', 'Aria Mitchell', 'Blake Roberts', 'Chloe Turner', 'Dylan Phillips',
  ]
  const students = await User.create(
    studentNames.map((name) => ({
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@elearning.msc`,
      password,
      role: 'student' as const,
    }))
  )
  console.log(`✓ ${students.length} students created`)

  // ── Courses with full content structure (no frontend-only `id` fields) ──
  const coursesData: Array<{
    title: string
    description: string
    active: boolean
    durationInMonths: number
    totalSessions: number
    content: Array<{
      title: string
      chapters: Array<{
        title: string
        lessons: Array<{ title: string; content: string; type: 'lesson' | 'checkpoint' | 'workshop' }>
      }>
    }>
  }> = [
    {
      title: '15-Month Software Engineering Program',
      description:
        'Comprehensive full-stack development track covering frontend, backend, databases, and DevOps. Build production-ready applications from the ground up.',
      active: true,
      durationInMonths: 15,
      totalSessions: 194,
      content: [
        {
          title: 'Introduction to Problem Solving',
          chapters: [
            {
              title: 'Foundations of Computing',
              lessons: [
                { title: 'What is Problem Solving?', content: 'Introduction to computational thinking and problem-solving methodologies.', type: 'lesson' },
                { title: 'Algorithmic Thinking', content: 'Breaking down complex problems into manageable steps.', type: 'lesson' },
                { title: 'Checkpoint 1', content: 'Problem-solving fundamentals assessment.', type: 'checkpoint' },
              ],
            },
            {
              title: 'Data Structures Basics',
              lessons: [
                { title: 'Arrays & Strings', content: 'Understanding array manipulation and string algorithms.', type: 'lesson' },
                { title: 'Linked Lists', content: 'Singly and doubly linked list implementations.', type: 'lesson' },
              ],
            },
          ],
        },
        {
          title: 'Practical Software Engineering',
          chapters: [
            {
              title: 'SDLC & Methodologies',
              lessons: [
                { title: 'Waterfall vs Agile', content: 'Comparing software development lifecycle models.', type: 'lesson' },
                { title: 'Scrum Fundamentals', content: 'Sprints, stand-ups, and retrospectives.', type: 'lesson' },
                { title: 'Workshop: Sprint Planning', content: 'Hands-on sprint planning exercise.', type: 'workshop' },
              ],
            },
          ],
        },
        {
          title: 'Front End UI/UX Development',
          chapters: [
            {
              title: 'Design Principles',
              lessons: [
                { title: 'Color Theory', content: 'Understanding color psychology and accessibility.', type: 'lesson' },
                { title: 'Typography Basics', content: 'Font pairing, hierarchy, and readability.', type: 'lesson' },
                { title: 'Checkpoint 2', content: 'Design principles assessment.', type: 'checkpoint' },
              ],
            },
          ],
        },
        {
          title: 'Backend Engineering with Node.js',
          chapters: [
            {
              title: 'RESTful API Design',
              lessons: [
                { title: 'HTTP & API Fundamentals', content: 'Methods, status codes, and REST conventions.', type: 'lesson' },
                { title: 'Express.js Deep Dive', content: 'Routing, middleware, error handling.', type: 'lesson' },
                { title: 'Workshop: Build an API', content: 'Create a full CRUD REST API from scratch.', type: 'workshop' },
              ],
            },
          ],
        },
        {
          title: 'Databases & Data Modeling',
          chapters: [
            {
              title: 'Relational Databases',
              lessons: [
                { title: 'SQL Fundamentals', content: 'SELECT, JOIN, GROUP BY, and aggregation queries.', type: 'lesson' },
                { title: 'Schema Design & Normalization', content: 'ACID, foreign keys, and normal forms.', type: 'lesson' },
              ],
            },
            {
              title: 'NoSQL with MongoDB',
              lessons: [
                { title: 'Document Model', content: 'Collections, documents, and embedded schemas.', type: 'lesson' },
                { title: 'Mongoose ODM', content: 'Schemas, models, validation, and population.', type: 'lesson' },
              ],
            },
          ],
        },
        {
          title: 'DevOps & Deployment',
          chapters: [
            {
              title: 'CI/CD & Containerization',
              lessons: [
                { title: 'Git & GitHub Actions', content: 'Branching strategies and automated pipelines.', type: 'lesson' },
                { title: 'Docker Fundamentals', content: 'Containers, images, Dockerfiles, and Compose.', type: 'lesson' },
                { title: 'Checkpoint 3', content: 'DevOps concepts assessment.', type: 'checkpoint' },
              ],
            },
          ],
        },
        {
          title: 'Final Capstone Project',
          chapters: [
            {
              title: 'Project Planning & Architecture',
              lessons: [
                { title: 'Requirements Gathering', content: 'User stories, acceptance criteria, and scope.', type: 'lesson' },
                { title: 'System Architecture Design', content: 'Component diagrams and data flow.', type: 'lesson' },
                { title: 'Workshop: Architecture Review', content: 'Peer review of system designs.', type: 'workshop' },
              ],
            },
            {
              title: 'Implementation & Delivery',
              lessons: [
                { title: 'Sprint Execution', content: 'Building features iteratively with Agile practices.', type: 'lesson' },
                { title: 'Testing & QA', content: 'Unit, integration, and end-to-end testing strategies.', type: 'lesson' },
                { title: 'Final Presentation', content: 'Demo day — present your capstone project.', type: 'workshop' },
              ],
            },
          ],
        },
      ],
    },
    {
      title: 'Data Science & Analytics Bootcamp',
      description:
        'Statistics, machine learning, data engineering, and visualization. Turn raw data into actionable intelligence.',
      active: true,
      durationInMonths: 12,
      totalSessions: 150,
      content: [
        {
          title: 'Statistics Fundamentals',
          chapters: [
            {
              title: 'Descriptive Statistics',
              lessons: [
                { title: 'Measures of Central Tendency', content: 'Mean, median, mode, and their applications.', type: 'lesson' },
                { title: 'Probability Distributions', content: 'Normal, binomial, and Poisson distributions.', type: 'lesson' },
                { title: 'Checkpoint 1', content: 'Statistics fundamentals assessment.', type: 'checkpoint' },
              ],
            },
            {
              title: 'Inferential Statistics',
              lessons: [
                { title: 'Hypothesis Testing', content: 'Null hypothesis, p-values, and confidence intervals.', type: 'lesson' },
                { title: 'Correlation & Regression', content: 'Pearson correlation, linear regression basics.', type: 'lesson' },
              ],
            },
          ],
        },
        {
          title: 'Machine Learning',
          chapters: [
            {
              title: 'Supervised Learning',
              lessons: [
                { title: 'Linear Regression', content: 'Understanding regression analysis and prediction.', type: 'lesson' },
                { title: 'Classification Algorithms', content: 'Decision trees, random forests, and SVM.', type: 'lesson' },
                { title: 'Workshop: Model Training', content: 'Build and evaluate a classification model with scikit-learn.', type: 'workshop' },
              ],
            },
            {
              title: 'Unsupervised Learning',
              lessons: [
                { title: 'Clustering Techniques', content: 'K-means, hierarchical, and DBSCAN clustering.', type: 'lesson' },
                { title: 'Dimensionality Reduction', content: 'PCA and t-SNE for high-dimensional data.', type: 'lesson' },
              ],
            },
          ],
        },
        {
          title: 'Data Engineering',
          chapters: [
            {
              title: 'ETL & Data Pipelines',
              lessons: [
                { title: 'Data Extraction & Cleaning', content: 'APIs, web scraping, and handling missing data.', type: 'lesson' },
                { title: 'Data Warehousing Concepts', content: 'Star schema, fact tables, and OLAP.', type: 'lesson' },
                { title: 'Checkpoint 2', content: 'Data engineering assessment.', type: 'checkpoint' },
              ],
            },
          ],
        },
        {
          title: 'Visualization & Communication',
          chapters: [
            {
              title: 'Storytelling with Data',
              lessons: [
                { title: 'Dashboard Design', content: 'Principles of effective dashboard layouts.', type: 'lesson' },
                { title: 'Workshop: Build a Dashboard', content: 'Create an interactive data dashboard.', type: 'workshop' },
              ],
            },
          ],
        },
      ],
    },
    {
      title: 'UI/UX Design Masterclass',
      description:
        'Design thinking, user research, prototyping, and visual design. Create interfaces that users love.',
      active: true,
      durationInMonths: 6,
      totalSessions: 72,
      content: [
        {
          title: 'Design Thinking',
          chapters: [
            {
              title: 'Empathize & Define',
              lessons: [
                { title: 'User Research Methods', content: 'Interviews, surveys, and observation techniques.', type: 'lesson' },
                { title: 'Problem Framing', content: 'How to define the right problem to solve.', type: 'lesson' },
                { title: 'Workshop: User Personas', content: 'Create user personas from research data.', type: 'workshop' },
              ],
            },
            {
              title: 'Ideate & Prototype',
              lessons: [
                { title: 'Brainstorming Techniques', content: 'Divergent and convergent thinking methods.', type: 'lesson' },
                { title: 'Rapid Prototyping', content: 'Low-fidelity wireframes and interactive mockups.', type: 'lesson' },
              ],
            },
          ],
        },
        {
          title: 'Visual Design',
          chapters: [
            {
              title: 'Layout & Composition',
              lessons: [
                { title: 'Grid Systems', content: 'Understanding layout grids and spacing.', type: 'lesson' },
                { title: 'Visual Hierarchy', content: 'Guiding the user\'s attention through design.', type: 'lesson' },
                { title: 'Checkpoint 1', content: 'Visual design principles assessment.', type: 'checkpoint' },
              ],
            },
            {
              title: 'Color & Typography',
              lessons: [
                { title: 'Advanced Color Theory', content: 'Accessibility, contrast ratios, and color systems.', type: 'lesson' },
                { title: 'Typeface Selection', content: 'Choosing fonts for readability and brand alignment.', type: 'lesson' },
              ],
            },
          ],
        },
        {
          title: 'Usability & Testing',
          chapters: [
            {
              title: 'Usability Heuristics',
              lessons: [
                { title: 'Nielsen\'s 10 Heuristics', content: 'Evaluating interfaces against established principles.', type: 'lesson' },
                { title: 'Workshop: Heuristic Evaluation', content: 'Conduct a heuristic evaluation on a real app.', type: 'workshop' },
              ],
            },
            {
              title: 'User Testing',
              lessons: [
                { title: 'Test Planning', content: 'Writing test scripts and recruiting participants.', type: 'lesson' },
                { title: 'Analyzing Results', content: 'Synthesizing findings into actionable improvements.', type: 'lesson' },
                { title: 'Checkpoint 2', content: 'Usability testing assessment.', type: 'checkpoint' },
              ],
            },
          ],
        },
        {
          title: 'Portfolio & Career',
          chapters: [
            {
              title: 'Building Your Case Studies',
              lessons: [
                { title: 'Structuring a Case Study', content: 'Problem, process, solution, and impact framework.', type: 'lesson' },
                { title: 'Workshop: Portfolio Review', content: 'Peer review and feedback session on portfolio drafts.', type: 'workshop' },
              ],
            },
          ],
        },
      ],
    },
  ]

  const courses = await Course.create(coursesData)
  console.log(`✓ ${courses.length} courses created`)

  // ── Guilds ──
  const guildsData: Array<{
    name: string
    courseId: mongoose.Types.ObjectId
    instructorId: mongoose.Types.ObjectId
    studentIds: mongoose.Types.ObjectId[]
    currentSession: number
    skillsTotal: number
    skillsAchieved: number
  }> = [
    { name: 'Achilles Vengeance', courseId: courses[0]._id, instructorId: instructors[0]._id, studentIds: students.slice(0, 6).map((s) => s._id), currentSession: 54, skillsTotal: 9210, skillsAchieved: 5583 },
    { name: 'Spartan Cohort', courseId: courses[0]._id, instructorId: instructors[0]._id, studentIds: students.slice(6, 12).map((s) => s._id), currentSession: 42, skillsTotal: 9210, skillsAchieved: 4102 },
    { name: 'Phoenix Rising', courseId: courses[1]._id, instructorId: instructors[1]._id, studentIds: students.slice(12, 18).map((s) => s._id), currentSession: 38, skillsTotal: 7200, skillsAchieved: 3200 },
    { name: 'Data Wizards', courseId: courses[1]._id, instructorId: instructors[1]._id, studentIds: students.slice(18, 24).map((s) => s._id), currentSession: 22, skillsTotal: 7200, skillsAchieved: 1800 },
    { name: 'Design Collective', courseId: courses[2]._id, instructorId: instructors[2]._id, studentIds: students.slice(24, 30).map((s) => s._id), currentSession: 15, skillsTotal: 3600, skillsAchieved: 1200 },
  ]

  const guilds = await Guild.create(guildsData)
  console.log(`✓ ${guilds.length} guilds created`)
  for (const g of guildsData) {
    console.log(`  → ${g.name}: ${g.studentIds.length} students`)
  }

  // ── Session Logs ──
  const sessionLogs = []
  for (const guild of guilds) {
    const currentSessions = guild.currentSession
    const memberIds = guild.studentIds
    for (let s = 1; s <= Math.min(currentSessions, 10); s++) {
      const date = new Date()
      date.setDate(date.getDate() - (currentSessions - s) * 7)
      const records = memberIds.map((sid) => ({
        studentId: sid,
        status: (['present', 'present', 'present', 'absent', 'late'] as const)[Math.floor(Math.random() * 5)],
      }))
      sessionLogs.push({ guildId: guild._id, sessionNumber: s, date, records })
    }
  }
  if (sessionLogs.length > 0) await SessionLog.create(sessionLogs)
  console.log(`✓ ${sessionLogs.length} session logs created`)

  // ── LabPhases ──
  const adminUser = await User.findOne({ role: 'admin' })
  const instructorUsers = await User.find({ role: 'instructor' }).limit(2)
  const labPhasesData = [
    { title: 'Phase 1: Foundations', description: 'HTML, CSS, JavaScript basics — build your first static webpage', instructions: 'Create a personal portfolio page using semantic HTML5 and CSS3.\n\nRequirements:\n- Use semantic HTML tags (header, nav, main, section, footer)\n- Include a navigation bar with at least 3 links\n- Style with CSS (Flexbox or Grid)\n- Make it responsive with media queries\n- Deploy to GitHub Pages', duration: '4 weeks', status: 'approved', createdBy: adminUser?._id ?? instructorUsers[0]._id },
    { title: 'Phase 2: Frontend Development', description: 'React, State Management, Routing — build interactive UIs', instructions: 'Build a task management dashboard using React.\n\nRequirements:\n- Use React with functional components and hooks\n- Implement state management (useReducer or Context)\n- Add routing with react-router\n- Fetch data from a mock API\n- Handle loading, empty, and error states', duration: '6 weeks', status: 'approved', createdBy: adminUser?._id ?? instructorUsers[0]._id },
    { title: 'Phase 3: Backend Development', description: 'Node.js, Express, Databases — build your first API', instructions: 'Design and implement a RESTful API for a blogging platform.\n\nRequirements:\n- Use Express.js with middleware\n- Implement CRUD operations for posts and users\n- Use MongoDB with Mongoose for data persistence\n- Add authentication with JWT\n- Write API documentation', duration: '6 weeks', status: 'approved', createdBy: adminUser?._id ?? instructorUsers[0]._id },
    { title: 'Phase 4: Full-Stack Project', description: 'Capstone project with full CI/CD pipeline', instructions: 'Build a complete full-stack application from scratch.\n\nRequirements:\n- Frontend: React with TypeScript\n- Backend: Node.js with Express\n- Database: MongoDB\n- Authentication and authorization\n- Testing (unit + integration)\n- CI/CD pipeline (GitHub Actions)\n- Deploy to production', duration: '8 weeks', status: 'pending', createdBy: instructorUsers[0]._id },
  ]
  const labphases = await LabPhase.insertMany(labPhasesData as any)
  console.log(`✓ ${labphases.length} lab phases created`)

  console.log('\n── Seed complete ──')
  console.log('Email format:  name@elearning.msc')
  console.log('Password for all accounts:  password123')

  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})