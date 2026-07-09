import Image from 'next/image'

export default function LogoSpinner() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-xxl">
        <div className="animate-spin" style={{ animationDuration: '2s' }}>
          <Image
            src="/images/icon.png"
            alt="Logo"
            width={48}
            height={48}
            priority
            className="object-contain"
          />
        </div>
        <p className="text-caption text-mute tracking-[0.1em]">Loading...</p>
      </div>
    </div>
  )
}