'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { META_PIXEL_ID, trackMetaPageView } from '@/lib/meta-pixel'

/**
 * Meta Pixel base code + PageView on route changes (App Router).
 * Skips admin routes.
 */
export function MetaPixel() {
  const pathname = usePathname()
  const firstLoad = useRef(true)

  useEffect(() => {
    if (!META_PIXEL_ID) return
    if (pathname?.startsWith('/admin')) return
    // Skip duplicate PageView on first paint (init already tracks it)
    if (firstLoad.current) {
      firstLoad.current = false
      return
    }
    trackMetaPageView()
  }, [pathname])

  if (!META_PIXEL_ID || pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
