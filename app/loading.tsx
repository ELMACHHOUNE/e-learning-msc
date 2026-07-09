import Image from 'next/image'

export default function RootLoading() {
  return (
    <div className="fixed inset-0 bg-canvas flex flex-col items-center justify-center z-[9999]">
      <div className="flex flex-col items-center gap-xxl">
        <div className="animate-spin" style={{ animationDuration: '2s' }}>
          <Image
            src="/images/icon.png"
            alt="Logo"
            width={64}
            height={64}
            priority
            className="object-contain"
          />
        </div>
        <div className="text-center">
          <p className="text-heading-sm text-ink font-700 uppercase tracking-[0.18em]">
            e-learning-msc
          </p>
          <p className="text-caption text-mute mt-sm tracking-[0.1em]">
            Loading...
          </p>
        </div>
      </div>
    </div>
  )
}