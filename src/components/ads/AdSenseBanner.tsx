import React, { useEffect, useRef } from 'react'

// Simple AdSense banner component. Replace data-ad-client and data-ad-slot in index.html for activation.
const AdSenseBanner: React.FC = () => {
  const adRef = useRef<HTMLModElement | null>(null)

  useEffect(() => {
    // Attempt to (re)render the ad when mounted
    try {
      // @ts-ignore
      (window.adsbygoogle = (window as any).adsbygoogle || []).push({})
    } catch (e) {
      // eslint-disable-next-line no-console
      console.debug('AdSense not initialized yet or blocked')
    }
  }, [])

  return (
    <div className="rounded-lg overflow-hidden border border-border/50 bg-background">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-0000000000000000"
        data-ad-slot="0000000000"
        data-ad-format="auto"
        data-full-width-responsive="true"
        ref={adRef as any}
        aria-label="Sponsored advertisement"
      />
    </div>
  )
}

export default AdSenseBanner
