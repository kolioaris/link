import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div className="m-5">
      <div>
        <h1 className="text-center text-4xl font-bold">
          kolioaris.xyz Linking
        </h1>
        <p className="mt-2 text-center text-muted-foreground">
          Press the button below to link your Discord account with your GitHub
          account.
        </p>
      </div>
      <div className="mt-7.5 flex justify-center">
        <a
          href="https://link-api.kolioaris.xyz/auth/discord"
          className="h-12 w-1/2 text-xl"
        >
          <Button className="h-12 w-full text-xl">Start Linking</Button>
        </a>
      </div>
    </div>
  )
}
