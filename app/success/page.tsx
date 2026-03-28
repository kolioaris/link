"use client"

import { useSearchParams } from "next/navigation"

export default function Page() {
  const params = useSearchParams()
  const discord = params.get("discord")
  const github = params.get("github")
  const isContributor = params.get("contributor") === "true"

  return (
    <div className="m-5">
      <div>
        <h1 className="text-center text-4xl font-bold">
          kolioaris.xyz Linking
        </h1>
        {isContributor ? (
          <p className="mt-2 text-center">
            Linked accounts succesfully! As a contributor you&apos;ve earned the{" "}
            <strong>Contributor</strong> role!
          </p>
        ) : (
          <p className="mt-2 text-center">
            Linked accounts succesfully! You&apos;ll automatically receive the{" "}
            <strong>Contributor</strong> role once you contribute to one of
            kolioaris&apos;s repos.
          </p>
        )}
        <p className="mt-2 text-center text-muted-foreground">
          <strong>Discord:</strong> {discord} <br />
          <strong>GitHub:</strong> {github} <br />
          <br />
          <br />
          <span className="text-xs">
            btw you can press <kbd>d</kbd> to switch dark mode
          </span>
        </p>
      </div>
    </div>
  )
}
