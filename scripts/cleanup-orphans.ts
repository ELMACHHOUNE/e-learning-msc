import mongoose from 'mongoose'
import User from '@/models/User'
import Certificate from '@/models/Certificate'
import ProjectApplication from '@/models/ProjectApplication'
import Guild from '@/models/Guild'
import SessionLog from '@/models/SessionLog'
import AIConversation from '@/models/AIConversation'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-learning-msc'

async function main() {
  await mongoose.connect(MONGODB_URI)

  const users = (await User.find().select('_id').lean()).map((u) => u._id.toString())
  const validIds = new Set(users)

  const orphanCertificates = await Certificate.find({ studentId: { $nin: users } })
  const orphanCertCount = await Certificate.countDocuments({})
  for (const cert of orphanCertificates) {
    console.log(`certificate: ${cert.studentName} (${cert.studentEmail}) | ${cert.certificateId} — student no longer exists`)
  }

  const deletedCerts = await Certificate.deleteMany({ studentId: { $nin: users } })
  const deletedProjects = await ProjectApplication.deleteMany({ studentId: { $nin: users } })
  const deletedConversations = await AIConversation.deleteMany({ userId: { $nin: users } })

  const guilds = await Guild.find().select('_id studentIds')
  let removedFromGuilds = 0
  for (const g of guilds) {
    const stale = (g.studentIds ?? []).filter((id) => !validIds.has(id.toString()))
    if (stale.length > 0) {
      removedFromGuilds += stale.length
      await Guild.updateOne({ _id: g._id }, { $pull: { studentIds: { $in: stale } } })
    }
  }

  const sessionLogs = await SessionLog.find().select('_id records')
  let removedRecords = 0
  for (const log of sessionLogs) {
    const kept = (log.records ?? []).filter((r) => validIds.has(r.studentId.toString()))
    if (kept.length !== (log.records ?? []).length) {
      removedRecords += (log.records ?? []).length - kept.length
      await SessionLog.updateOne({ _id: log._id }, { $set: { records: kept } })
    }
  }

  await mongoose.disconnect()
  console.log(`\nCleanup done:
  certificates deleted: ${deletedCerts.deletedCount} (of ${orphanCertCount} total)
  project applications deleted: ${deletedProjects.deletedCount}
  AI conversations deleted: ${deletedConversations.deletedCount}
  stale student refs removed from guilds: ${removedFromGuilds}
  stale attendance records removed: ${removedRecords}`)
}

main().catch((err) => {
  console.error('Cleanup failed:', err)
  process.exit(1)
})