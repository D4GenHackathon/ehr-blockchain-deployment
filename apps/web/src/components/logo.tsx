"use client"

import * as React from "react"

interface LogoProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "height" | "src" | "width"> {
  size?: number
}

export function Logo({ size = 24, className, ...props }: LogoProps) {
  const [useFallback, setUseFallback] = React.useState(false)

  if (!useFallback) {
    return (
      <img
        src="/icon.png"
        alt="D4Gen"
        width={size}
        height={size}
        className={`shrink-0 rounded-md object-cover ${className ?? ""}`}
        onError={() => setUseFallback(true)}
        {...props}
      />
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M16 2.75L24.75 6.35V13.75C24.75 19.33 21.49 24.4 16 27.75C10.51 24.4 7.25 19.33 7.25 13.75V6.35L16 2.75Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M16 10V20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M11 15H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 8.25V6.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16 23.75V21.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="16" cy="5" r="1.2" fill="currentColor" />
      <circle cx="16" cy="25" r="1.2" fill="currentColor" />
    </svg>
  )
}
