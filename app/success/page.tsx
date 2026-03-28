"use client"

export default function Page() {
  const params = new URLSearchParams(window.location.search)
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
          <strong>Discord:</strong> {discord} <br />
          <strong>GitHub:</strong> {github}
        </p>
      </div>
    </div>
  )
}
