import { ArtistProvider } from "@/contexts/artist-context"

export default function ArtistsLayout({ children }: { children: React.ReactNode }) {
  return <ArtistProvider>{children}</ArtistProvider>
}
