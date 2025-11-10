'use client'
import { useEffect } from 'react'

export default function OneSignalInit(){
  useEffect(()=>{
    if (typeof window !== 'undefined' && 'OneSignal' in window) return
    const script = document.createElement('script')
    script.src = "https://cdn.onesignal.com/sdks/OneSignalSDK.js"
    script.async = true
    document.body.appendChild(script)

    // @ts-ignore
    window.OneSignal = window.OneSignal || []
    // @ts-ignore
    window.OneSignal.push(function() {
      // @ts-ignore
      OneSignal.init({
        appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        notifyButton: { enable: true },
        safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_ID
      })
    })
  }, [])
  return null
}
