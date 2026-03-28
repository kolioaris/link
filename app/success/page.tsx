"use client"
import { useState } from "react"

export default function Page() {
  const [params] = useState(() => {
    if (typeof window === "undefined")
      return { discord: "", github: "", isContributor: false }
    const p = new URLSearchParams(window.location.search)
    return {
      discord: p.get("discord") ?? "",
      github: p.get("github") ?? "",
      isContributor: p.get("contributor") === "true",
    }
  })

  return (
    <div className="m-5">
      <div>
        <h1 className="text-center text-4xl font-bold">
          kolioaris.xyz Linking
        </h1>
        {params.isContributor ? (
          <p className="mt-2 text-center">
            Linked accounts successfully! As a contributor you&apos;ve earned
            the <strong>Contributor</strong> role!
          </p>
        ) : (
          <p className="mt-2 text-center">
            Linked accounts successfully! You&apos;ll automatically receive the{" "}
            <strong>Contributor</strong> role once you contribute to one of
            kolioaris&apos;s repos.
          </p>
        )}
        <p className="mt-2 text-center text-muted-foreground">
          <strong>Discord:</strong> {params.discord} <br />
          <strong>GitHub:</strong> {params.github}
        </p>
      </div>
    </div>
  )
}
